import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/header';
import { ApiKeyWarningDialog } from '@/components/api-key-warning-dialog';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI Vision Tools',
  description: 'Use AI to analyze images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} `}>
      <body className="font-body antialiased">
        <Header />
        {children}
        <Toaster />
        <ApiKeyWarningDialog />
      </body>
    </html>
  );
}
