import { supabase } from "../boot/supabase";

type JsonRecord = Record<string, unknown>;

function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string
  };
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { anonKey } = getSupabaseConfig();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated — sign in again");
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${session.access_token}`
  };
}

async function parseJsonResponse(response: Response): Promise<JsonRecord> {
  try {
    return (await response.json()) as JsonRecord;
  } catch {
    return {};
  }
}

function formatFunctionError(status: number, payload: JsonRecord): string {
  const details = payload.details;
  const error = payload.error;
  if (typeof details === "string" && details.trim()) return details;
  if (typeof error === "string" && error.trim()) return error;
  return `Request failed (${status})`;
}

function assertOkResponse(status: number, payload: JsonRecord) {
  if (typeof payload.error === "string") {
    throw new Error(formatFunctionError(status, payload));
  }
}

export async function invokeEdgeFunctionJson(
  functionName: string,
  body: Record<string, unknown>
): Promise<JsonRecord> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatFunctionError(response.status, payload));
  }

  assertOkResponse(response.status, payload);
  return payload;
}

export async function invokeEdgeFunctionFormData(
  functionName: string,
  formData: FormData
): Promise<JsonRecord> {
  const { url } = getSupabaseConfig();
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: formData
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(formatFunctionError(response.status, payload));
  }

  assertOkResponse(response.status, payload);
  return payload;
}
