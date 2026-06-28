import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { useQuasar } from "quasar";

export interface PhotoCaptureResult {
  webPath: string;
  blob: Blob;
}

function isUserCancel(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.toLowerCase().includes("cancel") ||
    message.toLowerCase().includes("dismiss")
  );
}

function isLocalPhotoUri(uri: string): boolean {
  return (
    uri.startsWith("capacitor://") ||
    uri.startsWith("file://") ||
    uri.startsWith("content://")
  );
}

async function uriToBlob(webPath: string): Promise<Blob> {
  const response = await fetch(webPath);
  return response.blob();
}

async function uriToBase64(uri: string): Promise<string> {
  const blob = await uriToBlob(uri);
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mime = "image/jpeg"): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function useProductPhoto() {
  const $q = useQuasar();

  async function capturePhoto(): Promise<PhotoCaptureResult | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const { camera } = await Camera.requestPermissions({
        permissions: ["camera"]
      });
      if (camera !== "granted" && camera !== "limited") {
        $q.notify({ type: "negative", message: "Camera permission denied" });
        return null;
      }

      const result = await Camera.takePhoto({
        quality: 80,
        editable: "in-app"
      });

      if (!result.webPath) return null;

      return {
        webPath: result.webPath,
        blob: await uriToBlob(result.webPath)
      };
    } catch (err) {
      if (isUserCancel(err)) return null;
      throw err;
    }
  }

  async function cropPhoto(
    webPath: string
  ): Promise<PhotoCaptureResult | null> {
    if (!Capacitor.isNativePlatform() || !webPath) return null;

    try {
      if (isLocalPhotoUri(webPath)) {
        const result = await Camera.editURIPhoto({
          uri: webPath,
          saveToGallery: false
        });

        if (!result.webPath) return null;

        return {
          webPath: result.webPath,
          blob: await uriToBlob(result.webPath)
        };
      }

      const base64 = await uriToBase64(webPath);
      const { outputImage } = await Camera.editPhoto({ inputImage: base64 });

      if (!outputImage) return null;

      const blob = base64ToBlob(outputImage);
      return {
        webPath: URL.createObjectURL(blob),
        blob
      };
    } catch (err) {
      if (isUserCancel(err)) return null;
      throw err;
    }
  }

  return { capturePhoto, cropPhoto };
}
