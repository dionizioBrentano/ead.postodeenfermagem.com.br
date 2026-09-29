// Escala de cores das notas: 0 = vermelho (muito ruim) até 10 = verde escuro (domínio total).
// Uma cor por nota, para o aluno bater o olho e ver onde precisa estudar.

export const ESCALA: { fundo: string; texto: string }[] = [
  { fundo: "#b71c1c", texto: "#ffffff" }, // 0
  { fundo: "#d32f2f", texto: "#ffffff" }, // 1
  { fundo: "#e64a19", texto: "#1a1a1a" }, // 2
  { fundo: "#f57c00", texto: "#1a1a1a" }, // 3
  { fundo: "#ffa000", texto: "#1a1a1a" }, // 4
  { fundo: "#fbc02d", texto: "#1a1a1a" }, // 5
  { fundo: "#c0ca33", texto: "#1a1a1a" }, // 6
  { fundo: "#7cb342", texto: "#1a1a1a" }, // 7
  { fundo: "#43a047", texto: "#1a1a1a" }, // 8
  { fundo: "#2e7d32", texto: "#ffffff" }, // 9
  { fundo: "#1b5e20", texto: "#ffffff" }, // 10
];

export function corDaNota(n: number) {
  return ESCALA[Math.max(0, Math.min(10, Math.round(n)))];
}

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function faixa(n: number): string {
  if (n <= 3) return "Não conhece ou nunca fez";
  if (n <= 6) return "Conhece a teoria ou fez com ajuda";
  if (n <= 8) return "Faz com supervisão e segurança";
  return "Faz com segurança e sabe explicar";
}
