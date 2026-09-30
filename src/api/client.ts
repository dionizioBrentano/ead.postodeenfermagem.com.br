// Cliente da API do Posto de Enfermagem.
// Regras: identidade e autorização vêm da API. Este frontend só usa
// /auth/application/token, /auth/register, /auth/login e /user.

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ?? "";
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET ?? "";

const USER_TOKEN_KEY = "ead.userToken";
const PROFILE_KEY = "ead.profile";

export type Profile = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function configMissing(): string[] {
  const missing: string[] = [];
  if (!API_URL) missing.push("VITE_API_URL");
  if (!TENANT_ID) missing.push("VITE_TENANT_ID");
  if (!CLIENT_ID) missing.push("VITE_CLIENT_ID");
  if (!CLIENT_SECRET) missing.push("VITE_CLIENT_SECRET");
  return missing;
}

/* ---------- Armazenamento do token do usuário ---------- */

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* navegador sem armazenamento: o login vale só nesta aba */
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nada a fazer */
  }
}

let memoryUserToken: string | null = null;

export function getUserToken(): string | null {
  return memoryUserToken ?? safeGet(USER_TOKEN_KEY);
}
export function saveSession(token: string, profile: Profile | null) {
  memoryUserToken = token;
  safeSet(USER_TOKEN_KEY, token);
  if (profile) safeSet(PROFILE_KEY, JSON.stringify(profile));
}
export function getSavedProfile(): Profile | null {
  const raw = safeGet(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}
export function clearSession() {
  memoryUserToken = null;
  safeRemove(USER_TOKEN_KEY);
  safeRemove(PROFILE_KEY);
}

/* ---------- Token do aplicativo (só em memória) ---------- */

let appToken: string | null = null;
let appTokenPromise: Promise<string> | null = null;

export function getAppToken(): Promise<string> {
  if (appToken) return Promise.resolve(appToken);
  if (!appTokenPromise) {
    appTokenPromise = request("POST", "/auth/application/token", {
      body: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
      tenant: false,
    })
      .then((data) => {
        const token = pickToken(data);
        if (!token) throw new ApiError(0, "A API não devolveu o token do aplicativo.", data);
        appToken = token;
        return token;
      })
      .finally(() => {
        appTokenPromise = null;
      });
  }
  return appTokenPromise;
}

/* ---------- Requisição base ---------- */

type RequestOptions = {
  body?: unknown;
  bearer?: string | null;
  tenant?: boolean;
};

export async function request(method: string, path: string, opts: RequestOptions = {}): Promise<unknown> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.tenant !== false) headers["X-Tenant-ID"] = TENANT_ID;
  if (opts.bearer) headers["Authorization"] = `Bearer ${opts.bearer}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível falar com o servidor. Verifique sua internet e tente de novo.", null);
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) throw new ApiError(res.status, messageFrom(data) ?? `Erro ${res.status}`, data);
  return data;
}

/* ---------- Leitura tolerante das respostas ---------- */

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function pickToken(data: unknown): string | null {
  const d = obj(data);
  if (!d) return null;
  if (typeof d.access_token === "string") return d.access_token;
  if (typeof d.token === "string") return d.token;
  const inner = obj(d.data);
  if (inner) return pickToken(inner);
  return null;
}

export function pickProfile(data: unknown): Profile | null {
  const d = obj(data);
  if (!d) return null;
  for (const k of ["profile", "user"]) {
    const p = obj(d[k]);
    if (p) return p;
  }
  const inner = obj(d.data);
  if (inner) return pickProfile(inner) ?? (inner.id !== undefined ? inner : null);
  return d.id !== undefined ? d : null;
}

function messageFrom(data: unknown): string | null {
  const d = obj(data);
  if (!d) return typeof data === "string" && data.length < 300 ? data : null;
  const errors = obj(d.errors);
  if (errors) {
    const msgs: string[] = [];
    for (const v of Object.values(errors)) {
      if (Array.isArray(v)) msgs.push(...v.filter((x): x is string => typeof x === "string"));
      else if (typeof v === "string") msgs.push(v);
    }
    if (msgs.length) return msgs.join(" ");
  }
  if (typeof d.message === "string") return d.message;
  if (typeof d.error === "string") return d.error;
  return null;
}

export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {};
  const errors = obj(obj(err.body)?.errors);
  const out: Record<string, string> = {};
  if (!errors) return out;
  for (const [k, v] of Object.entries(errors)) {
    if (Array.isArray(v) && typeof v[0] === "string") out[k] = v[0];
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}

export function isOrganizationMismatch(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 403) return false;
  return JSON.stringify(err.body ?? "").includes("organization_mismatch");
}

/* ---------- Rotas usadas ---------- */

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  cpf: string;
  user_type?: string;
  council_type?: string;
  council_number?: string;
};

export async function register(input: RegisterInput) {
  const app = await getAppToken();
  const data = await request("POST", "/auth/register", {
    bearer: app,
    body: { user_type: "patient", ...input },
  });
  const token = pickToken(data);
  if (!token) throw new ApiError(0, "Cadastro feito, mas a API não devolveu o token de acesso. Tente entrar.", data);
  const profile = pickProfile(data);
  saveSession(token, profile);
  return { token, profile };
}

export async function login(loginValue: string, password: string) {
  const app = await getAppToken();
  const data = await request("POST", "/auth/login", {
    bearer: app,
    body: { login: loginValue, password },
  });
  
  const token = pickToken(data);
  if (!token) throw new ApiError(0, "A API não devolveu o token de acesso.", data);
  
  if (obj(data)?.mfa_required === true) {
    return { mfa_required: true, token, profile: null };
  }
  
  const profile = pickProfile(data);
  saveSession(token, profile);
  return { mfa_required: false, token, profile };
}

export async function verifyMfa(token: string, totp_code: string) {
  const data = await request("POST", "/auth/mfa/verify", {
    bearer: token,
    body: { totp_code }
  });
  const newToken = pickToken(data) || token;
  const profile = pickProfile(data);
  saveSession(newToken, profile);
  return { token: newToken, profile };
}

export async function currentUser(token: string): Promise<Profile> {
  const data = await request("GET", "/user", { bearer: token });
  return pickProfile(data) ?? (obj(data) as Profile) ?? {};
}
