'use server';

/**
 * @fileOverview A flow for performing speaker diarization on audio.
 *
 * - diarizeAudio - A function that transcribes audio and identifies who spoke when.
 * - DiarizeAudioInput - The input type for the diarizeAudio function.
 * - DiarizeAudioOutput - The return type for the diarizeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiarizeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data URI of the meeting recording. Must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DiarizeAudioInput = z.infer<typeof DiarizeAudioInputSchema>;

const UtteranceSchema = z.object({
  speaker: z.number().describe('The identified speaker index (e.g., 0, 1, 2).'),
  text: z.string().describe('The transcribed text of the utterance.'),
  startSec: z
    .number()
    .optional()
    .describe('Approximate start time (seconds) for this utterance.'),
  endSec: z
    .number()
    .optional()
    .describe('Approximate end time (seconds) for this utterance.'),
});

const DiarizeAudioOutputSchema = z.object({
  utterances: z
    .array(UtteranceSchema)
    .describe('A list of utterances with speaker tags and text.'),
});
export type DiarizeAudioOutput = z.infer<typeof DiarizeAudioOutputSchema>;

// Main function
export async function diarizeAudio(
  input: DiarizeAudioInput
): Promise<DiarizeAudioOutput> {
  return diarizeAudioFlow(input);
}

// Prompt definition
const diarizeAudioPrompt = ai.definePrompt({
  name: 'diarizeAudioPrompt',
  input: { schema: DiarizeAudioInputSchema },
  output: { schema: DiarizeAudioOutputSchema },
  prompt: `You are an expert in speaker diarization. Analyze the following audio and transcribe it, identifying each speaker. The output should be a list of utterances, where each utterance has a speaker number, the corresponding text, and rough timestamps (in seconds) for startSec and endSec.

For example (schema, not prose):
{
  "utterances": [
    {"speaker":0, "text":"Hello, everyone.", "startSec":0.2, "endSec":1.6},
    {"speaker":1, "text":"Hi, good to be here.", "startSec":1.7, "endSec":3.1}
  ]
}

Audio: {{media url=audioDataUri}}`,
});

// Flow definition
const diarizeAudioFlow = ai.defineFlow(
  {
    name: 'diarizeAudioFlow',
    inputSchema: DiarizeAudioInputSchema,
    outputSchema: DiarizeAudioOutputSchema,
  },
  async (input) => {
    const { output } = await diarizeAudioPrompt(input);
    return output!;
  }
);
