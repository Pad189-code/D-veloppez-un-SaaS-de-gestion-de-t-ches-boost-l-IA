import Image from 'next/image';

/** Pied de page commun — largeur max maquette, fluide sur mobile. */
export default function AppShellFooter() {
  return (
    <footer className="mt-auto flex w-full justify-center border-t border-gray-100 bg-white">
      <div className="relative flex h-auto min-h-[48px] w-full max-w-[1440px] items-center justify-center overflow-hidden px-0 sm:min-h-[56px] md:h-[68px]">
        <Image
          src="/Footer.png"
          alt="Bandeau graphique du pied de page Abricot"
          width={1440}
          height={68}
          className="h-auto min-h-[48px] w-full max-w-[1440px] object-contain object-bottom sm:min-h-[56px] md:h-[68px] md:min-h-0"
        />
      </div>
    </footer>
  );
}
