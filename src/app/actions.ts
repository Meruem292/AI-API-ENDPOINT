'use server';

import {
  generateImageDescriptionFlow,
} from '@/ai/flows/generate-image-description';
import {
  findObjectsFlow,
} from '@/ai/flows/find-objects-flow';
import { imageQaFlow } from '@/ai/flows/image-qa-flow';
import { getCounter } from '@/lib/firebase/firestore';
import { z } from 'zod';

// Types for Image Description
const GenerateImageDescriptionInputSchema = z.object({
  imageUrl: z.string(),
  apiKey: z.string(),
  model: z.string(),
  prompt: z.string().optional(),
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
          'Your Gemini API key appears to be be invalid. Please check it and try again.',
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
  prompt: z.string().optional(),
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
          'Your Gemini API key appears to be be invalid. Please check it and try again.',
      };
    }
    return {
      error: `Failed to find objects: ${error.message}`,
    };
  }
}

// Types for Image Q&A
const ImageQaInputSchema = z.object({
  imageUrl: z.string(),
  prompt: z.string(),
  apiKey: z.string(),
  model: z.string(),
});

export type ImageQaInput = z.infer<typeof ImageQaInputSchema>;

type ImageQaResult = {
  jsonResponse?: string;
  error?: string;
};

export async function imageQaAction(
  input: ImageQaInput
): Promise<ImageQaResult> {
  if (!input.imageUrl) {
    return { error: 'Image data is missing.' };
  }
  if (!input.prompt) {
    return { error: 'Prompt is required.' };
  }
  if (!input.apiKey) {
    return { error: 'API Key is required.' };
  }
  if (!input.model) {
    return { error: 'Model is required.' };
  }

  try {
    const result = await imageQaFlow(input);
    return { jsonResponse: result.jsonResponse };
  } catch (e) {
    const error = e as Error;
    console.error(error);
    if (error.message.includes('API key not valid')) {
      return {
        error:
          'Your Gemini API key appears to be be invalid. Please check it and try again.',
      };
    }
    // A more generic error for parsing or other AI issues
    if (error.message.includes('The AI returned an empty response')) {
         return {
              error: 'The AI returned an empty or invalid response. Please check your prompt and try again.',
         };
    }

    return {
      error: `Failed to get a response: ${error.message}`,
    };
  }
}

export async function getApiUsageCount(counterId: 'imageDescriber' | 'objectFinder' | 'imageQa'): Promise<{ count: number; error?: string }> {
    try {
        const count = await getCounter(counterId);
        return { count };
    } catch (e) {
        const error = e as Error;
        console.error(error);
        return { count: 0, error: `Failed to get API usage count: ${error.message}` };
    }
}
