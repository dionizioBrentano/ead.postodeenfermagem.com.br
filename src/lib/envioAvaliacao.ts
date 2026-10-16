import { GERAIS, ATIVIDADES, type Momento, type Nota } from "../data/itens";
import type { AvaliacaoPayload } from "../api/ead";
import { ApiError } from "../api/client";
import { TEXTOS_ENVIO_AVALIACAO } from "../data/textosEnvioAvaliacao";

export const ENVIO_SIMULTANEOS = 3;
export const ENVIO_TENTATIVAS = 3;
export const ENVIO_ESPERA_BASE_MS = 1500;

export function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function montarItensDaAvaliacao(dados: {
  alunoId: string;
  papel: "auto" | "supervisor";
  etapa: number;
  momento: Momento;
  gerais: Nota[];
  atividades: Nota[];
  comentario: string;
}): AvaliacaoPayload[] {
  const itens: AvaliacaoPayload[] = [];

  dados.gerais.forEach((nota, i) => {
    if (nota !== null) {
      itens.push({
        aluno_user_id: dados.alunoId,
        item_chave: `gerais.${i}`,
        item_texto: GERAIS[i]?.texto ?? "",
        grupo: "gerais",
        papel: dados.papel,
        nota: typeof nota === "number" ? nota : null,
        nao_praticou: nota === "na",
        etapa: String(dados.etapa),
        momento: dados.momento,
        comentario: dados.comentario,
      });
    }
  });

  dados.atividades.forEach((nota, i) => {
    if (nota !== null) {
      itens.push({
        aluno_user_id: dados.alunoId,
        item_chave: `atividades.${i}`,
        item_texto: ATIVIDADES[i]?.texto ?? "",
        grupo: "atividades",
        papel: dados.papel,
        nota: typeof nota === "number" ? nota : null,
        nao_praticou: nota === "na",
        etapa: String(dados.etapa),
        momento: dados.momento,
        comentario: dados.comentario,
      });
    }
  });

  return itens;
}

export function ehFalhaPassageira(erro: unknown): boolean {
  if (erro instanceof ApiError || (typeof erro === "object" && erro !== null && "status" in erro)) {
    const status = (erro as { status: unknown }).status;
    if (typeof status === "number") {
      return status === 0 || status === 408 || status === 429 || (status >= 500 && status <= 599);
    }
  }
  return false;
}

export async function enviarEmLotes<T>(
  itens: T[],
  enviar: (item: T) => Promise<unknown>,
  opcoes: {
    simultaneos: number;
    tentativas: number;
    esperar: (ms: number) => Promise<void>;
    esperaBaseMs: number;
    aoAvancar?: (feitos: number, total: number) => void;
  }
): Promise<{ salvos: T[]; falhas: { item: T; erro: unknown }[] }> {
  const total = itens.length;
  if (total === 0) {
    return { salvos: [], falhas: [] };
  }

  const salvos: T[] = [];
  const falhas: { item: T; erro: unknown }[] = [];
  let feitos = 0;
  let cursor = 0;

  async function processarItem(item: T) {
    let tentativa = 1;
    while (true) {
      try {
        await enviar(item);
        salvos.push(item);
        break;
      } catch (erro) {
        if (ehFalhaPassageira(erro) && tentativa < opcoes.tentativas) {
          await opcoes.esperar(opcoes.esperaBaseMs * tentativa);
          tentativa++;
        } else {
          falhas.push({ item, erro });
          break;
        }
      }
    }
    feitos++;
    opcoes.aoAvancar?.(feitos, total);
  }

  const limite = Math.max(1, opcoes.simultaneos);
  const workers: Promise<void>[] = [];
  const workerCount = Math.min(limite, total);

  for (let i = 0; i < workerCount; i++) {
    workers.push((async () => {
      while (cursor < total) {
        const item = itens[cursor++];
        await processarItem(item);
      }
    })());
  }

  await Promise.all(workers);
  return { salvos, falhas };
}

export function motivoDaFalha(erro: unknown): string {
  if (erro instanceof ApiError || (typeof erro === "object" && erro !== null && "status" in erro)) {
    const status = (erro as { status: unknown }).status;
    const errObj = erro as { message?: unknown };
    const msg = typeof errObj.message === "string" ? errObj.message : "";

    if (status === 0) {
      return TEXTOS_ENVIO_AVALIACAO.motivoSemConexao;
    }
    if (status === 429) {
      return TEXTOS_ENVIO_AVALIACAO.motivoLimite;
    }
    if (typeof status === "number" && status > 0) {
      return TEXTOS_ENVIO_AVALIACAO.motivoComCodigo(status, msg || TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido);
    }
  }
  return TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido;
}
