'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Loader2,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { getImageDescriptionAction, getApiUsageCount } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription as FormDescriptionComponent,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const formSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
  apiKey: z.string().min(1, { message: 'API key is required.' }),
  model: z.string().min(1, { message: 'Model is required.' }),
});

async function urlToDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch image.');
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ImageDescriber() {
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(
    PlaceHolderImages[0].imageUrl
  );
  const [isPending, startTransition] = useTransition();
  const [apiCallCount, setApiCallCount] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCount() {
      const { count } = await getApiUsageCount('imageDescriber');
      setApiCallCount(count);
    }
    fetchCount();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
      apiKey: '',
      model: 'gemini-2.5-flash',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setImageUrl(values.imageUrl);
    setDescription('');

    startTransition(async () => {
      try {
        const dataUri = await urlToDataUri(values.imageUrl);

        const result = await getImageDescriptionAction({
          imageUrl: dataUri,
          apiKey: values.apiKey,
          model: values.model,
        });

        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
          });
        } else if (result.description) {
          setDescription(result.description);
          setApiCallCount((prev) => (prev !== null ? prev + 1 : 1));
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'Could not process the image. Please check that the URL is correct and publicly accessible.',
        });
      }
    });
  }

  const curlExample = `curl -X POST https://ai-api-endpoint-eight.vercel.app/api/describe \\
-H "Content-Type: application/json" \\
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash"
}'`;

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-8">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Image Describer
                </CardTitle>
                <CardDescription>
                  Enter an image URL and your Gemini API key to get an
                  AI-generated description.
                  {apiCallCount !== null && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Count: {apiCallCount}
                    </span>
                  )}
                </CardDescription>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <div className="text-sm font-semibold">
                        Important: API Key Usage
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p>
                          This tool requires a user-provided Gemini API key for
                          testing. For security, please adhere to the following:
                        </p>
                        <ul>
                          <li>
                            <strong>Do NOT use production or paid keys.</strong>{' '}
                            Create a temporary key for testing only.
                          </li>
                          <li>
                            Set strict, low quota limits in Google AI Studio.
                          </li>
                          <li>
                            Delete the key immediately after you finish testing.
                          </li>
                          <li>
                            Any key used in a client-side application (like
                            this one, or on an ESP32/Arduino) can be extracted.
                            Assume it is not secure.
                          </li>
                        </ul>
                        <p className="text-xs">
                          Users are solely responsible for the security of their
                          API keys. The developer is not liable for any misuse,
                          quota loss, or charges.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.png"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <a
                          href="https://aistudio.google.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-primary"
                        >
                          Gemini API Key
                        </a>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="gemini-2.5-flash"
                          {...field}
                        />
                      </FormControl>
                      <FormDescriptionComponent>
                        gemini-2.5-flash, gemini-2.5-flash-lite,
                        gemini-robotics-er-1.5-preview
                      </FormDescriptionComponent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    'Generating...'
                  ) : (
                    'Generate Description'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              The image and its generated description will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                key={imageUrl}
                src={imageUrl}
                alt="Image to be described"
                fill
                className="object-contain"
                data-ai-hint={PlaceHolderImages[0].imageHint}
                onError={() => {
                  setImageUrl(PlaceHolderImages[0].imageUrl);
                  toast({
                    variant: 'destructive',
                    title: 'Image Error',
                    description:
                      'Could not load the image from the provided URL.',
                  });
                }}
              />
            </div>
            <div className="flex-grow space-y-2">
              <h3 className="text-lg font-semibold">Description</h3>
              <div className="max-w-none text-muted-foreground">
                {isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                ) : (
                  <p className="text-sm">
                    {description ||
                      'The generated description will appear here once you submit an image URL and API key.'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">
            API Endpoint Instructions
          </CardTitle>
          <CardDescription>
            Use this application programmatically by sending a POST request to
            the following endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Endpoint</p>
              <p className="font-mono text-sm text-muted-foreground">
                POST /api/describe
              </p>
            </div>
            <div>
              <p className="font-semibold">Example Request (cURL)</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <code>{curlExample}</code>
              </pre>
            </div>
            <div>
              <p className="font-semibold">Successful Response</p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
                <code>{`{\n  "description": "A detailed description of the image..."\n}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
