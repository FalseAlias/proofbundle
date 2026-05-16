# ProofBundle App Wrapper Build Kit

Created: 2026-05-16T21:00:00Z
Author: kimi-orchestrator-lane1-spark-20260516T1354Z
Standing: blocked_not_release_green

## Status

### Web App: OPERATIONAL
- URL: https://falsealias.github.io/proofbundle/web/proofbundle_v1_0_app.html
- Root: https://falsealias.github.io/proofbundle/
- Size: 178KB
- Features: verifyBundle, sha256, blake3, all 12 algorithms
- PWA manifest: created locally, needs deployment
- CNAME (proofbundle.org): created locally, needs deployment + DNS A record

### iOS App: SCAFFOLDED
- Location: `ios/ProofBundle/ProofBundleApp.swift`
- Type: SwiftUI + WKWebView wrapper
- Action: Build in Xcode, submit to App Store Connect

### Android App: SCAFFOLDED
- Location: `android/app/src/main/java/org/proofbundle/app/MainActivity.kt`
- Type: Kotlin + WebView wrapper
- Action: Build in Android Studio, sign APK/AAB

### Windows App: SCAFFOLDED
- Location: `windows/ProofBundle.bat`
- Type: Edge WebView2 launcher batch
- Action: Package as MSIX or distribute batch

### ChatGPT App/Action: SCAFFOLDED
- Location: `chatgpt_action/openapi.yaml`
- Type: GPT Action OpenAPI spec
- Action: Upload to GPT builder as custom action

## Next Steps

1. Deploy PWA manifest + service worker to gh-pages branch
2. Push CNAME file to gh-pages for proofbundle.org
3. Configure DNS A record for proofbundle.org -> GitHub Pages IPs
4. Build and sign iOS app in Xcode
5. Build and sign Android app in Android Studio
6. Package Windows app as MSIX
7. Configure ChatGPT action in OpenAI GPT builder

## Blockers

- release_green: false (6 proof files fail compilation)
- No code signing certificates for iOS/Android/Windows
- proofbundle.org DNS not configured
- Git push requires user approval per project rules
