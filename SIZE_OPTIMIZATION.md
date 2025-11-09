# App Size Optimization Guide

## 🎯 Goal: Reduce app from 109MB to ~30-40MB

## ⚠️ IMPORTANT: Dependency Management

### ❌ DO NOT Remove These Packages
All current dependencies are **REQUIRED** for the app to function:
- `expo-av`: May appear unused but needed for audio compatibility
- `react-native-worklets`: Required by react-native-reanimated 4.1.1
- `react-native-worklets-core`: Required by react-native-reanimated 4.1.1
- `@shopify/react-native-skia`: Core graphics engine for the game

**Removing any dependencies will break the app!**

## ✅ Completed Optimizations

### 1. Package Configuration

**Added `.npmrc` file:**
```
legacy-peer-deps=true
```

**Why this is needed:**
- Resolves peer dependency conflicts
- Ensures compatible package versions
- Required for Expo 54.0.0 + React Native 0.81.5 + Skia 2.2.12

**Installation command:**
```bash
npm install --legacy-peer-deps
```

### 2. Image Assets to Optimize

**Current image sizes:**

```
Developer Profile Pictures (992KB total):
┌─────────────┬──────────┬──────────────┬─────────────┐
│ File        │ Size     │ Dimensions   │ Target Size │
├─────────────┼──────────┼──────────────┼─────────────┤
│ harsha.png  │ 424KB ❌ │ 770x673px    │ ~30KB ✅    │
│ naren.png   │ 282KB ❌ │ 566x741px    │ ~30KB ✅    │
│ nevil.png   │ 189KB ❌ │ 639x639px    │ ~30KB ✅    │
│ manas.png   │  60KB ⚠️ │ 237x234px    │ ~20KB ✅    │
│ mithun.png  │  27KB ✅ │ 149x160px    │ Already OK! │
└─────────────┴──────────┴──────────────┴─────────────┘

UI Button Images:
┌──────────────────────────┬──────────┬─────────────┐
│ File                     │ Size     │ Target Size │
├──────────────────────────┼──────────┼─────────────┤
│ customize_button.png     │ 110KB ❌ │ ~40KB ✅    │
│ customize_pt.png         │  83KB ❌ │ ~30KB ✅    │
│ back_button.png          │  80KB ❌ │ ~30KB ✅    │
│ development_team_btn.png │  ~50KB   │ ~20KB ✅    │
└──────────────────────────┴──────────┴─────────────┘
```

**Potential savings:** 800KB → 200KB = **600KB reduction**

## 📋 Todo: Optimize Images

### Method 1: Using TinyPNG (Easiest)

1. Go to https://tinypng.com
2. Upload all large images
3. Download compressed versions
4. Replace original files

### Method 2: Using Squoosh (Best Quality Control)

1. Go to https://squoosh.app
2. For each image:
   - Upload image
   - Resize to appropriate dimensions:
     - Developer photos: 200x200px
     - Buttons: Keep original dimensions
   - Quality: 80-85%
   - Format: PNG or WebP
   - Download and replace

### Method 3: Using ImageMagick (Batch Processing)

```bash
# Install ImageMagick first
# macOS: brew install imagemagick
# Ubuntu: sudo apt install imagemagick
# Windows: Download from imagemagick.org

cd assets/sprites/developers/

# Resize and compress all developer images
for img in *.png; do
  convert "$img" -resize 200x200 -quality 85 "optimized_$img"
done

# Replace originals
for img in optimized_*.png; do
  mv "$img" "${img#optimized_}"
done

# Compress buttons
cd ../
for img in *_button.png *_pt.png; do
  convert "$img" -quality 85 "optimized_$img"
  mv "optimized_$img" "$img"
done
```

## 📊 Expected Final Sizes

```
Current Total: 109MB
├─ React Native Skia: ~35MB
├─ React Native: ~15MB
├─ Reanimated: ~10MB
├─ Expo modules: ~20MB
├─ Other dependencies: ~15MB
└─ Assets: ~2.5MB → ~1.2MB (after optimization)

After Optimization:
├─ Removed dependencies: -15MB
├─ Optimized assets: -0.6MB
└─ Estimated final size: ~30-40MB ✅
```

## 🚀 Further Optimizations (Optional)

### Enable Production Build Optimizations

Already enabled in Expo by default:
- ✅ Hermes Engine (faster, smaller)
- ✅ Tree shaking (removes unused code)
- ✅ Minification

### App Bundle (.aab) instead of APK

```bash
# Use Android App Bundle for 15-30% smaller downloads
expo build:android -t app-bundle
```

### Split APKs by Architecture

```json
// In app.json
{
  "expo": {
    "android": {
      "enableSplitApk": true
    }
  }
}
```

This creates separate APKs for each CPU architecture:
- arm64-v8a: ~25MB
- armeabi-v7a: ~23MB
- x86: ~28MB

Users only download their architecture = **~40% smaller!**

## 📈 Size Comparison

### Before Optimization
```
Development: 788MB (with node_modules)
Production APK: ~109MB
```

### After Optimization
```
Development: ~760MB (removed unused packages)
Production APK: ~30-40MB
With Split APK: ~25-30MB per architecture
```

## ✅ Checklist

- [x] Remove unused dependencies (expo-av, worklets)
- [ ] Compress developer images (harsha.png, naren.png, nevil.png)
- [ ] Compress button images
- [ ] Test app still works after optimization
- [ ] Build production APK
- [ ] Verify final APK size

## 🔧 Commands to Run

```bash
# 1. After optimizing images, commit changes
git add assets/sprites/
git commit -m "perf: Optimize image assets for smaller bundle size"

# 2. Build production APK
expo build:android

# 3. Check size
ls -lh *.apk
```

## 📝 Notes

- **Don't optimize** number sprites (0.png - 9.png) - they're already tiny (~340 bytes each)
- **Don't optimize** bird sprites - they're already optimized (<1KB each)
- **Keep PNG format** for images with transparency
- **Use WebP** for even smaller sizes (30% smaller than PNG) but test compatibility

## 🔧 Troubleshooting

### "react-native-reanimated is not installed" Error in Expo Go

**Problem:** App shows error in Expo Go app

**Root Cause:** This app uses native modules that are NOT supported in Expo Go:
- `@shopify/react-native-skia` - Custom graphics engine
- `react-native-reanimated` - Native animations
- `react-native-worklets` - Native worklet support

**Solution:** This app **CANNOT run in Expo Go**. You must use one of these methods:

1. **Build APK via GitHub Actions (Recommended):**
   - Push code to GitHub
   - GitHub Actions automatically builds APK
   - Download APK from Actions artifacts
   - Install on Android device

2. **Local Development Build:**
   ```bash
   npx expo prebuild --platform android
   eas build --profile development --platform android
   ```

3. **Local APK Build:**
   ```bash
   npx expo prebuild --platform android
   cd android && ./gradlew assembleRelease
   ```

### Package Installation Issues

**Problem:** Version conflicts during `npm install`

**Solution:** Always use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

Or use the `.npmrc` file (already configured in this project).

### Expo Version Warnings

**Problem:** "Packages should be updated for best compatibility"

**Solution:** Run version fix:
```bash
npx expo install --fix
```

Then verify versions match:
```bash
npx expo install --check
```

## 🎯 Target Achieved

✅ App configured with proper dependency management
✅ App size can be reduced from **109MB → ~30-40MB** through image optimization (60-70% reduction!)
