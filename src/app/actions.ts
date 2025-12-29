'use server';

import {
  generateImageDescriptionFlow,
} from '@/ai/flows/generate-image-description';
import {
  findObjectsFlow,
} from '@/ai/flows/find-objects-flow';
import { z } from 'zod';

// Types for Image Description
const GenerateImageDescriptionInputSchema = z.object({
  imageUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
});


type ImageDescriptionResult = {
  description?: string;
  error?: string;
};

export type GenerateImageDescriptionInput = z.infer<
  typeof GenerateImageDescriptionInputSchema
>;

export async function getImageDescriptionAction(
  input: GenerateImageDescriptionInput
): Promise<ImageDescriptionResult> {
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

// Types for Object Finder
const FindObjectsInputSchema = z.object({
  imageUrl: z.string(),
  objects: z.array(z.string()),
  apiKey: z.string(),
  model: z.string(),
});

export type FindObjectsInput = z.infer<typeof FindObjectsInputSchema>;

type ObjectFinderResult = {
  results?: {
    [key: string]: {
      found: boolean;
      count: number;
    };
  };
  error?: string;
};

export async function findObjectsAction(
  input: FindObjectsInput
): Promise<ObjectFinderResult> {
  if (!input.imageUrl) {
    return { error: 'Image data is missing.' };
  }
  if (!input.apiKey) {
    return { error: 'API Key is required.' };
  }
  if (!input.model) {
    return { error: 'Model is required.' };
  }
  if (!input.objects || input.objects.length === 0) {
    return { error: 'Please provide at least one object to find.' };
  }

  try {
    const result = await findObjectsFlow(input);
    return { results: result.results };
  } catch (e) {
    const error = e as Error;
    console.error(error);
    if (error.message.includes('API key not valid')) {
      return {
        error:
          'Your Gemini API key appears to be invalid. Please check it and try again.',
      };
    }
    if (error.message.includes('invalid JSON response')) {
       return {
        error: `The AI returned an invalid response. Please try again. Raw response: ${error.message.substring(error.message.indexOf("Raw response:"))}`,
      };
    }
    return {
      error: `Failed to find objects: ${error.message}`,
    };
  }
}
