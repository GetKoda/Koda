# Koda

Next-generation design editor with AI-powered pixel-perfect code generation.

## Architecture

- `frontend/` — React + TypeScript UI shell, scene graph state, editing tools
- `render-wasm/` — Rust/WebAssembly canvas renderer, hit-testing, geometry
- `shared/` — TypeScript types shared across frontend and services

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Renderer:** Rust → WebAssembly (via wasm-pack)
- **State:** Zustand (lightweight, fast)
- **Codegen:** `koda-ai` service

## Quick Start

```bash
# Install dependencies
cd frontend && npm install

# Build WASM renderer
cd render-wasm && wasm-pack build --target web

# Run dev server
cd frontend && npm run dev
```

## License

AGPL-3.0 (editor only)
