
/**
 * Represents a contract opportunity from SAM.gov.
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
   * The NAICS code for the opportunity.
   */
  ncode: string;
  /**
   * The department issuing the opportunity.
   */
  department: string;
  /**
   * The subtier of the department.
   */
  subtier: string;
  /**
   * The specific office within the subtier.
   */
  office: string;
  /**
   * The location related to the opportunity.
   */
  location: {
    city?: { name: string; code?: string };
    state?: { name: string; code?: string };
    zip?: string;
    country?: { name: string; code?: string };
  } | null;
  /**
   * The closing date for the opportunity.
   */
  closingDate: string; // ISO date string
  /**
   * The type of opportunity (e.g., Solicitation, Sources Sought).
   */
  type: string;
  /**
   * Direct link to the opportunity on SAM.gov.
   */
  link: string;
  /**
   * Address of the office.
   */
  officeAddress: string;
  /**
   * Full description of the opportunity. This might be a URL or plain text.
   */
  description: string;
}
