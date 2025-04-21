'use server';
/**
 * @fileOverview Summarizes a contract opportunity using AI.
 *
 * - summarizeContractOpportunity - A function that summarizes a contract opportunity.
 * - SummarizeContractOpportunityInput - The input type for the summarizeContractOpportunity function.
 * - SummarizeContractOpportunityOutput - The return type for the summarizeContractOpportunity function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {SamGovOpportunity} from '@/services/sam-gov';
import {SeptaOpportunity} from '@/services/septa';

const SummarizeContractOpportunityInputSchema = z.object({
  opportunity: z.union([
    z.object({
      source: z.literal('sam.gov'),
      data: z.custom<SamGovOpportunity>(),
    }),
    z.object({
      source: z.literal('septa'),
      data: z.custom<SeptaOpportunity>(),
    }),
  ]).describe('The contract opportunity to summarize.'),
});
export type SummarizeContractOpportunityInput = z.infer<typeof SummarizeContractOpportunityInputSchema>;

const SummarizeContractOpportunityOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the contract opportunity.'),
});
export type SummarizeContractOpportunityOutput = z.infer<typeof SummarizeContractOpportunityOutputSchema>;

export async function summarizeContractOpportunity(input: SummarizeContractOpportunityInput): Promise<SummarizeContractOpportunityOutput> {
  return summarizeContractOpportunityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeContractOpportunityPrompt',
  input: {
    schema: z.object({
      opportunity: z.union([
        z.object({
          source: z.literal('sam.gov'),
          data: z.custom<SamGovOpportunity>(),
        }),
        z.object({
          source: z.literal('septa'),
          data: z.custom<SeptaOpportunity>(),
        }),
      ]).describe('The contract opportunity to summarize.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the contract opportunity.'),
    }),
  },
  prompt: `You are an AI assistant that summarizes government contract opportunities.

  Summarize the following contract opportunity in a concise manner, highlighting the key aspects such as the agency, location, and a brief description of the project. The summary should be no more than 100 words.

  Source: {{opportunity.source}}
  Title: {{opportunity.data.title}}
  Agency: {{opportunity.data.agency}}
  Location: {{opportunity.data.location}}
  Closing Date: {{opportunity.data.closingDate}}
  Description: {{opportunity.data.title}}`,
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
  return output!;
});

