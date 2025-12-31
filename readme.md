# YouTube Shorts Auto-Next

Automatically advances to the next YouTube Short when the current one ends. Say goodbye to manual scrolling!

## Features

- **Automatic Advancement** - Moves to the next Short when the current one finishes
- **Smart Detection** - Uses multiple methods to detect video end (events + polling)
- **Aggressive Loop Prevention** - Continuously disables YouTube's video loop
- **Reliable Navigation** - Multiple fallback methods (button, keyboard, scroll, wheel)
- **SPA-Aware** - Properly handles YouTube's single-page application navigation
- **Lightweight** - Minimal performance impact
-  **No Configuration** - Works immediately after installation

## Installation

### From Firefox Add-ons Store
1. Visit the [[Firefox Add-ons page](#) (link coming soon)](https://addons.mozilla.org/en-US/firefox/addon/youtube-shorts-auto-next/)
2. Click "Add to Firefox"
3. Confirm the installation

### Manual Installation (Development)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this extension's folder

## How It Works

The extension monitors YouTube Shorts videos and automatically advances to the next one when:
- The video reaches within 0.3 seconds of completion
- The video's "ended" event fires
- The video's `currentTime` equals its `duration`

### Loop Prevention
YouTube Shorts typically loop videos automatically. This extension aggressively disables looping by:
- Setting `video.loop = false` continuously
- Removing the `loop` attribute from video elements
- Checking and disabling loop every 50ms while a video plays

### Navigation Methods (in order of preference)
1. **Button Click** - Clicks the "Next" navigation button
2. **Keyboard** - Simulates ArrowDown keypress
3. **Scroll** - Uses `scrollIntoView` on the next video renderer
4. **Wheel** - Dispatches wheel events to trigger scroll navigation

## Privacy

This extension:
-  Only runs on youtube.com/shorts/*
- Does not collect any data
-  Does not make external network requests
-  Does not track your viewing history
-  All processing happens locally in your browser

## Permissions

- `*://www.youtube.com/*` - Required to run on YouTube pages and handle navigation

## Compatibility

- Firefox 109.0 or higher
- Works on desktop YouTube Shorts

## Debugging

If the extension isn't working:
1. Open the Browser Console (Ctrl+Shift+J / Cmd+Shift+J)
2. Look for messages prefixed with `[ShortsAutoNext]`
3. Debug mode is enabled by default in v1.1.0 - set `DEBUG = false` in content.js for production

## Known Limitations

- Only works on desktop browsers
- Requires JavaScript to be enabled
- May not work with certain browser extensions that heavily modify YouTube
- YouTube frequently changes their DOM structure, which may require updates

## Troubleshooting

**Extension doesn't advance:**
- Check the browser console for error messages
- Try refreshing the YouTube Shorts page
- Ensure no other extensions are conflicting

**Extension advances too early/late:**
- The `END_THRESHOLD` constant (default: 0.3 seconds) can be adjusted in content.js

## Support

Found a bug or have a suggestion? Please [open an issue](https://github.com/Ropaxyz/FFyoutube-shorts-auto-next/issues).

## License

MIT License - feel free to modify and distribute

## Changelog

### Version 1.1.0 (Reliability Update)
- **Improved loop prevention** - Continuously disables video loop every 50ms
- **Better video detection** - Multiple fallback selectors for YouTube's varying DOM
- **SPA navigation support** - Listens to `yt-navigate-finish` events
- **Faster polling** - Reduced from 250ms to 100ms for quicker end detection
- **Multiple navigation fallbacks** - Button → Keyboard → Scroll → Wheel
- **Advance verification** - Confirms navigation succeeded and retries if needed
- **Better state management** - Cleaner handling of video transitions
- **Debug logging** - Comprehensive console output for troubleshooting
- **Changed `run_at` to `document_start`** - Earlier injection for better reliability

### Version 1.0.0 (Initial Release)
- Automatic advancement to next Short
- Multiple fallback navigation methods
- Smart video end detection
- Firefox support

