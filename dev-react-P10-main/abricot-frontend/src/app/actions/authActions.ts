'use server';

/**
 * Authentification côté serveur (pages /register et /connexion).
 * Stockage : mot de passe uniquement en hash bcrypt (12 rounds, comme l’API Express).
 * Après connexion : cookie httpOnly signé via `setSession` dans `lib/session.ts`.
 */

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma-generated';
import { prisma } from '../../lib/prisma';
import { redirect } from 'next/navigation';
import { getSessionPayload, setSession } from '../../lib/session';
import { expressApiGet } from '@/lib/expressApi';

const SALT_ROUNDS = 12;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function splitDisplayName(name: string | null): { firstName: string; lastName: string } {
  const t = name?.trim() ?? '';
  if (!t) return { firstName: '', lastName: '' };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}

/** Données affichées sur /sign_in (Mon compte) ; `null` si non connecté. API **GET /auth/profile** si possible, sinon Prisma (même base que Prisma Studio). */
export async function getAccountProfile(): Promise<{
  email: string;
  firstName: string;
  lastName: string;
} | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  const r = await expressApiGet<{
    user: { id: string; email: string; name: string | null };
  }>('/auth/profile');

  if (r.ok) {
    const { firstName, lastName } = splitDisplayName(r.data.user.name);
    return { email: r.data.user.email, firstName, lastName };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  });
  if (!user) return null;
  const { firstName, lastName } = splitDisplayName(user.name);
  return { email: user.email, firstName, lastName };
}

export async function updateAccountProfile(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || null;

  const session = await getSessionPayload();
  if (!session) {
    return { error: 'Session expirée. Reconnectez-vous.' };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { name },
  });

  return { success: true };
}

/** Page Mon compte : nom / prénom + mot de passe optionnel (un seul champ, session requise). */
export async function updateMonCompteAction(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const newPassword = String(formData.get('password') ?? '').trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || null;

  const session = await getSessionPayload();
  if (!session) {
    return { error: 'Session expirée. Reconnectez-vous.' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: 'Compte introuvable.' };
  }

  if (newPassword && newPassword.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  }

  const hashedPassword = newPassword ? await bcrypt.hash(newPassword, SALT_ROUNDS) : undefined;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    },
  });

  await setSession(user.id, user.email);
  return { success: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmNewPassword = String(formData.get('confirmNewPassword') ?? '');

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return { error: 'Renseignez le mot de passe actuel et le nouveau mot de passe (deux fois).' };
  }
  if (newPassword.length < 8) {
    return { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' };
  }
  if (newPassword !== confirmNewPassword) {
    return { error: 'La confirmation ne correspond pas au nouveau mot de passe.' };
  }
  if (newPassword === currentPassword) {
    return { error: 'Le nouveau mot de passe doit être différent de l’ancien.' };
  }

  const session = await getSessionPayload();
  if (!session) {
    return { error: 'Session expirée. Reconnectez-vous.' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { error: 'Compte introuvable.' };
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return { error: 'Mot de passe actuel incorrect.' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await setSession(user.id, user.email);
  return { success: true };
}

export async function signUp(formData: FormData) {
  const email = normalizeEmail((formData.get('email') as string) ?? '');
  const password = formData.get('password') as string;
  const name = email.split('@')[0] || 'Utilisateur';

  if (!email || !password) {
    return { error: 'Adresse e-mail et mot de passe requis' };
  }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères' };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Cette adresse e-mail est déjà utilisée' };
    }
    return { error: "Erreur lors de l'inscription" };
  }

  redirect('/connexion');
}

/** Succès : `redirect` (ne revient pas) ; échec : `{ error }` pour affichage client. */
export async function signIn(formData: FormData): Promise<{ error: string } | void> {
  const email = normalizeEmail((formData.get('email') as string) ?? '');
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Adresse e-mail et mot de passe requis' };
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    console.error('[signIn] Prisma:', err);
    return {
      error:
        'Connexion impossible : la base de données est inaccessible. Lancez `npm run db:push` à la racine du projet et vérifiez que le fichier `prisma/dev.db` existe.',
    };
  }

  // Même message si l’e-mail est inconnu ou le mot de passe faux (pas d’indice aux attaquants).
  if (!user) {
    return { error: 'Adresse e-mail ou mot de passe incorrect' };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { error: 'Adresse e-mail ou mot de passe incorrect' };
  }

  try {
    await setSession(user.id, user.email);
  } catch (err) {
    console.error('[signIn] session:', err);
    return {
      error:
        'Connexion impossible : erreur de session. Définissez AUTH_SECRET (ou JWT_SECRET) dans `.env.local` en production.',
    };
  }

  redirect('/dashboard');
}

export type SignInFormState = { error: string | null };

/** Pour `useActionState` sur la page Connexion : propage les erreurs, laisse passer `redirect()`. */
export async function signInFormAction(
  _prevState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const result = await signIn(formData);
  if (result && 'error' in result) {
    return { error: result.error };
  }
  return { error: null };
}
