import { map } from "zod";

/**
 * Represents a government contract opportunity from SAM.gov.
 */
export interface SamGovOpportunity {
  /**
   * The unique identifier for the opportunity.
   */
  id: string;
  /**
   * The title or description of the opportunity.
   */
  title: string;
  /**
   * The NAICS code associated with the opportunity.
   */
  ncode: string;
  /**
   * The location of the opportunity.
   */
  location: {
    city?: { // Make optional as it might not always be present
      code?: string,
      name?: string
    },
    state?: { // Make optional
      code?: string,
      name?: string
    },
    country?: { // Make optional
      code?: string,
      name?: string
    },
    zip?: string // Make optional
  } | null; // Allow null if location is not provided
  /**
   * The closing date for the opportunity.
   */
  closingDate?: string; // Make optional as it might not always be present

  department?: string; // Make optional
  subtier?: string; // Make optional
  office?: string; // Make optional
  type?: string; // Make optional
  link?: string; // Make optional
  officeAddress?: string; // Make optional
  /**
   * The description of the opportunity.
   */
  description?: string; // Added description field
}

/**
 * Asynchronously retrieves government contract opportunities from SAM.gov based on search criteria.
 *
 * @param searchCriteria An object containing the search criteria (e.g., keywords, NAICS codes).
 * @returns A promise that resolves to an array of SamGovOpportunity objects.
 */
export async function getSamGovOpportunities(
    searchCriteria: Record<string, string>
  ): Promise<SamGovOpportunity[]> {
    const apiKey = process.env.SAM_GOV_API_KEY; // Use SAM_GOV_API_KEY

    if (!apiKey) {
      console.error('SAM_GOV_API_KEY is not set in environment variables.');
      // It's better to throw an error or return a specific error object
      // instead of an empty array to indicate configuration issues.
      // For now, returning empty array as per previous logic.
      return [];
    }

    const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
    const defaultParams: Record<string, string> = {
      api_key: apiKey,
      ptype: 'o,k,p', // Solicitation, Combined Synopsis/Solicitation, Pre solicitation
      postedFrom: getOneYearBackDate(),
      postedTo: getCurrentDate(),
      limit: '1000', // Maximum allowed limit per page
      // typeOfSetAside: 'SBA' // Removed this filter as it wasn't requested
    };

    let allOpportunities: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    console.log("Fetching SAM.gov opportunities...");

    while (hasMore) {
        const params = { ...defaultParams, ...searchCriteria, limit: String(limit), offset: String(offset) };
        const queryString = new URLSearchParams(params).toString();
        const url = `${baseUrl}?${queryString}`;

        console.log(`Fetching page with offset: ${offset}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
              const errorBody = await response.text();
              console.error(`SAM.gov API error: ${response.status} ${response.statusText}`, errorBody);
              // Stop fetching if an error occurs on any page
              throw new Error(`SAM.gov API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
              console.error('Invalid data format from SAM.gov API.');
              hasMore = false; // Stop if data format is unexpected
              break;
            }

            allOpportunities = allOpportunities.concat(data.opportunitiesData);

            // Check if there are more pages
            if (data.opportunitiesData.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }

            // Safety break to prevent infinite loops in case API behavior changes
             if (offset >= 10000) { // Limit to 10 pages for safety
                 console.warn("Reached maximum fetch limit (10 pages). Stopping.");
                 hasMore = false;
             }

        } catch (error: any) {
            console.error('Error fetching data from SAM.gov API:', error);
            hasMore = false; // Stop fetching on error
            // Optionally re-throw or return an error indicator
            throw error; // Propagate the error
        }
    }

    console.log(`Fetched a total of ${allOpportunities.length} opportunities before filtering.`);

    // Filter out expired opportunities AFTER fetching all data
    const currentDate = new Date();
    const activeOpportunities = allOpportunities.filter((opportunity: any) => {
      const responseDeadlineToUse = opportunity.responseDeadLine; // Use responseDeadLine for closing date
      if (!responseDeadlineToUse) {
        // Presolicitations might not have a deadline yet, consider them active
        // Or handle based on specific business logic if they should be excluded
        if (opportunity.type === "Presolicitation"){
             // console.log(`Opportunity ${opportunity.noticeId} (Presolicitation) has no deadline, keeping.`);
             return true;
         }
        // console.warn(`Opportunity ${opportunity.noticeId} missing response date. Filtering out.`);
        return false; // Filter out if no deadline and not Presolicitation
      }

      try {
        // SAM API date format can be inconsistent, try parsing common formats
        // Format: "YYYY-MM-DDTHH:mm:ss.sssZ" or "MM-DD-YYYY" or "YYYY-MM-DD" etc.
        // Let Date constructor handle parsing, but be aware of potential timezone issues.
        const responseDate = new Date(responseDeadlineToUse);
        // Check if date is valid and not in the past (ignoring time part for simplicity)
        return !isNaN(responseDate.getTime()) && responseDate.setHours(0,0,0,0) >= currentDate.setHours(0,0,0,0);
      } catch (e) {
        console.warn(`Could not parse date '${responseDeadlineToUse}' for opportunity ${opportunity.noticeId}. Filtering out.`);
        return false;
      }
    });

     console.log(`Filtered down to ${activeOpportunities.length} active opportunities.`);

    // Process department, subtier, office
    activeOpportunities.forEach((opportunity: any) => {
      const parts = opportunity.fullParentPathName?.split('.') || [];
      opportunity.department = parts[0] || ''; // L1
      opportunity.subtier = parts[1] || '';    // L2
      opportunity.office = parts[parts.length - 1] || ''; // Last part
    });


    // Map to SamGovOpportunity
    const mappedOpportunities: SamGovOpportunity[] = activeOpportunities.map((opportunity: any) => {

      // Handle NAICS code (ensure it's a string, join if array)
      let ncodeString = '';
      if (Array.isArray(opportunity.naicsCode)) {
        ncodeString = opportunity.naicsCode.join(',');
      } else if (typeof opportunity.naicsCode === 'string') {
        ncodeString = opportunity.naicsCode;
      }
      ncodeString = ncodeString.toLowerCase().replace(/\s+/g, ''); // Clean up

      // Construct office address safely
       const officeAddr = opportunity.officeAddress;
       const officeAddressString = officeAddr ?
         `${officeAddr.city || ''}${officeAddr.city && officeAddr.state ? ', ' : ''}${officeAddr.state || ''}${officeAddr.zipcode ? ' ' + officeAddr.zipcode : ''}${officeAddr.countryCode ? ', ' + officeAddr.countryCode : ''}`.trim()
         : 'N/A'; // Handle missing officeAddress


      return {
      id: opportunity.noticeId,
      title: opportunity.title || 'N/A',
      ncode: ncodeString || 'N/A', // Use the processed NAICS code
      department: opportunity.department || 'N/A',
      subtier: opportunity.subtier || 'N/A',
      office: opportunity.office || 'N/A',
      location: opportunity.placeOfPerformance || null, // Assign the location object or null
      closingDate: opportunity.responseDeadLine, // Use responseDeadLine
      type: opportunity.type || 'N/A',
      link: opportunity.uiLink || '#', // Provide a fallback link
      officeAddress: officeAddressString,
      description: opportunity.description || 'No description available.' // Map the description field
      }
    });

    console.log(`Returning ${mappedOpportunities.length} mapped opportunities.`);
    return mappedOpportunities;
  }


  function getCurrentDate(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    // Format required by SAM API: MM/DD/YYYY
    return `${mm}/${dd}/${yyyy}`;
  }

  function getOneYearBackDate(): string {
    const today = new Date();
    const pastDate = new Date(today);
    // Go back 365 days for a full year range
    pastDate.setDate(today.getDate() - 365);

    const mm = String(pastDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const yyyy = pastDate.getFullYear();

    // Format required by SAM API: MM/DD/YYYY
    return `${mm}/${dd}/${yyyy}`;
  }