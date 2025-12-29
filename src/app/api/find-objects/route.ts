import { findObjectsFlow } from '@/ai/flows/find-objects-flow';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const webhookSchema = z.object({
  imageUrl: z.string().url(),
  objects: z.array(z.string()).min(1),
  apiKey: z.string().min(1),
  model: z.string().min(1),
});

/**
 * Converts an image URL to a Base64 data URI.
 * @param url The URL of the image to convert.
 * @returns A promise that resolves to the data URI.
 */
async function urlToDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image. Status: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${contentType};base64,${buffer.toString('base64')}`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();

    // Validate the input
    const validation = webhookSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input.', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { imageUrl, objects, apiKey, model } = validation.data;

    // Convert image URL to data URI
    const imageDataUri = await urlToDataUri(imageUrl);

    // Call the Genkit flow
    const result = await findObjectsFlow({
      imageUrl: imageDataUri,
      objects,
      apiKey,
      model,
    });

    // Return the results
    return NextResponse.json({ results: result.results });
  } catch (e: any) {
    console.error('Webhook error:', e);
    // Handle potential errors like invalid API keys or model issues
    let errorMessage = 'Failed to find objects.';
    if (e.message.includes('API key not valid')) {
      errorMessage = 'The provided Gemini API key is invalid.';
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }
    if (body && e.message.includes('not found')) {
      errorMessage = `The specified model '${body.model}' was not found.`;
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    if (e.message.includes('Failed to fetch image')) {
      errorMessage = 'Could not download the image from the provided URL.';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json(
      { error: errorMessage, details: e.message },
      { status: 500 }
    );
  }
}
