
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
    city?: {
      code?: string,
      name?: string
    },
    state?: {
      code?: string,
      name?: string
    },
    country?: {
      code?: string,
      name?: string
    },
    zip?: string
  } | null;
  /**
   * The closing date for the opportunity.
   */
  closingDate?: string;

  department?: string;
  subtier?: string;
  office?: string;
  type?: string;
  link?: string;
  officeAddress?: string;
  /**
   * The description of the opportunity.
   */
  description?: string; // Ensure description field exists
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
    const apiKey = process.env.NEXT_PUBLIC_SAM_GOV_API_KEY;

    if (!apiKey) {
      console.error('NEXT_PUBLIC_SAM_GOV_API_KEY is not set in environment variables.');
      // Return empty array for now, but ideally handle error more explicitly
      return [];
    }

    const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
    const defaultParams: Record<string, string> = {
      api_key: apiKey,
      ptype: 'o,k,p',
      postedFrom: getOneYearBackDate(),
      postedTo: getCurrentDate(),
      limit: '1000',
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
              throw new Error(`SAM.gov API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
              console.error('Invalid data format from SAM.gov API.');
              hasMore = false;
              break;
            }

            allOpportunities = allOpportunities.concat(data.opportunitiesData);

            if (data.opportunitiesData.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }

             if (offset >= 10000) {
                 console.warn("Reached maximum fetch limit (10 pages). Stopping.");
                 hasMore = false;
             }

        } catch (error: any) {
            console.error('Error fetching data from SAM.gov API:', error);
            hasMore = false;
            throw error;
        }
    }

    console.log(`Fetched a total of ${allOpportunities.length} opportunities before filtering.`);

    // Filter out expired opportunities AFTER fetching all data
    const currentDate = new Date();
    const activeOpportunities = allOpportunities.filter((opportunity: any) => {
      const responseDeadlineToUse = opportunity.responseDeadLine;
      if (!responseDeadlineToUse) {
        if (opportunity.type === "Presolicitation"){
             return true;
         }
        return false;
      }

      try {
        const responseDate = new Date(responseDeadlineToUse);
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
      opportunity.department = parts[0] || '';
      opportunity.subtier = parts[1] || '';
      opportunity.office = parts[parts.length - 1] || '';
    });


    // Map to SamGovOpportunity
    const mappedOpportunities: SamGovOpportunity[] = activeOpportunities.map((opportunity: any) => {

      let ncodeString = '';
      if (Array.isArray(opportunity.naicsCode)) {
        ncodeString = opportunity.naicsCode.join(',');
      } else if (typeof opportunity.naicsCode === 'string') {
        ncodeString = opportunity.naicsCode;
      }
      ncodeString = ncodeString.toLowerCase().replace(/\s+/g, '');

       const officeAddr = opportunity.officeAddress;
       const officeAddressString = officeAddr ?
         `${officeAddr.city || ''}${officeAddr.city && officeAddr.state ? ', ' : ''}${officeAddr.state || ''}${officeAddr.zipcode ? ' ' + officeAddr.zipcode : ''}${officeAddr.countryCode ? ', ' + officeAddr.countryCode : ''}`.trim()
         : 'N/A';


      return {
      id: opportunity.noticeId,
      title: opportunity.title || 'N/A',
      ncode: ncodeString || 'N/A',
      department: opportunity.department || 'N/A',
      subtier: opportunity.subtier || 'N/A',
      office: opportunity.office || 'N/A',
      location: opportunity.placeOfPerformance || null,
      closingDate: opportunity.responseDeadLine,
      type: opportunity.type || 'N/A',
      link: opportunity.uiLink || '#',
      officeAddress: officeAddressString,
      description: opportunity.description || 'No description available.' // Use description directly
      }
    });

    console.log(`Returning ${mappedOpportunities.length} mapped opportunities.`);
    return mappedOpportunities;
  }


  function getCurrentDate(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  function getOneYearBackDate(): string {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 364);

    const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
