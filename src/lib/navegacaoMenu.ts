import { PARAMETRO_ABA } from "../data/abasMenu";

export const CHAVE_DASHBOARD = "dashboard";
export const CHAVE_INICIO = "inicio";

export type DestinoMenu =
  | { tipo: "aba"; chave: string }
  | { tipo: "rota"; para: string };

export function destinoDoItemDoMenu(
  rotaAtual: string,
  chave: string,
  rotaDoItem?: string
): DestinoMenu {
  if (!rotaDoItem || rotaDoItem === rotaAtual) {
    return { tipo: "aba", chave };
  }
  return {
    tipo: "rota",
    para: `${rotaDoItem}?${PARAMETRO_ABA}=${encodeURIComponent(chave)}`,
  };
}

export function abaInicialDaBusca<T extends string>(
  busca: string,
  abasPermitidas: readonly T[],
  padrao: T
): T {
  if (!busca || busca.trim().length === 0) {
    return padrao;
  }
  const params = new URLSearchParams(busca);
  const valor = params.get(PARAMETRO_ABA);
  if (!valor) {
    return padrao;
  }
  if ((abasPermitidas as readonly string[]).includes(valor)) {
    return valor as T;
  }
  return padrao;
}

export function itemDoMenuAtivo(
  rotaAtual: string,
  abaAtiva: string,
  chave: string,
  rotaDoItem?: string
): boolean {
  if (rotaDoItem && rotaDoItem !== rotaAtual) {
    return false;
  }

  const ehDashboardOuInicio =
    (chave === CHAVE_DASHBOARD || chave === CHAVE_INICIO) &&
    (abaAtiva === CHAVE_DASHBOARD || abaAtiva === CHAVE_INICIO);

  if (ehDashboardOuInicio) {
    return true;
  }

  return chave === abaAtiva;
}
