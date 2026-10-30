/**
 * OmniRoute Built-in Middleware Suite
 * Production-grade CORS, Rate Limiter, Logger, and JWT-Style Auth Guard.
 */

// ─── CORS Middleware ───
export function cors(options = {}) {
  const {
    origin = '*',
    methods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    headers = 'Content-Type, Authorization',
    maxAge = 86400,
  } = options;

  return async (ctx, next) => {
    ctx.res.setHeader('Access-Control-Allow-Origin', origin);
    ctx.res.setHeader('Access-Control-Allow-Methods', methods);
    ctx.res.setHeader('Access-Control-Allow-Headers', headers);
    ctx.res.setHeader('Access-Control-Max-Age', String(maxAge));

    if (ctx.method === 'OPTIONS') {
      ctx.res.writeHead(204);
      ctx.res.end();
      return;
    }
    await next();
  };
}

// ─── Request Logger Middleware ───
export function logger() {
  return async (ctx, next) => {
    const start = performance.now();
    await next();
    const duration = (performance.now() - start).toFixed(2);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${ctx.method} ${ctx.pathname} — ${duration}ms`);
  };
}

// ─── In-Memory Sliding Window Rate Limiter ───
export function rateLimiter(options = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
  } = options;

  const store = new Map();

  // Cleanup stale entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store) {
      if (now - record.windowStart > windowMs) store.delete(key);
    }
  }, windowMs);

  return async (ctx, next) => {
    const clientIP = ctx.headers['x-forwarded-for'] || ctx.req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = store.get(clientIP);
    if (!record || now - record.windowStart > windowMs) {
      record = { windowStart: now, count: 0 };
      store.set(clientIP, record);
    }

    record.count++;

    ctx.res.setHeader('X-RateLimit-Limit', String(maxRequests));
    ctx.res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));

    if (record.count > maxRequests) {
      ctx.res.writeHead(429, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({
        error: 'Too Many Requests',
        retryAfterMs: windowMs - (now - record.windowStart),
      }));
      return;
    }

    await next();
  };
}

// ─── Bearer Token Auth Guard ───
export function authGuard(options = {}) {
  const { validateToken } = options;

  return async (ctx, next) => {
    const authHeader = ctx.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.res.writeHead(401, { 'Content-Type': 'application/json' });
      ctx.res.end(JSON.stringify({ error: 'Unauthorized: Missing Bearer token' }));
      return;
    }

    const token = authHeader.slice(7);

    if (validateToken) {
      const payload = await validateToken(token);
      if (!payload) {
        ctx.res.writeHead(403, { 'Content-Type': 'application/json' });
        ctx.res.end(JSON.stringify({ error: 'Forbidden: Invalid or expired token' }));
        return;
      }
      ctx.state.user = payload;
    }

    await next();
  };
}

// ─── JSON Body Parser ───
export function jsonParser() {
  return async (ctx, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(ctx.method)) {
      const chunks = [];
      for await (const chunk of ctx.req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        ctx.body = JSON.parse(raw || '{}');
      } catch {
        ctx.body = {};
      }
    }
    await next();
  };
}

// ─── Response Helper ───
export function json(ctx, statusCode, data) {
  ctx.res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  ctx.res.end(JSON.stringify(data));
}
