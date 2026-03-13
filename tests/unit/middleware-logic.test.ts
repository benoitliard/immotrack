import { describe, it, expect } from 'vitest';

// Tests for the route-protection logic from src/middleware.ts.
// We extract the matching patterns and decision logic as pure functions
// so they can be tested without an HTTP server or DB connection.

// ─── Patterns from middleware.ts ─────────────────────────────────────────────
const BROKER_PATTERN = /^\/broker(\/|$)/;
const PORTAL_PATTERN = /^\/portal(\/|$)/;
const ADMIN_PATTERN = /^\/admin(\/|$)/;

type Role = 'broker' | 'client' | 'admin';

type AuthState =
  | { authenticated: false; role: null }
  | { authenticated: true; role: Role };

type RouteDecision =
  | { action: 'next' }
  | { action: 'redirect'; to: string };

/**
 * Pure function that mirrors the decision logic in onRequest() middleware.
 * Returns what the middleware would do for a given pathname + auth state.
 */
function resolveRoute(pathname: string, auth: AuthState): RouteDecision {
  const isAuthenticated = auth.authenticated;
  const role = isAuthenticated ? auth.role : null;

  // Auth pages — redirect authenticated users to their home
  if (pathname === '/login' || pathname === '/signup') {
    if (isAuthenticated) {
      if (role === 'broker') return { action: 'redirect', to: '/broker/dashboard' };
      if (role === 'admin') return { action: 'redirect', to: '/admin' };
      return { action: 'redirect', to: '/portal' };
    }
    return { action: 'next' };
  }

  // Protect /admin/*
  if (ADMIN_PATTERN.test(pathname)) {
    if (!isAuthenticated) return { action: 'redirect', to: '/login' };
    if (role !== 'admin') return { action: 'redirect', to: '/login' };
    return { action: 'next' };
  }

  // Protect /broker/*
  if (BROKER_PATTERN.test(pathname)) {
    if (!isAuthenticated) return { action: 'redirect', to: '/login' };
    if (role !== 'broker' && role !== 'admin') return { action: 'redirect', to: '/login' };
    return { action: 'next' };
  }

  // Protect /portal/*
  if (PORTAL_PATTERN.test(pathname)) {
    if (!isAuthenticated) return { action: 'redirect', to: '/login' };
    return { action: 'next' };
  }

  return { action: 'next' };
}

// ─── Pattern matching tests ───────────────────────────────────────────────────

describe('Route pattern matching', () => {
  describe('BROKER_PATTERN', () => {
    it('matches /broker', () => {
      expect(BROKER_PATTERN.test('/broker')).toBe(true);
    });

    it('matches /broker/', () => {
      expect(BROKER_PATTERN.test('/broker/')).toBe(true);
    });

    it('matches /broker/dashboard', () => {
      expect(BROKER_PATTERN.test('/broker/dashboard')).toBe(true);
    });

    it('matches /broker/transactions/123', () => {
      expect(BROKER_PATTERN.test('/broker/transactions/123')).toBe(true);
    });

    it('does not match /brokerage', () => {
      expect(BROKER_PATTERN.test('/brokerage')).toBe(false);
    });

    it('does not match /portal', () => {
      expect(BROKER_PATTERN.test('/portal')).toBe(false);
    });
  });

  describe('PORTAL_PATTERN', () => {
    it('matches /portal', () => {
      expect(PORTAL_PATTERN.test('/portal')).toBe(true);
    });

    it('matches /portal/', () => {
      expect(PORTAL_PATTERN.test('/portal/')).toBe(true);
    });

    it('matches /portal/transactions', () => {
      expect(PORTAL_PATTERN.test('/portal/transactions')).toBe(true);
    });

    it('does not match /portals', () => {
      expect(PORTAL_PATTERN.test('/portals')).toBe(false);
    });
  });

  describe('ADMIN_PATTERN', () => {
    it('matches /admin', () => {
      expect(ADMIN_PATTERN.test('/admin')).toBe(true);
    });

    it('matches /admin/', () => {
      expect(ADMIN_PATTERN.test('/admin/')).toBe(true);
    });

    it('matches /admin/users', () => {
      expect(ADMIN_PATTERN.test('/admin/users')).toBe(true);
    });

    it('does not match /administration', () => {
      expect(ADMIN_PATTERN.test('/administration')).toBe(false);
    });
  });
});

// ─── Route decision tests ─────────────────────────────────────────────────────

describe('Middleware route decisions', () => {
  const unauthenticated: AuthState = { authenticated: false, role: null };
  const brokerUser: AuthState = { authenticated: true, role: 'broker' };
  const clientUser: AuthState = { authenticated: true, role: 'client' };
  const adminUser: AuthState = { authenticated: true, role: 'admin' };

  describe('/broker/* routes', () => {
    it('allows broker through /broker/dashboard', () => {
      expect(resolveRoute('/broker/dashboard', brokerUser)).toEqual({ action: 'next' });
    });

    it('allows admin through /broker/dashboard', () => {
      expect(resolveRoute('/broker/dashboard', adminUser)).toEqual({ action: 'next' });
    });

    it('redirects unauthenticated user to /login', () => {
      expect(resolveRoute('/broker/dashboard', unauthenticated)).toEqual({ action: 'redirect', to: '/login' });
    });

    it('redirects client user to /login (insufficient role)', () => {
      expect(resolveRoute('/broker/transactions', clientUser)).toEqual({ action: 'redirect', to: '/login' });
    });

    it('redirects unauthenticated user from /broker root', () => {
      expect(resolveRoute('/broker', unauthenticated)).toEqual({ action: 'redirect', to: '/login' });
    });
  });

  describe('/portal/* routes', () => {
    it('allows any authenticated user through /portal', () => {
      expect(resolveRoute('/portal', clientUser)).toEqual({ action: 'next' });
      expect(resolveRoute('/portal', brokerUser)).toEqual({ action: 'next' });
      expect(resolveRoute('/portal', adminUser)).toEqual({ action: 'next' });
    });

    it('redirects unauthenticated user to /login', () => {
      expect(resolveRoute('/portal', unauthenticated)).toEqual({ action: 'redirect', to: '/login' });
    });

    it('redirects unauthenticated user from /portal/transactions', () => {
      expect(resolveRoute('/portal/transactions', unauthenticated)).toEqual({ action: 'redirect', to: '/login' });
    });
  });

  describe('/admin/* routes', () => {
    it('allows admin through /admin', () => {
      expect(resolveRoute('/admin', adminUser)).toEqual({ action: 'next' });
    });

    it('allows admin through /admin/users', () => {
      expect(resolveRoute('/admin/users', adminUser)).toEqual({ action: 'next' });
    });

    it('redirects unauthenticated user to /login', () => {
      expect(resolveRoute('/admin', unauthenticated)).toEqual({ action: 'redirect', to: '/login' });
    });

    it('redirects broker to /login (insufficient role for admin)', () => {
      expect(resolveRoute('/admin', brokerUser)).toEqual({ action: 'redirect', to: '/login' });
    });

    it('redirects client to /login (insufficient role for admin)', () => {
      expect(resolveRoute('/admin/settings', clientUser)).toEqual({ action: 'redirect', to: '/login' });
    });
  });

  describe('/login and /signup — redirect authenticated users', () => {
    it('redirects authenticated broker away from /login to /broker/dashboard', () => {
      expect(resolveRoute('/login', brokerUser)).toEqual({ action: 'redirect', to: '/broker/dashboard' });
    });

    it('redirects authenticated admin away from /login to /admin', () => {
      expect(resolveRoute('/login', adminUser)).toEqual({ action: 'redirect', to: '/admin' });
    });

    it('redirects authenticated client away from /login to /portal', () => {
      expect(resolveRoute('/login', clientUser)).toEqual({ action: 'redirect', to: '/portal' });
    });

    it('allows unauthenticated user through /login', () => {
      expect(resolveRoute('/login', unauthenticated)).toEqual({ action: 'next' });
    });

    it('redirects authenticated broker away from /signup', () => {
      expect(resolveRoute('/signup', brokerUser)).toEqual({ action: 'redirect', to: '/broker/dashboard' });
    });

    it('allows unauthenticated user through /signup', () => {
      expect(resolveRoute('/signup', unauthenticated)).toEqual({ action: 'next' });
    });
  });

  describe('public routes', () => {
    it('allows unauthenticated access to /', () => {
      expect(resolveRoute('/', unauthenticated)).toEqual({ action: 'next' });
    });

    it('allows authenticated access to /', () => {
      expect(resolveRoute('/', brokerUser)).toEqual({ action: 'next' });
    });

    it('allows unauthenticated access to /about', () => {
      expect(resolveRoute('/about', unauthenticated)).toEqual({ action: 'next' });
    });

    it('allows unauthenticated access to /api/auth/signin', () => {
      expect(resolveRoute('/api/auth/signin', unauthenticated)).toEqual({ action: 'next' });
    });
  });
});
