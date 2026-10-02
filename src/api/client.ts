// Cliente da API do Posto de Enfermagem.
// Regras: identidade e autorização vêm da API. Entrar, cadastro, verificação em
// duas etapas, confirmação de contatos e senha ficam no login central
// (entrar.postodeenfermagem.com.br); ver src/auth/loginCentral.ts.
import { iniciarLogin } from "../auth/loginCentral";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TENANT_ID = import.meta.env.VITE_TENANT_ID ?? "";

const USER_TOKEN_KEY = "ead.userToken";
const PROFILE_KEY = "ead.profile";
const MEMBERSHIPS_KEY = "ead.memberships";

export type Profile = Record<string, unknown>;
export type Role = "aluno" | "docente" | "administrador";
export type Membership = {
  id: string;
  organizacao: { id: string; nome: string; trilho_principal: string };
  trilho: string;
  papel: Role;
  situacao: "pendente" | "ativo" | "convidado";
  atribuicoes: string[];
};

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
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
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
export function saveMemberships(memberships: Membership[]) {
  safeSet(MEMBERSHIPS_KEY, JSON.stringify(memberships));
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
export function getSavedMemberships(): Membership[] {
  const raw = safeGet(MEMBERSHIPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Membership[];
  } catch {
    return [];
  }
}
export function clearSession() {
  memoryUserToken = null;
  safeRemove(USER_TOKEN_KEY);
  safeRemove(PROFILE_KEY);
  safeRemove(MEMBERSHIPS_KEY);
}

/* ---------- Requisição base ---------- */

type RequestOptions = {
  body?: unknown;
  bearer?: string | null;
  tenant?: boolean;
};

export const apiErrorListeners = new Set<(err: ApiError) => void>();

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
    const e = new ApiError(0, "Não foi possível falar com o servidor. Verifique sua internet e tente de novo.", null);
    apiErrorListeners.forEach(cb => cb(e));
    throw e;
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
  if (!res.ok) {
    if (res.status === 401) {
      clearSession();
      if (!window.location.pathname.includes("/entrar/retorno")) {
        void iniciarLogin();
      }
    }
    const e = new ApiError(res.status, messageFrom(data) ?? `Erro ${res.status}`, data);
    apiErrorListeners.forEach(cb => cb(e));
    throw e;
  }
  return data;
}

/* ---------- Leitura tolerante das respostas ---------- */

export function obj(v: unknown): Record<string, unknown> | null {
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

export async function logout(token: string) {
  try {
    await request("POST", "/auth/logout", { bearer: token });
  } catch {
    // Ignora erros ao deslogar
  }
  clearSession();
}

export async function currentUser(token: string): Promise<Profile> {
  const data = await request("GET", "/user", { bearer: token });
  return pickProfile(data) ?? (obj(data) as Profile) ?? {};
}

export async function getMemberships(token: string): Promise<Membership[]> {
  const data = await request("GET", "/me/memberships", { bearer: token });
  const list = obj(data)?.data as unknown[];
  if (!Array.isArray(list)) return [];
  const filtered = list.filter((m: any) => m?.organizacao?.id === TENANT_ID && m?.trilho === "ensino");
  return filtered as Membership[];
}

export async function createMembership(token: string, papel: "aluno" | "docente"): Promise<Membership> {
  const data = await request("POST", "/me/vinculos", { bearer: token, body: { papel } });
  return data as Membership;
}

export async function fetchMembershipsAndSave(token: string): Promise<Membership[]> {
  const mems = await getMemberships(token);
  saveMemberships(mems);
  return mems;
}

export async function getInvitation(token: string) {
  return request("GET", `/convites/${token}`);
}

export async function acceptInvitation(bearer: string, token: string) {
  return request("POST", `/convites/${token}/aceitar`, { bearer });
}

// Admin endpoints
export async function adminGetMembros(bearer: string, query: string) {
  return request("GET", `/organizacao/membros?${query}`, { bearer });
}
export async function adminAprovarMembro(bearer: string, id: string) {
  return request("POST", `/organizacao/membros/${id}/aprovar`, { bearer });
}
export async function adminRevogarMembro(bearer: string, id: string, motivo: string) {
  return request("POST", `/organizacao/membros/${id}/revogar`, { bearer, body: { motivo } });
}
export async function adminReativarMembro(bearer: string, id: string) {
  return request("POST", `/organizacao/membros/${id}/reativar`, { bearer });
}
export async function adminSetAtribuicoes(bearer: string, id: string, atribuicoes: string[]) {
  return request("PATCH", `/organizacao/membros/${id}/atribuicoes`, { bearer, body: { atribuicoes } });
}
export async function adminGetConvites(bearer: string) {
  return request("GET", `/organizacao/convites`, { bearer });
}
export async function adminCriarConvite(bearer: string, payload: { email: string; papel: string; atribuicoes?: string[] }) {
  return request("POST", `/organizacao/convites`, { bearer, body: payload });
}
export async function adminDeletarConvite(bearer: string, id: string) {
  return request("DELETE", `/organizacao/convites/${id}`, { bearer });
}

// Registros Profissionais
export type RegistroProfissional = {
  id: string;
  conselho: string;
  uf: string;
  numero: string;
  categoria: string;
  situacao: "nao_conferido" | "regular" | "irregular" | "suspenso" | "cancelado";
  conferido_em?: string;
};

export async function getRegistrosProfissionais(bearer: string): Promise<RegistroProfissional[]> {
  const data = await request("GET", "/me/registros-profissionais", { bearer });
  return (Array.isArray(data) ? data : []) as RegistroProfissional[];
}

export async function createRegistroProfissional(bearer: string, payload: { conselho: string; uf: string; numero: string; categoria: string }) {
  return request("POST", "/me/registros-profissionais", { bearer, body: payload });
}

export async function deleteRegistroProfissional(bearer: string, id: string) {
  return request("DELETE", `/me/registros-profissionais/${id}`, { bearer });
}

