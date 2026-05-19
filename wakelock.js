// wakelock.js — keep the screen awake during a gym session

let wakeLock = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) {
    // Silently ignore — some browsers / contexts don't allow it
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

// Re-acquire on visibility change (iOS releases on background)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.__wantWakeLock) {
    requestWakeLock();
  }
});

window.requestWakeLock = () => { window.__wantWakeLock = true; requestWakeLock(); };
window.releaseWakeLock = () => { window.__wantWakeLock = false; releaseWakeLock(); };
