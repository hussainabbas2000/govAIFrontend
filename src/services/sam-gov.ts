
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
   * The description of the opportunity. Can be a URL or text.
   */
  description?: string;
}

interface SamGovCache {
  data: SamGovOpportunity[];
  lastFetched: number;
}

let samGovCache: SamGovCache | null = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

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
    pastDate.setDate(today.getDate() - 364); // Go back 364 days (almost a year)

    const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

/**
 * Asynchronously retrieves government contract opportunities from SAM.gov.
 * Uses an in-memory cache that refreshes every 4 hours.
 * If API calls fail, it relies on existing cache or returns an empty list.
 *
 * @param searchCriteria An object containing search criteria.
 * @returns A promise that resolves to an array of SamGovOpportunity objects.
 */
export async function getSamGovOpportunities(
  searchCriteria: Record<string, any>
): Promise<SamGovOpportunity[]> {
  const currentTime = Date.now();

  if (samGovCache && (currentTime - samGovCache.lastFetched < CACHE_DURATION_MS)) {
    console.log("Serving SAM.gov opportunities from cache.");
    return applyFilters(samGovCache.data, searchCriteria);
  }

  console.log("Attempting to fetch fresh SAM.gov opportunities from API.");
  const apiKey = process.env.SAM_GOV_API_KEY ?? process.env.NEXT_PUBLIC_SAM_GOV_API_KEY;

  if (!apiKey) {
    console.warn('SAM_GOV_API_KEY or NEXT_PUBLIC_SAM_GOV_API_KEY is not set. Using existing cache or empty data.');
    // Do not set samGovCache here, rely on its existing state or return empty if it's null.
    return applyFilters(samGovCache?.data || [], searchCriteria);
  }

  const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
  const defaultParams: Record<string, any> = {
    api_key: apiKey,
    ptype: 'o,k,p', // Solicitations, Combined Synopsis/Solicitations, Presolicitations
    postedFrom: getOneYearBackDate(),
    postedTo: getCurrentDate(),
    limit: '1000' // Max limit per page
  };

  let allOpportunitiesData: any[] = [];
  let offset = 0;
  const limit = 1000; // Consistent with defaultParams.limit
  let hasMore = true;
  let pagesFetched = 0;
  const maxPages = 2; // Reduced to be less aggressive

  console.log(`Fetching SAM.gov opportunities (max ${maxPages} pages)...`);

  while (hasMore && pagesFetched < maxPages) {
    const params = { ...defaultParams, offset: String(offset) };
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}?${queryString}`;

    console.log(`Fetching page ${pagesFetched + 1} with offset: ${offset}`);
    pagesFetched++;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`SAM.gov API error on page ${pagesFetched}: ${response.status} ${response.statusText}`, errorBody);
        if (pagesFetched <= 1 && allOpportunitiesData.length === 0) {
             console.warn("API error on first page. Using existing cache or empty data.");
             // Do not set samGovCache here.
             return applyFilters(samGovCache?.data || [], searchCriteria);
        }
        // If error on subsequent pages, we might have partial data in allOpportunitiesData.
        // The loop will break, and we'll process what we have. Or if cache is old, it will be returned.
        hasMore = false; // Stop fetching more pages if an error occurs after the first page
        break; // Exit the loop
      }

      const data = await response.json();

      if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
        console.error(`Invalid data format from SAM.gov API on page ${pagesFetched}.`);
        if (pagesFetched <= 1 && allOpportunitiesData.length === 0) {
          console.warn("Invalid data format on first page. Using existing cache or empty data.");
          // Do not set samGovCache here.
          return applyFilters(samGovCache?.data || [], searchCriteria);
        }
        hasMore = false;
        break;
      }

      allOpportunitiesData = allOpportunitiesData.concat(data.opportunitiesData);

      if (data.opportunitiesData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }

    } catch (error: any) {
      console.error(`Error fetching data from SAM.gov API on page ${pagesFetched}:`, error);
       if (pagesFetched <= 1 && allOpportunitiesData.length === 0) {
            console.warn("Network error on first page. Using existing cache or empty data.");
            // Do not set samGovCache here.
            return applyFilters(samGovCache?.data || [], searchCriteria);
       }
      hasMore = false; // Stop fetching more pages
      break; // Exit the loop
    }
  }
  
  // If API calls were attempted (pagesFetched > 0) but resulted in no data,
  // or if an error occurred after fetching some data, we process what we got.
  // If allOpportunitiesData is empty here, it means the API truly returned nothing or failed after the first page.
  if (pagesFetched > 0) { // Indicates an API interaction attempt happened
    if (allOpportunitiesData.length === 0) {
      console.warn("API returned no opportunities after fetching. Existing cache (if any) will be used, or empty list.");
      // If cache exists and is stale, this condition ensures it's preferred over an empty live result.
      // However, if the intent is to reflect that the API is *currently* empty, we should update cache.
      // For now, if API returns empty, let's update cache to empty.
      samGovCache = {
        data: [],
        lastFetched: currentTime,
      };
      console.log("SAM.gov cache updated with empty list from API.");
      return applyFilters([], searchCriteria);
    }

    console.log(`Fetched a total of ${allOpportunitiesData.length} opportunities from API over ${pagesFetched} page(s).`);

    const mappedOpportunities: SamGovOpportunity[] = allOpportunitiesData.map((apiOpp: any) => {
      let ncodeString = '';
      if (Array.isArray(apiOpp.naicsCode)) {
        ncodeString = apiOpp.naicsCode.join(',');
      } else if (typeof apiOpp.naicsCode === 'string') {
        ncodeString = apiOpp.naicsCode;
      }
      ncodeString = ncodeString.toLowerCase().replace(/\s+/g, '');

      const officeAddr = apiOpp.officeAddress;
      const officeAddressString = officeAddr ?
        `${officeAddr.city || ''}${officeAddr.city && officeAddr.state ? ', ' : ''}${officeAddr.state || ''}${officeAddr.zipcode ? ' ' + officeAddr.zipcode : ''}${officeAddr.countryCode ? ', ' + officeAddr.countryCode : ''}`.trim()
        : 'N/A';
      
      const pop = apiOpp.placeOfPerformance;
      let locationObject: SamGovOpportunity['location'] = null;
      if (pop) {
          locationObject = {
              city: pop.city ? { name: pop.city.name, code: pop.city.code } : undefined,
              state: pop.state ? { name: pop.state.name, code: pop.state.code } : undefined,
              country: pop.country ? { name: pop.country.name, code: pop.country.code } : undefined,
              zip: pop.zipCode || undefined,
          };
      }

      const parentPath = apiOpp.fullParentPathName?.split('.') || [];
      const department = parentPath[0]?.trim() || 'N/A';
      const subtier = parentPath[1]?.trim() || 'N/A';
      const office = parentPath.length > 2 ? parentPath.slice(2).join('. ').trim() : (parentPath.pop()?.trim() || 'N/A');

      const descriptionText = apiOpp.description || 'No description available.';

      return {
        id: apiOpp.noticeId,
        title: apiOpp.title || 'N/A',
        ncode: ncodeString || 'N/A',
        department: department,
        subtier: subtier,
        office: office,
        location: locationObject,
        closingDate: apiOpp.responseDeadLine,
        type: apiOpp.type || 'N/A',
        link: apiOpp.uiLink || '#',
        officeAddress: officeAddressString,
        description: descriptionText,
      };
    });

    samGovCache = {
      data: mappedOpportunities,
      lastFetched: currentTime,
    };
    console.log(`SAM.gov cache updated with live API data. ${mappedOpportunities.length} opportunities stored.`);
    return applyFilters(mappedOpportunities, searchCriteria);

  } else { // pagesFetched === 0, meaning no API call was made (e.g. API key missing from the start)
    // This case is already handled by the initial API key check,
    // but as a safeguard, return existing cache or empty.
    console.log("No API calls made. Using existing cache or empty list.");
    return applyFilters(samGovCache?.data || [], searchCriteria);
  }
}


// Helper function to apply filters
function applyFilters(
  opportunities: SamGovOpportunity[],
  searchCriteria: Record<string, any>
): SamGovOpportunity[] {
  const { ncode, location, dateFilter, showOnlyOpen, searchQuery } = searchCriteria;

  return opportunities.filter(opportunity => {
    const searchLower = searchQuery?.toLowerCase() || '';
    const descriptionText = opportunity.description || '';
    const matchesSearch = !searchQuery || (
      opportunity.title?.toLowerCase().includes(searchLower) ||
      opportunity.department?.toLowerCase().includes(searchLower) ||
      opportunity.subtier?.toLowerCase().includes(searchLower) ||
      opportunity.office?.toLowerCase().includes(searchLower) ||
      descriptionText.toLowerCase().includes(searchLower)
    );

    const ncodeLower = ncode?.toLowerCase();
    const matchesNaics = !ncodeLower || opportunity.ncode?.toLowerCase().includes(ncodeLower);

    const locationLower = location?.toLowerCase();
    const locationString = [
        opportunity.location?.city?.name,
        opportunity.location?.state?.name,
        opportunity.location?.country?.name,
        opportunity.location?.zip,
        opportunity.officeAddress,
      ].filter(Boolean).join(', ').toLowerCase();
    const matchesLocation = !locationLower || locationString.includes(locationLower);
    

    const selectedDate = dateFilter ? new Date(dateFilter) : undefined;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0); 
    const closingDate = opportunity.closingDate ? new Date(opportunity.closingDate) : undefined;
    const matchesDate = !selectedDate || (closingDate && closingDate >= selectedDate);

    const today = new Date();
    today.setHours(0,0,0,0);
    const isOpen = closingDate && closingDate >= today;
    const matchesOpen = !showOnlyOpen || isOpen;

    return matchesSearch && matchesNaics && matchesLocation && matchesDate && matchesOpen;
  });
}
