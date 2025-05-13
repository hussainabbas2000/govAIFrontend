'use server';
/**
 * @fileOverview Summarizes a contract opportunity using AI, extracting key fields.
 *
 * - summarizeContractOpportunity - A function that summarizes a contract opportunity.
 * - SummarizeContractOpportunityInput - The input type for the summarizeContractOpportunity function.
 * - SummarizeContractOpportunityOutput - The return type for the summarizeContractOpportunity function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type {SamGovOpportunity} from '@/services/sam-gov';
// Assuming SeptaOpportunity type exists or you might need to define it
// import {SeptaOpportunity} from '@/services/septa';

// Define input schema accepting SamGovOpportunity
const SummarizeContractOpportunityInputSchema = z.object({
  opportunity: z.custom<SamGovOpportunity>().describe('The contract opportunity object to summarize.'),
});
export type SummarizeContractOpportunityInput = z.infer<typeof SummarizeContractOpportunityInputSchema>;

// Define output schema for extracted details
const SummarizeContractOpportunityOutputSchema = z.object({
  requiredProductService: z.array(z.string()).describe('A list of all main products or services required by the opportunity.'),
  quantities: z.record(z.string(), z.number()).describe('An object mapping each required product/service to its numerical quantity. If a quantity is not specified for a product, it defaults to 1.'),
  deadline: z.string().describe('The closing date or response deadline for the opportunity.'),
  location: z.string().describe('The primary location where the work will be performed or delivered.'),
});
export type SummarizeContractOpportunityOutput = z.infer<typeof SummarizeContractOpportunityOutputSchema>;

export async function summarizeContractOpportunity(input: SummarizeContractOpportunityInput): Promise<SummarizeContractOpportunityOutput> {
  return summarizeContractOpportunityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeContractOpportunityPrompt',
  input: { schema: SummarizeContractOpportunityInputSchema },
  output: { schema: SummarizeContractOpportunityOutputSchema },
  prompt: `Analyze the following contract opportunity details and extract the requested information. Focus on identifying *all* core requirements, their quantities, the deadline, and the primary location.

Opportunity Title: {{{opportunity.title}}}
Opportunity Type: {{{opportunity.type}}}
Department: {{{opportunity.department}}}
Subtier: {{{opportunity.subtier}}}
Office: {{{opportunity.office}}}
NAICS Code: {{{opportunity.ncode}}}
Closing Date: {{{opportunity.closingDate}}}
Location: {{#if opportunity.location}}{{opportunity.location.city.name}}, {{opportunity.location.state.name}} {{opportunity.location.zip}}{{else}}N/A{{/if}}
Office Address: {{{opportunity.officeAddress}}}
Description:
{{{opportunity.description}}}

Based *only* on the information provided above, extract the following:
1.  **Required Product/Service:** Identify *all* distinct main items, tasks, or services being procured. List each primary product or service. Examples: "IT support", "Network Management", "Cybersecurity services", "Facility Wing Construction", "Janitorial Services", "Penetration Testing", "Office Supplies", "Grant Management Software", "Vehicle Maintenance", "Translation Services", "Environmental Assessment", "Cloud Hosting", "IT Hardware Procurement", "SATA HDD", "DDR4 RAM", "Intel Processors". Return these as an array of strings. Be concise for each item.
2.  **Quantities:** For each item listed in 'requiredProductService' (result of step 1), determine its numerical quantity.
    - If a specific numerical quantity is mentioned for an item (e.g., "500 units of X", "200 Ys", "500 SATA 2 HDD", "200 2TB DDR4 RAM"), use that number.
    - If an item is listed in 'requiredProductService' but no specific numerical quantity is provided for it in the description, assign a quantity of 1 to that item.
    - If the overall description gives a general scale (e.g., "for 500 users", "20,000 sq ft") but not for individual items, still assign a quantity of 1 to each distinct product/service identified in 'requiredProductService', unless a more specific quantity can be inferred for that item.
    - Structure this as a JSON object where keys are the product/service names (matching those in 'requiredProductService') and values are their corresponding numerical quantities. Example: {"SATA HDD": 500, "2TB DDR4 RAM": 200, "Intel i9-9700K Processors": 300, "IT Hardware Procurement": 1}.
3.  **Deadline:** Extract the closing date.
4.  **Location:** Extract the primary place of performance location (City, State, Zip if available). If multiple locations are mentioned, use the primary one listed or inferred.

Return the extracted information in the specified JSON format, ensuring 'requiredProductService' is an array of strings and 'quantities' is an object mapping product names to numbers.`,
});


const summarizeContractOpportunityFlow = ai.defineFlow<
  typeof SummarizeContractOpportunityInputSchema,
  typeof SummarizeContractOpportunityOutputSchema
>({
  name: 'summarizeContractOpportunityFlow',
  inputSchema: SummarizeContractOpportunityInputSchema,
  outputSchema: SummarizeContractOpportunityOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  if (!output) {
      throw new Error("AI failed to generate summary output.");
  }
   // Ensure all fields have values, providing defaults if necessary
   return {
    requiredProductService: output.requiredProductService || [], // Default to empty array
    quantities: output.quantities || {}, // Default to empty object
    deadline: output.deadline || input.opportunity.closingDate || "Not specified", // Fallback to original date
    location: output.location || "Could not determine",
   };
});

