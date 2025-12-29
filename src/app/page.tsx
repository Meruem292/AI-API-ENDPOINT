import { ImageDescriber } from '@/components/image-describer';

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center p-4">
      <ImageDescriber />
    </main>
  );
}
