# NEXA-LOGICS Route ⚡🌐

[![Live Web Demo](https://img.shields.io/badge/Live_Demo-Open_API_Gateway-10B981.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://zbrainsofficial.github.io/nexa-logics-route/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue.svg?style=for-the-badge)](#)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> Ultra-fast zero-dependency HTTP router, API gateway, and middleware pipeline engine with dynamic path parameters, rate limiting, JWT auth guard, and CORS — a lightweight, production-grade Express alternative.

🌐 **Live Interactive API Playground:** [https://zbrainsofficial.github.io/nexa-logics-route/](https://zbrainsofficial.github.io/nexa-logics-route/)

---

## ⚡ Architecture

```
   Incoming HTTP Request
          │
          ▼
   ┌──────────────────────────────────────┐
   │        NEXA-LOGICS Route Engine       │
   ├──────────────────────────────────────┤
   │  ► CORS Middleware                    │
   │  ► Request Logger (with timestamps)  │
   │  ► Sliding Window Rate Limiter       │
   │  ► Bearer Token Auth Guard           │
   ├──────────────────────────────────────┤
   │  Route Resolution Engine:             │
   │  ├── Static Paths: /api/health        │
   │  ├── Dynamic Params: /users/:id       │
   │  ├── Nested: /orders/:oid/items/:iid  │
   │  ├── Grouped Prefixes: /api/v1/*      │
   │  └── Wildcard Catch-All: /*           │
   ├──────────────────────────────────────┤
   │  Handler Chain ──► JSON Response      │
   └──────────────────────────────────────┘
```

---

## 🚀 Features

- **Zero-Dependency Router Core:** No npm bloat. Pure Node.js `http` module for maximum auditability.
- **Dynamic Path Parameters:** `/users/:id`, `/orders/:orderId/items/:itemId` — unlimited nesting depth.
- **Route Groups with Prefix:** Clean REST API versioning via `router.group('/api/v1', ...)`.
- **Built-in Middleware Suite:** CORS, structured logger, sliding-window rate limiter, JWT bearer auth guard, JSON body parser.
- **Express-Compatible API:** Drop-in `app.get()`, `app.post()`, `app.use()` syntax.
- **Sub-millisecond Latency:** Regex-compiled route patterns for near-zero overhead on hot paths.

---

## 🛠️ Quick Start

### Install & Test
```bash
npm test
```

### Launch API Gateway
```bash
npm start
```

Server runs at `http://localhost:4000`

### Example API Calls
```bash
# Health check
curl http://localhost:4000/api/health

# List users
curl http://localhost:4000/api/v1/users/

# Get user by ID (dynamic param)
curl http://localhost:4000/api/v1/users/42

# List products
curl http://localhost:4000/api/v1/products/

# Introspect route table
curl http://localhost:4000/api/routes
```

---

## 📜 License
MIT License. Open-source software.

<p align="right">
  <sub>Architected & Engineered by <b>Zaigham Ali Ashraf</b> (0321-6314020) • Z-Brains Systems</sub>
</p>
