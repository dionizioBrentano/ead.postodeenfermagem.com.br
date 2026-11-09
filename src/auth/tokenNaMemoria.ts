import { ENDERECO_TROCA } from "./enderecosApi";
import { postarComProva } from "./provaDpop";

export type RespostaToken = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  [k: string]: unknown;
};

let tokenAcesso: string | null = null;
let tokenRenovacao: string | null = null;
let horaVencimento: number | null = null;
let permissoes: string | null = null;

let timerRenovacao: ReturnType<typeof setTimeout> | null = null;
let promessaRenovando: Promise<string | null> | null = null;

export function token(): string | null {
  return tokenAcesso;
}

export function temAcesso(): boolean {
  return Boolean(tokenAcesso);
}

export function vencimento(): number | null {
  return horaVencimento;
}

export function escopo(): string | null {
  return permissoes;
}

export function limpar(): void {
  tokenAcesso = null;
  tokenRenovacao = null;
  horaVencimento = null;
  permissoes = null;

  if (timerRenovacao) {
    clearTimeout(timerRenovacao);
    timerRenovacao = null;
  }

  try {
    sessionStorage.removeItem("entrada.ativa");
  } catch {
    // Sem acesso a sessionStorage
  }
}

export function guardar(resposta: RespostaToken): void {
  tokenAcesso = resposta.access_token || null;
  tokenRenovacao = resposta.refresh_token || null;
  permissoes = typeof resposta.scope === "string" ? resposta.scope : null;

  if (timerRenovacao) {
    clearTimeout(timerRenovacao);
    timerRenovacao = null;
  }

  const expiresIn = typeof resposta.expires_in === "number" ? resposta.expires_in : 0;
  if (expiresIn > 0) {
    horaVencimento = Date.now() + expiresIn * 1000;
    const delayMs = Math.max(0, (expiresIn - 60) * 1000);
    timerRenovacao = setTimeout(() => {
      void renovar();
    }, delayMs);
  } else {
    horaVencimento = null;
  }

  try {
    sessionStorage.setItem("entrada.ativa", "1");
  } catch {
    // Sem acesso a sessionStorage
  }
}

export async function renovar(): Promise<string | null> {
  if (promessaRenovando) {
    return promessaRenovando;
  }
  if (!tokenRenovacao) {
    limpar();
    return null;
  }

  promessaRenovando = (async () => {
    try {
      const res = await postarComProva(ENDERECO_TROCA, {
        grant_type: "refresh_token",
        refresh_token: tokenRenovacao,
        client_id: window.location.hostname,
      });

      if (!res.ok) {
        limpar();
        return null;
      }

      const dados = (await res.json().catch(() => null)) as RespostaToken | null;
      if (!dados || typeof dados.access_token !== "string") {
        limpar();
        return null;
      }

      guardar(dados);
      return dados.access_token;
    } catch {
      limpar();
      return null;
    } finally {
      promessaRenovando = null;
    }
  })();

  return promessaRenovando;
}
