/**
 * Índice e carregamento dinâmico dos assuntos de estudo EAD.
 * Lê indice.json e carrega o conteúdo via import.meta.glob do Vite.
 */

import type { AssuntoEstudo, AssuntoIndiceItem } from "../../../types/ead";
import indiceRaw from "./indice.json";

const arquivosJson = import.meta.glob<Record<string, unknown>>(
  ["./*.json", "!./indice.json"],
  {
    eager: true,
    import: "default",
  },
);

export const ASSUNTOS_ESTUDO: readonly AssuntoIndiceItem[] = [
  ...(indiceRaw as AssuntoIndiceItem[]),
];

export const SLUGS_ASSUNTOS_ESTUDO: readonly string[] = ASSUNTOS_ESTUDO.map((a) => a.slug);

export function conteudoDoAssunto(slug: string): AssuntoEstudo | null {
  const metadados = ASSUNTOS_ESTUDO.find((a) => a.slug === slug);
  if (!metadados) {
    return null;
  }

  const chave = `./${metadados.dataFile}`;
  const dados = arquivosJson[chave];

  if (!dados) {
    throw new Error(
      `Arquivo de conteúdo não encontrado para o assunto "${slug}": ${metadados.dataFile}`,
    );
  }

  return dados as unknown as AssuntoEstudo;
}

export function listarAssuntos(): AssuntoEstudo[] {
  const lista: AssuntoEstudo[] = [];
  for (const item of ASSUNTOS_ESTUDO) {
    const assunto = conteudoDoAssunto(item.slug);
    if (assunto) {
      lista.push(assunto);
    }
  }
  return lista;
}

