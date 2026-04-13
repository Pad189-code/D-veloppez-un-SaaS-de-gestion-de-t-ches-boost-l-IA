import 'server-only';

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'abricot_session';

/**
 * URL de l’API Express (même base que Swagger : `/auth`, `/projects`, …).
 * Priorité : `API_URL` → `NEXT_PUBLIC_API_URL` → `http://localhost:8000`.
 */
export function getExpressApiBaseUrl(): string {
  const raw =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://localhost:8000';
  return raw.replace(/\/$/, '');
}

/**
 * JWT du cookie de session Next (`setSession` dans `session.ts`).
 * L’API Express doit vérifier ce token avec le **même** `JWT_SECRET` que Next (`AUTH_SECRET` ou `JWT_SECRET`).
 */
export async function getSessionBearerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export type ExpressApiError = { ok: false; status: number; message: string };

export async function expressApiGet<TData>(
  path: string,
): Promise<{ ok: true; data: TData } | ExpressApiError> {
  const token = await getSessionBearerToken();
  if (!token) {
    return { ok: false, status: 401, message: 'Session absente.' };
  }

  const base = getExpressApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, message: 'API inaccessible (réseau ou serveur arrêté).' };
  }

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
    data?: TData;
  } | null;

  if (!json || typeof json !== 'object') {
    return { ok: false, status: res.status, message: 'Réponse API invalide.' };
  }

  if (!res.ok || json.success === false) {
    return {
      ok: false,
      status: res.status,
      message: json.message ?? res.statusText ?? 'Erreur API',
    };
  }

  if (json.data === undefined) {
    return { ok: false, status: res.status, message: 'Réponse API sans données.' };
  }

  return { ok: true, data: json.data as TData };
}
