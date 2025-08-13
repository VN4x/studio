'use server';

/**
 * @fileOverview AI-powered function to suggest an estimated time for a window installation job.
 *
 * - suggestEstimatedTime - A function that suggests the estimated time for a job.
 * - SuggestEstimatedTimeInput - The input type for the suggestEstimatedTime function.
 * - SuggestEstimatedTimeOutput - The return type for the suggestEstimatedTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEstimatedTimeInputSchema = z.object({
  windowCount: z.number().describe('The number of windows to be installed.'),
  squareMeters: z.number().describe('The total square meters of the windows.'),
  circumference: z.number().describe('The total circumference of the windows.'),
  addons: z.object({
    innerSills: z.boolean().describe('Whether inner sills are included.'),
    outerSills: z.boolean().describe('Whether outer sills are included.'),
    finishing: z.boolean().describe('Whether finishing is required.'),
    tape: z.boolean().describe('Whether tape is required.'),
    extras: z.boolean().describe('Whether there are any extras.'),
  }).describe('A map of add-ons and whether they are selected'),
  notes: z.string().describe('Any notes about the job.'),
});
export type SuggestEstimatedTimeInput = z.infer<typeof SuggestEstimatedTimeInputSchema>;

const SuggestEstimatedTimeOutputSchema = z.object({
  estimatedTime: z.string().describe('The estimated time for the job (e.g., "2 hours", "3.5 hours").'),
});
export type SuggestEstimatedTimeOutput = z.infer<typeof SuggestEstimatedTimeOutputSchema>;

export async function suggestEstimatedTime(input: SuggestEstimatedTimeInput): Promise<SuggestEstimatedTimeOutput> {
  return suggestEstimatedTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEstimatedTimePrompt',
  input: {schema: SuggestEstimatedTimeInputSchema},
  output: {schema: SuggestEstimatedTimeOutputSchema},
  prompt: `You are an expert window installation time estimator.

  Based on the following information, estimate the time it will take to complete the job.

  Number of windows: {{{windowCount}}}
  Total square meters: {{{squareMeters}}}
  Total circumference: {{{circumference}}}
  Add-ons: Inner Sills: {{#if addons.innerSills}}Yes{{else}}No{{/if}}, Outer Sills: {{#if addons.outerSills}}Yes{{else}}No{{/if}}, Finishing: {{#if addons.finishing}}Yes{{else}}No{{/if}}, Tape: {{#if addons.tape}}Yes{{else}}No{{/if}}, Extras: {{#if addons.extras}}Yes{{else}}No{{/if}}
  Notes: {{{notes}}}

  Provide the estimated time in the format: "X hours" or "Y.Z hours".`,
});

const suggestEstimatedTimeFlow = ai.defineFlow(
  {
    name: 'suggestEstimatedTimeFlow',
    inputSchema: SuggestEstimatedTimeInputSchema,
    outputSchema: SuggestEstimatedTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
