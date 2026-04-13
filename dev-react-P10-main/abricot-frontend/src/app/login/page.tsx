import { redirect } from 'next/navigation';

/** Ancienne URL /login : redirige vers la page de connexion maquette. */
export default function LoginPage() {
  redirect('/connexion');
}
