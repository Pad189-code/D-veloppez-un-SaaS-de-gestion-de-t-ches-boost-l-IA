/**
 * Session navigateur : JWT dans un cookie httpOnly (non accessible au JavaScript client),
 * `sameSite: lax`, `secure` en production. Secret : `AUTH_SECRET` ou `JWT_SECRET` (souvent partagé avec l’API).
 */
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'abricot_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  email: string;
};

/**
 * Secret pour signer les JWT de session. En **production**, définir `AUTH_SECRET` ou `JWT_SECRET`
 * dans l’environnement. En **développement** sans `.env`, un repli local permet la connexion
 * (uniquement `localhost`, jamais déployer sans variables réelles).
 */
const DEV_FALLBACK_SESSION_SECRET = 'abricot-dev-local-session-secret-not-for-production';

function resolveSessionSecret(): string | null {
  const fromEnv = process.env.AUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'development') {
    return DEV_FALLBACK_SESSION_SECRET;
  }
  return null;
}

export async function setSession(userId: string, email: string): Promise<void> {
  const secret = resolveSessionSecret();
  if (!secret) {
    throw new Error(
      'Variable AUTH_SECRET ou JWT_SECRET requise en production pour les sessions (cookie signé).',
    );
  }

  const token = jwt.sign({ userId, email }, secret, { expiresIn: '7d' });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const secret = resolveSessionSecret();
  if (!secret) {
    return null;
  }

  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) {
    return null;
  }

  try {
    const decoded = jwt.verify(raw, secret) as jwt.JwtPayload & SessionPayload;
    if (typeof decoded.userId !== 'string' || typeof decoded.email !== 'string') {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    // Expiration, signature invalide, etc.
    return null;
  }
}
