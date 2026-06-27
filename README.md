# Thrift App (thrift-app)

A Quasar + Capacitor mobile application for stock registration, barcode scanning, and lookup management.

For architecture, data flows, and where to add features (AI + humans), see **[AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)**.

## Install the dependencies

```bash
npm install
# or: pnpm/yarn/bun install
```

### Start the app in web development mode (HMR, error reporting, etc.)

```bash
npm run dev
# or: npx quasar dev
```

### Build the app for production (Web)

```bash
npm run build
# or: npx quasar build
```

---

## Google Drive backup (web only)

The mobile app saves images to **Cloudinary only**. Drive backup is done from the **web admin** UI.

**Full guide:** [TRADEFLOWBD_DRIVE_UPLOADER.md](../brandwala-wholesale-quasar-v2/doc/TRADEFLOWBD_DRIVE_UPLOADER.md) in the main repo.

1. Keep `VITE_GOOGLE_DRIVE_UPLOAD_ENABLED=false` in this app (default).
2. On the web app, sign in with **Google** as the Drive admin email.
3. Use **Thrift → Shipments** → cloud upload icon per shipment.

No Supabase Drive secrets or OAuth Playground setup is required for thrift backup.

---

## Google OAuth & Deep Linking in Native App

Because Google OAuth authentication happens in the browser, deep links are used to return the user to the native mobile app after authentication.

### Supabase Configuration
To enable authentication redirects to the app, you **MUST** whitelist the custom deep link redirect URL in the Supabase Dashboard:
1. Go to your **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. Add the following URL to your **Redirect URLs**:
   ```
   com.brandwala.thriftapp://auth-callback
   ```
3. Save the changes.

---

## Capacitor (Android Mobile App) Instructions

This application is wrapped with Capacitor to run natively on mobile devices.

### 1. How to Open the Project in Android Studio

**Quick open (recommended):**

```bash
cd src-capacitor
npx cap open android
```

Run from the project root. This opens `src-capacitor/android` in Android Studio.

Other options:

*   **Dev mode (build + run on device/emulator):**
    ```bash
    npx quasar dev -m capacitor -T android
    ```

*   **Manually via Android Studio UI:**
    1. Launch **Android Studio**.
    2. Click **Open** (or **Open an Existing Project**).
    3. Select the `src-capacitor/android` folder in this project.

---

### 2. How to Sync Plugins and Assets

Whenever you make frontend changes in the `src/` directory or install new Capacitor plugins, you need to sync them with the native Android project:

*   **Via Quasar (Build + Sync):**
    ```bash
    npx quasar build -m capacitor -T android
    ```
    This compiles the web app assets and automatically executes `cap sync` under the hood.

*   **Manual Capacitor Sync:**
    If you only installed a new plugin or changed configuration files without needing a full rebuild, run:
    ```bash
    npm run sync
    ```

---

### 3. How to Build the App (APK / AAB)

**Use a clean release build for sideloading** — it installs faster and avoids stale web assets piling up in the APK.

```bash
npm run build:android
```

This clears old Capacitor web assets, rebuilds the UI, and produces a **release** APK (smaller than debug, arm-only native libs).

For a debug APK while developing:

```bash
npm run build:android:debug
```

**Why installs felt slow:** debug APKs are larger, ML Kit ships native scanner libraries, and repeated builds were leaving **old JS/CSS bundles** inside the APK (~5MB extra). `npm run clean:android` fixes the stale assets issue.

Legacy step-by-step:

1.  **Compile the Web Assets:**
    ```bash
    npx quasar build -m capacitor -T android
    ```

2.  **Build the Native Binary:**
    You can trigger the native compiler from the command line:
    ```bash
    cd src-capacitor
    npx cap build android
    ```
    *This command will ask whether to build a Debug APK or a Release AAB/APK.*

3.  **Alternative Build via Android Studio:**
    1. Open the project in Android Studio (`cd src-capacitor && npx cap open android`).
    2. Wait for Gradle sync to complete.
    3. In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** (or **Generate Signed Bundle / APK** for release builds).
    4. Once done, a popup will locate the compiled `.apk` file on your system.
