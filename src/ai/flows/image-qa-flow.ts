'use server';

/**
 * @fileOverview Image Q&A flow.
 *
 * This file defines the Genkit flow responsible for answering a question about an image in JSON format.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { incrementCounter } from '@/lib/firebase/firestore';

const ImageQaInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "A photo of an image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().min(1).describe('The user question about the image.'),
  apiKey: z.string().min(1).describe('The user-provided Gemini API key.'),
  model: z.string().min(1).describe('The user-provided Gemini model.'),
});

const ImageQaOutputSchema = z.object({
  jsonResponse: z.string().describe('The JSON response from the model as a string.'),
});

export const imageQaFlow = ai.defineFlow(
  {
    name: 'imageQaFlow',
    inputSchema: ImageQaInputSchema,
    outputSchema: ImageQaOutputSchema,
  },
  async (input) => {
    // This custom AI instance ensures that ONLY the user-provided apiKey is used for this call.
    // It will not fall back to any environment variables.
    const customAi = genkit({
      plugins: [googleAI({ apiKey: input.apiKey })],
    });

    const prompt = customAi.definePrompt({
      name: 'imageQaPrompt',
      input: { schema: ImageQaInputSchema },
      prompt: `{{prompt}}\n\nImage:\n{{media url=imageUrl}}`,
      config: {
        // We explicitly ask for a JSON string, not a specific schema,
        // because the user's prompt defines the structure.
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
    
    await incrementCounter('imageQa');
    
    // The output should already be a JS object if response_mime_type is application/json.
    // We stringify it to pass it back to the client as a clean string.
    const jsonString = JSON.stringify(output, null, 2);

    return { jsonResponse: jsonString };
  }
);
