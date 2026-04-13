/**
 * Lien d’évitement (WCAG 2.4.1) : premier focus tabulable, visible au focus clavier.
 * La cible `#contenu-principal` est définie dans `layout.tsx`.
 */
export default function SkipToContent() {
  return (
    <a
      href="#contenu-principal"
      className="absolute left-4 top-0 z-[100] -translate-y-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#1D1D1B] shadow-none transition focus:translate-y-4 focus:outline-none focus:ring-2 focus:ring-[#E86B32] focus:ring-offset-0"
    >
      Aller au contenu principal
    </a>
  );
}
