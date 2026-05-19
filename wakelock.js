// wakelock.js — keep the screen awake during a gym session
// Wrapped in an IIFE so the inner helpers don't collide with the
// `window.requestWakeLock` / `window.releaseWakeLock` we export at the end
// (otherwise the public wrapper would recursively call itself → stack overflow).
(() => {
  let wakeLock = null;

  async function acquire() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      }
    } catch (e) {
      // Silently ignore — some browsers / contexts don't allow it
    }
  }

  function release() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }

  // Re-acquire on visibility change (iOS releases on background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.__wantWakeLock) {
      acquire();
    }
  });

  window.requestWakeLock = () => { window.__wantWakeLock = true; acquire(); };
  window.releaseWakeLock = () => { window.__wantWakeLock = false; release(); };
})();
