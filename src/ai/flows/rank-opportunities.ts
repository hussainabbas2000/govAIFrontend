'use server';
/**
 * @fileOverview Ranks contract opportunities based on user preferences using AI.
 *
 * - rankOpportunities - A function that ranks a single opportunity based on user preferences.
 * - RankOpportunitiesInput - The input type for the rankOpportunities function.
 * - RankOpportunitiesOutput - The return type for the rankOpportunities function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the schema for user preferences, matching localStorage structure
const UserPreferencesSchema = z.object({
  opportunityType: z.enum(['product', 'service', 'product/service', '']).optional().describe('Preferred type of opportunity (product, service, or both). Empty string means no preference.'),
  location: z.string().optional().describe('Preferred location(s) for opportunities (e.g., "Philadelphia, PA; New York, NY"). Empty means nationwide.'),
  interestedDepartments: z.string().optional().describe('Specific departments or agencies of interest (e.g., "Department of Defense; GSA"). Empty means all.'),
});


const RankOpportunitiesInputSchema = z.object({
  opportunityDescription: z.string().describe('The title or description of the contract opportunity.'),
  userPreferences: UserPreferencesSchema.describe('The user\'s preferences.'),
});
export type RankOpportunitiesInput = z.infer<typeof RankOpportunitiesInputSchema>;

const RankOpportunitiesOutputSchema = z.object({
  relevanceScore: z.number().min(0).max(1).describe('A score indicating the relevance of the opportunity to the user (0 to 1).'),
});
export type RankOpportunitiesOutput = z.infer<typeof RankOpportunitiesOutputSchema>;

export async function rankOpportunities(input: RankOpportunitiesInput): Promise<RankOpportunitiesOutput> {
  return rankOpportunitiesFlow(input);
}

const rankOpportunitiesPrompt = ai.definePrompt({
  name: 'rankOpportunitiesPrompt',
  input: {
    schema: RankOpportunitiesInputSchema, // Use the combined schema
  },
  output: {
    schema: RankOpportunitiesOutputSchema,
  },
  prompt: `You are an AI assistant that ranks contract opportunities based on user preferences.

  Given the following opportunity description:
  "{{{opportunityDescription}}}"

  And the following user preferences:
  Opportunity Type Preference: "{{#if userPreferences.opportunityType}}{{userPreferences.opportunityType}}{{else}}Any{{/if}}"
  Location Preference: "{{#if userPreferences.location}}{{userPreferences.location}}{{else}}Anywhere{{/if}}"
  Interested Departments/Agencies: "{{#if userPreferences.interestedDepartments}}{{userPreferences.interestedDepartments}}{{else}}Any{{/if}}"

  Analyze the opportunity description and determine how well it matches the user's preferences. Consider the type of work (product, service, or both), the location mentioned or implied in the description compared to the user's preference, and whether the agency involved matches the user's interests.

  Provide a relevance score between 0.0 and 1.0 (inclusive), where 1.0 means the opportunity is a perfect match for the user's preferences, and 0.0 means it is not relevant at all. Be precise with the score.

  Return ONLY the relevance score as a number in the JSON output.`,
});


const rankOpportunitiesFlow = ai.defineFlow<
  typeof RankOpportunitiesInputSchema,
  typeof RankOpportunitiesOutputSchema
>({
  name: 'rankOpportunitiesFlow',
  inputSchema: RankOpportunitiesInputSchema,
  outputSchema: RankOpportunitiesOutputSchema,
}, async input => {
  // Ensure userPreferences is not null or undefined before passing to the prompt
  const validatedInput = {
      ...input,
      userPreferences: input.userPreferences || { opportunityType: '', location: '', interestedDepartments: '' } // Provide default empty preferences if null/undefined
  };
  const {output} = await rankOpportunitiesPrompt(validatedInput);
  // Ensure a valid score is returned, default to 0 if undefined
  return output ? { relevanceScore: output.relevanceScore ?? 0 } : { relevanceScore: 0 };
});

