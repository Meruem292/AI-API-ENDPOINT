'use server';

/**
 * @fileOverview Image description generation flow.
 *
 * - generateImageDescription - A function that generates a description of an image based on a provided URL and API key.
 * - GenerateImageDescriptionInput - The input type for the generateImageDescription function.
 * - GenerateImageDescriptionOutput - The return type for the generateImageDescription function.
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
});
export type GenerateImageDescriptionInput = z.infer<
  typeof GenerateImageDescriptionInputSchema
>;

const GenerateImageDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated description of the image.'),
});
export type GenerateImageDescriptionOutput = z.infer<
  typeof GenerateImageDescriptionOutputSchema
>;

export async function generateImageDescription(
  input: GenerateImageDescriptionInput
): Promise<GenerateImageDescriptionOutput> {
  return generateImageDescriptionFlow(input);
}

const generateImageDescriptionFlow = ai.defineFlow(
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
      model: 'googleai/gemini-2.5-flash',
    });

    const {output} = await prompt(input);
    return output!;
  }
);
