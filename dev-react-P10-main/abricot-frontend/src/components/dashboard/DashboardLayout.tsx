import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';
import { CREATE_PROJECT_CTA_CLASSNAME } from '@/components/layout/createProjectCtaClassName';

/** Valeurs du paramètre d’URL `?vue=` (libellés français conservés pour les liens existants). */
export type DashboardViewMode = 'liste' | 'kanban';

const NAV_IMG =
  'h-7 w-auto max-h-8 object-contain sm:h-9 sm:max-h-10 md:h-11 md:max-h-[52px] lg:h-[78px] lg:max-h-none';

/** Maquette Figma : logo 252,57×32,17 px, ancrage haut-gauche du bandeau à 20 px. */
const LOGO_CLASS = 'h-[32.17px] w-[252.57px] shrink-0 object-contain object-left';

export default function DashboardLayout({
  children,
  userLabel,
  activeView,
}: {
  children: React.ReactNode;
  userLabel: string;
  activeView: DashboardViewMode;
}) {
  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition sm:px-4 ${
      active
        ? 'bg-orange-50 text-orange-600 border-orange-100'
        : 'bg-white text-gray-400 border-gray-100 hover:border-orange-200'
    }`;

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F9FAFB] font-sans">
      <header className="w-full border-b border-gray-100 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-[20px] py-5 sm:gap-4 md:min-h-[86px]">
          <div className="flex shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center">
              <Image
                src="/Logo_orange.png"
                alt="Logo Abricot"
                width={253}
                height={32}
                priority
                className={LOGO_CLASS}
              />
            </Link>
          </div>

          <nav className="flex min-w-0 max-w-[min(100%,calc(100vw-7rem))] flex-1 items-center justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none sm:gap-4 md:gap-8 md:overflow-visible [&::-webkit-scrollbar]:hidden">
            <Link href="/dashboard" className="shrink-0 transition-transform hover:scale-105">
              <Image
                src="/tlb_noir.png"
                alt="Tableau de bord"
                width={248}
                height={78}
                className={NAV_IMG}
              />
            </Link>
            <Link href="/projets" className="shrink-0 transition-transform hover:scale-105">
              <Image
                src="/projets_blanc.png"
                alt="Projets"
                width={248}
                height={78}
                className={NAV_IMG}
              />
            </Link>
          </nav>

          <Link
            href="/sign_in"
            className="flex h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border-2 border-white bg-[#FDEEE7] text-sm font-bold leading-none text-[#E86B32] shadow-sm transition-colors hover:bg-[#fbdccf] md:h-12 md:w-12 md:text-base"
            aria-label="Mon compte"
          >
            AD
          </Link>
        </div>
      </header>

      <main className="w-full max-w-[1440px] px-4 py-8 sm:px-6 md:py-12 lg:px-10 xl:px-[100px]">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#1D1D1B] sm:text-[28px] md:text-[32px]">
              Tableau de bord
            </h1>
            <p className="mt-1 text-base text-gray-500 sm:text-lg">
              Bonjour {userLabel}, voici un aperçu de vos projets et tâches
            </p>
          </div>
          <Link href="/projets" className={`${CREATE_PROJECT_CTA_CLASSNAME} text-center shadow-sm`}>
            <span className="text-base font-medium leading-none" aria-hidden>
              +
            </span>
            <span>Créer un projet</span>
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-4">
          <Link
            href="/dashboard?vue=liste"
            className={tabClass(activeView === 'liste')}
            aria-current={activeView === 'liste' ? 'page' : undefined}
          >
            <List size={18} aria-hidden /> Liste
          </Link>
          <Link
            href="/dashboard?vue=kanban"
            className={tabClass(activeView === 'kanban')}
            aria-current={activeView === 'kanban' ? 'page' : undefined}
          >
            <LayoutGrid size={18} aria-hidden /> Kanban
          </Link>
        </div>

        {children}
      </main>

      <footer className="mt-auto flex w-full justify-center border-t border-gray-100 bg-white">
        <div className="relative flex h-auto min-h-[48px] w-full max-w-[1440px] items-center justify-center overflow-hidden sm:min-h-[56px] md:h-[68px]">
          <Image
            src="/Footer.png"
            alt="Pied de page Abricot"
            width={1440}
            height={68}
            className="h-auto min-h-[48px] w-full max-w-[1440px] object-contain object-bottom sm:min-h-[56px] md:h-[68px] md:min-h-0"
          />
        </div>
      </footer>
    </div>
  );
}
