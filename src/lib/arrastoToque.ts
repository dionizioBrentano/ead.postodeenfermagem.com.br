export const TEMPO_TOQUE_LONGO_MS = 350;
export const TOLERANCIA_MOVIMENTO_PX = 10;
export const ATRIBUTO_JANELA_HORARIO = "data-janela-horario";

export interface PontoToque {
  x: number;
  y: number;
  t: number;
}

export type DecisaoArrastoToque = "aguardar" | "iniciar" | "cancelar";

export function deveIniciarArrasto(
  inicio: PontoToque,
  atual: PontoToque
): DecisaoArrastoToque {
  const distancia = Math.hypot(atual.x - inicio.x, atual.y - inicio.y);
  if (distancia > TOLERANCIA_MOVIMENTO_PX) {
    return "cancelar";
  }

  const decorrido = atual.t - inicio.t;
  if (decorrido >= TEMPO_TOQUE_LONGO_MS) {
    return "iniciar";
  }

  return "aguardar";
}

export function horarioDaJanela(el: Element | null): string | null {
  if (!el || typeof el.closest !== "function") {
    return null;
  }
  const janela = el.closest(`[${ATRIBUTO_JANELA_HORARIO}]`);
  if (!janela) {
    return null;
  }
  const horario = janela.getAttribute(ATRIBUTO_JANELA_HORARIO);
  return horario && horario.trim().length > 0 ? horario.trim() : null;
}
