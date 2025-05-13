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

// Define input schema accepting SamGovOpportunity
const SummarizeContractOpportunityInputSchema = z.object({
  opportunity: z.custom<SamGovOpportunity>().describe('The contract opportunity object to summarize.'),
});
export type SummarizeContractOpportunityInput = z.infer<typeof SummarizeContractOpportunityInputSchema>;

// Define the schema for the AI prompt's direct output.
// Here, 'quantities' is expected as a JSON string from the AI.
const InternalPromptOutputSchema = z.object({
  requiredProductService: z.array(z.string()).describe('A list of all main products or services required by the opportunity.'),
  quantities: z.string().describe('A JSON string representing an object that maps each required product/service to its numerical quantity. Example: "{\\"SATA HDD\\": 500, \\"2TB DDR4 RAM\\": 200}"'),
  deadline: z.string().describe('The closing date or response deadline for the opportunity.'),
  location: z.string().describe('The primary location where the work will be performed or delivered.'),
});

// Define the final output schema for the flow (and for export).
// Here, 'quantities' is the parsed object.
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
  output: { schema: InternalPromptOutputSchema }, // AI generates output matching this schema
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
    - Structure this as a **JSON STRING** where keys are the product/service names (matching those in 'requiredProductService') and values are their corresponding numerical quantities. Example: "{\\"SATA HDD\\": 500, \\"2TB DDR4 RAM\\": 200, \\"Intel i9-9700K Processors\\": 300, \\"IT Hardware Procurement\\": 1}".
3.  **Deadline:** Extract the closing date.
4.  **Location:** Extract the primary place of performance location (City, State, Zip if available). If multiple locations are mentioned, use the primary one listed or inferred.

Return the extracted information in the specified JSON format. Make sure 'requiredProductService' is an array of strings and 'quantities' is a JSON string as described.`,
});


const summarizeContractOpportunityFlow = ai.defineFlow<
  typeof SummarizeContractOpportunityInputSchema,
  typeof SummarizeContractOpportunityOutputSchema // Flow's final output uses the parsed quantities
>({
  name: 'summarizeContractOpportunityFlow',
  inputSchema: SummarizeContractOpportunityInputSchema,
  outputSchema: SummarizeContractOpportunityOutputSchema,
}, async (input): Promise<SummarizeContractOpportunityOutput> => {
  const {output: rawOutput} = await prompt(input);
  if (!rawOutput) {
      throw new Error("AI failed to generate summary output.");
  }

  let parsedQuantities: Record<string, number>;
  try {
    parsedQuantities = JSON.parse(rawOutput.quantities);
    // Validate the parsed object structure
    z.record(z.string(), z.number()).parse(parsedQuantities);
  } catch (e) {
    console.error("Failed to parse quantities JSON string from AI:", e);
    console.error("AI returned quantities string:", rawOutput.quantities);
    // Fallback to an empty object or handle as appropriate for your application
    // For example, if some products were identified but quantities failed to parse,
    // you might want to assign default quantity 1 to them.
    parsedQuantities = (rawOutput.requiredProductService || []).reduce((acc, productName) => {
        acc[productName] = 1; // Default to 1 if parsing fails
        return acc;
    }, {} as Record<string, number>);
    // Alternatively, throw a more specific error or return a partial result with an error indicator
    // throw new Error("AI returned invalid JSON for quantities.");
  }

   return {
    requiredProductService: rawOutput.requiredProductService || [],
    quantities: parsedQuantities,
    deadline: rawOutput.deadline || input.opportunity.closingDate || "Not specified",
    location: rawOutput.location || "Could not determine",
   };
});

