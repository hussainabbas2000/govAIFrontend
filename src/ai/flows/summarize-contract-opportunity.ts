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
import {SamGovOpportunity} from '@/services/sam-gov';
// Assuming SeptaOpportunity type exists or you might need to define it
// import {SeptaOpportunity} from '@/services/septa';

// Define input schema accepting SamGovOpportunity
const SummarizeContractOpportunityInputSchema = z.object({
  opportunity: z.custom<SamGovOpportunity>().describe('The contract opportunity object to summarize.'),
});
export type SummarizeContractOpportunityInput = z.infer<typeof SummarizeContractOpportunityInputSchema>;

// Define output schema for extracted details
const SummarizeContractOpportunityOutputSchema = z.object({
  requiredProductService: z.string().describe('The main product or service required by the opportunity.'),
  quantity: z.string().describe('The estimated quantity or scale of the product/service needed (e.g., "500 units", "approx. 10 FTEs", "20,000 sq ft"). Extract any numerical value related to quantity or scale.'),
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
  prompt: `Analyze the following contract opportunity details and extract the requested information. Focus on identifying the core requirement, any mentioned quantity/scale, the deadline, and the primary location.

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
1.  **Required Product/Service:** Identify the main item, task, or service being procured. Be concise.
2.  **Quantity:** Find any mention of quantity, number of units, size (e.g., sq ft), number of personnel (FTEs), or other scale indicators within the title or description. If multiple quantities are mentioned, focus on the most prominent one related to the core requirement. If none is explicitly stated, respond with "Not specified".
3.  **Deadline:** Extract the closing date.
4.  **Location:** Extract the primary place of performance location (City, State, Zip if available). If multiple locations are mentioned, use the primary one listed or inferred.

Return the extracted information in the specified JSON format.`,
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
    requiredProductService: output.requiredProductService || "Could not determine",
    quantity: output.quantity || "Not specified",
    deadline: output.deadline || input.opportunity.closingDate || "Not specified", // Fallback to original date
    location: output.location || "Could not determine",
   };
});
