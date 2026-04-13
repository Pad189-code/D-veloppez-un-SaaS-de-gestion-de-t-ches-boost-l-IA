/**
 * Maquette Figma — bouton « + Créer un projet » :
 * 181×50 px, rayon 10 px, fond Neutral/Grey 800 `#1F1F1F`, gap interne 10 px ;
 * padding vertical 13 px (le 74 px L/R du fichier Figma dépasserait la largeur fixe de 181 px avec ce libellé).
 */
export const CREATE_PROJECT_CTA_CLASSNAME = [
  'inline-flex h-[50px] w-[181px] shrink-0 items-center justify-center',
  'gap-[10px] rounded-[10px] bg-[#1F1F1F] box-border py-[13px] px-3',
  'text-sm font-medium leading-none text-white',
  'transition-colors hover:bg-black',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E86B32] focus-visible:ring-offset-2',
].join(' ');
