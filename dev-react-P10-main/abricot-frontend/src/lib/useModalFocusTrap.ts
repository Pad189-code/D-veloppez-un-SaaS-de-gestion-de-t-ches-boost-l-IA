'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Sélecteur des éléments pouvant recevoir le focus (modale). */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el.getClientRects().length > 0,
  );
}

/**
 * À l’ouverture : focus dans la modale et cycle Tab/Shift+Tab à l’intérieur.
 * À la fermeture : restaure le focus sur l’élément actif avant ouverture.
 */
export function useModalFocusTrap(active: boolean): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    previousActive.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const root = ref.current;

    const focusInitial = () => {
      const list = getFocusableElements(root);
      const target = list[0] ?? root;
      target.focus();
    };

    requestAnimationFrame(() => {
      focusInitial();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusableElements(root);
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Phase de capture : intercepter Tab avant qu’il ne sorte du document / de la modale.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previousActive.current?.focus?.();
    };
  }, [active]);

  return ref;
}
