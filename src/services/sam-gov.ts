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
   * The agency issuing the opportunity.
   */
  agency: string;
  /**
   * The location of the opportunity.
   */
  location: string;
  /**
   * The closing date for the opportunity.
   */
  closingDate: string;
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
    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      console.error('SAM_GOV_API_KEY is not set in environment variables.');
      return [];
    }
  
    const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
    const defaultParams = {
      api_key: apiKey,
      ptype: 'o,k,p', // Solicitation, Combined Synopsis/Solicitation, Pre solicitation
      postedFrom: getOneYearBackDate(),
      postedTo: getCurrentDate(),
      limit: '1000', // Maximum allowed limit
    };
  
    const params = { ...defaultParams, ...searchCriteria };
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}?${queryString}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`SAM.gov API error: ${response.status} ${response.statusText}`);
        return [];
      }
  
      const data = await response.json();
      if (!data.opportunities || !Array.isArray(data.opportunities)) {
        console.error('Invalid data format from SAM.gov API.');
        return [];
      }
  
      // Filter out expired opportunities
      const currentDate = new Date();
      const activeOpportunities = data.opportunities.filter((opportunity: any) => {
        const responseDeadlineToUse = opportunity.responseDeadlineTo;
  
        if (!responseDeadlineToUse) {
          console.warn(`Opportunity ${opportunity.noticeId} missing response date. It may have expired.`);
          return false;
        }
  
        const responseDate = new Date(responseDeadlineToUse);
        return responseDate >= currentDate;
      });
  
      // Map to SamGovOpportunity
      const mappedOpportunities: SamGovOpportunity[] = activeOpportunities.map((opportunity: any) => ({
        id: opportunity.noticeId,
        title: opportunity.title,
        ncode: opportunity.ncode,
        agency: opportunity.subTierName,
        location: opportunity.placeOfPerformance ? opportunity.placeOfPerformance.state : 'N/A',
        closingDate: opportunity.responseDeadlineTo,
      }));
  
      return mappedOpportunities;
    } catch (error: any) {
      console.error('Error fetching data from SAM.gov API:', error);
      return [];
    }
  }
  
  
  function getCurrentDate(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  
  function getOneYearBackDate(): string {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear() - 1;
    return `${mm}/${dd}/${yyyy}`;
  }
  
