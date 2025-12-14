# YouTube Shorts Auto-Next

Automatically advances to the next YouTube Short when the current one ends. Enjoy uninterrupted Shorts viewing without manual scrolling.

---

## ✨ Features

- ✅ **Automatic Advancement**  
  Moves to the next YouTube Short as soon as the current video finishes.

- ✅ **Smart End Detection**  
  Uses both video `ended` events and time-based checks for reliability.

- ✅ **Multiple Fallback Methods**  
  Attempts navigation via button click, scrolling, wheel events, and keyboard input.

- ✅ **Zero Configuration**  
  Works immediately after installation. No settings required.

- ✅ **Lightweight & Local**  
  No performance overhead, no background services.

---

## 🖥️ Compatibility

- **Firefox Desktop only**
- Firefox **140.0 or newer**
- Designed specifically for **YouTube Shorts**

> Mobile browsers (including Firefox for Android) use a different interface and are not supported.

---

## 🔒 Privacy

This extension is privacy-first by design:

- ✔ Runs only on `https://www.youtube.com/shorts/*`
- ✔ No data collection
- ✔ No tracking or analytics
- ✔ No external network requests
- ✔ All logic runs locally in the browser

Declared data collection permissions: **none**

---

## 🧠 How It Works

The extension monitors the active YouTube Shorts video and automatically advances when:

- The video reaches the end (within a small tolerance), or
- The video’s native `ended` event fires

If the standard navigation fails, fallback techniques are used to ensure consistent advancement even when YouTube’s UI changes.

---

## 📦 Installation

### From Firefox Add-ons Store
1. Visit the add-on page on addons.mozilla.org
2. Click **Add to Firefox**
3. Confirm installation

The extension starts working immediately on YouTube Shorts pages.

### Manual Installation (Development)
1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file

---

## 🛠 Permissions Explained

- `https://www.youtube.com/shorts/*`  
  Required to detect Shorts videos and trigger navigation.

No other permissions are used.

---

## 🐛 Support & Feedback

Found a bug or have a suggestion?  
Please open an issue on GitHub:

👉 https://github.com/Ropaxyz/FFyoutube-shorts-auto-next/issues

---

## 📄 License

MIT License  
Free to use, modify, and distribute.
