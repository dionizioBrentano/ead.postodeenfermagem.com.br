export type Aleatorio = () => number;

export const MENSAGEM_ERRO_SORTEIO_SEM_PESO_POSITIVO =
  "Nenhuma opção com peso positivo para sortear.";

const PESO_MINIMO_EXCLUIDO = 0;
const PASSO_INCLUSIVO_INTEIRO = 1;

export function sortearIndice(
  quantidade: number,
  aleatorio: Aleatorio = Math.random
): number {
  return Math.floor(aleatorio() * quantidade);
}

export function sortearPonderado<T>(
  opcoes: { valor: T; peso: number }[],
  aleatorio: Aleatorio = Math.random
): T {
  const positivas = opcoes.filter((opcao) => opcao.peso > PESO_MINIMO_EXCLUIDO);
  if (positivas.length === 0) {
    throw new Error(MENSAGEM_ERRO_SORTEIO_SEM_PESO_POSITIVO);
  }

  let somaPesos = 0;
  for (const opcao of positivas) {
    somaPesos += opcao.peso;
  }

  const pontoSorteado = aleatorio() * somaPesos;
  let acumulado = 0;
  for (const opcao of positivas) {
    acumulado += opcao.peso;
    if (pontoSorteado < acumulado) {
      return opcao.valor;
    }
  }

  return positivas[positivas.length - 1].valor;
}

export function sortearInteiro(
  minimo: number,
  maximo: number,
  aleatorio: Aleatorio = Math.random
): number {
  const quantidade = maximo - minimo + PASSO_INCLUSIVO_INTEIRO;
  return minimo + Math.floor(aleatorio() * quantidade);
}

export function sortearChance(
  probabilidade: number,
  aleatorio: Aleatorio = Math.random
): boolean {
  return aleatorio() < probabilidade;
}
