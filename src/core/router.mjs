/**
 * OmniRoute — Ultra-Fast Zero-Dependency HTTP Router & API Gateway Engine
 * Supports dynamic path parameters, wildcard routes, middleware pipelines,
 * grouped route prefixes, and OpenAPI-compatible method registration.
 */

export class OmniRouter {
  constructor() {
    this._routes = [];
    this._globalMiddleware = [];
    this._notFoundHandler = null;
    this._errorHandler = null;
  }

  // ─── Middleware Registration ───
  use(middlewareFn) {
    this._globalMiddleware.push(middlewareFn);
    return this;
  }

  // ─── Route Registration (Express-compatible API) ───
  get(path, ...handlers)    { return this._register('GET', path, handlers); }
  post(path, ...handlers)   { return this._register('POST', path, handlers); }
  put(path, ...handlers)    { return this._register('PUT', path, handlers); }
  patch(path, ...handlers)  { return this._register('PATCH', path, handlers); }
  delete(path, ...handlers) { return this._register('DELETE', path, handlers); }
  options(path, ...handlers){ return this._register('OPTIONS', path, handlers); }
  all(path, ...handlers)    { return this._register('*', path, handlers); }

  // ─── Route Groups (Prefix-Based Nesting) ───
  group(prefix, callback) {
    const subRouter = new OmniRouter();
    callback(subRouter);
    for (const route of subRouter._routes) {
      const compiled = this._compilePattern(prefix + route.path);
      this._routes.push({
        ...route,
        path: prefix + route.path,
        pattern: compiled.pattern,
        paramNames: compiled.paramNames,
      });
    }
    return this;
  }

  // ─── Custom Error & 404 Handlers ───
  onNotFound(handler) { this._notFoundHandler = handler; return this; }
  onError(handler)    { this._errorHandler = handler; return this; }

  // ─── Core Request Resolver ───
  resolve(method, pathname) {
    for (const route of this._routes) {
      if (route.method !== '*' && route.method !== method.toUpperCase()) continue;

      const match = route.pattern.exec(pathname);
      if (!match) continue;

      const params = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }

      return { route, params };
    }
    return null;
  }

  // ─── Execute Full Middleware + Handler Pipeline ───
  async handle(req, res) {
    const url = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    const method = req.method || 'GET';
    const pathname = url.pathname;

    // Build context object
    const ctx = {
      req,
      res,
      method,
      pathname,
      query: Object.fromEntries(url.searchParams),
      params: {},
      headers: req.headers || {},
      state: {},
    };

    try {
      // Run global middleware pipeline
      for (const mw of this._globalMiddleware) {
        let shouldContinue = false;
        await mw(ctx, () => { shouldContinue = true; });
        if (!shouldContinue) return;
      }

      // Resolve route
      const match = this.resolve(method, pathname);
      if (!match) {
        if (this._notFoundHandler) {
          return this._notFoundHandler(ctx);
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found', path: pathname }));
        return;
      }

      ctx.params = match.params;

      // Execute route-level handler chain
      const handlers = match.route.handlers;
      for (let i = 0; i < handlers.length; i++) {
        let calledNext = false;
        await handlers[i](ctx, () => { calledNext = true; });
        if (!calledNext && i < handlers.length - 1) return;
      }
    } catch (err) {
      if (this._errorHandler) {
        return this._errorHandler(err, ctx);
      }
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
    }
  }

  // ─── Internal: Register & Compile ───
  _register(method, path, handlers) {
    const { pattern, paramNames } = this._compilePattern(path);
    this._routes.push({ method: method.toUpperCase(), path, pattern, paramNames, handlers });
    return this;
  }

  _compilePattern(path) {
    const paramNames = [];
    const regexStr = path
      .replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return { pattern: new RegExp(`^${regexStr}$`), paramNames };
  }

  // ─── Route Table Inspection ───
  getRouteTable() {
    return this._routes.map(r => ({
      method: r.method,
      path: r.path,
      handlersCount: r.handlers.length,
    }));
  }
}
