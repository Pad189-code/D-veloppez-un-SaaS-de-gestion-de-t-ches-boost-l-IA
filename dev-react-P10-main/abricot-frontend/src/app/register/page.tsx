'use client';

import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import Link from 'next/link';
import { signUp } from '../actions/authActions';
import { useState } from 'react';

const accent = '#E86B32';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <main className="min-h-dvh flex justify-center bg-[#F9FAFB]">
      <AuthSplitLayout heroImageAlt="Espace de travail avec ordinateur et fournitures de bureau">
        <h1
          id="auth-heading"
          className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-center mb-8 md:mb-10"
          style={{ color: accent }}
        >
          Inscription
        </h1>

        {error && (
          <p className="text-red-600 text-center text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <form action={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="register-email" className="text-sm font-medium text-gray-700">
              Adresse e-mail
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="exemple@adresse.fr"
              className="w-full min-h-[50px] px-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E86B32]"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="register-password" className="text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Au moins 8 caractères"
              className="w-full min-h-[50px] px-4 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E86B32]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[52px] rounded-full bg-[#1D1D1B] text-white text-base font-semibold hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#E86B32] focus:ring-offset-2 transition-colors mt-1"
          >
            S&apos;inscrire
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-10 md:mt-12">
          Déjà un compte ?{' '}
          <Link
            href="/connexion"
            className="font-medium underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[#E86B32] rounded px-0.5"
            style={{ color: accent }}
          >
            Se connecter
          </Link>
        </p>
      </AuthSplitLayout>
    </main>
  );
}
