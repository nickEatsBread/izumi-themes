// Injected into every preview page before the client boots. It stands in for the Tauri runtime
// so the real SvelteKit client renders in headless Chromium: native HTTP commands are answered
// with `fetch` (which Playwright routes to the fixture server), events and windows are inert, and
// every other command resolves to a harmless default.
export function tauriShim({ platform }) {
  return `(() => {
    const platform = ${JSON.stringify(platform)};
    let callbackId = 0;
    const callbacks = new Map();
    async function httpCommand(args, method) {
      const headers = Object.assign({}, args.headers || {});
      const init = { method, headers };
      if (method === 'POST') init.body = args.body ?? '';
      const response = await fetch(args.url, init);
      const responseHeaders = {};
      response.headers.forEach((value, key) => { responseHeaders[key] = value; });
      const body = await response.text();
      return { status: response.status, headers: responseHeaders, body, bodyBase64: '' };
    }
    const defaults = {
      'plugin:os|platform': platform,
      'plugin:os|type': platform === 'android' ? 'android' : 'linux',
      'plugin:os|arch': 'x86_64',
      'plugin:os|locale': 'en-US',
      'plugin:os|version': '1.0',
      'plugin:event|listen': () => ++callbackId,
      'plugin:event|unlisten': null,
      'plugin:event|emit': null,
      'plugin:event|emit_to': null,
      'player_is_game_mode': false,
      'player_compositor_path': 'desktop-live',
      'prepare_player': false,
      'take_pending_magnet': null,
      'list_downloads': [],
      'plugin:window|is_maximized': false,
      'plugin:window|is_fullscreen': false,
      'plugin:window|inner_size': { width: 1280, height: 800 },
      'plugin:window|outer_size': { width: 1280, height: 800 },
      'plugin:window|scale_factor': 1,
      'plugin:window|theme': 'dark',
      'plugin:app|version': '0.0.0-preview',
      'plugin:app|name': 'izumi',
    };
    window.__TAURI_INTERNALS__ = {
      metadata: {
        currentWindow: { label: 'main' },
        currentWebview: { label: 'main', windowLabel: 'main' },
        windows: [{ label: 'main' }],
        webviews: [{ label: 'main', windowLabel: 'main' }],
      },
      plugins: {},
      convertFileSrc: (path) => path,
      transformCallback(callback) {
        const id = ++callbackId;
        callbacks.set(id, callback);
        return id;
      },
      unregisterCallback(id) { callbacks.delete(id); },
      async invoke(command, args = {}) {
        if (command === 'http_post') return httpCommand(args, 'POST');
        if (command === 'http_get') return httpCommand(args, 'GET');
        if (command === 'ext_fetch') return httpCommand(args, args.method || 'GET');
        if (command in defaults) {
          const value = defaults[command];
          return typeof value === 'function' ? value(args) : value;
        }
        return null;
      },
    };
    window.__IZUMI_PREVIEW__ = true;
  })();`
}

/** Seed the persisted client settings a preview needs: setup finished, the theme applied. */
export function storageSeed(entries) {
  return `(() => {
    const entries = ${JSON.stringify(entries)};
    for (const [key, value] of Object.entries(entries)) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  })();`
}
