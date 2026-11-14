export const inviteUrl = (code: string, origin = window.location.origin) => `${origin}/add/${code}`;

export const safeNext = (next: string | null) => (next && /^\/(?![/\\])/.test(next) ? next : null);
