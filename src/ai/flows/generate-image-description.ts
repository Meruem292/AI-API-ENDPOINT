'use server';

/**
 * @fileOverview Image description generation flow.
 *
 * This file defines the Genkit flow responsible for generating an image description.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'zod';
import {ai} from '@/ai/genkit';

const GenerateImageDescriptionInputSchema = z.object({
  imageUrl: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  apiKey: z.string().min(1).describe('The user-provided Gemini API key.'),
  model: z.string().min(1).describe('The user-provided Gemini model.'),
});

const GenerateImageDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated description of the image.'),
});

export const generateImageDescriptionFlow = ai.defineFlow(
  {
    name: 'generateImageDescriptionFlow',
    inputSchema: GenerateImageDescriptionInputSchema,
    outputSchema: GenerateImageDescriptionOutputSchema,
  },
  async input => {
    // This custom AI instance ensures that ONLY the user-provided apiKey is used for this call.
    // It will not fall back to any environment variables.
    const customAi = genkit({
      plugins: [googleAI({apiKey: input.apiKey})],
    });

    const prompt = customAi.definePrompt({
      name: 'generateImageDescriptionPrompt',
      input: {schema: GenerateImageDescriptionInputSchema},
      output: {schema: GenerateImageDescriptionOutputSchema},
      prompt: `You are an AI vision expert that describes the contents of images.
    
      Please analyze the image and provide a detailed description of its contents:
      
      {{media url=imageUrl}}
      
      Focus on identifying key objects, scenes, and overall context within the image.
      Response must be a detailed paragraph.`,
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

    const {output} = await prompt(input);
    return output!;
  }
);
