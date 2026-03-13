import { defineMiddleware } from 'astro:middleware';
import { auth } from '~/lib/auth';

const BROKER_PATTERN = /^\/broker(\/|$)/;
const PORTAL_PATTERN = /^\/portal(\/|$)/;
const ADMIN_PATTERN = /^\/admin(\/|$)/;

export const onRequest = defineMiddleware(async (ctx, next) => {
  const pathname = new URL(ctx.request.url).pathname;

  // Resolve session for every request
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  try {
    session = await auth.api.getSession({ headers: ctx.request.headers });
  } catch {
    // No valid session – leave null
  }

  ctx.locals.session = session?.session ?? null;
  ctx.locals.user = session?.user ?? null;

  const user = ctx.locals.user;
  const isAuthenticated = user !== null;
  const role = (user as (typeof user & { role?: string }) | null)?.role ?? null;

  // Redirect already-authenticated users away from login/signup
  if (pathname === '/login' || pathname === '/signup') {
    if (isAuthenticated) {
      if (role === 'broker') return ctx.redirect('/broker/dashboard');
      if (role === 'admin') return ctx.redirect('/admin');
      return ctx.redirect('/portal');
    }
    return next();
  }

  // Protect /admin/*
  if (ADMIN_PATTERN.test(pathname)) {
    if (!isAuthenticated) return ctx.redirect('/login');
    if (role !== 'admin') return ctx.redirect('/login');
    return next();
  }

  // Protect /broker/*
  if (BROKER_PATTERN.test(pathname)) {
    if (!isAuthenticated) return ctx.redirect('/login');
    if (role !== 'broker' && role !== 'admin') return ctx.redirect('/login');
    return next();
  }

  // Protect /portal/*
  if (PORTAL_PATTERN.test(pathname)) {
    if (!isAuthenticated) return ctx.redirect('/login');
    return next();
  }

  return next();
});
