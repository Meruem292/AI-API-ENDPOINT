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
import { incrementCounter } from '@/lib/firebase/firestore';

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
      prompt: `You are an AI vision expert that finds objects in images.

      Analyze the image provided and determine if the following objects are present: {{#each objects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

      Respond with ONLY a valid JSON object. Do not include any other text or markdown formatting.
      The JSON object should have a single key "results". The value of "results" should be an object where each key is an object name you were asked to find.
      For each object name, the value should be an object with two keys: "found" (a boolean) and "count" (a number).

      Example response format:
      {"results":{"car":{"found":true,"count":2},"bottle":{"found":true,"count":1},"chair":{"found":false,"count":0}}}

      Image:
      {{media url=imageUrl}}
      `,
      config: {
        response_mime_type: 'application/json',
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

    if (!output) {
      throw new Error('The AI returned an empty response.');
    }

    if (output) {
      await incrementCounter('objectFinder');
    }

    return FindObjectsOutputSchema.parse(output);
  }
);
