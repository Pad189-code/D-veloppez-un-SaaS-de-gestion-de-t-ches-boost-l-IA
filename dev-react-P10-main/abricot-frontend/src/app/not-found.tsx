import Link from 'next/link';
import AppShellHeader from '@/components/layout/AppShellHeader';
import AppShellFooter from '@/components/layout/AppShellFooter';

/**
 * Page 404 — même shell que le reste de l’app (header 1440 × 94, footer, palette Abricot).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] font-sans">
      <AppShellHeader active="compte" />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 md:px-[100px]">
        <div className="w-full max-w-[1440px] rounded-[10px] border border-[#E5E7EB] bg-white px-8 py-14 text-center shadow-sm md:px-16 md:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E86B32]">
            Erreur 404
          </p>
          <h1 className="mt-3 text-2xl font-bold text-[#1D1D1B] md:text-[32px]">
            Page introuvable
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
            La page demandée n&apos;existe pas, ou l&apos;adresse a été modifiée.
          </p>
          <nav
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
            aria-label="Pages utiles"
          >
            <Link
              href="/dashboard"
              className="inline-flex min-w-[200px] items-center justify-center rounded-lg bg-[#1D1D1B] px-8 py-3 text-sm font-semibold text-white transition hover:bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86B32] focus-visible:ring-offset-2"
            >
              Tableau de bord
            </Link>
            <Link
              href="/projets"
              className="inline-flex min-w-[200px] items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-8 py-3 text-sm font-semibold text-[#1D1D1B] transition hover:border-[#E86B32]/40 hover:bg-[#FFFBF8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86B32] focus-visible:ring-offset-2"
            >
              Mes projets
            </Link>
            <Link
              href="/connexion"
              className="inline-flex min-w-[200px] items-center justify-center rounded-lg px-8 py-3 text-sm font-semibold text-[#E86B32] underline-offset-4 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86B32] focus-visible:ring-offset-2"
            >
              Connexion
            </Link>
          </nav>
        </div>
      </main>

      <AppShellFooter />
    </div>
  );
}
