# YouTube Shorts Auto-Next

Automatically advances to the next YouTube Short when the current one ends. Say goodbye to manual scrolling!

## Features

- ✅ **Automatic Advancement** - Moves to the next Short when the current one finishes
- ✅ **Smart Detection** - Uses multiple methods to detect video end
- ✅ **Reliable Navigation** - Tries multiple techniques (button click, scroll, keyboard) to ensure advancement
- ✅ **Lightweight** - Minimal performance impact
- ✅ **No Configuration** - Works immediately after installation

## Installation

### From Firefox Add-ons Store
1. Visit the [Firefox Add-ons page](#) (link coming soon)
2. Click "Add to Firefox"
3. Confirm the installation

### Manual Installation (Development)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this extension's folder

## How It Works

The extension monitors YouTube Shorts videos and automatically advances to the next one when:
- The video reaches the end (within 0.18 seconds of completion)
- The video's "ended" event fires

It uses multiple fallback methods to ensure reliable navigation:
1. Click the "Next" button if available
2. Scroll to the next video element
3. Simulate wheel scroll events
4. Simulate arrow down keypress

## Privacy

This extension:
- ✅ Only runs on youtube.com
- ✅ Does not collect any data
- ✅ Does not make external network requests
- ✅ Does not track your viewing history
- ✅ All processing happens locally in your browser

## Permissions

- `storage` - For potential future settings/preferences
- `*://www.youtube.com/*` - Required to run on YouTube pages

## Compatibility

- Firefox 109.0 or higher
- Works on desktop YouTube Shorts

## Known Limitations

- Only works on desktop browsers
- Requires JavaScript to be enabled
- May not work with certain browser extensions that modify YouTube

## Support

Found a bug or have a suggestion? Please [open an issue](https://github.com/Ropaxyz/FFyoutube-shorts-auto-next/issues).

## License

MIT License - feel free to modify and distribute

## Changelog

### Version 1.0.0 (Initial Release)
- Automatic advancement to next Short
- Multiple fallback navigation methods
- Smart video end detection
- Firefox support