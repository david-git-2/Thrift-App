# Google Sign-In Setup — Thrift App (from zero)

This project ships with **no** release keystore, **no** signing passwords, and
**no** `VITE_GOOGLE_WEB_CLIENT_ID` in `.env`. You set everything up yourself.

Follow the steps in order. Each step explains **what** it is, **why** you need
it, and **where** to put the result.

**Package name (fixed):** `com.brandwala.thriftapp`

---

## Starting state (important)

| Item | In this repo? |
|---|---|
| `src-capacitor/release.keystore` | **No — you create it** |
| `RELEASE_*` values in `.env` | **No — you add them** |
| `VITE_GOOGLE_WEB_CLIENT_ID` in `.env` | **No — you add it** |
| Android OAuth clients in Google Cloud | **No — you create them** |
| Debug keystore | Auto-created by Android tools on your machine (`~/.android/debug.keystore`) |

Until the steps below are done, **release Google Sign-In will not work**.

---

## How login works (after setup)

```
Phone Google account picker
        ↓
@capgo/capacitor-social-login (native)
        ↓  Google ID token + nonce
supabase.auth.signInWithIdToken
        ↓
Thrift session bootstrap (membership / tenant)
```

| Surface | Mechanism |
|---|---|
| **Android / iOS app** | Native account picker → ID token → Supabase `signInWithIdToken` |
| **Web browser** | Supabase `signInWithOAuth` redirect |

Code (already in the app — you only configure keys/cloud):

- `src/utils/nativeGoogleAuth.ts`
- `src/composables/useOAuthLogin.ts` → `handleGoogleLogin`
- `src-capacitor/android/.../MainActivity.java`

---

## Step 0 — Add a Google account on the device (do this first)

### What is this?

A Google account stored on the phone/emulator. Native Sign-In uses that account
list (Credential Manager / Google Play services), not a website form.

### Why?

Without a device account, the account picker is empty or Sign-In fails oddly.
Do this **before** building or debugging OAuth.

### Where / how

On the phone or emulator you will install the APK on:

1. **Settings → Passwords & accounts** (or **Settings → Accounts**)
2. **Add account → Google**
3. Sign in with the account you will use for Thrift
4. Confirm it appears under Accounts

Optional: open the Play Store once while signed in (checks Play services).

> That Google user still needs Thrift membership in your backend. Otherwise
> Google login succeeds and membership bootstrap fails (`no_membership`).

---

## Step 1 — Understand SHA-1 (what it is and why)

### What is a SHA-1 fingerprint?

Every Android APK is signed with a certificate. **SHA-1** is a short fingerprint
of that certificate — like an ID card for “which key signed this APK.”

### Why Google needs it

Native Google Sign-In only issues tokens if:

1. Package name is `com.brandwala.thriftapp`
2. The APK’s signing SHA-1 matches an **Android** OAuth client in Google Cloud

Mismatch → `DEVELOPER_ERROR` / `ApiException: 10`.

### Debug vs release (two different keys — both required)

| Build | Keystore | Who creates it |
|---|---|---|
| **Debug** | `~/.android/debug.keystore` | Android Studio / Gradle on your machine (automatic) |
| **Release** | `src-capacitor/release.keystore` | **You** (Step 2) — does not exist yet |

Each SHA needs its **own** Android OAuth client. Debug working ≠ release working.

### What goes in `.env` vs Google Cloud

| Credential | Purpose | Where |
|---|---|---|
| **Web application** OAuth client ID | Supabase Google provider + Capgo `webClientId` | `.env` → `VITE_GOOGLE_WEB_CLIENT_ID` |
| **Android** OAuth client (package + SHA-1) | Allows that signed APK to get Google tokens | Google Cloud Console only — **never** in `.env` |

---

## Step 2 — Create the release keystore (required — none in repo)

### What is this?

A new file that holds the private key used to **sign release APKs**. This repo
does not include one on purpose.

### Why?

Release / sideload / Play builds must be signed with a stable key. That key’s
SHA-1 is what you register for production Sign-In.

### Where the file must live

```
Thrift-app/src-capacitor/release.keystore
```

### How — create it now

From anywhere (then move the file), run:

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias thriftapp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You will be prompted for:

| Prompt | You will store it as |
|---|---|
| Keystore password | `RELEASE_STORE_PASSWORD` in `.env` |
| Key password | `RELEASE_KEY_PASSWORD` in `.env` |
| Name / org / country | Anything (metadata) |

Then move the file:

```bash
mv release.keystore "/path/to/Thrift-app/src-capacitor/release.keystore"
```

> **Back up this file and the passwords.** If you lose them, you cannot update
> the same Play Store app with a new key.

> Do **not** commit the keystore or real passwords to git.

---

## Step 3 — Create the Web OAuth client (Google Cloud + Supabase)

### What is this?

A **Web application** OAuth client ID/secret. The native plugin and Supabase both
use this Web client ID (not the Android client ID).

### Why?

- Capgo Social Login needs `webClientId` at runtime
- Supabase Google provider verifies ID tokens against that Web client

### Where

1. [Google Cloud Console](https://console.cloud.google.com) → your project  
   (same project you will use for Android clients)
2. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name it e.g. `Thrift Supabase Google`
5. Create → copy **Client ID** and **Client Secret**

Then:

**A. Supabase** → Authentication → Providers → Google  

- Paste Client ID + Client Secret  
- Enable the provider  

**B. Project root `.env`** — uncomment / add:

```ini
VITE_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Do **not** put an Android client ID here.

---

## Step 4 — Add release signing values to `.env`

### What is this?

Values Gradle reads from root `.env` when building a signed release APK
(`src-capacitor/android/app/build.gradle`).

### Why?

Without these, you cannot produce a properly signed release APK, and you cannot
get a stable release SHA-1 for Google Cloud.

### Where

In **`Thrift-app/.env`**, add (after Step 2 passwords are known):

```ini
VITE_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com

RELEASE_STORE_FILE=../../release.keystore
RELEASE_STORE_PASSWORD=the_password_you_chose
RELEASE_KEY_ALIAS=thriftapp
RELEASE_KEY_PASSWORD=the_key_password_you_chose
```

`RELEASE_STORE_FILE` is relative to `src-capacitor/android/app/`.

---

## Step 5 — Extract SHA-1 fingerprints

### What is this?

Reading the fingerprint from the debug keystore and from your new release
keystore so you can paste them into Google Cloud.

### Why?

Google’s allow-list for native Sign-In is “package name + SHA-1”.

### Where the values go

Google Cloud → Credentials → Android OAuth clients (not `.env`).

### Debug SHA-1

(First Android Studio / Gradle run may create `~/.android/debug.keystore`.)

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Copy `SHA1:`.

> Each developer machine has its own debug keystore. Teammates need their own
> debug Android OAuth client (or their SHA registered).

### Release SHA-1

Only after Steps 2–4:

```bash
cd src-capacitor/android
./gradlew signingReport
```

Copy `SHA1:` under **Variant: release**.

Or:

```bash
keytool -list -v \
  -keystore src-capacitor/release.keystore \
  -alias thriftapp \
  -storepass YOUR_RELEASE_STORE_PASSWORD
```

---

## Step 6 — Register Android OAuth clients in Google Cloud

### What is this?

An **Android** OAuth client = package name + one SHA-1.

### Why?

This is what makes Google accept tokens from your debug APK and your release APK.

### Where / how

1. Google Cloud → **APIs & Services → Credentials**
2. **+ Create Credentials → OAuth client ID**
3. Application type: **Android**
4. Package name: `com.brandwala.thriftapp`
5. SHA-1: paste debug fingerprint → Create (name e.g. `Thrift App Debug`)
6. Repeat for release SHA-1 (name e.g. `Thrift App Release`)

You should end up with:

| Type | Purpose |
|---|---|
| Web application | `.env` + Supabase |
| Android (debug SHA) | `npm run build:android:debug` |
| Android (release SHA) | `npm run build:android` |

Wait a few minutes after creating clients before testing.

---

## Step 7 — Debug vs release builds

### Debug

Signed with the machine debug keystore. Needs the **debug** Android OAuth client.

```bash
npm run build:android:debug
```

Install APK → device has Google account (Step 0) → Continue with Google.

### Release

Signed with **your** new `release.keystore`. Needs the **release** Android OAuth
client and filled `RELEASE_*` + `VITE_GOOGLE_WEB_CLIENT_ID` in `.env`.

```bash
npm run build:android
```

Verify:

```bash
cd src-capacitor/android
./gradlew signingReport
```

**Variant: release** SHA-1 must match the Release Android OAuth client.

Uninstall older APKs signed with a different key before installing.

### What “working” looks like

1. Account picker appears  
2. You pick a Google account  
3. App enters Thrift (or shows a clear membership error)  
4. No Chrome / Custom Tab for the happy path  

---

## Step 8 — Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Build fails on release signing | No keystore / empty `RELEASE_*` | Steps 2 + 4 |
| No account picker | No Google account on device | Step 0 |
| `DEVELOPER_ERROR` / `ApiException: 10` | SHA not registered for this build type | Steps 5–6 |
| Works debug, fails release | Only debug Android client created | Add release client |
| Missing `VITE_GOOGLE_WEB_CLIENT_ID` | Not set before Quasar build | Step 3–4, rebuild |
| Google OK, then no Thrift access | No membership | Grant tenant access in backend |

---

## Summary checklist (from zero)

- [ ] Google account on the test device (Step 0)
- [ ] Understood SHA-1 (Step 1)
- [ ] Created `src-capacitor/release.keystore` (Step 2) and backed it up
- [ ] Created Web OAuth client; set Supabase Google provider (Step 3)
- [ ] Added `VITE_GOOGLE_WEB_CLIENT_ID` + `RELEASE_*` to `.env` (Step 4)
- [ ] Extracted debug + release SHA-1 (Step 5)
- [ ] Created Android OAuth clients for both SHAs (Step 6)
- [ ] Tested debug build (Step 7)
- [ ] Tested release build (Step 7)
- [ ] `signingReport` release SHA matches Google Cloud
