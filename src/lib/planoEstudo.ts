/**
 * Regras puras para plano de estudo sugerido, itens de atenção e próximo ciclo.
 * Regra F-12: funções puras sem React e sem rede.
 */

import {
  ATIVIDADES,
  ETAPAS,
  GERAIS,
  MOMENTOS,
  type Item,
  type Momento,
  type Nota,
} from "../data/itens";
import {
  linhaItemPlano,
  linhaItemProximoCiclo,
  TEXTOS_PLANO_ESTUDO,
  tituloProximoCicloPlano,
} from "../data/textosPlanoEstudo";
import type { ItemFichaRef } from "../types/ead";
import { cicloDoItemFicha } from "./assuntosEstudo";
import { media, ordenar, type Avaliacao } from "./historico";

export const NOTA_MINIMA_ATENCAO = 7;

export type NotasDaAvaliacao = Pick<
  Avaliacao,
  "etapa" | "momento" | "gerais" | "atividades"
>;

export type ItemDeAtencao = {
  ref: ItemFichaRef;
  item: Item;
  nota: number;
  ciclo: number;
};

export function avaliacaoMaisRecente(lista: Avaliacao[]): Avaliacao | null {
  const ordenadas = ordenar(lista);
  return ordenadas.length > 0 ? ordenadas[ordenadas.length - 1]! : null;
}

// Ordem: ciclo crescente. Dentro do mesmo ciclo, ordem da ficha: aspectos gerais antes de atividades, cada bloco por número.
// A ordem dentro do ciclo está pendente de decisão do Dionizio (plano guia-de-estudo.md).
export function ordenarItensDoPlano(itens: ItemDeAtencao[]): ItemDeAtencao[] {
  return [...itens].sort((a, b) => {
    if (a.ciclo !== b.ciclo) {
      return a.ciclo - b.ciclo;
    }
    if (a.ref.block !== b.ref.block) {
      return a.ref.block === "gerais" ? -1 : 1;
    }
    return a.ref.number - b.ref.number;
  });
}

function coletarItensDeAtencao(
  bloco: "gerais" | "atividades",
  notas: readonly Nota[],
  itens: readonly Item[],
  mediaGeral: number,
): ItemDeAtencao[] {
  const resultado: ItemDeAtencao[] = [];
  for (let i = 0; i < notas.length; i++) {
    const nota = notas[i];
    if (typeof nota === "number" && (nota < mediaGeral || nota < NOTA_MINIMA_ATENCAO)) {
      const ref: ItemFichaRef = { block: bloco, number: i + 1 };
      resultado.push({
        ref,
        item: itens[i]!,
        nota,
        ciclo: cicloDoItemFicha(ref),
      });
    }
  }
  return resultado;
}

export function itensDeAtencao(av: NotasDaAvaliacao): ItemDeAtencao[] {
  const todasNotas = [...av.gerais, ...av.atividades];
  const mediaGeral = media(todasNotas);
  if (mediaGeral === null) {
    return [];
  }

  const gerais = coletarItensDeAtencao("gerais", av.gerais, GERAIS, mediaGeral);
  const atividades = coletarItensDeAtencao(
    "atividades",
    av.atividades,
    ATIVIDADES,
    mediaGeral,
  );

  return ordenarItensDoPlano([...gerais, ...atividades]);
}

export function ehAvaliacaoFinal(momento: Momento): boolean {
  return momento === MOMENTOS[MOMENTOS.length - 1];
}

export function itensDoProximoCiclo(
  av: NotasDaAvaliacao,
): { ciclo: number; itens: { ref: ItemFichaRef; item: Item }[] } | null {
  if (!ehAvaliacaoFinal(av.momento)) {
    return null;
  }
  const proximo = av.etapa + 1;
  const existeNaEtapa = (ETAPAS as readonly number[]).includes(proximo);
  if (!existeNaEtapa) {
    return null;
  }

  const itensProximo: { ref: ItemFichaRef; item: Item }[] = [];
  ATIVIDADES.forEach((item, idx) => {
    if (item.desde === proximo) {
      itensProximo.push({
        ref: { block: "atividades", number: idx + 1 },
        item,
      });
    }
  });

  return {
    ciclo: proximo,
    itens: itensProximo,
  };
}

export function podeSugerirPlano(av: {
  etapa: number | null;
  momento: Momento | null;
  gerais: Nota[];
  atividades: Nota[];
}): boolean {
  if (av.etapa === null || av.momento === null) {
    return false;
  }
  return [...av.gerais, ...av.atividades].some((n) => typeof n === "number");
}

export function textoPlanoSugerido(
  itens: ItemDeAtencao[],
  proximo: ReturnType<typeof itensDoProximoCiclo>,
): string {
  const linhas: string[] = [TEXTOS_PLANO_ESTUDO.primeiraLinhaPlano];

  if (itens.length === 0) {
    linhas.push(TEXTOS_PLANO_ESTUDO.planoSemItens);
  } else {
    itens.forEach((it, idx) => {
      linhas.push(linhaItemPlano(idx + 1, it.item.curto, it.nota, it.ciclo));
    });
  }

  if (proximo !== null) {
    linhas.push("");
    linhas.push(tituloProximoCicloPlano(proximo.ciclo));
    proximo.itens.forEach((it) => {
      linhas.push(linhaItemProximoCiclo(it.item.curto));
    });
  }

  return linhas.join("\n");
}

export function acrescentarAoTexto(atual: string, novo: string): string {
  if (!atual.trim()) {
    return novo;
  }
  return `${atual.trimEnd()}\n\n${novo}`;
}
