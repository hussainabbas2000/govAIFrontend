import type { map } from "zod";

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

interface SamGovCache {
  data: SamGovOpportunity[];
  lastFetched: number;
}

let samGovCache: SamGovCache | null = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

/**
 * Asynchronously retrieves government contract opportunities from SAM.gov based on search criteria.
 * Implements in-memory caching, refreshing data every 4 hours.
 *
 * @param searchCriteria An object containing the search criteria (e.g., keywords, NAICS codes).
 * @returns A promise that resolves to an array of SamGovOpportunity objects.
 */
export async function getSamGovOpportunities(
    searchCriteria: Record<string, string>
  ): Promise<SamGovOpportunity[]> {
    const currentTime = Date.now();

    // Check cache
    if (samGovCache && (currentTime - samGovCache.lastFetched < CACHE_DURATION_MS)) {
      console.log("Serving SAM.gov opportunities from cache.");
      // Filter cached data if searchCriteria are provided (basic implementation)
      if (Object.keys(searchCriteria).length > 0) {
          // This is a very basic filter. For more complex scenarios, consider a more robust filtering mechanism.
          return samGovCache.data.filter(opp => {
              let match = true;
              if (searchCriteria.ncode && opp.ncode) {
                  match = match && opp.ncode.toLowerCase().includes(searchCriteria.ncode.toLowerCase());
              }
              // Add other criteria filters as needed
              return match;
          });
      }
      return samGovCache.data;
    }

    console.log("Fetching SAM.gov opportunities from API (cache expired or not present).");

    const apiKey = process.env.NEXT_PUBLIC_SAM_GOV_API_KEY;

    if (!apiKey) {
      console.error('NEXT_PUBLIC_SAM_GOV_API_KEY is not set in environment variables.');
      return [];
    }

    const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
    const defaultParams: Record<string, any> = {
      api_key: apiKey,
      ptype: 'o,k,p', // Solicitation, Combined Synopsis/Solicitation, Presolicitation
      postedFrom: getOneYearBackDate(),
      postedTo: getCurrentDate(),
    };

    let allOpportunities: any[] = [];
    let offset = 0;
    const limit = 1000; // Max limit per API documentation
    let hasMore = true;

    console.log("Fetching all SAM.gov opportunities pages...");

    while (hasMore) {
        // Note: The API seems to ignore searchCriteria if we are fetching all pages like this.
        // If specific search criteria are needed *during* the paginated fetch, the API call structure might need adjustment.
        // For now, we fetch all and then can filter the cached result if needed.
        const params = { ...defaultParams, limit: String(limit), offset: String(offset) };
        const queryString = new URLSearchParams(params).toString();
        const url = `${baseUrl}?${queryString}`;

        console.log(`Fetching page with offset: ${offset}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
              const errorBody = await response.text();
              console.error(`SAM.gov API error: ${response.status} ${response.statusText}`, errorBody);
              // If one page fails, we might still have data from previous pages.
              // Depending on requirements, could throw, or return what's fetched so far.
              // For now, let's stop fetching more.
              hasMore = false;
              // If it's the first page and it fails, return empty or throw.
              if (offset === 0) return [];
              break;
            }

            const data = await response.json();

            if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
              console.error('Invalid data format from SAM.gov API.');
              hasMore = false;
              break;
            }

            allOpportunities = allOpportunities.concat(data.opportunitiesData);

            if (data.opportunitiesData.length < limit) {
              hasMore = false; // No more data to fetch
            } else {
              offset += limit;
            }
             // Safety break if API doesn't stop sending data or offset becomes too large
             if (offset >= 10000) { // Fetch up to 10 pages (10 * 1000 = 10000 records)
                 console.warn("Reached maximum fetch limit (10 pages). Stopping.");
                 hasMore = false;
             }

        } catch (error: any) {
            console.error('Error fetching data from SAM.gov API:', error);
            hasMore = false; // Stop fetching on error
            // If it's the first page and it fails, return empty or throw.
            if (offset === 0) return [];
            break;
        }
    }

    console.log(`Fetched a total of ${allOpportunities.length} opportunities before filtering.`);

    const currentDate = new Date();
    const activeOpportunities = allOpportunities.filter((opportunity: any) => {
      const responseDeadlineToUse = opportunity.responseDeadLine;
      if (!responseDeadlineToUse) {
        if (opportunity.type === "Presolicitation"){
             return true; // Presolicitations might not have a deadline yet
         }
        return false; // No deadline means we can't determine if it's active
      }

      try {
        // Ensure dates are compared correctly (e.g., by setting time to 00:00:00)
        const responseDate = new Date(responseDeadlineToUse);
        // Set hours to 0 to compare dates only, not times
        return !isNaN(responseDate.getTime()) && responseDate.setHours(0,0,0,0) >= currentDate.setHours(0,0,0,0);
      } catch (e) {
        console.warn(`Could not parse date '${responseDeadlineToUse}' for opportunity ${opportunity.noticeId}. Filtering out.`);
        return false;
      }
    });

     console.log(`Filtered down to ${activeOpportunities.length} active opportunities.`);

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
        department: opportunity.fullParentPathName?.split('.')[0] || 'N/A',
        subtier: opportunity.fullParentPathName?.split('.')[1] || 'N/A',
        office: opportunity.fullParentPathName?.split('.').pop() || 'N/A',
        location: opportunity.placeOfPerformance || null,
        closingDate: opportunity.responseDeadLine,
        type: opportunity.type || 'N/A',
        link: opportunity.uiLink || '#',
        officeAddress: officeAddressString,
        description: opportunity.description || 'No description available.' // This is a link, not the actual description
      };
    });

    // Fetch actual descriptions for each opportunity - This can be slow if many opportunities.
    // Consider if this is needed for all, or on-demand when a user views details.
    // For now, keeping the placeholder/link as per previous implementation.
    // If actual descriptions are needed here, a Promise.all() approach would be used:
    /*
    const opportunitiesWithDescriptions = await Promise.all(mappedOpportunities.map(async (opp) => {
      if (opp.description && opp.description.startsWith('http')) { // Assuming description is a URL
        try {
          const descResponse = await fetch(`${opp.description}&api_key=${apiKey}`);
          if (descResponse.ok) {
            const descData = await descResponse.json();
            return { ...opp, description: descData.description || 'Failed to load description.' };
          }
        } catch (descError) {
          console.error(`Failed to fetch description for ${opp.id}:`, descError);
        }
      }
      return { ...opp, description: opp.description || 'No description available.'}; // Keep original if not a link or fetch fails
    }));
    */

    // Update cache
    samGovCache = {
      data: mappedOpportunities, // or opportunitiesWithDescriptions if fetching actual descriptions
      lastFetched: currentTime,
    };
    console.log(`SAM.gov cache updated. ${mappedOpportunities.length} opportunities stored.`);

    // Filter based on searchCriteria if provided (after caching all)
    if (Object.keys(searchCriteria).length > 0) {
        return mappedOpportunities.filter(opp => {
            let match = true;
            if (searchCriteria.ncode && opp.ncode) {
                 match = match && opp.ncode.toLowerCase().includes(searchCriteria.ncode.toLowerCase());
            }
            // Add other criteria filters as needed
            return match;
        });
    }

    return mappedOpportunities;
  }


  function getCurrentDate(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  function getOneYearBackDate(): string {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 364); // Go back 364 days to ensure a full year window, inclusive of today

    const mm = String(pastDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
