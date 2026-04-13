import Image from 'next/image';
import Link from 'next/link';

/** `compte` : page profil / 404 — onglets Tableau de bord & Projets en style « inactif » (maquette). */
export type AppShellActiveNav = 'dashboard' | 'projets' | 'compte';

const NAV_IMG =
  'h-7 w-auto max-h-8 object-contain sm:h-9 sm:max-h-10 md:h-11 md:max-h-[52px] lg:h-[78px] lg:max-h-none';

/** Maquette Figma : logo 252,57×32,17 px, ancrage haut-gauche du bandeau à 20 px. */
const LOGO_CLASS = 'h-[32.17px] w-[252.57px] shrink-0 object-contain object-left';

export default function AppShellHeader({ active }: { active: AppShellActiveNav }) {
  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-[20px] py-5 sm:gap-4 md:min-h-[86px]">
        <Link href="/dashboard" className="flex shrink-0 items-center">
          <Image
            src="/Logo_orange.png"
            alt="Abricot"
            width={253}
            height={32}
            priority
            className={LOGO_CLASS}
          />
        </Link>
        <nav
          className="flex min-w-0 max-w-[min(100%,calc(100vw-7rem))] flex-1 items-center justify-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:max-w-none sm:gap-4 md:justify-center md:gap-8 md:overflow-visible [&::-webkit-scrollbar]:hidden"
          aria-label="Navigation principale"
        >
          <Link href="/dashboard" className="shrink-0 transition-transform hover:scale-105">
            <Image
              src={active === 'dashboard' ? '/tlb_noir.png' : '/tdb_blanc.png'}
              alt="Tableau de bord"
              width={248}
              height={78}
              className={NAV_IMG}
            />
          </Link>
          <Link href="/projets" className="shrink-0 transition-transform hover:scale-105">
            <Image
              src={active === 'projets' ? '/projets_noir.png' : '/projets_blanc.png'}
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
  );
}
