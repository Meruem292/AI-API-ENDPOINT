'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Image Describer', icon: <Sparkles className="h-4 w-4" /> },
    { href: '/find-objects', label: 'Object Finder', icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 transition-colors hover:text-foreground',
                pathname === link.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
