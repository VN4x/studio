'use server';

/**
 * @fileOverview An AI agent that enhances job notes with a summary of key details.
 *
 * - enhanceJobNotes - A function that enhances the job notes.
 * - EnhanceJobNotesInput - The input type for the enhanceJobNotes function.
 * - EnhanceJobNotesOutput - The return type for the enhanceJobNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceJobNotesInputSchema = z.object({
  notes: z.string().describe('The original job notes.'),
  contractNumber: z.string().describe('The contract number for the job.'),
  clientAddress: z.string().describe('The client address for the job.'),
  windowCount: z.number().describe('The number of windows for the job.'),
  squareMeters: z.number().describe('The total square meters of windows.'),
  circumference: z.number().describe('The total circumference of windows.'),
  addons: z.string().describe('A comma separated list of add-ons for the job (e.g. Inner Sills, Outer Sills).'),
});
export type EnhanceJobNotesInput = z.infer<typeof EnhanceJobNotesInputSchema>;

const EnhanceJobNotesOutputSchema = z.object({
  enhancedNotes: z.string().describe('The enhanced job notes with a summary of key details.'),
});
export type EnhanceJobNotesOutput = z.infer<typeof EnhanceJobNotesOutputSchema>;

export async function enhanceJobNotes(input: EnhanceJobNotesInput): Promise<EnhanceJobNotesOutput> {
  return enhanceJobNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceJobNotesPrompt',
  input: {schema: EnhanceJobNotesInputSchema},
  output: {schema: EnhanceJobNotesOutputSchema},
  prompt: `You are an AI assistant helping a window installation manager enhance job notes for their team.

  Your task is to summarize the key details of the job and add it to the beginning of the notes.

  Here are the job details:
  Contract Number: {{{contractNumber}}}
  Client Address: {{{clientAddress}}}
  Number of Windows: {{{windowCount}}}
  Square Meters: {{{squareMeters}}}
  Circumference: {{{circumference}}}
  Add-ons: {{{addons}}}

  Original Notes: {{{notes}}}

  Enhanced Notes:`, // Ensure the prompt is well-formatted and clear
});

const enhanceJobNotesFlow = ai.defineFlow(
  {
    name: 'enhanceJobNotesFlow',
    inputSchema: EnhanceJobNotesInputSchema,
    outputSchema: EnhanceJobNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
