(() => {
  const DEBUG = true; // Enable for troubleshooting, set to false for production
  const COOLDOWN_MS = 1000;
  const END_THRESHOLD = 0.3; // Seconds before end to trigger advance
  const POLL_MS = 100; // Faster polling for better detection
  const LOOP_CHECK_MS = 50; // How often to disable loop
  const MAX_ADVANCE_ATTEMPTS = 5;

  const log = (...a) => DEBUG && console.log("[ShortsAutoNext]", ...a);
  const warn = (...a) => DEBUG && console.warn("[ShortsAutoNext]", ...a);

  let state = {
    lastAdvanceTime: 0,
    lastUrl: location.href,
    currentVideo: null,
    currentShortId: "",
    advanceAttempts: 0,
    hasTriggeredEnd: false,
    loopDisableInterval: null,
    videoEndedHandler: null
  };

  // ===== UTILITY FUNCTIONS =====
  
  const now = () => Date.now();
  
  const canAdvance = () => {
    const elapsed = now() - state.lastAdvanceTime;
    return elapsed > COOLDOWN_MS;
  };

  const getShortId = () => {
    // Primary: Get from URL
    const urlMatch = location.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
    if (urlMatch) return urlMatch[1];
    
    // Fallback: Get from active renderer
    const renderer = getActiveRenderer();
    if (renderer) {
      const videoId = renderer.getAttribute('video-id');
      if (videoId) return videoId;
    }
    
    return null;
  };

  // ===== DOM QUERY FUNCTIONS =====

  const getActiveRenderer = () => {
    // Try multiple selectors - YouTube changes these frequently
    const selectors = [
      'ytd-reel-video-renderer[is-active]',
      'ytd-reel-video-renderer[aria-hidden="false"]',
      'ytd-reel-video-renderer:not([aria-hidden="true"])',
      'ytd-shorts-player-container ytd-reel-video-renderer',
      '#shorts-player ytd-reel-video-renderer'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    
    // Last resort: find the one with a playing video
    const renderers = document.querySelectorAll('ytd-reel-video-renderer');
    for (const renderer of renderers) {
      const video = renderer.querySelector('video');
      if (video && !video.paused && video.readyState >= 2) {
        return renderer;
      }
    }
    
    return null;
  };

  const getActiveVideo = () => {
    const renderer = getActiveRenderer();
    if (renderer) {
      const video = renderer.querySelector('video');
      if (video && video.readyState >= 2) return video;
    }
    
    // Fallback selectors
    const fallbackSelectors = [
      'ytd-shorts video',
      '#shorts-player video',
      'ytd-reel-video-renderer video',
      '#player video'
    ];
    
    for (const selector of fallbackSelectors) {
      const video = document.querySelector(selector);
      if (video && video.readyState >= 2) return video;
    }
    
    return null;
  };

  const getNextButton = () => {
    // YouTube uses various aria-labels depending on locale
    const selectors = [
      'button[aria-label="Next video"]',
      'button[aria-label="Next"]',
      'button[title="Next video"]',
      'button[title="Next"]',
      '#navigation-button-down button',
      'ytd-shorts [id*="navigation"] button:last-child',
      '[class*="navigation"] button[aria-label*="ext"]', // Catches "Next" in various forms
      'ytd-reel-player-overlay-renderer button[aria-label*="Next"]'
    ];
    
    for (const selector of selectors) {
      const btn = document.querySelector(selector);
      if (btn && btn.offsetParent !== null) { // Check if visible
        return btn;
      }
    }
    
    // Try to find by icon/position (down arrow button)
    const navButtons = document.querySelectorAll('ytd-shorts button, #shorts-container button');
    for (const btn of navButtons) {
      const svg = btn.querySelector('svg');
      if (svg && btn.offsetParent !== null) {
        // Check if it's positioned as a "next" button (usually has down arrow or is second button)
        const rect = btn.getBoundingClientRect();
        if (rect.bottom > window.innerHeight / 2) {
          return btn;
        }
      }
    }
    
    return null;
  };

  // ===== VIDEO STATE DETECTION =====

  const isVideoNearEnd = (video) => {
    if (!video) return false;
    if (!isFinite(video.duration) || video.duration <= 0) return false;
    if (!isFinite(video.currentTime)) return false;
    
    const remaining = video.duration - video.currentTime;
    return remaining <= END_THRESHOLD && remaining >= 0;
  };

  const isVideoEnded = (video) => {
    if (!video) return false;
    return video.ended || (isFinite(video.duration) && video.currentTime >= video.duration);
  };

  // ===== LOOP PREVENTION =====

  const disableVideoLoop = (video) => {
    if (!video) return;
    
    try {
      // Disable loop attribute
      if (video.loop) {
        video.loop = false;
        log("Disabled video.loop");
      }
      
      // Also try to remove loop attribute entirely
      video.removeAttribute('loop');
      
      // YouTube sometimes uses a custom property
      if (video._loop !== undefined) {
        video._loop = false;
      }
    } catch (e) {
      warn("Error disabling loop:", e);
    }
  };

  const startLoopPrevention = (video) => {
    if (state.loopDisableInterval) {
      clearInterval(state.loopDisableInterval);
    }
    
    // Continuously disable loop as YouTube may re-enable it
    state.loopDisableInterval = setInterval(() => {
      disableVideoLoop(video);
    }, LOOP_CHECK_MS);
  };

  const stopLoopPrevention = () => {
    if (state.loopDisableInterval) {
      clearInterval(state.loopDisableInterval);
      state.loopDisableInterval = null;
    }
  };

  // ===== NAVIGATION METHODS =====

  const advanceViaButton = () => {
    const btn = getNextButton();
    if (btn) {
      log("Advancing via Next button click");
      btn.click();
      return true;
    }
    return false;
  };

  const advanceViaScroll = () => {
    const renderer = getActiveRenderer();
    if (!renderer) return false;
    
    const next = renderer.nextElementSibling;
    if (next && next.tagName === 'YTD-REEL-VIDEO-RENDERER') {
      log("Advancing via scrollIntoView");
      next.scrollIntoView({ behavior: 'instant', block: 'center' });
      
      // Try to activate the next video
      setTimeout(() => {
        const nextVideo = next.querySelector('video');
        if (nextVideo) {
          nextVideo.play().catch(() => {});
        }
      }, 50);
      return true;
    }
    return false;
  };

  const advanceViaKeyboard = () => {
    log("Advancing via keyboard (ArrowDown)");
    
    // Focus the document first
    document.body?.focus();
    
    const keyEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      which: 40,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    // Dispatch to multiple targets
    document.dispatchEvent(keyEvent);
    document.body?.dispatchEvent(keyEvent);
    
    // Also try the shorts container
    const container = document.querySelector('ytd-shorts, #shorts-container');
    if (container) {
      container.dispatchEvent(keyEvent);
    }
    
    return true;
  };

  const advanceViaWheel = () => {
    log("Advancing via wheel event");
    
    const container = document.querySelector('ytd-shorts, #shorts-container, #shorts-player');
    const target = container || document.body;
    
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 300,
      deltaMode: 0,
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    target.dispatchEvent(wheelEvent);
    
    // Also try native scroll
    window.scrollBy({ top: window.innerHeight, behavior: 'instant' });
    
    return true;
  };

  const advanceViaTouch = () => {
    log("Advancing via touch simulation");
    
    const container = document.querySelector('ytd-shorts, #shorts-container');
    if (!container) return false;
    
    const rect = container.getBoundingClientRect();
    const startY = rect.top + rect.height * 0.7;
    const endY = rect.top + rect.height * 0.3;
    const x = rect.left + rect.width / 2;
    
    // Simulate swipe up
    const touchStart = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [new Touch({ identifier: 0, target: container, clientX: x, clientY: startY })]
    });
    
    const touchEnd = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [new Touch({ identifier: 0, target: container, clientX: x, clientY: endY })]
    });
    
    container.dispatchEvent(touchStart);
    setTimeout(() => container.dispatchEvent(touchEnd), 50);
    
    return true;
  };

  // ===== MAIN ADVANCE LOGIC =====

  const advanceToNext = () => {
    if (!canAdvance()) {
      log("Advance blocked by cooldown");
      return;
    }
    
    const currentId = getShortId();
    
    // Reset attempts if we've moved to a new short
    if (currentId !== state.currentShortId) {
      state.advanceAttempts = 0;
    }
    
    if (state.advanceAttempts >= MAX_ADVANCE_ATTEMPTS) {
      warn("Max advance attempts reached, waiting for manual navigation");
      return;
    }
    
    state.advanceAttempts++;
    state.lastAdvanceTime = now();
    
    log(`Attempting advance (attempt ${state.advanceAttempts}/${MAX_ADVANCE_ATTEMPTS}) from short: ${currentId}`);
    
    // Try methods in order of reliability
    const methods = [
      { name: 'button', fn: advanceViaButton, delay: 0 },
      { name: 'keyboard', fn: advanceViaKeyboard, delay: 200 },
      { name: 'scroll', fn: advanceViaScroll, delay: 400 },
      { name: 'wheel', fn: advanceViaWheel, delay: 600 }
    ];
    
    // Execute first method immediately
    if (advanceViaButton()) {
      log("Button click succeeded");
      scheduleAdvanceVerification(currentId, 300);
      return;
    }
    
    // Try remaining methods with delays
    let methodIndex = 1;
    const tryNextMethod = () => {
      if (methodIndex >= methods.length) return;
      if (getShortId() !== currentId) {
        log("Navigation detected, stopping advance attempts");
        return;
      }
      
      const method = methods[methodIndex];
      log(`Trying ${method.name} method...`);
      method.fn();
      methodIndex++;
      
      setTimeout(tryNextMethod, 200);
    };
    
    setTimeout(tryNextMethod, 150);
    scheduleAdvanceVerification(currentId, 800);
  };

  const scheduleAdvanceVerification = (originalId, delay) => {
    setTimeout(() => {
      const newId = getShortId();
      if (newId === originalId && state.advanceAttempts < MAX_ADVANCE_ATTEMPTS) {
        log("Advance verification: still on same short, retrying...");
        advanceToNext();
      } else if (newId !== originalId) {
        log("Advance verification: successfully moved to new short");
        state.advanceAttempts = 0;
      }
    }, delay);
  };

  // ===== VIDEO MONITORING =====

  const attachVideoListeners = (video) => {
    if (!video || video === state.currentVideo) return;
    
    // Clean up previous video
    if (state.currentVideo && state.videoEndedHandler) {
      state.currentVideo.removeEventListener('ended', state.videoEndedHandler);
    }
    
    state.currentVideo = video;
    state.hasTriggeredEnd = false;
    
    // Disable loop immediately
    disableVideoLoop(video);
    startLoopPrevention(video);
    
    // Create ended handler
    state.videoEndedHandler = () => {
      log("Video 'ended' event fired");
      if (!state.hasTriggeredEnd) {
        state.hasTriggeredEnd = true;
        advanceToNext();
      }
    };
    
    video.addEventListener('ended', state.videoEndedHandler);
    
    // Also listen for timeupdate to catch near-end
    const timeUpdateHandler = () => {
      if (!state.hasTriggeredEnd && isVideoNearEnd(video) && !video.paused) {
        log(`Video near end: ${video.currentTime.toFixed(2)}/${video.duration.toFixed(2)}`);
        state.hasTriggeredEnd = true;
        
        // Small delay to ensure we're really at the end
        setTimeout(() => {
          if (isVideoNearEnd(video) || isVideoEnded(video)) {
            advanceToNext();
          }
        }, 100);
      }
    };
    
    video.addEventListener('timeupdate', timeUpdateHandler);
    
    log(`Attached listeners to video (duration: ${video.duration?.toFixed(2) || 'unknown'}s)`);
  };

  // ===== URL CHANGE DETECTION =====

  const handleUrlChange = () => {
    const newUrl = location.href;
    if (newUrl === state.lastUrl) return;
    
    state.lastUrl = newUrl;
    const newId = getShortId();
    
    if (newId && newId !== state.currentShortId) {
      log(`Short changed: ${state.currentShortId} -> ${newId}`);
      state.currentShortId = newId;
      state.hasTriggeredEnd = false;
      state.advanceAttempts = 0;
      state.currentVideo = null;
      stopLoopPrevention();
    }
  };

  // ===== MAIN TICK FUNCTION =====

  const tick = () => {
    // Check for URL changes (SPA navigation)
    handleUrlChange();
    
    // Only run on shorts pages
    if (!location.pathname.startsWith('/shorts/')) return;
    
    const video = getActiveVideo();
    if (!video) return;
    
    // Attach listeners if this is a new video
    attachVideoListeners(video);
    
    // Continuously disable loop
    disableVideoLoop(video);
    
    // Check for end condition (backup for when events don't fire)
    if (!state.hasTriggeredEnd && !video.paused) {
      if (isVideoEnded(video)) {
        log("Detected video ended via tick check");
        state.hasTriggeredEnd = true;
        advanceToNext();
      } else if (isVideoNearEnd(video)) {
        log("Detected video near end via tick check");
        state.hasTriggeredEnd = true;
        setTimeout(() => advanceToNext(), 150);
      }
    }
  };

  // ===== INITIALISATION =====

  const init = () => {
    log("Initialising YouTube Shorts Auto-Next...");
    
    // Listen for YouTube's SPA navigation events
    window.addEventListener('yt-navigate-finish', () => {
      log("yt-navigate-finish event");
      handleUrlChange();
      // Reset state for new page
      state.hasTriggeredEnd = false;
      state.currentVideo = null;
    });
    
    window.addEventListener('popstate', () => {
      log("popstate event");
      handleUrlChange();
    });
    
    // MutationObserver for DOM changes
    const observer = new MutationObserver(() => {
      tick();
    });
    
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Regular polling as backup
    setInterval(tick, POLL_MS);
    
    // Initial state
    state.currentShortId = getShortId();
    log(`Loaded. Current short: ${state.currentShortId}`);
    
    // Run initial tick
    tick();
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
