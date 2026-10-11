// Gera o PDF da autoavaliação no próprio aparelho do aluno.
// Página 1 em diante: dados, notas e observações.
// Última página: "Minha evolução", com as notas coloridas de vermelho a verde.

import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable/es";
import { ATIVIDADES, GERAIS, type Item, type Nota } from "../data/itens";
import { corDaNota, rgb } from "./cores";
import { fmt1, fmtData, media, type Avaliacao } from "./historico";

import {
  INK,
  LINE,
  M,
  MUTED,
  TEAL,
  ZEBRA,
  desenharCabecalho,
  desenharRodape,
  slug,
} from "./pdfComum";

type Doc = jsPDF & { lastAutoTable: { finalY: number } };

function notaTexto(v: Nota): string {
  if (v === "na") return "Não pratiquei";
  return v == null ? "–" : String(v);
}

export function nomeArquivo(av: Avaliacao): string {
  return `autoavaliacao_etapa${av.etapa}_${slug(av.momento)}_${slug(av.nome)}.pdf`;
}

function pintarNota(d: CellHookData, col: number) {
  if (d.section !== "body" || d.column.index < col) return;
  const raw = String(d.cell.raw ?? "");
  const n = Number(raw.replace(",", "."));
  if (raw !== "" && raw !== "–" && !Number.isNaN(n)) {
    const c = corDaNota(n);
    d.cell.styles.fillColor = rgb(c.fundo);
    d.cell.styles.textColor = rgb(c.texto);
    d.cell.styles.fontStyle = "bold";
  }
}

export function gerarPDF(av: Avaliacao, historico: Avaliacao[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as Doc;
  const W = doc.internal.pageSize.getWidth();

  desenharCabecalho(
    doc,
    "Autoavaliação do Estágio Hospitalar",
    "Curso Técnico em Enfermagem · ead.postodeenfermagem.com.br"
  );

  autoTable(doc, {
    startY: 29,
    theme: "grid",
    margin: { left: M, right: M },
    styles: { fontSize: 10, cellPadding: 2.2, textColor: INK, lineColor: LINE },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30, fillColor: ZEBRA },
      2: { fontStyle: "bold", cellWidth: 26, fillColor: ZEBRA },
    },
    body: [
      ["Nome", av.nome, "Data", fmtData(av.data)],
      ["Turma", av.turma || "–", "Unidade", av.unidade || "–"],
      ["Etapa", `Etapa ${av.etapa}`, "Momento", av.momento],
    ],
  });

  const bloco = (titulo: string, itens: Item[], notas: Nota[], comDesde: boolean) => {
    const head = [["Nº", titulo, ...(comDesde ? ["Cobrado a partir"] : []), "Nota"]];
    const body = itens.map((it, i) => [
      String(i + 1),
      it.texto,
      ...(comDesde ? [`Etapa ${it.desde}`] : []),
      notaTexto(notas[i]),
    ]);
    const notaCol = comDesde ? 3 : 2;
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 7,
      theme: "striped",
      margin: { left: M, right: M },
      head,
      body,
      headStyles: { fillColor: TEAL, textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 2, textColor: INK, valign: "middle" },
      alternateRowStyles: { fillColor: ZEBRA },
      columnStyles: comDesde
        ? { 0: { cellWidth: 10 }, 2: { cellWidth: 26 }, 3: { cellWidth: 24, halign: "center" } }
        : { 0: { cellWidth: 10 }, 2: { cellWidth: 24, halign: "center" } },
      didParseCell: (d) => pintarNota(d, notaCol),
    });
    const y = doc.lastAutoTable.finalY + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(`Média: ${fmt1(media(notas))} (itens não praticados ficam fora da média)`, M, y);
    doc.lastAutoTable.finalY = y;
  };

  bloco("Aspectos gerais", GERAIS, av.gerais, false);
  bloco("Atividades desenvolvidas", ATIVIDADES, av.atividades, true);

  let y = doc.lastAutoTable.finalY + 9;
  const obs = doc.splitTextToSize(av.obs || "(não preenchido)", W - 2 * M) as string[];
  if (y + 12 + obs.length * 5 > 280) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("O que preciso estudar ou praticar mais", M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(obs, M, y + 6);

  // Evolução: todas as autoavaliações salvas até esta (inclusive)
  const lista = historico.length ? historico : [av];
  doc.addPage("a4", "landscape");
  const LW = doc.internal.pageSize.getWidth();
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, LW, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text("Minha evolução", M, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Vermelho = não conhece. Amarelo = conhece com ajuda. Verde escuro = domina. Traço = ainda não praticado.",
    M,
    22,
  );

  const cols = lista.map((r) => `Etapa ${r.etapa} ${r.momento}`);
  const linha = (n: number, it: Item, notas: (a: Avaliacao) => Nota[], i: number) => [
    String(n),
    it.curto,
    ...lista.map((r) => {
      const v = notas(r)[i];
      return typeof v === "number" ? String(v) : "–";
    }),
  ];
  const secao = (t: string) => [
    { content: t, colSpan: 2 + lista.length, styles: { fontStyle: "bold" as const, fillColor: [227, 243, 241] as [number, number, number] } },
  ];
  const body: unknown[][] = [];
  body.push(secao("Aspectos gerais"));
  GERAIS.forEach((it, i) => body.push(linha(i + 1, it, (r) => r.gerais, i)));
  body.push(["", "Média gerais", ...lista.map((r) => fmt1(media(r.gerais)))]);
  body.push(secao("Atividades desenvolvidas"));
  ATIVIDADES.forEach((it, i) => body.push(linha(i + 1, it, (r) => r.atividades, i)));
  body.push(["", "Média atividades", ...lista.map((r) => fmt1(media(r.atividades)))]);

  autoTable(doc, {
    startY: 26,
    theme: "grid",
    margin: { left: M, right: M },
    head: [["Nº", "Item", ...cols]],
    body: body as never,
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 8, halign: "center" },
    styles: { fontSize: 8, cellPadding: 1.3, textColor: INK, lineColor: LINE, halign: "center" },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 48, halign: "left" } },
    didParseCell: (d) => {
      const rotulo = Array.isArray(d.row.raw) ? String(d.row.raw[1] ?? "") : "";
      if (rotulo.startsWith("Média")) {
        d.cell.styles.fontStyle = "bold";
        return;
      }
      pintarNota(d, 2);
    },
  });

  desenharRodape(
    doc,
    "Autoavaliação do aluno. Não substitui a avaliação do supervisor de estágio."
  );
  return doc;
}

