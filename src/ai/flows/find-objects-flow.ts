'use server';

/**
 * @fileOverview Object finding flow.
 *
 * This file defines the Genkit flow responsible for finding objects in an image.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ai } from '@/ai/genkit';

const FindObjectsInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "A photo of an image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  objects: z.array(z.string()).describe('An array of object names to find.'),
  apiKey: z.string().min(1).describe('The user-provided Gemini API key.'),
  model: z.string().min(1).describe('The user-provided Gemini model.'),
});

const FindObjectsOutputSchema = z.object({
  results: z
    .record(
      z.object({
        found: z.boolean(),
        count: z.number(),
      })
    )
    .describe('An object with keys being the object names to find.'),
});

export const findObjectsFlow = ai.defineFlow(
  {
    name: 'findObjectsFlow',
    inputSchema: FindObjectsInputSchema,
    outputSchema: FindObjectsOutputSchema,
  },
  async (input) => {
    // This custom AI instance ensures that ONLY the user-provided apiKey is used for this call.
    // It will not fall back to any environment variables.
    const customAi = genkit({
      plugins: [googleAI({ apiKey: input.apiKey })],
    });

    const prompt = customAi.definePrompt({
      name: 'findObjectsPrompt',
      input: { schema: FindObjectsInputSchema },
      output: { schema: FindObjectsOutputSchema },
      prompt: `You are an AI vision expert that finds objects in images.
    
      Analyze the image provided and determine if the following objects are present: {{#each objects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
      
      For each object, respond with whether it was found (true/false) and the count of how many times it appears.
      
      Image:
      {{media url=imageUrl}}
      `,
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_LOW_AND_ABOVE',
          },
        ],
      },
      model: `googleai/${input.model}`,
    });

    const { output } = await prompt(input);
    return output!;
  }
);
