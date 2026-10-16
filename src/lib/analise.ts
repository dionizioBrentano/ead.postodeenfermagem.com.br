import type { Membership } from "../api/client";

export const PADRAO_ID_MEDICAO = /^G-[A-Z0-9]+$/;

export function medicaoAtiva(idMedicao: string, emDesenvolvimento: boolean): boolean {
  if (emDesenvolvimento) {
    return false;
  }
  return PADRAO_ID_MEDICAO.test(idMedicao);
}

export function enderecoParaAnalise(origem: string, caminho: string): string {
  const caminhoLimpo = caminho.split(/[?#]/)[0] ?? "";
  const baseOrigem = origem.replace(/\/+$/, "");
  const caminhoComBarra = caminhoLimpo.startsWith("/") ? caminhoLimpo : `/${caminhoLimpo}`;
  return `${baseOrigem}${caminhoComBarra}`;
}

export function dadosDaOrganizacao(
  tenantId: string,
  memberships: Membership[],
): { organizacao_id: string; organizacao_nome?: string } {
  const vinculo = memberships.find((m) => m.organizacao?.id === tenantId);
  if (vinculo?.organizacao?.nome) {
    return {
      organizacao_id: tenantId,
      organizacao_nome: vinculo.organizacao.nome,
    };
  }
  return {
    organizacao_id: tenantId,
  };
}
