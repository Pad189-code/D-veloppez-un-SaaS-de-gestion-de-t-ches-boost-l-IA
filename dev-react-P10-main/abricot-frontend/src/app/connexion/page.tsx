'use client';

import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import Link from 'next/link';
import { signInFormAction, type SignInFormState } from '../actions/authActions';
import { useActionState } from 'react';

const accent = '#E86B32';

const initialSignInState: SignInFormState = { error: null };

export default function ConnexionPage() {
  const [state, formAction, isPending] = useActionState(signInFormAction, initialSignInState);

  return (
    <main className="min-h-dvh flex justify-center bg-[#F9FAFB]">
      <AuthSplitLayout heroImageAlt="Espace de travail avec ordinateur et fournitures de bureau">
        <h1
          id="auth-heading"
          className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center mb-8 md:mb-10"
          style={{ color: accent }}
        >
          Connexion
        </h1>

        {state.error && (
          <p className="text-red-600 text-center text-sm mb-4" role="alert">
            {state.error}
          </p>
        )}

        <form action={formAction} className="flex flex-col gap-6" noValidate>
          <div className="flex flex-col gap-2.5">
            <label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
              Adresse e-mail
            </label>
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="exemple@adresse.fr"
              className="w-full min-h-[50px] px-4 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#E86B32]"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Votre mot de passe"
              className="w-full min-h-[50px] px-4 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#E86B32]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full min-h-[52px] rounded-full bg-[#1D1D1B] text-white text-base font-semibold hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#E86B32] focus:ring-offset-2 transition-colors mt-1 disabled:opacity-60"
          >
            {isPending ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <span className="sr-only">Réinitialisation : </span>
            Mot de passe oublié — fonctionnalité à venir.
          </p>
        </form>

        <p className="text-center text-sm text-gray-600 mt-10 md:mt-12">
          Pas encore de compte ?{' '}
          <Link
            href="/register"
            className="font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#E86B32] rounded px-0.5"
            style={{ color: accent }}
          >
            Créer un compte
          </Link>
        </p>
      </AuthSplitLayout>
    </main>
  );
}
