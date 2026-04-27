'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useToast } from '@/hooks/use-toast';
import { findObjectsAction, getApiUsageCount } from '@/app/actions';
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
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Textarea } from './ui/textarea';

const formSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
  objects: z
    .string()
    .min(1, { message: 'Please enter at least one object to find.' }),
  apiKey: z.string().min(1, { message: 'API key is required.' }),
  model: z.string().min(1, { message: 'Model is required.' }),
  prompt: z.string().optional(),
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

type Results = {
  [key: string]: {
    found: boolean;
    count: number;
  };
};

export function ObjectFinder() {
  const [results, setResults] = useState<Results | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(
    PlaceHolderImages[0].imageUrl
  );
  const [isPending, startTransition] = useTransition();
  const [apiCallCount, setApiCallCount] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCount() {
      const { count } = await getApiUsageCount('objectFinder');
      setApiCallCount(count);
    }
    fetchCount();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
      objects: '',
      apiKey: '',
      model: 'gemini-2.5-flash',
      prompt: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setImageUrl(values.imageUrl);
    setResults(null);
    const objectList = values.objects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (objectList.length === 0) {
      form.setError('objects', { message: 'Please enter at least one object.' });
      return;
    }

    startTransition(async () => {
      try {
        const dataUri = await urlToDataUri(values.imageUrl);

        const result = await findObjectsAction({
          imageUrl: dataUri,
          objects: objectList,
          apiKey: values.apiKey,
          model: values.model,
          prompt: values.prompt,
        });

        if (result.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.error,
            duration: 20000,
          });
        } else if (result.results) {
          setResults(result.results);
          setApiCallCount((prev) => (prev !== null ? prev + 1 : 1));
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            'Could not process the image. Please check that the URL is correct and publicly accessible.',
          duration: 20000,
        });
      }
    });
  }

  const curlExample = `curl -X POST https://ai-api-endpoint-eight.vercel.app/api/find-objects \\
-H "Content-Type: application/json" \\
-d '{
  "imageUrl": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0",
  "objects": ["tree", "person", "bench"],
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
                  Object Finder
                </CardTitle>
                <CardDescription>
                  Find and count specific objects within an image using your
                  Gemini API key.
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
                  name="objects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Objects to Find</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., car, person, dog"
                          {...field}
                        />
                      </FormControl>
                      <FormDescriptionComponent>
                        Enter a comma-separated list of objects.
                      </FormDescriptionComponent>
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
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="advanced-options">
                    <AccordionTrigger>
                      <div className="text-sm font-semibold">
                        Advanced Options
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Prompt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Focus only on objects on the table. Respond in JSON."
                                {...field}
                              />
                            </FormControl>
                            <FormDescriptionComponent>
                              Optional. If you leave this blank, a default prompt will
                              be used. Your prompt should instruct the AI to return a
                              JSON object with a specific structure.
                            </FormDescriptionComponent>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    'Finding Objects...'
                  ) : (
                    'Find Objects'
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
              The image and object detection results will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-grow flex-col gap-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                key={imageUrl}
                src={imageUrl}
                alt="Image to be analyzed"
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
              <h3 className="text-lg font-semibold">Detections</h3>
              <div className="max-w-none text-muted-foreground">
                {isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                ) : results ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(results).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-lg border p-2"
                      >
                        <span className="font-medium capitalize">{key}</span>
                        <Badge
                          variant={value.found ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {value.found
                            ? `Found: ${value.count}`
                            : 'Not Found'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">
                    Detection results will appear here.
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
            Use this feature programmatically by sending a POST request to the
            following endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Endpoint</p>
              <p className="font-mono text-sm text-muted-foreground">
                POST /api/find-objects
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
                <code>{`{\n  "results": {\n    "tree": { "found": true, "count": 1 },\n    "person": { "found": false, "count": 0 },\n    "bench": { "found": true, "count": 1 }\n  }\n}`}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
