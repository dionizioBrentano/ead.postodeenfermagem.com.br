// Login central da rede (entrar.postodeenfermagem.com.br).
// Mesmo comportamento em todos os sites: PKCE S256, código de uso único trocado na API.
// Nunca colocar token em URL ou console.

import { base64url } from "./base64url";
import { ENDERECO_AUTORIZAR, ENDERECO_SAIR, ENDERECO_TROCA } from "./enderecosApi";
import { postarComProva } from "./provaDpop";
import { token, limpar, guardar, temAcesso, type RespostaToken } from "./tokenNaMemoria";

const LOGIN_CENTRAL = (import.meta.env.VITE_LOGIN_CENTRAL_URL ?? "https://entrar.postodeenfermagem.com.br").replace(/\/+$/, "");
// Prefixo das rotas quando o site não fica na raiz do domínio (ex.: "/frontend").
const BASE = (import.meta.env.VITE_ROTAS_BASE ?? "").replace(/\/+$/, "");
const CHAVE = "loginCentral.pedido";

export const CAMINHO_RETORNO = "/entrar/retorno";

type PedidoLocal = { state: string; verifier: string; destino: string };

function aleatorio(bytes: number): string {
  const b = new Uint8Array(bytes);
  crypto.getRandomValues(b);
  return base64url(b);
}

async function desafio(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

function urlRetorno(): string {
  return `${window.location.origin}${BASE}${CAMINHO_RETORNO}`;
}

/** Página atual sem o prefixo das rotas. */
function paginaAtual(): string {
  const p = window.location.pathname;
  const semBase = BASE && p.startsWith(BASE) ? p.slice(BASE.length) || "/" : p;
  return semBase + window.location.search;
}

/** Só aceita destino interno do próprio site (evita redirecionar para fora). */
function destinoSeguro(destino: string | null | undefined): string {
  if (!destino || !destino.startsWith("/") || destino.startsWith("//")) return "/";
  return destino;
}

export type OpcoesLogin = {
  /** Página para onde voltar depois de entrar. Padrão: a página atual. */
  destino?: string;
  /** A área exige verificação em duas etapas (aplicativo autenticador). */
  exigirMfa?: boolean;
};

export async function iniciarLogin(opcoes: OpcoesLogin = {}): Promise<void> {
  const verifier = aleatorio(48); // 64 caracteres
  const pedido: PedidoLocal = {
    state: aleatorio(32),
    verifier,
    destino: destinoSeguro(opcoes.destino ?? paginaAtual()),
  };
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(pedido));
  } catch {
    // Sem sessionStorage não dá para concluir o retorno com segurança.
  }
  const q = new URLSearchParams({
    response_type: "code",
    client_id: window.location.hostname,
    redirect_uri: urlRetorno(),
    state: pedido.state,
    code_challenge: await desafio(verifier),
    code_challenge_method: "S256",
  });
  if (opcoes.exigirMfa) q.set("verificacao", "1");
  window.location.assign(`${ENDERECO_AUTORIZAR}?${q.toString()}`);
}

export type RespostaLogin = RespostaToken & {
  user?: Record<string, unknown>;
  abilities?: string[];
};

/**
 * Conclui o retorno do login central: confere o state, troca o código na API
 * e devolve a resposta (token + usuário) e a página de destino.
 */
export async function concluirLogin(): Promise<{ resposta: RespostaLogin; destino: string }> {
  const q = new URLSearchParams(window.location.search);
  const code = q.get("code");
  const state = q.get("state");
  window.history.replaceState(null, "", window.location.pathname);

  let pedido: PedidoLocal | null = null;
  try {
    const raw = sessionStorage.getItem(CHAVE);
    sessionStorage.removeItem(CHAVE);
    pedido = raw ? (JSON.parse(raw) as PedidoLocal) : null;
  } catch {
    pedido = null;
  }

  if (!code || !state || !pedido || pedido.state !== state) {
    throw new Error("Não foi possível confirmar a entrada. Tente entrar de novo.");
  }

  let res: Response;
  try {
    res = await postarComProva(ENDERECO_TROCA, {
      grant_type: "authorization_code",
      code,
      code_verifier: pedido.verifier,
      redirect_uri: urlRetorno(),
      client_id: window.location.hostname,
    });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Verifique sua internet e tente de novo.");
  }
  const data = (await res.json().catch(() => null)) as RespostaLogin | null;
  if (!res.ok || !data || typeof data.access_token !== "string") {
    throw new Error("A entrada expirou ou já foi usada. Tente entrar de novo.");
  }
  guardar(data);
  return { resposta: data, destino: destinoSeguro(pedido.destino) };
}

/** Encerra a sessão localmente e redireciona para o login central para logout global. */
export async function sair(): Promise<void> {
  const tk = token();
  try {
    if (tk) {
      await postarComProva(ENDERECO_SAIR, undefined, tk);
    }
  } catch {
    // Falhas de rede não impedem a saída
  } finally {
    limpar();
    localStorage.removeItem("ead.profile");
    localStorage.removeItem("ead.memberships");
    const returnTo = `${window.location.origin}${BASE}/`;
    const q = new URLSearchParams({ return_to: returnTo });
    window.location.assign(`${LOGIN_CENTRAL}/sair?${q.toString()}`);
  }
}

let recuperando = false;

/**
 * Se não há token na memória mas há marca de sessão ativa nesta aba e não estamos no retorno,
 * inicia o login com a página atual como destino e retorna true (passagem silenciosa).
 */
export function recuperarAcesso(): boolean {
  if (temAcesso()) {
    return false;
  }
  let ativa = false;
  try {
    ativa = sessionStorage.getItem("entrada.ativa") === "1";
  } catch {
    ativa = false;
  }
  if (!ativa) {
    return false;
  }
  const p = window.location.pathname;
  if (p.includes(CAMINHO_RETORNO)) {
    return false;
  }
  if (!recuperando) {
    recuperando = true;
    void iniciarLogin({ destino: paginaAtual() });
  }
  return true;
}

/** Encerra a sessão também no login central. Chame depois de apagar o token do site. */
export function sairNoLoginCentral(): void {
  const q = new URLSearchParams({ return_to: `${window.location.origin}${BASE}/` });
  window.location.assign(`${LOGIN_CENTRAL}/sair?${q.toString()}`);
}

/** Endereço da tela de segurança da conta (ativar verificação em duas etapas). */
export const URL_SEGURANCA = `${LOGIN_CENTRAL}/seguranca`;
