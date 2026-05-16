# ProofBundle App Wrappers

**Identity:** kimi-current-lane1-spark
**Standing:** blocked_not_release_green
**Date:** 2026-05-16

---

## Platforms

### PWA (Progressive Web App)
- **Status:** Live
- **URL:** https://falsealias.github.io/proofbundle/
- **Manifest:** `app_wrappers/pwa/manifest.json`
- **Service Worker:** `app_wrappers/pwa/sw.js`
- **Install:** Visit the URL in Chrome/Edge/Safari, tap "Add to Home Screen"

### Windows
- **Status:** Tested and working
- **Launcher:** `app_wrappers/windows/ProofBundle.ps1`
- **Usage:**
  ```powershell
  # Launch browser verifier
  .\ProofBundle.ps1
  
  # Check conformance vectors
  .\ProofBundle.ps1 -Conformance
  
  # Verify a bundle file
  .\ProofBundle.ps1 -BundleFile "path\to\bundle.json"
  ```

### iOS
- **Status:** Scaffold committed
- **Source:** `app_wrappers/ios/ProofBundle/`
- **Build Requirements:** Xcode 15+, macOS 14+
- **Build Steps:**
  1. Open `app_wrappers/ios/ProofBundle.xcodeproj` in Xcode
  2. Select target device/simulator
  3. Build and run (Cmd+R)
- **Blockers:** Requires Apple Developer account for device deployment

### Android
- **Status:** Scaffold committed
- **Source:** `app_wrappers/android/`
- **Build Requirements:** Android Studio Hedgehog+, JDK 17+
- **Build Steps:**
  1. Open `app_wrappers/android/` in Android Studio
  2. Sync Gradle
  3. Build and run on emulator or device
- **Blockers:** None for emulator; Play Store requires developer account

### ChatGPT Action
- **Status:** OpenAPI spec committed
- **Source:** `app_wrappers/chatgpt_action/openapi.yaml`
- **Description:** GPT action for verifying ProofBundle receipts
- **Blockers:** Requires OpenAI developer review for GPT Store

---

## Cross-Platform Core

All apps use the same core verifier:
- **Web:** Single-file HTML5 verifier (no build step)
- **Native:** WebView wrapper around the HTML5 verifier
- **API:** JSON Schema validation + cryptographic checks

---

## Standing

No app store releases until:
- Proof compilation passes 8/8
- Conformance vectors maintain 300/300
- Legal review of claims completed
- User explicit authorization obtained

**Current standing: blocked_not_release_green**
