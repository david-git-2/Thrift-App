# Google Sign-In SHA Setup — Thrift App

This guide covers everything needed to make native Google Sign-In work for both
**debug** (development) and **release** (production) builds.

---

## Why SHA fingerprints matter

Google Sign-In on Android uses the SHA-1 fingerprint of the signing certificate
to verify that the app making the request is genuine. Google Cloud Console must
have a matching Android OAuth credential for each SHA you build with:

| Build type | Keystore | Who has it |
|---|---|---|
| **Debug** | `~/.android/debug.keystore` (auto-created by Android Studio / Gradle) | Every developer machine has its own |
| **Release** | Your custom `.keystore` / `.jks` file | You create it once and keep it forever |

Both SHAs need a separate **Android** OAuth client registered in Google Cloud
Console. You do **not** touch the existing **Web application** client — that one
is used by Supabase and the native plugin's `webClientId`.

---

## Step 1 — Create a release keystore (first time only)

> Skip this if you already have a `.keystore` / `.jks` file.

Run this command **once** from the project root (or anywhere):

```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias thriftapp \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You will be prompted for:
- **Keystore password** → this is `RELEASE_STORE_PASSWORD`
- **Key password** → this is `RELEASE_KEY_PASSWORD`
- Name / organisation / country → put anything

Place the resulting `release.keystore` file at:
```
Thrift-app/src-capacitor/release.keystore
```

That path matches `RELEASE_STORE_FILE=../../release.keystore` already set in
`src-capacitor/android/gradle.properties` (relative to the `app/` folder).

> ⚠️ **Back this file up somewhere safe (external drive, cloud storage).**
> Losing it means you can never update the app on the Play Store.

---

## Step 2 — Fill in gradle.properties

Open `src-capacitor/android/gradle.properties` and replace the placeholder
values with your real ones:

```properties
RELEASE_STORE_FILE=../../release.keystore
RELEASE_STORE_PASSWORD=<the keystore password you chose above>
RELEASE_KEY_ALIAS=thriftapp
RELEASE_KEY_PASSWORD=<the key password you chose above>
```

> Do **not** commit this file to version control with real passwords.
> Add `gradle.properties` to `.gitignore`, or use environment variables
> in CI instead.

---

## Step 3 — Extract the SHA-1 fingerprints

### Debug SHA-1

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Copy the `SHA1:` line from the output.

### Release SHA-1

After completing Steps 1–2, run:

```bash
cd src-capacitor/android
./gradlew signingReport
```

Find the block labelled **Variant: release** and copy its `SHA1:` line.

Alternatively, query the keystore file directly:

```bash
keytool -list -v \
  -keystore src-capacitor/release.keystore \
  -alias thriftapp \
  -storepass <your_store_password>
```

---

## Step 4 — Register the SHAs in Google Cloud Console

1. Open [console.cloud.google.com](https://console.cloud.google.com) and select
   the same project used for Supabase Google OAuth.
2. Go to **APIs & Services → Credentials**.
3. Click **+ Create Credentials → OAuth client ID**.
4. Set **Application type** to **Android**.
5. Enter:
   - **Package name**: `com.brandwala.thriftapp`
   - **SHA-1 certificate fingerprint**: paste the SHA1 from Step 3
6. Click **Create**.
7. Repeat steps 3–6 for the **other** SHA (debug or release) — each needs its
   own Android credential entry.

You should end up with at least these entries in your credentials list:

| Type | Name (example) | Purpose |
|---|---|---|
| Web application | Supabase Google OAuth | Used by Supabase + `VITE_GOOGLE_WEB_CLIENT_ID` |
| Android | Thrift App Debug | Debug builds on dev machines |
| Android | Thrift App Release | Release / sideload / Play Store builds |

> The Web application client ID is already in `.env` as
> `VITE_GOOGLE_WEB_CLIENT_ID`. You do **not** change that value — the Android
> clients are linked to the same project automatically.

---

## Step 5 — Verify signing is working

Build the release APK:

```bash
npm run build:android
```

Then confirm the signing report shows your keystore:

```bash
cd src-capacitor/android
./gradlew signingReport
```

The `SHA1` under **Variant: release** must exactly match the fingerprint
registered in Google Cloud Console.

---

## Summary checklist

- [ ] `release.keystore` created and backed up
- [ ] `gradle.properties` filled in with real keystore values
- [ ] Debug SHA-1 extracted and registered (Android OAuth client in GCP)
- [ ] Release SHA-1 extracted and registered (Android OAuth client in GCP)
- [ ] `./gradlew signingReport` → release SHA matches GCP credential
- [ ] Test Google Sign-In on a debug build
- [ ] Test Google Sign-In on a release APK (sideloaded)
