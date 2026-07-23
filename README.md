# Thrift App (`thrift-app`)

A modern, high-performance mobile and web application built with **Quasar (Vue 3)**, **Capacitor 8**, **Pinia**, **TanStack Vue Query**, and **Supabase**. Designed for warehouse inventory management, stock registration, fast barcode scanning, stock audit, and internationalization.

---

## 🌟 Key Features

- **Inventory & Stock Management**: Streamlined workflow to register, view, update, filter, and audit stocks.
- **High-Performance Barcode Scanning**: Hardware and ML Kit camera scanning integration for lightning-fast barcode capture.
- **Multilingual Support (i18n)**: Instant language switching between **English** and **Bengali (বাংলা)** with persisted locale preferences.
- **Contextual Help & Tooltips**: Built-in visual help dialogs (`AppHelpDialog`) across main workflows to guide warehouse operators.
- **Modern UI & Design System**: Custom typography (Outfit / Plus Jakarta Sans / JetBrains Mono), Phosphor icons, sleek glassmorphism panels, and skeleton loaders.
- **Android Native Mobile App**: Powered by Capacitor 8 with optimized release builds and deep link OAuth routing.

---

## 🚀 Tech Stack

- **Framework**: [Quasar Framework v2](https://quasar.dev/) (Vue 3 + Vite)
- **Mobile Engine**: [Capacitor 8](https://capacitorjs.com/)
- **State & Query**: [Pinia](https://pinia.vuejs.org/) & [TanStack Vue Query v5](https://tanstack.com/query/latest)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Internationalization**: [Vue I18n v10](https://vue-i18n.intlify.dev/)
- **Iconography**: Phosphor Icons (`@phosphor-icons/web`)

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
pnpm install
# or npm install / yarn / bun
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```ini
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_DRIVE_UPLOAD_ENABLED=false
```

### 3. Start Development Server

```bash
npm run dev
# or: npx quasar dev
```

---

## 📱 Native Android Development (Capacitor)

### 1. Open Android Studio

```bash
cd src-capacitor
npx cap open android
```

### 2. Development Mode (Live Reload on Device / Emulator)

```bash
npx quasar dev -m capacitor -T android
```

### 3. Building Android Binaries (APK / AAB)

Clean release build (recommended for sideloading):

```bash
npm run build:android
```

Debug build:

```bash
npm run build:android:debug
```

Sync web assets with Capacitor native platform:

```bash
npm run sync
```

---

## 🔐 Google OAuth & Deep Linking

To enable native Google OAuth login redirection back to the mobile application:

1. Open your **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. Add the custom scheme URI to your **Redirect URLs**:
   ```
   com.brandwala.thriftapp://auth-callback
   ```
3. Save changes.

---

## ☁️ Google Drive Backup (Web Admin Only)

The mobile app uploads images directly to Cloudinary. Google Drive backup is triggered from the **Web Admin UI**:

1. Keep `VITE_GOOGLE_DRIVE_UPLOAD_ENABLED=false` in the mobile app.
2. Sign in with the Google Drive admin account on the Web Admin platform.
3. Access **Thrift → Shipments** and use the cloud upload trigger per shipment.

---

## 🧪 Linting & Type Checking

```bash
# Typecheck TypeScript / Vue files
npm run typecheck

# Code formatting & linting
npm run lint
```
