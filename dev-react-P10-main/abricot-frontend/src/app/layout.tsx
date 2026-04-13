import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import SkipToContent from '@/components/SkipToContent';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Abricot — Gestion de projets et de tâches',
  description: 'Application de suivi de projets, de tâches et de collaboration en équipe.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
      // Cet attribut empêche l'erreur d'hydratation si une extension (ex: LanguageTool)
      // modifie la balise html sur votre navigateur.
      suppressHydrationWarning
    >
      <body className="relative min-h-full flex flex-col">
        <SkipToContent />
        <div
          id="contenu-principal"
          tabIndex={-1}
          className="flex min-h-full flex-1 flex-col outline-none"
        >
          {children}
        </div>
      </body>
    </html>
  );
}
