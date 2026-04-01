import { sb } from './client.js';

export async function signInWithGoogle() {
  await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  await sb.auth.signOut();
}

export function onAuthStateChange(callback) {
  sb.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
