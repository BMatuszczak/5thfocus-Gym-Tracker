// Cloud sync via GitHub Gist API
// Requires a personal access token with 'gist' scope only.

const SYNC_CONFIG_KEY = 'gymtracker_sync';

const syncConfig = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)) || {};
  } catch { return {}; }
};

const saveConfig = (cfg) => {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
};

const headers = (token) => ({
  'Authorization': `token ${token}`,
  'Accept': 'application/vnd.github+json',
  'Content-Type': 'application/json',
});

const Sync = {
  config() { return syncConfig(); },

  saveToken(token) {
    const cfg = syncConfig();
    cfg.token = token;
    saveConfig(cfg);
  },

  saveGistId(id) {
    const cfg = syncConfig();
    cfg.gistId = id;
    saveConfig(cfg);
  },

  clear() {
    localStorage.removeItem(SYNC_CONFIG_KEY);
  },

  async push(data) {
    const cfg = syncConfig();
    if (!cfg.token) throw new Error('No GitHub token set');
    const body = {
      files: { 'gymtracker_v1.json': { content: JSON.stringify(data, null, 2) } },
    };
    if (cfg.gistId) {
      const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
        method: 'PATCH', headers: headers(cfg.token),
        body: JSON.stringify({ ...body, description: 'Gym Tracker backup' }),
      });
      if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
      return res.json();
    } else {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST', headers: headers(cfg.token),
        body: JSON.stringify({
          description: 'Gym Tracker backup',
          public: false,
          ...body,
        }),
      });
      if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
      const gist = await res.json();
      cfg.gistId = gist.id;
      saveConfig(cfg);
      return gist;
    }
  },

  async pull() {
    const cfg = syncConfig();
    if (!cfg.token || !cfg.gistId) throw new Error('Sync not configured');
    const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
      headers: headers(cfg.token),
    });
    if (!res.ok) throw new Error(`GitHub API: ${res.status} ${res.statusText}`);
    const gist = await res.json();
    const file = gist.files?.['gymtracker_v1.json'];
    if (!file?.content) throw new Error('No backup found in gist');
    return JSON.parse(file.content);
  },

  async status() {
    const cfg = syncConfig();
    if (!cfg.token || !cfg.gistId) return { connected: false };
    try {
      const res = await fetch(`https://api.github.com/gists/${cfg.gistId}`, {
        headers: headers(cfg.token),
      });
      if (!res.ok) return { connected: false };
      const gist = await res.json();
      const file = gist.files?.['gymtracker_v1.json'];
      return {
        connected: true,
        updatedAt: gist.updated_at,
        gistId: gist.id,
        gistUrl: gist.html_url,
        fileSize: file?.size || 0,
      };
    } catch { return { connected: false }; }
  },
};

window.Sync = Sync;
