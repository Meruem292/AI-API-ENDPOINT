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
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import {
  getImageDescriptionAction,
  GenerateImageDescriptionInput,
} from '@/app/actions';
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
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageUrl: '',
      apiKey: '',
      model: 'gemini-3-flash',
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

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-3 text-3xl">
                <Sparkles className="h-8 w-8 text-primary" />
                ImageDescriber
              </CardTitle>
              <CardDescription>
                Enter an image URL and your Gemini API key to get an
                AI-generated description.
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
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gemini API Key</FormLabel>
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
                          placeholder="gemini-3-flash"
                          {...field}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormDescriptionComponent>
                      Suggested: gemini-3-flash, gemini-pro-vision,
                      gemini-2.5-flash
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Description
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
  );
}
