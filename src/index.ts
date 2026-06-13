import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import routes from './routes/index';
import { authenticate } from './middleware/authMiddleware';
import { loggingMiddleware } from './middleware/loggingMiddleware';
import { initializeService, getService } from './controllers/openaiController';
import { cleanupOldLogs } from './services/fileLogger';
import identityMiddleware from './middleware/identityMiddleware';
import { loadIdentity } from './services/identityService';
import { initializeAgentSystem, getAgentService, getRagService } from './controllers/agentController';
import { DiskRAGService } from './services/ragService';
import { startWorkspaceWatcher } from './services/workspaceWatcher';
import { bootstrapProviders } from './services/providerBootstrap';

dotenv.config();

function writeRuntimeManifest(workspaceDir: string, serverPort: string | number) {
  try {
    const runtimeDir = path.join(workspaceDir, 'mcp', '.zombiecoder');
    const runtimePath = path.join(runtimeDir, 'runtime.json');
    if (!fs.existsSync(runtimeDir)) {
      fs.mkdirSync(runtimeDir, { recursive: true });
    }
    const manifest = {
      workspaceRoot: workspaceDir,
      server: {
        port: Number(serverPort),
        mcpUrl: `http://localhost:${serverPort}/mcp`,
        sseUrl: `http://localhost:${serverPort}/sse`,
      },
      editorConfigs: {
        vscode: 'mcp/editor-configs/vscode-mcp.json',
        zed: 'mcp/editor-configs/zed-settings.json',
        windsurf: 'mcp/editor-configs/windsurf-mcp_config.json',
        jetbrains: 'mcp/editor-configs/jetbrains-mcp.json',
      },
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(runtimePath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  } catch (err: any) {
    console.warn('Failed to write runtime manifest:', err?.message || err);
  }
}

const app = express();
const PORT = process.env.PORT || 5001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim());

if (!GROQ_API_KEY) {
  console.warn('WARNING: GROQ_API_KEY not set — server will run in degraded mode');
}

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggingMiddleware);
// Load identity manifest early and attach identity headers to responses
loadIdentity();
app.use(identityMiddleware);

// /health is implemented in routes/index.ts (includes model/service stats)

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(['/v1', '/api', '/dashboard', '/admin', '/db'], authenticate);

app.use(routes);

async function start() {
  const service = initializeService(GROQ_API_KEY!);
  // Initialize Agent & RAG system
  // Preference order for workspace dir: editor mcp config -> env WORKSPACE_DIR -> process.cwd()
  function findMcpConfig(): string | null {
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      const candidate = path.join(dir, 'mcp', 'mcp.json');
      if (fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  }

  function resolveWorkspaceFromConfig(configPath: string): string | null {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const workspaceRoot = path.resolve(path.dirname(configPath), '..');
      let candidate = parsed.workspaceDir || parsed.workspace || '';
      if (!candidate) return null;
      if (typeof candidate !== 'string') return null;
      candidate = candidate.replace('${workspaceFolder}', workspaceRoot).trim();
      return path.isAbsolute(candidate) ? candidate : path.resolve(workspaceRoot, candidate);
    } catch (e) {
      return null;
    }
  }

  const mcpConfigPath = findMcpConfig();
  let DEFAULT_WORKSPACE = process.env.WORKSPACE_DIR || process.cwd();
  if (mcpConfigPath) {
    const resolved = resolveWorkspaceFromConfig(mcpConfigPath);
    if (resolved) {
      DEFAULT_WORKSPACE = resolved;
    }
    // Watch the mcp config for runtime changes and apply updates
    try {
      fs.watch(mcpConfigPath, { persistent: false }, async (ev) => {
        if (ev === 'change' || ev === 'rename') {
          const newResolved = resolveWorkspaceFromConfig(mcpConfigPath);
          if (newResolved && newResolved !== DEFAULT_WORKSPACE) {
            console.log('Detected update to mcp/mcp.json workspaceDir ->', newResolved);
            DEFAULT_WORKSPACE = newResolved;
            try {
              const rag = getRagService();
              if (rag) {
                await rag.setWorkingDirectory(DEFAULT_WORKSPACE, { autoInit: true });
                // start a watcher for this directory to keep SSOT up-to-date
                try {
                  const localRag = new DiskRAGService();
                  await localRag.setWorkingDirectory(DEFAULT_WORKSPACE, { autoInit: true });
                  startWorkspaceWatcher({ directory: DEFAULT_WORKSPACE, rag: localRag, index: undefined, workspaceId: 'auto' });
                } catch (e: any) {
                  console.warn('Failed to start watcher for updated workspace:', e?.message || e);
                }
              }
            } catch (e: any) {
              console.warn('Applying updated workspace failed:', e?.message || e);
            }
          }
        }
      });
    } catch (e) {
      /* ignore watch errors */
    }
  }

  await initializeAgentSystem(DEFAULT_WORKSPACE);
  await service.initialize();

  // Bootstrap providers from environment variables
  try {
    const bootstrap = await bootstrapProviders();
    console.log(`✅ Provider bootstrap: ${bootstrap.discovered} providers, ${bootstrap.synced} models, ${bootstrap.toolsRegistered} tools`);
  } catch (err: any) {
    console.warn('⚠️ Provider bootstrap failed:', err?.message || err);
  }

  writeRuntimeManifest(process.cwd(), PORT);
  cleanupOldLogs();
  setInterval(cleanupOldLogs, 3600000);
  const agentSvc = getAgentService();
  const persona = agentSvc?.getPersonaName() || 'ZombieCoder';

  app.listen(PORT, () => {
    const models = service.getModels();
    const lines = [
      '='.repeat(58),
      '  Groq OpenAI-Compatible Bridge',
      '='.repeat(58),
      `  Server:      http://localhost:${PORT}`,
      `  Models:      ${models.length} available`,
      `  Auth:        Optional (auto-uses env GROQ_API_KEY)`,
      `  CORS:        ${CORS_ORIGINS.join(', ')}`,
      `  Dashboard:   http://localhost:${PORT}/dashboard`,
      '',
      '  Endpoints:',
      `  POST /v1/chat/completions    - Chat (tools, vision, JSON mode, streaming)`,
      `  POST /v1/completions         - Text completions (legacy)`,
      `  POST /v1/audio/transcriptions  - Speech-to-text`,
      `  POST /v1/audio/translations    - Audio translation`,
      `  POST /v1/embeddings          - Text embeddings`,
      `  GET  /v1/models              - List models`,
      `  GET  /v1/models/:id          - Get model`,
      '',
      `  ${'='.repeat(52)}`,
      `  🌟 ZombieCoder Agent System (${persona})`,
      `  ${'='.repeat(52)}`,
      `  POST /v1/agent/chat          - Agent chat (RAG + Persona + Tool calling)`,
      `  POST /v1/agent/directory     - Set working directory`,
      `  POST /v1/agent/permission    - Grant/deny permission`,
      `  GET  /v1/agent/status        - Agent system status`,
      `  POST /v1/agent/rescan        - Rescan project`,
      `  GET  /v1/agent/ssot          - Read SSOT.md`,
      `  GET  /v1/agent/routes        - Available agent routes`,
      '',
      '  Features:',
      '  - Full OpenAI format pass-through (tools, streaming, images)',
      '  - Smart auto model routing based on input',
      '  - Per-model rate limit management',
      '  - Real-time dashboard & logging',
      '  - Disk-based RAG (SSOT.md) - single source of truth',
      '  - ZombieCoder agent persona with identity anchoring',
      '  - Permission-based project scanning',
      '  - No vendor lock-in - use any OpenAI-compatible client',
      '='.repeat(58),
    ];
    console.log(lines.join('\n'));
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
