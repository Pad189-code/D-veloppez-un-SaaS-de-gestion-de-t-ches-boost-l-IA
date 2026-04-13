'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShellHeader from '@/components/layout/AppShellHeader';
import AppShellFooter from '@/components/layout/AppShellFooter';
import { getAccountProfile, updateMonCompteAction } from '@/app/actions/authActions';

/** Même principe que `AuthSplitLayout` / connexion : zone utile max 1440×1024, centrée dans le viewport. */
export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getAccountProfile();
      if (!cancelled) {
        if (p) {
          setProfile(p);
          setFirstName(p.firstName);
          setLastName(p.lastName);
          setEmail(p.email);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = `${firstName} ${lastName}`.trim() || email;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    const fd = new FormData();
    fd.set('firstName', firstName);
    fd.set('lastName', lastName);
    fd.set('password', password);

    const result = await updateMonCompteAction(fd);
    if ('error' in result) {
      setError(result.error);
      setPending(false);
      return;
    }

    setPassword('');
    setSuccess(true);
    setPending(false);
  }

  const inputClass =
    'w-full min-h-[50px] rounded-lg border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-[#E86B32] focus:ring-2 focus:ring-[#E86B32]/25';

  return (
    <div className="flex min-h-dvh justify-center bg-[#F9FAFB] font-sans">
      <div
        className={[
          'flex w-full max-w-[1440px] flex-col bg-[#F9FAFB]',
          'md:h-[1024px] md:min-h-[1024px] md:max-h-[1024px] md:overflow-hidden',
        ].join(' ')}
      >
        <AppShellHeader active="compte" />

        <main
          className="flex min-h-0 flex-1 flex-col justify-center px-4 py-6 sm:px-6 md:px-[100px] md:py-8"
          aria-labelledby="account-heading"
        >
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[41px] rounded-[10px] border border-[#E5E7EB] bg-white px-6 py-10 shadow-sm md:px-[59px] md:py-10">
            <div>
              <h1 id="account-heading" className="text-2xl font-bold text-[#111827] md:text-[28px]">
                Mon compte
              </h1>
              <p className="mt-2 text-base text-gray-500 md:text-lg">{displayName}</p>
            </div>

            {loading ? (
              <p className="text-gray-600">Chargement…</p>
            ) : !profile ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/90 p-6 text-center text-gray-800">
                <p className="font-medium">Connectez-vous pour accéder à votre compte.</p>
                <Link
                  href="/connexion"
                  className="mt-3 inline-block font-semibold text-[#E86B32] underline underline-offset-2"
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-[41px]">
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-emerald-700" role="status">
                    Modifications enregistrées.
                  </p>
                )}

                <div className="flex flex-col gap-2.5">
                  <label htmlFor="account-lastname" className="text-sm font-medium text-gray-700">
                    Nom
                  </label>
                  <input
                    id="account-lastname"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label htmlFor="account-firstname" className="text-sm font-medium text-gray-700">
                    Prénom
                  </label>
                  <input
                    id="account-firstname"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label htmlFor="account-email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="account-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    readOnly
                    aria-readonly="true"
                    className={`${inputClass} cursor-not-allowed bg-gray-50`}
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label htmlFor="account-password" className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </label>
                  <input
                    id="account-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Laisser vide pour ne pas modifier"
                    className={`${inputClass} placeholder:text-gray-400`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-fit min-h-[52px] rounded-lg bg-[#1D1D1B] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#E86B32] focus:ring-offset-2 disabled:opacity-60"
                >
                  {pending ? 'Enregistrement…' : 'Modifier les informations'}
                </button>
              </form>
            )}
          </div>
        </main>

        <AppShellFooter />
      </div>
    </div>
  );
}
