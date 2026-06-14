import { Request, Response } from 'express';
import { AgentService } from '../services/agentService';
import { DiskRAGService } from '../services/ragService';
import { MawlanaRouter } from '../services/mawlanaRouter';
import { getService } from './openaiController';
import { ChatCompletionCreateParams } from 'groq-sdk/resources/chat/completions';
import { getIdentity } from '../services/identityService';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { initStateDb, setStateDb, upsertModels, upsertModelRateLimits, upsertPersona, isWorkspaceTrusted, ensureConversation, addConversationMessage, upsertWorkspaceTrust } from '../services/stateDb';
import { initAdminTables } from '../admin/db';
import { addEditorConnection } from '../admin/db';
import { startWorkspaceWatcher, WorkspaceWatcher } from '../services/workspaceWatcher';
import { VectorIndexService } from '../services/vectorIndexService';

function stripThinkBlocks(text: string): string {
  if (!text) return text;
  return text.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '');
}

let agentService: AgentService;
let ragService: DiskRAGService;
let mawlanaRouter: MawlanaRouter;
let vectorIndexService: VectorIndexService;
let stateDb: any;
const workspaceWatchers: Map<string, WorkspaceWatcher> = new Map();

export const initializeAgentSystem = async (workingDir?: string) => {
  const groq = getService();
  if (!groq) throw new Error('GroqService not initialized');

  ragService = new DiskRAGService();
  mawlanaRouter = new MawlanaRouter(groq);
  agentService = new AgentService(groq, ragService);

  if (workingDir) {
    try {
      await ragService.setWorkingDirectory(workingDir, { autoInit: true });
    } catch (e: any) {
      console.warn('rag setWorkingDirectory autoInit failed:', e?.message || e);
    }
    // Start watcher for the default workspace to keep SSOT up-to-date
    try {
      const key = `default:${workingDir}`;
      if (!workspaceWatchers.has(key)) {
        workspaceWatchers.set(key, startWorkspaceWatcher({
          directory: workingDir,
          rag: ragService,
          index: vectorIndexService,
          workspaceId: 'default',
        }));
        console.log(`👁️ Workspace watcher started for default workspace: ${workingDir}`);
      }
    } catch (e: any) {
      console.warn('Failed to start default workspace watcher:', e?.message || e);
    }
  }

  // Initialize local SQLite state DB under the working directory.
  try {
    const baseDir = path.resolve(workingDir || process.cwd());
    const zdir = path.join(baseDir, '.zombiecoder');
    if (!fs.existsSync(zdir)) fs.mkdirSync(zdir, { recursive: true });
    const dbPath = path.join(zdir, 'state.db');
    stateDb = initStateDb(dbPath);
    setStateDb(stateDb);
    initAdminTables();
    vectorIndexService = new VectorIndexService(stateDb);

    const identity = getIdentity();
    if (identity?.system_identity) {
      upsertPersona(stateDb, {
        persona_id: 'default',
        name: identity.system_identity.name || 'ZombieCoder',
        system_prompt: identity.system_identity.system_prompt || '',
      });
    }

    upsertModels(stateDb, groq.getModels());
    upsertModelRateLimits(stateDb, groq.getConfiguredRateLimits());
    // Auto-trust loader: read .zombiecoder/auto_trust.json and auto-init trusted workspaces
    try {
      const autoTrustPath = path.join(baseDir, '.zombiecoder', 'auto_trust.json');
      if (fs.existsSync(autoTrustPath)) {
        const raw = fs.readFileSync(autoTrustPath, 'utf-8');
        const list = JSON.parse(raw || '[]');
        if (Array.isArray(list)) {
          for (const entry of list) {
            try {
              const dirCandidate = String(entry || '').trim();
              if (!dirCandidate) continue;
              const resolved = path.isAbsolute(dirCandidate) ? dirCandidate : path.resolve(baseDir, dirCandidate);
              if (!fs.existsSync(resolved)) {
                console.warn('auto_trust: directory does not exist, skipping:', resolved);
                continue;
              }
              const workspaceId = 'auto:' + crypto.createHash('sha256').update(resolved).digest('hex').slice(0, 16);
              try {
                upsertWorkspaceTrust(stateDb, {
                  workspace_id: workspaceId,
                  user_id: 'auto',
                  directory: resolved,
                  trusted: true,
                });
              } catch (e: any) {
                console.warn('auto_trust: upsertWorkspaceTrust failed:', e?.message || e);
              }

              // Use a dedicated DiskRAGService instance per watched directory so multiple directories
              // can be scanned/watched independently without clobbering a shared workingDir.
              const localRag = new DiskRAGService();
              try {
                // autoInit will create .zombiecoder/SSOT.md if missing
                // eslint-disable-next-line no-await-in-loop
                await localRag.setWorkingDirectory(resolved, { autoInit: true });
              } catch (e: any) {
                console.warn('auto_trust: setWorkingDirectory failed for', resolved, e?.message || e);
              }

              // Start a watcher for this directory to keep SSOT up-to-date
              try {
                const key = `${workspaceId}:${resolved}`;
                if (!workspaceWatchers.has(key)) {
                  workspaceWatchers.set(key, startWorkspaceWatcher({
                    directory: resolved,
                    rag: localRag,
                    index: vectorIndexService,
                    workspaceId,
                  }));
                }
              } catch (e: any) {
                console.warn('auto_trust: failed to start watcher for', resolved, e?.message || e);
              }
            } catch (e: any) {
              console.warn('auto_trust: entry processing failed:', e?.message || e);
            }
          }
        }
      }
    } catch (e: any) {
      console.warn('auto_trust load failed:', e?.message || e);
    }
  } catch (e: any) {
    console.warn('state db init failed:', e?.message || e);
  }

  return { agentService, ragService, mawlanaRouter };
};

export const getAgentService = () => agentService;
export const getRagService = () => ragService;
export const getMawlanaRouter = () => mawlanaRouter;
export const getVectorIndexService = () => vectorIndexService;
export const getStateDb = () => stateDb;

export const handleCreateEditorSession = async (req: Request, res: Response) => {
  try {
    const { directory, client_name } = req.body || {};
    if (!directory) return res.status(400).json({ error: { message: 'directory is required', type: 'invalid_request_error' } });

    const resolved = path.resolve(String(directory));
    if (!fs.existsSync(resolved)) return res.status(400).json({ error: { message: 'directory does not exist', type: 'invalid_request_error' } });

    if (!stateDb) return res.status(500).json({ error: { message: 'state db not initialized', type: 'server_error' } });

    // Auto-trust any directory (global agent mode)
    const wsId = 'editor:' + crypto.createHash('sha256').update(resolved).digest('hex').slice(0, 16);
    try {
      const existing = stateDb.prepare('SELECT trusted FROM workspaces WHERE directory = ? LIMIT 1').get(resolved) as any;
      if (!existing || !existing.trusted) {
        upsertWorkspaceTrust(stateDb, {
          workspace_id: wsId,
          user_id: client_name || 'editor',
          directory: resolved,
          trusted: true,
        });
        console.log(`[Agent] Auto-trusted editor directory: ${resolved}`);
      }
    } catch (e: any) {
      console.warn('auto-trust editor failed:', e?.message || e);
    }

    // Locate mcp folder (search upwards) and parse .env for MCP_PUBLIC_URL / MCP_SERVER_PORT / MCP_SERVER_HOST / MCP_OAUTH_SECRET
    let cur = resolved;
    let mcpRoot: string | null = null;
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(cur, 'mcp');
      if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'mcp.json'))) { mcpRoot = candidate; break; }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    if (!mcpRoot) {
      const fallback = path.join(process.cwd(), 'mcp');
      if (fs.existsSync(fallback) && fs.existsSync(path.join(fallback, 'mcp.json'))) mcpRoot = fallback;
    }

    if (!mcpRoot) return res.status(404).json({ error: { message: 'mcp config not found', type: 'not_found' } });

    const envPath = path.join(mcpRoot, '.env');
    let baseUrl = 'http://localhost:3000';
    let oauthSecret = '';
    if (fs.existsSync(envPath)) {
      const text = fs.readFileSync(envPath, 'utf8');
      const lines = text.split(/\r?\n/);
      const env: Record<string, string> = {};
      for (const l of lines) {
        const m = l.match(/^\s*([A-Za-z0-9_]+)=(.*)$/);
        if (!m) continue;
        const k = m[1];
        let v = m[2] || '';
        v = v.replace(/^\"|\"$/g, '').replace(/^\'|\'$/g, '');
        env[k] = v;
      }
      if (env.MCP_PUBLIC_URL && env.MCP_PUBLIC_URL.trim()) baseUrl = env.MCP_PUBLIC_URL.trim();
      else {
        const host = env.MCP_SERVER_HOST || env.MCP_SERVER || 'localhost';
        const port = env.MCP_SERVER_PORT || env.MCP_SERVER_PORT || '3000';
        baseUrl = `http://${host}:${port}`;
      }
      oauthSecret = env.MCP_OAUTH_SECRET || env.MCP_OAUTH || env.MCP_OAUTH_SECRET || '';
    }

    // Call mcp /auth/register and /auth/token to obtain a client token
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_name: client_name || 'proxi-auto-client', redirect_uris: [] })
    }).catch(e => ({ ok: false, status: 0, text: () => String(e) } as any));

    if (!regRes || !regRes.ok) {
      const txt = await (regRes.text ? regRes.text() : String(regRes));
      return res.status(502).json({ error: { message: 'registration failed: ' + txt, type: 'upstream_error' } });
    }
    const regJson = await regRes.json();
    const clientId = regJson.client_id || 'mcp-agent-server';

    const tokenRes = await fetch(`${baseUrl}/auth/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: oauthSecret })
    }).catch(e => ({ ok: false, status: 0, text: () => String(e) } as any));

    if (!tokenRes || !tokenRes.ok) {
      const txt = await (tokenRes.text ? tokenRes.text() : String(tokenRes));
      return res.status(502).json({ error: { message: 'token request failed: ' + txt, type: 'upstream_error' } });
    }
    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) return res.status(502).json({ error: { message: 'no access_token in token response', type: 'upstream_error' } });

    // Save token to workspace .zombiecoder directory
    const zdir = path.join(resolved, '.zombiecoder');
    if (!fs.existsSync(zdir)) fs.mkdirSync(zdir, { recursive: true });
    const outPath = path.join(zdir, 'mcp_session.json');
    const content = { access_token: accessToken, expires_at: Date.now() + ((tokenJson.expires_in || 3600) * 1000), created_at: new Date().toISOString(), base_url: baseUrl };
    fs.writeFileSync(outPath, JSON.stringify(content, null, 2) + '\n', 'utf8');

    try {
      if (stateDb) {
        addEditorConnection(stateDb, {
          connection_id: crypto.createHash('sha256').update(`${resolved}:${client_name || 'editor'}:${outPath}`).digest('hex').slice(0, 32),
          editor_name: String(client_name || 'editor'),
          client_name: String(client_name || 'editor'),
          workspace_id: wsId,
          directory: resolved,
          session_path: outPath,
          active: true,
        });
      }
    } catch (e: any) {
      console.warn('editor connection record failed:', e?.message || e);
    }

    return res.json({ ok: true, savedTo: outPath, baseUrl });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to create session', type: 'server_error' } });
  }
};

function resolveConversationId(conversation_id?: string): string {
  return conversation_id && String(conversation_id).trim() ? String(conversation_id).trim() : crypto.randomUUID();
}

export const handleAgentChat = async (req: Request, res: Response) => {
  try {
    const { messages, model, directory, category, legacy, user_id, workspace_id, conversation_id } = req.body || {};

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'messages array is required', type: 'invalid_request_error' } });
    }

    if (directory) {
      // Auto-trust any directory in global agent mode
      if (stateDb && fs.existsSync(path.resolve(String(directory)))) {
        const wsId = workspace_id || 'global:' + crypto.createHash('sha256').update(path.resolve(String(directory))).digest('hex').slice(0, 16);
        const uid = user_id || 'auto';
        try {
          const existing = stateDb.prepare('SELECT trusted FROM workspaces WHERE workspace_id = ? AND user_id = ? AND directory = ?').get(wsId, uid, path.resolve(String(directory))) as any;
          if (!existing || !existing.trusted) {
            upsertWorkspaceTrust(stateDb, {
              workspace_id: wsId,
              user_id: uid,
              directory: path.resolve(String(directory)),
              trusted: true,
            });
          }
        } catch { /* ignore */ }
      }

      const result = await ragService.setWorkingDirectory(directory, { autoInit: true });
      if (result.needsPermission) {
        return res.json({
          requiresPermission: true,
          message: ragService.requestPermissionMessage('scan'),
          directory,
        });
      }

      if (vectorIndexService) {
        try {
          await vectorIndexService.indexDirectory(path.resolve(String(directory)), {
            workspaceId: workspace_id ? String(workspace_id) : undefined,
          });
        } catch (e: any) {
          console.warn('workspace index failed:', e?.message || e);
        }
      }
    }

    // Legacy agent JSON wrapper mode (kept for backward compatibility).
    if (legacy === true) {
      let selectedModel = model || undefined;
      if (mawlanaRouter && !model) {
        const route = await mawlanaRouter.route(messages, category);
        selectedModel = route.model;
      }
      const result = await agentService.processMessage(messages, selectedModel);
      return res.json(result);
    }

    // OpenAI-compatible mode: behave like /v1/chat/completions, but with optional routing + RAG injection.
    // IMPORTANT: do not forward agent-specific keys (directory/category/legacy/etc) to Groq.
    const body: any = req.body || {};
    const params: ChatCompletionCreateParams = {
      model: body.model,
      messages,
      temperature: body.temperature,
      top_p: body.top_p,
      max_tokens: body.max_tokens ?? body.max_completion_tokens,
      stop: body.stop,
      stream: body.stream,
      n: body.n,
      presence_penalty: body.presence_penalty,
      frequency_penalty: body.frequency_penalty,
      logprobs: body.logprobs,
      top_logprobs: body.top_logprobs,
      response_format: body.response_format,
      seed: body.seed,
      tools: body.tools,
      tool_choice: body.tool_choice,
      parallel_tool_calls: body.parallel_tool_calls,
      user: body.user,
    } as any;

    // Model routing
    if (!params.model || params.model === 'auto') {
      const route = await mawlanaRouter.route(messages, category);
      params.model = route.model;

      // RAG injection (SSOT.md)
      if (route.needsRag) {
        const lastMsg = String(messages[messages.length - 1]?.content || '');
        let ragContext = '';

        if (vectorIndexService && ragService.currentDir) {
          try {
            const indexed = await vectorIndexService.search(lastMsg, {
              workspaceId: workspace_id ? String(workspace_id) : undefined,
              limit: 5,
            });
            ragContext = indexed.matches
              .map((item) => `- ${item.source_path} [chunk ${item.chunk_index}] (score ${item.score.toFixed(4)}): ${item.chunk_text}`)
              .join('\n');
          } catch (e: any) {
            console.warn('vector search failed:', e?.message || e);
          }
        }

        if (!ragContext && ragService.ssotExists()) {
          ragContext = ragService.searchSSOT(lastMsg);
        }

        if (ragContext) {
          const sysIdx = params.messages.findIndex((m: any) => m.role === 'system');
          const docBlock = `Project context:\n${ragContext}`;
          if (sysIdx === -1) {
            params.messages.unshift({ role: 'system', content: docBlock } as any);
          } else {
            params.messages[sysIdx].content = String(params.messages[sysIdx].content || '') + `\n\n${docBlock}`;
          }
        }
      }
    }

    // Identity anchoring: ensure the system identity prompt is the first system message
    try {
      const identity = getIdentity();
      const sys = identity?.system_identity?.system_prompt;
      if (sys) {
        params.messages = Array.isArray(params.messages) ? params.messages : [];
        const first = params.messages[0];
        const needsInsert = !(first && first.role === 'system' && String(first.content || '').includes('ZombieCoder'));
        if (needsInsert) {
          params.messages.unshift({ role: 'system', content: sys } as any);
        }
      }
    } catch (e) {
      // do not fail the request if identity anchoring has an issue
      console.warn('identity anchor failed:', (e as any)?.message || e);
    }

    const groq = getService();
    if (!groq) throw new Error('GroqService not initialized');

    // Persist conversation memory (best-effort).
    const convoId = stateDb ? resolveConversationId(conversation_id) : (conversation_id ? String(conversation_id) : null);
    if (stateDb && convoId) {
      ensureConversation(stateDb, {
        conversation_id: convoId,
        workspace_id: workspace_id ? String(workspace_id) : undefined,
        user_id: user_id ? String(user_id) : undefined,
      });
      const lastUser = messages[messages.length - 1];
      if (lastUser?.role && typeof lastUser?.content === 'string') {
        addConversationMessage(stateDb, { conversation_id: convoId, role: String(lastUser.role), content: String(lastUser.content) });
      }
    }

    const isStream = params.stream === true;
    if (isStream) {
      const stream = await groq.createChatCompletion(params);
      res.setHeader('X-Conversation-Id', convoId || '');
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      let aborted = false;
      req.on('close', () => { aborted = true; });

      for await (const chunk of stream as any) {
        if (aborted) break;
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      if (!aborted) {
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }

    const completion: any = await groq.createChatCompletion(params);
    if (Array.isArray(completion?.choices)) {
      for (const c of completion.choices) {
        const content = c?.message?.content;
        if (typeof content === 'string') c.message.content = stripThinkBlocks(content);
      }
    }

    if (stateDb && convoId) {
      const assistant = completion?.choices?.[0]?.message?.content;
      if (typeof assistant === 'string' && assistant.trim()) {
        addConversationMessage(stateDb, { conversation_id: convoId, role: 'assistant', content: assistant });
      }
    }

    return res.json({
      ...completion,
      conversation_id: convoId,
    });
  } catch (err: any) {
    console.error('❌ Agent error:', err.stack || err.message);
    res.status(err.status || 500).json({
      error: { message: err.message || 'Agent processing failed', type: 'server_error' },
    });
  }
};

export const handleCreateConversation = async (req: Request, res: Response) => {
  try {
    const { workspace_id, user_id, title, conversation_id } = req.body || {};
    if (!stateDb) {
      return res.status(500).json({ error: { message: 'state db not initialized', type: 'server_error' } });
    }

    const convoId = resolveConversationId(conversation_id);
    ensureConversation(stateDb, {
      conversation_id: convoId,
      workspace_id: workspace_id ? String(workspace_id) : undefined,
      user_id: user_id ? String(user_id) : undefined,
      title: title ? String(title) : undefined,
    });

    return res.status(201).json({ conversation_id: convoId });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to create conversation', type: 'server_error' } });
  }
};

export const handleGetConversationHistory = async (req: Request, res: Response) => {
  try {
    const { conversation_id } = req.params;
    if (!stateDb || !conversation_id) {
      return res.status(400).json({ error: { message: 'conversation_id is required', type: 'invalid_request_error' } });
    }

    const convo = stateDb.prepare(`
      SELECT conversation_id, workspace_id, user_id, title, created_at, updated_at
      FROM conversations
      WHERE conversation_id = ?
      LIMIT 1
    `).get(String(conversation_id));

    if (!convo) {
      return res.status(404).json({ error: { message: 'conversation not found', type: 'not_found' } });
    }

    const messages = stateDb.prepare(`
      SELECT id, conversation_id, role, content, created_at
      FROM conversation_messages
      WHERE conversation_id = ?
      ORDER BY id ASC
    `).all(String(conversation_id));

    return res.json({ conversation: convo, messages });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to fetch conversation', type: 'server_error' } });
  }
};

export const handleListConversations = async (req: Request, res: Response) => {
  try {
    if (!stateDb) {
      return res.status(500).json({ error: { message: 'state db not initialized', type: 'server_error' } });
    }
    const { workspace_id, limit } = req.query;
    const rows = workspace_id
      ? stateDb.prepare(`
          SELECT conversation_id, workspace_id, user_id, title, created_at, updated_at
          FROM conversations
          WHERE workspace_id = ?
          ORDER BY updated_at DESC
          LIMIT ?
        `).all(String(workspace_id), Math.max(1, Number(limit) || 50))
      : stateDb.prepare(`
          SELECT conversation_id, workspace_id, user_id, title, created_at, updated_at
          FROM conversations
          ORDER BY updated_at DESC
          LIMIT ?
        `).all(Math.max(1, Number(limit) || 50));

    return res.json({ conversations: rows });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to list conversations', type: 'server_error' } });
  }
};

export const handleIndexWorkspace = async (req: Request, res: Response) => {
  try {
    const { directory, workspace_id } = req.body || {};
    if (!directory) {
      return res.status(400).json({ error: { message: 'directory is required', type: 'invalid_request_error' } });
    }
    if (!vectorIndexService) {
      return res.status(500).json({ error: { message: 'vector index not initialized', type: 'server_error' } });
    }

    const result = await vectorIndexService.indexDirectory(path.resolve(String(directory)), {
      workspaceId: workspace_id ? String(workspace_id) : undefined,
    });

    return res.json({ ok: true, result, stats: vectorIndexService.getStats() });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to index workspace', type: 'server_error' } });
  }
};

export const handleSearchWorkspace = async (req: Request, res: Response) => {
  try {
    const { query, workspace_id, limit } = req.body || {};
    if (!query) {
      return res.status(400).json({ error: { message: 'query is required', type: 'invalid_request_error' } });
    }
    if (!vectorIndexService) {
      return res.status(500).json({ error: { message: 'vector index not initialized', type: 'server_error' } });
    }

    const result = await vectorIndexService.search(String(query), {
      workspaceId: workspace_id ? String(workspace_id) : undefined,
      limit: Number(limit) || 5,
    });

    return res.json({ ok: true, result, stats: vectorIndexService.getStats() });
  } catch (err: any) {
    return res.status(500).json({ error: { message: err.message || 'failed to search workspace', type: 'server_error' } });
  }
};

export const handleSetDirectory = async (req: Request, res: Response) => {
  try {
    const { directory, user_id, workspace_id } = req.body;
    if (!directory) {
      return res.status(400).json({ error: { message: 'directory is required', type: 'invalid_request_error' } });
    }
    const resolvedDir = path.resolve(String(directory));

    // Auto-trust any directory (global agent mode)
    if (stateDb && fs.existsSync(resolvedDir)) {
      const wsId = workspace_id || 'global:' + crypto.createHash('sha256').update(resolvedDir).digest('hex').slice(0, 16);
      const uid = user_id || 'auto';
      try {
        const existing = stateDb.prepare('SELECT trusted FROM workspaces WHERE workspace_id = ? AND user_id = ? AND directory = ?').get(wsId, uid, resolvedDir) as any;
        if (!existing || !existing.trusted) {
          upsertWorkspaceTrust(stateDb, {
            workspace_id: wsId,
            user_id: uid,
            directory: resolvedDir,
            trusted: true,
          });
          console.log(`[Agent] Auto-trusted directory: ${resolvedDir}`);
        }
      } catch (e: any) {
        console.warn('auto-trust failed:', e?.message || e);
      }
    }

    const trusted = true; // Always trust in global mode
    const result = await ragService.setWorkingDirectory(directory, { autoInit: trusted });

    if (result.needsPermission) {
      return res.json({
        requiresPermission: true,
        message: ragService.requestPermissionMessage('scan'),
        directory: resolvedDir,
        zombieDirExists: ragService.zombieDirExists(),
      });
    }

    // Auto-generate SSOT if it doesn't exist
    if (!ragService.ssotExists()) {
      try {
        const scan = await ragService.scanProject();
        const template = ragService.generateSSOTTemplate(scan);
        ragService.saveSSOT(template);
        console.log(`[Agent] Auto-generated SSOT for: ${resolvedDir}`);
      } catch (e: any) {
        console.warn('auto SSOT generation failed:', e?.message || e);
      }
    }

    // Start (or reuse) a watcher for auto SSOT refresh
    try {
      const wsId = workspace_id || 'global:' + crypto.createHash('sha256').update(resolvedDir).digest('hex').slice(0, 16);
      const key = `${wsId}:${resolvedDir}`;
      if (!workspaceWatchers.has(key)) {
        workspaceWatchers.set(key, startWorkspaceWatcher({
          directory: resolvedDir,
          rag: ragService,
          index: vectorIndexService,
          workspaceId: wsId,
        }));
      }
    } catch (e: any) {
      console.warn('watcher start failed:', e?.message || e);
    }

    return res.json({
      ok: true,
      directory: resolvedDir,
      ssotExists: ragService.ssotExists(),
      message: 'Directory ready. Agent can work.',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, type: 'server_error' } });
  }
};

export const handleGrantPermission = async (req: Request, res: Response) => {
  try {
    const { grant, scope, user_id, workspace_id, directory } = req.body;
    if (!grant) {
      return res.json({ ok: false, message: 'Permission not granted.' });
    }
    ragService.grantPermission(scope || 'scan');

    // If the caller provides user/workspace context, mark the workspace as trusted for this directory.
    try {
      if (stateDb && user_id && workspace_id && directory) {
        upsertWorkspaceTrust(stateDb, {
          workspace_id: String(workspace_id),
          user_id: String(user_id),
          directory: path.resolve(String(directory)),
          trusted: true,
        });
      }
    } catch (e: any) {
      console.warn('workspace trust update failed:', e?.message || e);
    }

    if (scope === 'scan' && !ragService.ssotExists()) {
      const scanResult = await ragService.scanProject();
      const template = ragService.generateSSOTTemplate(scanResult);
      ragService.saveSSOT(template);

      return res.json({
        ok: true,
        message: 'Permission granted. Project scanned. SSOT.md created.',
        ssotPath: path.join(ragService.currentDir, '.zombiecoder', 'SSOT.md'),
        fileCount: scanResult.files.length,
      });
    }

    res.json({ ok: true, message: `Permission granted for: ${scope}` });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, type: 'server_error' } });
  }
};

export const handleProjectStatus = async (req: Request, res: Response) => {
  try {
    res.json({
      hasWorkingDir: ragService.hasWorkingDir,
      workingDir: ragService.currentDir || null,
      zombieDirExists: ragService.zombieDirExists(),
      ssotExists: ragService.ssotExists(),
      hasScanPermission: ragService.hasPermission('scan'),
      hasWritePermission: ragService.hasPermission('write'),
      persona: agentService?.getPersonaName() || 'none',
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, type: 'server_error' } });
  }
};

export const handleRescan = async (req: Request, res: Response) => {
  try {
    if (!ragService.hasPermission('scan')) {
      return res.status(403).json({ error: { message: 'No scan permission. Grant permission first.', type: 'permission_error' } });
    }
    const scanResult = await ragService.scanProject();
    const template = ragService.generateSSOTTemplate(scanResult);
    ragService.saveSSOT(template);
    if (vectorIndexService) {
      try {
        const workspaceRow = stateDb && ragService.currentDir
          ? stateDb.prepare(`
              SELECT workspace_id
              FROM workspaces
              WHERE directory = ?
              ORDER BY updated_at DESC
              LIMIT 1
            `).get(path.resolve(ragService.currentDir))
          : null;
        await vectorIndexService.indexDirectory(ragService.currentDir || process.cwd(), {
          workspaceId: workspaceRow?.workspace_id ? String(workspaceRow.workspace_id) : undefined,
        });
      } catch (e: any) {
        console.warn('rescan index failed:', e?.message || e);
      }
    }
    res.json({ ok: true, message: 'Project rescanned and SSOT.md updated.', fileCount: scanResult.files.length });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, type: 'server_error' } });
  }
};

export const handleReadSSOT = async (req: Request, res: Response) => {
  try {
    const content = ragService.readSSOT();
    if (!content) {
      return res.status(404).json({ error: { message: 'SSOT.md not found. Scan project first.', type: 'not_found' } });
    }
    res.set('Content-Type', 'text/markdown');
    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message, type: 'server_error' } });
  }
};

export const handleAgentRoutes = async (req: Request, res: Response) => {
  const routes = mawlanaRouter?.getAllRoutes() || {};
  res.json({ routes, persona: agentService?.getPersonaName() || 'ZombieCoder' });
};
