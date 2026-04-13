import Image from 'next/image';
import type { ReactNode } from 'react';

type AuthSplitLayoutProps = {
  children: ReactNode;
  /** Texte alternatif pour l’image lifestyle (droite / bas sur mobile). */
  heroImageAlt: string;
};

/**
 * Mise en page auth au format maquette **1440×1024** (desktop).
 * Colonne formulaire ~562px comme sur la maquette d’origine.
 */
export function AuthSplitLayout({ children, heroImageAlt }: AuthSplitLayoutProps) {
  return (
    <div
      className={[
        'mx-auto w-full max-w-[1440px] bg-white',
        /* Mobile : hauteur viewport ; desktop : hauteur maquette 1024px */
        'min-h-dvh flex flex-col md:min-h-[1024px] md:h-[1024px] md:max-h-[1024px]',
        'md:grid md:grid-cols-[562px_minmax(0,1fr)] md:overflow-hidden',
      ].join(' ')}
    >
      <section
        className="flex flex-1 flex-col bg-white px-6 pt-10 pb-10 md:h-full md:w-[562px] md:shrink-0 md:px-[100px] md:pt-[55px] md:pb-[55px] order-1"
        aria-labelledby="auth-heading"
      >
        <div className="flex justify-center mb-10 md:mb-12 shrink-0">
          <Image
            src="/Logo_orange.png"
            alt="Abricot"
            width={252}
            height={32}
            className="h-8 w-auto object-contain md:h-9"
            priority
          />
        </div>
        <div className="flex flex-1 flex-col justify-center w-full max-w-[380px] mx-auto">
          {children}
        </div>
      </section>

      <div className="relative order-2 min-h-[240px] shrink-0 md:order-2 md:min-h-0 md:h-full">
        <Image
          src="/Photo_Log_in.jpg"
          alt={heroImageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 768px) 878px, 100vw"
          priority
        />
      </div>
    </div>
  );
}
