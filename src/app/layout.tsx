import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Human.Farm - The Meatspace Layer for AI',
  description: 'AI agents hire humans for real-world tasks they cannot accomplish',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">
        {children}
      </body>
    </html>
  );
}
