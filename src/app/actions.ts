'use server';

import { generateImageDescription } from '@/ai/flows/generate-image-description';

type ActionResult = {
  description?: string;
  error?: string;
};

export async function getImageDescriptionAction(
  formData: FormData
): Promise<ActionResult> {
  const imageUrl = formData.get('imageUrl') as string;
  const apiKey = formData.get('apiKey') as string;

  if (!imageUrl || !apiKey) {
    return { error: 'Image URL and API Key are required.' };
  }

  try {
    const result = await generateImageDescription({ imageUrl, apiKey });
    return { description: result.description };
  } catch (e) {
    const error = e as Error;
    console.error(error);
    if (error.message.includes('API key not valid')) {
      return {
        error: 'Your Gemini API key appears to be invalid. Please check it and try again.',
      };
    }
    return {
      error: `Failed to generate description: ${error.message}`,
    };
  }
}
