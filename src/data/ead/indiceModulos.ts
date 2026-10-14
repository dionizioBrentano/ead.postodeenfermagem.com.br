/**
 * Índice e carregamento dinâmico dos módulos EAD.
 * Lê modules.json e carrega o conteúdo via import.meta.glob do Vite.
 */

import type { EadModule, EadModuleMetadata } from "../../types/ead";
import modulesRaw from "./modules.json";

const arquivosJson = import.meta.glob<Record<string, unknown>>("./*.json", {
  eager: true,
  import: "default",
});

export const MODULOS_EAD: readonly EadModuleMetadata[] = [
  ...(modulesRaw as EadModuleMetadata[]),
].sort((a, b) => a.number - b.number);

export const SLUGS_MODULOS_EAD: readonly string[] = MODULOS_EAD.map((m) => m.slug);

export function conteudoDoModulo(
  slug: string
): { metadados: EadModuleMetadata; modulo: EadModule } | null {
  const metadados = MODULOS_EAD.find((m) => m.slug === slug);
  if (!metadados) {
    return null;
  }

  const chave = `./${metadados.dataFile}`;
  const dados = arquivosJson[chave];

  if (!dados) {
    throw new Error(
      `Arquivo de conteúdo não encontrado para o módulo "${slug}": ${metadados.dataFile}`
    );
  }

  return {
    metadados,
    modulo: dados as unknown as EadModule,
  };
}
