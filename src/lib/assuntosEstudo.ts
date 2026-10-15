/**
 * Regras puras para assuntos de estudo EAD.
 * Regra F-12: funções puras sem React e sem rede.
 */

import { ATIVIDADES, ETAPAS, GERAIS, type Item } from "../data/itens";
import { TEXTOS_ASSUNTOS_ESTUDO } from "../data/textosAssuntosEstudo";
import type {
  AssuntoEstudo,
  ItemFichaRef,
  PromptEstudo,
  RevisaoAssunto,
  SourceItem,
} from "../types/ead";
import { normalizarRota } from "./modulosEad";

export const LIMITE_DUVIDA = 1000;

export function slugDoAssuntoNaRota(rota: string, slugs: readonly string[]): string | null {
  const limpa = normalizarRota(rota);
  for (const slug of slugs) {
    if (limpa === `/estudo/${slug}`) {
      return slug;
    }
  }
  return null;
}

export function rotasDosAssuntos(slugs: readonly string[]): string[] {
  return slugs.map((slug) => `estudo/${slug}`);
}

export function itemDaFicha(ref: ItemFichaRef): Item {
  const indice = ref.number - 1;
  if (ref.block === "gerais") {
    if (indice < 0 || indice >= GERAIS.length) {
      throw new Error(`Item da ficha inexistente no bloco gerais: número ${ref.number}.`);
    }
    return GERAIS[indice]!;
  }
  if (ref.block === "atividades") {
    if (indice < 0 || indice >= ATIVIDADES.length) {
      throw new Error(`Item da ficha inexistente no bloco atividades: número ${ref.number}.`);
    }
    return ATIVIDADES[indice]!;
  }
  throw new Error(`Bloco da ficha inválido: ${ref.block as string}.`);
}

export function cicloDoItemFicha(ref: ItemFichaRef): number {
  if (ref.block === "gerais") {
    return ETAPAS[0];
  }
  const item = itemDaFicha(ref);
  return item.desde ?? ETAPAS[0];
}

export function ciclosDoAssunto(itens: ItemFichaRef[]): number[] {
  const ciclos = new Set<number>();
  for (const ref of itens) {
    ciclos.add(cicloDoItemFicha(ref));
  }
  return Array.from(ciclos).sort((a, b) => a - b);
}

export function slugPublicadoDoItem(
  ref: ItemFichaRef,
  assuntos: readonly AssuntoEstudo[],
): string | null {
  for (const assunto of assuntos) {
    if (assunto.review.status === "publicado") {
      const temItem = assunto.assessment_items.some(
        (item) => item.block === ref.block && item.number === ref.number,
      );
      if (temItem) {
        return assunto.slug;
      }
    }
  }
  return null;
}

export function fontesPorIds(
  ids: readonly string[] | undefined,
  fontes: readonly SourceItem[],
): SourceItem[] {
  if (!ids || ids.length === 0) return [];
  const mapaFontes = new Map<string, SourceItem>();
  for (const f of fontes) {
    if (f.id) {
      mapaFontes.set(f.id, f);
    }
  }
  const resultado: SourceItem[] = [];
  for (const id of ids) {
    const f = mapaFontes.get(id);
    if (f) {
      resultado.push(f);
    }
  }
  return resultado;
}

export function montarPromptDeEstudo(prompt: PromptEstudo, duvida: string): string {
  if (!prompt.accepts_question) {
    return prompt.text;
  }
  return `${prompt.text}\n\n${TEXTOS_ASSUNTOS_ESTUDO.prefixoDuvida} ${duvida.trim()}`;
}

export function podeCopiarPrompt(prompt: PromptEstudo, duvida: string): boolean {
  if (!prompt.accepts_question) {
    return true;
  }
  return duvida.trim().length > 0;
}

export function mostrarAvisoRascunho(revisao: RevisaoAssunto): boolean {
  return revisao.status !== "publicado";
}
