import type { jsPDF } from "jspdf";

export const TEAL: [number, number, number] = [15, 124, 116];
export const INK: [number, number, number] = [21, 35, 43];
export const MUTED: [number, number, number] = [86, 102, 111];
export const LINE: [number, number, number] = [214, 223, 227];
export const ZEBRA: [number, number, number] = [243, 246, 247];
export const M = 14;

export function slug(t: string): string {
  return (t || "aluno")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function desenharCabecalho(
  doc: jsPDF,
  titulo: string,
  subtitulo: string
): void {
  const w = doc.internal.pageSize.getWidth();
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, w, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(titulo, M, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(subtitulo, M, 24);
}

export function desenharRodape(doc: jsPDF, texto: string): void {
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(texto, M, ph - 8);
    doc.text(`Página ${p} de ${paginas}`, pw - M, ph - 8, { align: "right" });
  }
}
