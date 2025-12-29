'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  KeyRound,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Cpu,
  Search,
  Tag,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { findObjectsAction } from '@/app/actions';
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

const formSchema = z.object({
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }),
  objects: z.string().min(1, { message: 'Please enter at least one object to find.' }),
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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
      objects: '',
      apiKey: '',
      model: 'gemini-2.5-flash',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setImageUrl(values.imageUrl);
    setResults(null);
    const objectList = values.objects.split(',').map(s => s.trim()).filter(Boolean);

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

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-8">
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-3 text-3xl">
                  <Search className="h-8 w-8 text-primary" />
                  ObjectFinder
                </CardTitle>
                <CardDescription>
                  Find and count specific objects within an image using your Gemini API key.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="https://example.com/image.png"
                            {...field}
                            className="pl-10"
                          />
                        </div>
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
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="e.g., car, person, dog"
                            {...field}
                            className="pl-10"
                          />
                        </div>
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
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter your API key"
                            {...field}
                            className="pl-10"
                          />
                        </div>
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
                        <div className="relative">
                          <Cpu className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="gemini-2.5-flash"
                            {...field}
                            className="pl-10"
                          />
                        </div>
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
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Objects...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Objects
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="flex flex-col shadow-lg">
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
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(results).map(([key, value]) => (
                      <div key={key} className="flex flex-col items-center gap-2 rounded-lg border p-3">
                         <span className="font-medium capitalize">{key}</span>
                         <Badge variant={value.found ? 'default' : 'destructive'}>
                          {value.found ? `Found: ${value.count}`: 'Not Found'}
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
    </div>
  );
}
