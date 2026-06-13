import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ID_PATH = path.resolve(__dirname, '../../identity.json');

let _identity: any = null;
let _hash: string | null = null;
let _lastModified: number = 0;

/**
 * Load identity.json with file change detection.
 * Uses file mtime to detect changes and reload automatically.
 */
export function loadIdentity(forceReload = false): any {
    try {
        const stat = fs.statSync(ID_PATH);
        const currentMtime = stat.mtimeMs;

        // Return cached if file hasn't changed (unless force reload)
        if (_identity && !forceReload && currentMtime === _lastModified) {
            return _identity;
        }

        const raw = fs.readFileSync(ID_PATH, 'utf8');
        _identity = JSON.parse(raw);
        _hash = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
        _lastModified = currentMtime;

        // Note: chmod removed — it was making the file permanently read-only
        // which prevented updates. Use file permissions at OS level if needed.

        return _identity;
    } catch (err: any) {
        console.error('identityService: failed to load identity.json:', err?.message || err);
        _identity = null;
        _hash = null;
        _lastModified = 0;
        return null;
    }
}

/**
 * Get identity with automatic cache refresh.
 * Checks file mtime on each call to detect changes.
 */
export function getIdentity(): any {
    try {
        const stat = fs.statSync(ID_PATH);
        const currentMtime = stat.mtimeMs;

        // Reload if file changed since last load
        if (!_identity || currentMtime !== _lastModified) {
            return loadIdentity(true);
        }
        return _identity;
    } catch {
        return _identity;
    }
}

export function getIdentityHash(): string | null {
    if (!_hash) loadIdentity();
    return _hash;
}

/**
 * Force reload identity from disk.
 * Call this after updating identity.json.
 */
export function reloadIdentity(): any {
    return loadIdentity(true);
}

export default {
    loadIdentity,
    getIdentity,
    getIdentityHash,
    reloadIdentity,
};
