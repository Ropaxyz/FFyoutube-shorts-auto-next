(() => {
  const DEBUG = false;
  const COOLDOWN_MS = 800;
  const END_EPS = 0.18;
  const POLL_MS = 250;
  const ADVANCE_TIMEOUT_MS = 2000;

  const log = (...a) => DEBUG && console.log("[ShortsAutoNext]", ...a);

  let lastAdvanceAt = 0;
  let lastUrl = location.href;
  let lastVideo = null;
  let lastShortKey = "";
  let advanceAttemptAt = 0;
  let hasLoggedEnd = false;

  function now() { return Date.now(); }
  function cooldownOK() { return now() - lastAdvanceAt > COOLDOWN_MS; }
  function markAdvanced() { lastAdvanceAt = now(); }

  function getShortKey() {
    const m = location.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (m && m[1]) return `shorts:${m[1]}`;
    
    const active = getActiveRenderer();
    if (active) {
      const videoId = active.getAttribute('video-id');
      if (videoId) return `shorts:${videoId}`;
    }
    
    return `url:${location.href}`;
  }

  function getActiveRenderer() {
    return (
      document.querySelector("ytd-reel-video-renderer[is-active]") ||
      document.querySelector("ytd-reel-video-renderer[aria-hidden='false']")
    );
  }

  function getActiveVideo() {
    const active = getActiveRenderer();
    const v =
      active?.querySelector("video") ||
      document.querySelector("ytd-reel-player-overlay-renderer video") ||
      document.querySelector("ytd-shorts video") ||
      document.querySelector("video");

    if (v && v.readyState >= 1) return v;
    return null;
  }

  function isAtEnd(v) {
    if (!v || !isFinite(v.duration) || v.duration <= 0) return false;
    if (!isFinite(v.currentTime)) return false;
    return (v.duration - v.currentTime) <= END_EPS;
  }

  function tryClickNext() {
    const btn =
      document.querySelector("button[aria-label='Next']") ||
      document.querySelector("button[title='Next']") ||
      document.querySelector("ytd-reel-player-overlay-renderer button[aria-label*='Next']");
    if (btn) { btn.click(); log("Advance: click Next"); return true; }
    return false;
  }

  function tryScrollNextRenderer() {
    const active = getActiveRenderer();
    if (!active) return false;

    const next = active.nextElementSibling;
    if (next && next.scrollIntoView) {
      next.scrollIntoView({ behavior: "auto", block: "center" });
      setTimeout(() => {
        const nextVideo = next.querySelector("video");
        if (nextVideo) nextVideo.click();
      }, 100);
      log("Advance: scrollIntoView(next renderer)");
      return true;
    }
    return false;
  }

  function tryWheelScroll() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        document.dispatchEvent(new WheelEvent("wheel", { 
          deltaY: 1200, 
          bubbles: true, 
          cancelable: true 
        }));
      }, i * 50);
    }
    window.scrollBy({ top: window.innerHeight, behavior: "auto" });
    log("Advance: wheel/scrollBy fallback");
    return true;
  }

  function tryKeydown() {
    (document.body || document.documentElement)?.focus?.();
    const ev = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
      which: 40,
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
    log("Advance: ArrowDown fallback");
    return true;
  }

  function advanceToNext() {
    const key = getShortKey();
    const timeSinceAttempt = now() - advanceAttemptAt;
    const sameKeyAsLastAttempt = advanceAttemptAt > 0;
    
    if (sameKeyAsLastAttempt && timeSinceAttempt < ADVANCE_TIMEOUT_MS) {
      return;
    }

    if (!cooldownOK()) return;

    advanceAttemptAt = now();
    markAdvanced();

    log("Attempting advance from:", key);

    if (tryClickNext()) {
      log("→ Next button clicked, waiting for navigation...");
      return;
    }
    
    setTimeout(() => {
      if (getShortKey() === key) {
        if (tryScrollNextRenderer()) {
          setTimeout(() => {
            if (getShortKey() === key) {
              log("→ ScrollIntoView didn't work, trying wheel...");
              tryWheelScroll();
              setTimeout(() => {
                if (getShortKey() === key) {
                  log("→ Wheel didn't work, trying keydown...");
                  tryKeydown();
                }
              }, 150);
            }
          }, 150);
        }
      }
    }, 100);
  }

  function attachEnded(v) {
    if (!v || v === lastVideo) return;
    lastVideo = v;

    try { v.loop = false; } catch {}

    v.addEventListener("ended", () => {
      log("Ended event fired");
      advanceToNext();
    });

    log("Attached to video", v);
  }

  function tick() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const newKey = getShortKey();

      if (newKey !== lastShortKey) {
        lastShortKey = newKey;
        advanceAttemptAt = 0;
        lastVideo = null;
        hasLoggedEnd = false;
        log("Short changed:", lastShortKey);
      }
    }

    const v = getActiveVideo();
    if (!v) return;

    attachEnded(v);

    if (!v.paused && isAtEnd(v)) {
      if (!hasLoggedEnd) {
        log("Detected end by time", { t: v.currentTime.toFixed(2), d: v.duration.toFixed(2) });
        hasLoggedEnd = true;
      }
      advanceToNext();
    }
  }

  const obs = new MutationObserver(tick);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  setInterval(tick, POLL_MS);

  lastShortKey = getShortKey();
  log("Loaded. Current short:", lastShortKey);
})();