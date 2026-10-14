/**
 * Regras puras para roteamento e metadados de módulos EAD.
 * Regra F-12: lógica pura sem React e sem rede.
 */

import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";

export function normalizarRota(rota: string): string {
  const limpa = rota.trim().replace(/\/+$/, "");
  return limpa === "" ? "/" : limpa;
}

export function slugDoModuloNaRota(rota: string, slugs: readonly string[]): string | null {
  const limpa = normalizarRota(rota);
  for (const slug of slugs) {
    if (limpa === `/${slug}` || limpa === `/ead/${slug}`) {
      return slug;
    }
  }
  return null;
}

export function rotasDosModulos(slugs: readonly string[]): string[] {
  const rotas: string[] = [];
  for (const slug of slugs) {
    rotas.push(slug);
    rotas.push(`ead/${slug}`);
  }
  return rotas;
}

export function rotuloTipoFonte(tipo: string): string {
  if (tipo === "video") return TEXTOS_MODULOS_EAD.tipoFonteVideo;
  if (tipo === "book") return TEXTOS_MODULOS_EAD.tipoFonteLivro;
  if (tipo === "article") return TEXTOS_MODULOS_EAD.tipoFonteArtigo;
  return tipo;
}
