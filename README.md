# Zombie Coder SSOT

> Single Source of Truth for ZombieCoder — Local-first AI provider orchestration gateway with multi-provider routing, smart model selection, and OpenAI-compatible API.

## Overview

Zombie Coder SSOT is a production-grade provider orchestration system that routes AI requests to multiple LLM providers through a unified OpenAI-compatible API. It features automatic failover, smart model selection, rate limiting, and a comprehensive admin dashboard.

## Key Features

- **Multi-Provider Routing** — 6 providers (OpenCode, Groq, OpenAI, Gemini, Anthropic, Ollama) with automatic failover
- **Smart Model Selection** — Auto-route based on budget, quality, health, and input complexity (98+ models)
- **Response Normalization** — Ollama, Anthropic, Gemini responses normalized to OpenAI format
- **Tool Call Normalization** — Tool call formats from all providers normalized to OpenAI function calling
- **Retry & Fallback** — Configurable retry with exponential backoff, automatic fallback chain
- **Rate Limiting** — Per-model RPM/TPM tracking with pre-emptive routing
- **Local-First Database** — SQLite with WAL mode, no external DB required
- **Admin Dashboard** — Full web UI for provider/model management, testing, and documentation
- **Identity Anchoring** — System identity injected into all requests for consistent persona

## Architecture

```
proxi_new/
├── src/
│   ├── index.ts                          ← Server entry point (port 9999)
│   ├── providers/
│   │   ├── types.ts                      ← ILLMProvider, ChatCompletionParams
│   │   ├── base.provider.ts              ← Abstract base (rate limit, retry, health)
│   │   ├── normalizer.ts                 ← Ollama/Anthropic/Gemini → OpenAI format
│   │   ├── tool-normalizer.ts            ← Tool call format normalization
│   │   ├── provider-registry.ts          ← Singleton factory + TTL cache
│   │   ├── provider-gateway.ts           ← Main routing brain (3-tier, smart select)
│   │   └── implementations/
│   │       ├── opencode.provider.ts
│   │       ├── groq.provider.ts
│   │       ├── openai.provider.ts
│   │       ├── gemini.provider.ts
│   │       └── anthropic.provider.ts
│   ├── services/
│   │   ├── stateDb.ts                    ← SQLite DB (providers, models, tools)
│   │   ├── providerBootstrap.ts          ← Env-based provider discovery
│   │   ├── groqService.ts                ← Core chat with retry/fallback
│   │   ├── identityService.ts            ← System identity management
│   │   └── ragService.ts                 ← Disk-based RAG (SSOT.md)
│   ├── controllers/
│   │   ├── openaiController.ts           ← /v1/chat/completions
│   │   └── agentController.ts            ← /v1/agent/* endpoints
│   ├── admin/
│   │   └── controller.ts                 ← Admin dashboard + API handlers
│   └── routes/
│       └── index.ts                      ← All route registrations
├── documentation/
│   └── now/
│       └── provider-orchestration.html   ← Bengali documentation
├── .env.example
├── package.json
├── tsconfig.json
└── LICENSE
```

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/zombiecode1/Zombie-Coder-Ssot.git
cd Zombie-Coder-Ssot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your API keys

# 4. Start the server
npm run dev
# Server runs on http://localhost:9999
```

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `OPENCODE_API_KEY` | OpenCode provider authentication | Optional |
| `GROQ_API_KEY` | Groq provider authentication | Optional |
| `OPENAI_API_KEY` | OpenAI provider authentication | Optional |
| `GEMINI_API_KEY` | Google Gemini authentication | Optional |
| `ANTHROPIC_API_KEY` | Anthropic provider authentication | Optional |
| `PORT` | Server port (default: 9999) | Optional |
| `WORKSPACE_DIR` | Working directory for RAG | Optional |

## API Endpoints

### Core (OpenAI-Compatible)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/chat/completions` | Chat completions (tools, vision, streaming) |
| POST | `/v1/completions` | Text completions (legacy) |
| POST | `/v1/audio/transcriptions` | Speech-to-text |
| POST | `/v1/audio/translations` | Audio translation |
| POST | `/v1/embeddings` | Text embeddings |
| GET | `/v1/models` | List available models |

### Agent

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/agent/chat` | Agent chat with RAG + persona |
| POST | `/v1/agent/directory` | Set working directory |
| POST | `/v1/agent/rescan` | Rescan project files |
| GET | `/v1/agent/ssot` | Read SSOT documentation |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/providers` | List all providers |
| POST | `/api/admin/providers` | Create/update provider |
| POST | `/api/admin/providers/:id/test` | Test provider connection |
| POST | `/api/admin/providers/:id/sync` | Sync provider models |
| POST | `/api/admin/providers/sync-all` | Sync all providers |
| POST | `/api/admin/models/:id/test` | Test specific model |
| GET | `/api/admin/provider-costs` | Cost statistics |

## Usage Examples

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:9999/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="auto",  # or specific model like "llama-3.1-8b-instant"
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### Node.js (OpenAI SDK)

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: 'http://localhost:9999/v1',
    apiKey: 'not-needed',
});

const response = await client.chat.completions.create({
    model: 'auto',
    messages: [{ role: 'user', content: 'Hello!' }],
});
```

### cURL

```bash
curl http://localhost:9999/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

## Provider Status

| Provider | Status | Models | Notes |
|----------|--------|--------|-------|
| Groq | Active | 16 | Fast inference, free tier |
| OpenCode | Active | 48 | Claude, Gemini models |
| OpenAI | Configured | 6 | GPT-4o, etc. |
| Gemini | Configured | 3 | Google models |
| Anthropic | Configured | 3 | Claude models |
| Ollama | Local | - | Requires local server |

## Admin Dashboard

Access the admin dashboard at `http://localhost:9999/admin/dashboard`:

- **Overview** — System stats, uptime, memory usage
- **Providers** — List/manage providers, test connections, sync models
- **Models** — Browse all models, test, set defaults
- **Test** — Provider + capability testing with real requests
- **Docs** — Architecture, API structure, integration guide

## Smart Model Selection

When `model: "auto"` is used, the system selects the best model based on:

- **Input length** — Short text → fast models, long text → balanced
- **Tool requirements** — Filters to models with tool support
- **Budget** — Free models preferred, then cheapest
- **Health** — Healthy providers scored higher
- **Category** — Fast (+15), Balanced (+5), Powerful (+10), Free (+20)

## Database Schema

```sql
providers        → id, name, type, base_url, api_key, priority, health_status
provider_models  → id, provider_id, model_id, context_window, category, is_free
provider_tools   → id, provider_id, tool_name, tool_type, is_available
agent_profiles   → id, name, persona, preferred_provider_id, budget_limit
```

## License

MIT

## Author

**ZombieCoder** — Sahon Srabon
- Website: https://zombiecoder.my.id/
- Email: infi@zombiecoder.my.id
