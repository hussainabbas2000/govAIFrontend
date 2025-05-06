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

// --- Dummy Data Start ---
// Updated descriptions to include quantities
const dummySamGovOpportunities: SamGovOpportunity[] = [
  {
    id: "DUMMY001",
    title: "Advanced IT Support Services Contract",
    ncode: "541519",
    location: { city: { name: "Washington" }, state: { name: "DC" }, zip: "20001" },
    closingDate: "2024-09-15T23:59:59Z",
    department: "Department of Commerce",
    subtier: "National Oceanic and Atmospheric Administration (NOAA)",
    office: "Acquisition and Grants Office",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY001", // Example link
    officeAddress: "Washington, DC 20230, USA",
    description: "Provide comprehensive IT support, including helpdesk, network management, and cybersecurity services for NOAA facilities. Requires support for approximately 500 users across 3 locations. Estimated 10 FTEs required."
  },
  {
    id: "DUMMY002",
    title: "Construction of New Research Facility Wing",
    ncode: "236220",
    location: { city: { name: "Boulder" }, state: { name: "CO" }, zip: "80305" },
    closingDate: "2024-10-01T17:00:00Z",
    department: "Department of Energy",
    subtier: "National Renewable Energy Laboratory (NREL)",
    office: "Facilities Management",
    type: "Combined Synopsis/Solicitation",
    link: "https://sam.gov/opp/DUMMY002",
    officeAddress: "Golden, CO 80401, USA",
    description: "Design and build a new 20,000 sq ft wing for the existing research facility, focusing on sustainable building practices and laboratory space. Includes 5 specialized labs and 30 office spaces."
  },
  {
    id: "DUMMY003",
    title: "Janitorial Services for Federal Building",
    ncode: "561720",
    location: { city: { name: "Philadelphia" }, state: { name: "PA" }, zip: "19106" },
    closingDate: "2024-08-30T16:00:00Z",
    department: "General Services Administration",
    subtier: "Public Buildings Service",
    office: "Region 3",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY003",
    officeAddress: "Philadelphia, PA 19107, USA",
    description: "Provide daily janitorial and cleaning services for a large federal office building (approx. 250,000 sq ft) in downtown Philadelphia. Includes cleaning for 10 floors and common areas."
  },
  {
    id: "DUMMY004",
    title: "Cybersecurity Assessment and Penetration Testing",
    ncode: "541512",
    location: { city: { name: "Arlington" }, state: { name: "VA" }, zip: "22202" },
    closingDate: "2024-09-20T14:00:00Z",
    department: "Department of Defense",
    subtier: "Defense Information Systems Agency (DISA)",
    office: "Cybersecurity Directorate",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY004",
    officeAddress: "Fort Meade, MD 20755, USA",
    description: "Conduct comprehensive cybersecurity vulnerability assessments and penetration testing on 5 critical DISA networks. Deliverables include detailed reports and remediation recommendations."
  },
  {
    id: "DUMMY005",
    title: "Office Supplies Procurement",
    ncode: "453210",
    location: { city: { name: "Denver" }, state: { name: "CO" }, zip: "80225" },
    closingDate: "2024-08-25T12:00:00Z",
    department: "Department of the Interior",
    subtier: "Bureau of Land Management",
    office: "National Operations Center",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY005",
    officeAddress: "Denver, CO 80225, USA",
    description: "Establish a Blanket Purchase Agreement (BPA) for the procurement and delivery of standard office supplies. Initial requirement includes 1000 reams of paper, 500 pens, and 200 staplers."
  },
  {
    id: "DUMMY006",
    title: "Scientific Research Grant Management Software",
    ncode: "511210",
    location: { city: { name: "Bethesda" }, state: { name: "MD" }, zip: "20892" },
    closingDate: "2024-10-10T17:00:00Z",
    department: "Department of Health and Human Services",
    subtier: "National Institutes of Health (NIH)",
    office: "Center for Information Technology",
    type: "Presolicitation",
    link: "https://sam.gov/opp/DUMMY006",
    officeAddress: "Bethesda, MD 20892, USA",
    description: "Develop or provide a COTS solution for managing the lifecycle of scientific research grants, from application to reporting. System must handle approximately 50,000 grant applications per year."
  },
  {
    id: "DUMMY007",
    title: "Fleet Vehicle Maintenance and Repair",
    ncode: "811111",
    location: { city: { name: "Atlanta" }, state: { name: "GA" }, zip: "30303" },
    closingDate: "2024-09-05T15:00:00Z",
    department: "Department of Homeland Security",
    subtier: "Federal Emergency Management Agency (FEMA)",
    office: "Logistics Management Directorate",
    type: "Combined Synopsis/Solicitation",
    link: "https://sam.gov/opp/DUMMY007",
    officeAddress: "Washington, DC 20472, USA",
    description: "Provide routine maintenance and repair services for FEMA's fleet of 150 light-duty vehicles in the Southeast region."
  },
  {
    id: "DUMMY008",
    title: "Translation and Interpretation Services (Spanish)",
    ncode: "541930",
    location: { city: { name: "San Diego" }, state: { name: "CA" }, zip: "92101" },
    closingDate: "2024-09-12T18:00:00Z",
    department: "Department of Justice",
    subtier: "Executive Office for Immigration Review",
    office: "Board of Immigration Appeals",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY008",
    officeAddress: "Falls Church, VA 22041, USA",
    description: "Provide on-demand and scheduled Spanish-English translation and interpretation services for immigration court proceedings. Estimated need: 2000 hours of interpretation annually."
  },
  {
    id: "DUMMY009",
    title: "Environmental Impact Assessment Study",
    ncode: "541620",
    location: { city: { name: "Seattle" }, state: { name: "WA" }, zip: "98174" },
    closingDate: "2024-10-18T17:00:00Z",
    department: "Environmental Protection Agency",
    subtier: "Region 10",
    office: "Superfund and Emergency Management Division",
    type: "Solicitation",
    link: "https://sam.gov/opp/DUMMY009",
    officeAddress: "Seattle, WA 98101, USA",
    description: "Conduct an environmental impact assessment for a proposed infrastructure project (10-mile pipeline), including field surveys across 5 distinct zones and report generation."
  },
  {
    id: "DUMMY010",
    title: "Cloud Computing Infrastructure Hosting",
    ncode: "518210",
    location: { city: { name: "Reston" }, state: { name: "VA" }, zip: "20190" },
    closingDate: "2024-09-25T11:00:00Z",
    department: "Department of Veterans Affairs",
    subtier: "Office of Information and Technology",
    office: "Enterprise Cloud Solutions Office",
    type: "Combined Synopsis/Solicitation",
    link: "https://sam.gov/opp/DUMMY010",
    officeAddress: "Washington, DC 20420, USA",
    description: "Provide secure, scalable cloud infrastructure hosting services compliant with FedRAMP High standards. Requires capacity for 10 Petabytes of storage and 5000 virtual machines."
  },
   {
     id: "DUMMY011",
     title: "IT Hardware Procurement - Bulk Order",
     ncode: "334111", // Electronic Computer Manufacturing
     location: { city: { name: "Austin" }, state: { name: "TX" }, zip: "78701" },
     closingDate: "2024-11-01T16:00:00Z",
     department: "Department of Education",
     subtier: "Office of the Chief Information Officer",
     office: "Technology Infrastructure Services",
     type: "Solicitation",
     link: "https://sam.gov/opp/DUMMY011",
     officeAddress: "Washington, DC 20202, USA",
     description: "Bulk procurement of IT hardware components for data center upgrade. Required items include: 500 SATA 2 HDD units, 200 sticks of 2TB DDR4 RAM, and 300 Intel i9-9700K Processors. Delivery to Austin, TX data center."
   },
];
// --- Dummy Data End ---


interface SamGovCache {
  data: SamGovOpportunity[];
  lastFetched: number;
  descriptions: Record<string, string>; // Cache for fetched descriptions
}

let samGovCache: SamGovCache | null = null;
const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds


/**
 * Asynchronously retrieves government contract opportunities from SAM.gov.
 * Uses dummy data if API fetching fails or is commented out.
 * Fetches full descriptions if available.
 *
 * @param searchCriteria An object containing search criteria like ncode, location, dateFilter, showOnlyOpen.
 * @returns A promise that resolves to an array of SamGovOpportunity objects with descriptions.
 */
export async function getSamGovOpportunities(
  searchCriteria: Record<string, any> // Accept various filter types
): Promise<SamGovOpportunity[]> {
  const currentTime = Date.now();

  // Check cache first
  if (samGovCache && (currentTime - samGovCache.lastFetched < CACHE_DURATION_MS)) {
    console.log("Serving SAM.gov opportunities from cache.");
    // Apply filters to cached data
    return applyFilters(samGovCache.data, samGovCache.descriptions, searchCriteria);
  }

  console.log("Fetching SAM.gov opportunities (using dummy data).");

  // --- Dummy Data Usage ---
  console.log("Using dummy data for SAM.gov opportunities.");
  // Descriptions are already included in dummy data
  const dummyDescriptions: Record<string, string> = {};
  dummySamGovOpportunities.forEach(opp => {
    dummyDescriptions[opp.id] = opp.description || "No description available.";
  });

  // Update cache with dummy data
  samGovCache = {
    data: dummySamGovOpportunities,
    descriptions: dummyDescriptions,
    lastFetched: currentTime,
  };

  // Apply filters to the dummy data
  return applyFilters(dummySamGovOpportunities, dummyDescriptions, searchCriteria);

  // --- Original API Fetching Logic (Commented Out) ---
  /*
  console.log("Fetching SAM.gov opportunities from API.");
  const apiKey = process.env.SAM_GOV_API_KEY ?? process.env.NEXT_PUBLIC_SAM_GOV_API_KEY; // Check both standard and public env var

  if (!apiKey) {
    console.error('SAM_GOV_API_KEY or NEXT_PUBLIC_SAM_GOV_API_KEY is not set in environment variables.');
    // Fallback to dummy data if API key is missing
    console.warn("Falling back to dummy data due to missing API key.");
    const dummyDescriptions: Record<string, string> = {};
    dummySamGovOpportunities.forEach(opp => {
        dummyDescriptions[opp.id] = opp.description || "No description available.";
    });
     samGovCache = {
      data: dummySamGovOpportunities,
      descriptions: dummyDescriptions,
      lastFetched: currentTime,
    };
    return applyFilters(dummySamGovOpportunities, dummyDescriptions, searchCriteria);
    // return []; // Or return empty array
  }


  const baseUrl = 'https://api.sam.gov/opportunities/v2/search';
  const defaultParams: Record<string, any> = {
    api_key: apiKey,
    ptype: 'o,k,p', // Solicitation, Combined Synopsis/Solicitation, Presolicitation
    postedFrom: getOneYearBackDate(),
    postedTo: getCurrentDate(),
    limit: '1000' // Fetch max per page initially
  };

  let allOpportunitiesData: any[] = [];
  let offset = 0;
  const limit = 1000; // Max limit per API documentation
  let hasMore = true;

  console.log("Fetching all SAM.gov opportunities pages...");

  while (hasMore) {
    const params = { ...defaultParams, offset: String(offset) };
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}?${queryString}`;

    console.log(`Fetching page with offset: ${offset}`);

    try {
      // Use { cache: 'no-store' } to bypass Next.js fetch cache if needed
      // Consider server-side caching instead if making frequent identical calls
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`SAM.gov API error: ${response.status} ${response.statusText}`, errorBody);
        // Fallback to dummy data on API error
        console.warn("Falling back to dummy data due to API error.");
         const dummyDescriptions: Record<string, string> = {};
         dummySamGovOpportunities.forEach(opp => {
             dummyDescriptions[opp.id] = opp.description || "No description available.";
         });
          samGovCache = {
           data: dummySamGovOpportunities,
           descriptions: dummyDescriptions,
           lastFetched: currentTime,
         };
         return applyFilters(dummySamGovOpportunities, dummyDescriptions, searchCriteria);
        // hasMore = false; // Stop fetching
        // break;
      }

      const data = await response.json();

      if (!data.opportunitiesData || !Array.isArray(data.opportunitiesData)) {
        console.error('Invalid data format from SAM.gov API.');
        hasMore = false;
        break;
      }

      allOpportunitiesData = allOpportunitiesData.concat(data.opportunitiesData);

      if (data.opportunitiesData.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
      // Safety break after fetching a large number of pages (e.g., 10)
      if (offset >= 10000) {
        console.warn("Reached maximum fetch limit (10 pages). Stopping.");
        hasMore = false;
      }

    } catch (error: any) {
      console.error('Error fetching data from SAM.gov API:', error);
       // Fallback to dummy data on network error
       console.warn("Falling back to dummy data due to network error.");
       const dummyDescriptions: Record<string, string> = {};
       dummySamGovOpportunities.forEach(opp => {
           dummyDescriptions[opp.id] = opp.description || "No description available.";
       });
        samGovCache = {
         data: dummySamGovOpportunities,
         descriptions: dummyDescriptions,
         lastFetched: currentTime,
       };
       return applyFilters(dummySamGovOpportunities, dummyDescriptions, searchCriteria);
      // hasMore = false; // Stop fetching
      // break;
    }
  }

  console.log(`Fetched a total of ${allOpportunitiesData.length} opportunities.`);

  // Map initial data (description might be a link)
  let mappedOpportunities: SamGovOpportunity[] = allOpportunitiesData.map((opportunity: any) => {
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
      closingDate: opportunity.responseDeadLine, // API uses responseDeadLine
      type: opportunity.type || 'N/A',
      link: opportunity.uiLink || '#',
      officeAddress: officeAddressString,
      description: opportunity.description // This might be a URL
    };
  });

  // Fetch actual descriptions concurrently for opportunities where description is a URL
  console.log(`Fetching descriptions for opportunities with description links...`);
  const descriptionPromises = mappedOpportunities.map(async (opp) => {
    // Check if description is a string and looks like a URL
    if (typeof opp.description === 'string' && opp.description.startsWith('http')) {
      try {
        // Use { cache: 'no-store' } if descriptions change frequently
        const descResponse = await fetch(`${opp.description}&api_key=${apiKey}`);
        if (descResponse.ok) {
          const descData = await descResponse.json();
          // Extract the actual description text - adjust path based on the API response structure
          // Common structures might be descData.description or nested like descData.opportunity.description
          const actualDesc = descData?.description || descData?.opportunity?.description || 'Full description not found in response.';
          return { id: opp.id, description: actualDesc };
        } else {
          console.warn(`Failed to fetch description for ${opp.id} (${descResponse.status})`);
          return { id: opp.id, description: 'Failed to load description.' }; // Keep original link on failure? Or set error message?
        }
      } catch (descError) {
        console.error(`Error fetching description for ${opp.id}:`, descError);
        return { id: opp.id, description: 'Error loading description.' };
      }
    }
    // If description is not a link or already fetched/exists, keep it as is
    return { id: opp.id, description: opp.description || 'No description provided.' };
  });

  const descriptionResults = await Promise.all(descriptionPromises);
  const descriptionsMap: Record<string, string> = {};
  descriptionResults.forEach(result => {
    descriptionsMap[result.id] = result.description;
  });
  console.log("Finished fetching descriptions.");

  // Update cache with fetched data and descriptions
  samGovCache = {
    data: mappedOpportunities,
    descriptions: descriptionsMap,
    lastFetched: currentTime,
  };
  console.log(`SAM.gov cache updated. ${mappedOpportunities.length} opportunities and descriptions stored.`);

  // Apply filters before returning
  return applyFilters(mappedOpportunities, descriptionsMap, searchCriteria);
  */
}


// Helper function to apply filters (used for both dummy data and cached data)
function applyFilters(
  opportunities: SamGovOpportunity[],
  descriptions: Record<string, string>,
  searchCriteria: Record<string, any>
): SamGovOpportunity[] {
  const { ncode, location, dateFilter, showOnlyOpen, searchQuery } = searchCriteria;

  return opportunities.filter(opportunity => {
    // Search query filter (searches title, department, subtier, office, and description)
    const searchLower = searchQuery?.toLowerCase() || '';
    const descriptionText = descriptions[opportunity.id] || '';
    const matchesSearch = !searchQuery || (
      opportunity.title?.toLowerCase().includes(searchLower) ||
      opportunity.department?.toLowerCase().includes(searchLower) ||
      opportunity.subtier?.toLowerCase().includes(searchLower) ||
      opportunity.office?.toLowerCase().includes(searchLower) ||
      descriptionText.toLowerCase().includes(searchLower) // Search description
    );

    // NAICS code filter
    const ncodeLower = ncode?.toLowerCase();
    const matchesNaics = !ncodeLower || opportunity.ncode?.toLowerCase().includes(ncodeLower);

    // Location filter (searches city, state, country, zip, and office address)
    const locationLower = location?.toLowerCase();
    const matchesLocation = !locationLower ||
      [
        opportunity.location?.city?.name,
        opportunity.location?.state?.name,
        opportunity.location?.country?.name,
        opportunity.location?.zip,
        opportunity.officeAddress, // Include office address in location search
      ]
        .filter(Boolean) // Remove null/undefined values
        .some(field => field?.toLowerCase().includes(locationLower));

    // Date filter (Closing date >= selected date)
    const selectedDate = dateFilter ? new Date(dateFilter) : undefined;
    if (selectedDate) selectedDate.setHours(0, 0, 0, 0); // Normalize date for comparison
    const closingDate = opportunity.closingDate ? new Date(opportunity.closingDate) : undefined;
    if (closingDate) closingDate.setHours(0, 0, 0, 0); // Normalize closing date
    const matchesDate = !selectedDate || (closingDate && closingDate >= selectedDate);

    // Open listings filter (Closing date >= today)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const isOpen = closingDate && closingDate >= today;
    const matchesOpen = !showOnlyOpen || isOpen;


    return matchesSearch && matchesNaics && matchesLocation && matchesDate && matchesOpen;
  });
}


// --- Helper Functions (Used by API logic, commented out but kept for reference) ---

// function getCurrentDate(): string {
//     const today = new Date();
//     const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
//     const dd = String(today.getDate()).padStart(2, '0');
//     const yyyy = today.getFullYear();
//     return `${mm}/${dd}/${yyyy}`;
// }

// function getOneYearBackDate(): string {
//     const today = new Date();
//     const pastDate = new Date(today);
//     pastDate.setDate(today.getDate() - 364); // Go back 364 days (almost a year)

//     const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
//     const dd = String(pastDate.getDate()).padStart(2, '0');
//     const yyyy = pastDate.getFullYear();
//     return `${mm}/${dd}/${yyyy}`;
// }
