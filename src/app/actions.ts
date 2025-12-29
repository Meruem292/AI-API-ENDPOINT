'use server';

import {
  generateImageDescriptionFlow,
  GenerateImageDescriptionInputSchema,
} from '@/ai/flows/generate-image-description';
import { z } from 'zod';

type ActionResult = {
  description?: string;
  error?: string;
};

export type GenerateImageDescriptionInput = z.infer<
  typeof GenerateImageDescriptionInputSchema
>;

export async function getImageDescriptionAction(
  input: GenerateImageDescriptionInput
): Promise<ActionResult> {
  if (!input.imageUrl) {
    return { error: 'Image data is missing.' };
  }
  if (!input.apiKey) {
    return { error: 'API Key is required.' };
  }
  if (!input.model) {
    return { error: 'Model is required.' };
  }

  try {
    const result = await generateImageDescriptionFlow(input);
    return { description: result.description };
  } catch (e) {
    const error = e as Error;
    console.error(error);
    if (error.message.includes('API key not valid')) {
      return {
        error:
          'Your Gemini API key appears to be invalid. Please check it and try again.',
      };
    }
    return {
      error: `Failed to generate description: ${error.message}`,
    };
  }
}
