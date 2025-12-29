'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from './ui/scroll-area';

const STORAGE_KEY = 'has-seen-api-key-warning';

export function ApiKeyWarningDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // This code runs only on the client
    const hasSeenWarning = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWarning) {
      setIsOpen(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
            API Key Usage Notice (Please Read Before Testing)
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <ScrollArea className="max-h-[60vh] pr-6">
              <div className="space-y-4 text-left text-foreground">
                <p>
                  This application requires users to provide their own Gemini API key for
                  testing and demonstration purposes.
                </p>

                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-bold">
                    Important Security Warning
                  </h3>
                  <p>
                    Your API key is a secret, similar to a password. Do NOT use a
                    production or paid API key for this tool.
                  </p>
                </div>

                <p>Any API key you submit:</p>
                <ul className="list-disc space-y-1 pl-6 text-sm">
                  <li>Can be logged by your browser, device, or network</li>
                  <li>
                    May be exposed if used on ESP32, Arduino, mobile apps, or public
                    code
                  </li>
                  <li>Can be extracted from firmware or client-side code</li>
                </ul>
                <p className="font-semibold">
                  If your key is leaked, others may consume your API quota or incur
                  charges on your behalf.
                </p>

                <div>
                  <h3 className="font-bold">❗ ESP32 / IoT Warning</h3>
                  <p>
                    If you embed your API key directly inside firmware for devices
                    like ESP32 or Arduino, assume it can be extracted. Firmware can
                    be dumped and searched for plain-text strings like API keys.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold">
                    ✅ Recommended for Testing Only
                  </h3>
                  <ul className="list-disc space-y-1 pl-6 text-sm">
                    <li>Create a temporary, test-only API key.</li>
                    <li>Set strict, low quota limits in Google AI Studio.</li>
                    <li>Rotate or delete the key immediately after testing.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold">🔐 Best Practices (Strongly Recommended)</h3>
                  <p>For real projects, never expose keys on the client-side.</p>
                  <ul className="list-disc space-y-2 pl-6 text-sm">
                    <li>
                      <strong>Environment Variables (PC/Server):</strong> Load keys
                      from the server environment.
                      <pre className="mt-1 rounded-md bg-muted p-2 font-mono text-xs">
                        <code>export GEMINI_API_KEY="your_test_key"</code>
                      </pre>
                    </li>
                    <li>
                      <strong>Backend Proxy (Safest):</strong> This is how production
                      systems work. The client app makes a request to your own server,
                      which then securely adds the API key and calls the Gemini API.
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="font-bold">Liability Disclaimer</h3>
                  <p className="text-sm text-muted-foreground">
                    This service is for educational and testing purposes only. Users are
                    solely responsible for the security and usage of their own API
                    keys. The developer is not responsible for any API misuse, quota
                    exhaustion, or billing charges.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge} className="w-full sm:w-auto">
            I Understand and Acknowledge the Risks
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
