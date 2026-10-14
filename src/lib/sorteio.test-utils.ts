import type { Aleatorio } from "./sorteio";

export function criarAleatorioDeSequencia(
  valores: number[],
  valorPadrao = 0
): Aleatorio {
  let indice = 0;
  return () => {
    if (indice < valores.length) {
      const atual = valores[indice];
      indice += 1;
      return atual;
    }
    return valorPadrao;
  };
}
