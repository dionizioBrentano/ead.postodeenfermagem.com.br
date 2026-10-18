// Escala de notas universal (0 a 10).
// Nenhum valor de cor repetido no código TypeScript: os valores vêm dos tokens CSS.

export const ESCALA_DE_NOTAS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function classeDaNota(n: number): string {
  const nota = Math.max(0, Math.min(10, Math.round(n)));
  return `nota-${nota}`;
}

export function rgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function corDaNotaParaPdf(n: number): { fundo: [number, number, number]; texto: [number, number, number] } {
  const nota = Math.max(0, Math.min(10, Math.round(n)));
  const estilo = getComputedStyle(document.documentElement);
  const fundo = estilo.getPropertyValue(`--cor-nota-${nota}`).trim();
  const texto = estilo.getPropertyValue(`--cor-nota-${nota}-texto`).trim();
  return {
    fundo: rgb(fundo),
    texto: rgb(texto),
  };
}
