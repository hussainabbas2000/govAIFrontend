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
    city: {
      code: string,
      name: string
    },
    state: {
      code: string,
      name: string
    },
    country: {
      code: string,
      name: string
    },
    zip: string
  };
  /**
   * The closing date for the opportunity.
   */
  closingDate: string;

  department: string;
  subtier: string;
  office: string;
  type: string;
  link:string;
  officeAddress: string;
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
      typeOfSetAside: 'SBA'
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

      if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
        console.error('Invalid data format from SAM.gov API.');
        return [];
      }
      
      // Filter out expired opportunities
      const currentDate = new Date();
      const activeOpportunities = data.opportunitiesData.filter((opportunity: any) => {
        const responseDeadlineToUse = opportunity.responseDeadLine;
        if (!responseDeadlineToUse) {
          if (opportunity.type === "Presolicitation"){
            return true;
          }
          console.warn(`Opportunity ${opportunity.noticeId} missing response date. It may have expired.`);
          return false;
        }
  
        const responseDate = new Date(responseDeadlineToUse);
        return responseDate >= currentDate;
      });
      
      
      activeOpportunities.forEach((opportunity: any) => {
        const parts = opportunity.fullParentPathName?.split('.') || [];
      
        opportunity.department = parts[0] || '';
        opportunity.subtier = parts[1] || '';
        opportunity.office = parts[parts.length - 1] || '';
      });
     

      // Map to SamGovOpportunity
      const mappedOpportunities: SamGovOpportunity[] = activeOpportunities.map((opportunity: any) => {
        
        const n = Array.isArray(opportunity.naicsCodes) ? opportunity.naicsCodes.join(',') : opportunity.naicsCodes;
        return {
        id: opportunity.noticeId,
        title: opportunity.title,
        ncode: n.toLowerCase().replace(/\s+/g, ''),
        department: opportunity.department,
        subtier: opportunity.subtier,
        office: opportunity.office,
        location: opportunity.placeOfPerformance,
        closingDate: opportunity.responseDeadLine,
        type: opportunity.type,
        link: opportunity.uiLink,
        officeAddress: `${opportunity.officeAddress.city}, ${opportunity.officeAddress.state}, ${opportunity.officeAddress.countryCode}, ${opportunity.officeAddress.zipcode}`
        }
      });

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
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 364); // Subtract 364 days
  
    const mm = String(pastDate.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(pastDate.getDate()).padStart(2, '0');
    const yyyy = pastDate.getFullYear();
  
    return `${mm}/${dd}/${yyyy}`;
  }
  
