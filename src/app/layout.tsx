import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GTO Trainer — Poker Strategy Simulator',
  description: 'A beginner-to-intermediate poker training simulator with simplified GTO-inspired feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-gray-900 text-gray-100" suppressHydrationWarning>{children}</body>
    </html>
  );
}
