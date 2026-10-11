import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable/es";
import { TEXTOS_PDF_COLA } from "../data/prescricaoFicticia";
import { VALOR_CAMPO_AUSENTE_COLA, type ColaPlantao } from "./colaPlantao";
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

const QUANTIDADE_LINHAS_PENDENCIAS = 4;
const ALTURA_LINHA_PENDENCIA_MM = 7;

export function nomeArquivoCola(cola: ColaPlantao): string {
  const dataComHifens =
    cola.cabecalho.data
      .trim()
      .replace(/[^0-9a-zA-Z]+/g, "-")
      .replace(/^-|-$/g, "") || "data";
  const turnoSlug = slug(cola.cabecalho.turno);
  return `organizacao-plantao_${dataComHifens}_${turnoSlug}.pdf`;
}

export function gerarPdfCola(cola: ColaPlantao): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as Doc;
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();

  desenharCabecalho(doc, TEXTOS_PDF_COLA.titulo, TEXTOS_PDF_COLA.subtitulo);

  // 2. Dados do paciente
  autoTable(doc, {
    startY: 29,
    theme: "grid",
    margin: { left: M, right: M },
    styles: { fontSize: 9.5, cellPadding: 2, textColor: INK, lineColor: LINE },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 28, fillColor: ZEBRA },
      2: { fontStyle: "bold", cellWidth: 28, fillColor: ZEBRA },
    },
    body: [
      [
        TEXTOS_PDF_COLA.rotuloPaciente,
        cola.cabecalho.paciente,
        TEXTOS_PDF_COLA.rotuloLeito,
        cola.cabecalho.leito,
      ],
      [
        TEXTOS_PDF_COLA.rotuloIdade,
        cola.cabecalho.idade,
        TEXTOS_PDF_COLA.rotuloPeso,
        cola.cabecalho.peso,
      ],
      [
        TEXTOS_PDF_COLA.rotuloData,
        cola.cabecalho.data,
        TEXTOS_PDF_COLA.rotuloTurno,
        cola.cabecalho.turno,
      ],
      [
        TEXTOS_PDF_COLA.rotuloDiagnostico,
        cola.cabecalho.diagnostico,
        TEXTOS_PDF_COLA.rotuloAlergias,
        cola.cabecalho.alergias,
      ],
    ],
  });

  // 3. Cuidados por horário
  const corpoHorarios =
    cola.linhas.length > 0
      ? cola.linhas.map((l) => [l.horario, l.cuidado, l.detalhes, ""])
      : [[VALOR_CAMPO_AUSENTE_COLA, VALOR_CAMPO_AUSENTE_COLA, VALOR_CAMPO_AUSENTE_COLA, ""]];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    theme: "grid",
    margin: { left: M, right: M },
    showHead: "everyPage",
    head: [
      [
        TEXTOS_PDF_COLA.colunaHorario,
        TEXTOS_PDF_COLA.colunaCuidado,
        TEXTOS_PDF_COLA.colunaDetalhes,
        TEXTOS_PDF_COLA.colunaFeito,
      ],
    ],
    body: corpoHorarios,
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 9.5 },
    styles: {
      fontSize: 9,
      cellPadding: 2.2,
      textColor: INK,
      lineColor: LINE,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold" },
      3: { cellWidth: 24, halign: "center" },
    },
  });

  // 4. Se necessário
  const corpoSN =
    cola.seNecessario.length > 0
      ? cola.seNecessario.map((sn) => [sn.cuidado, sn.regra, "", ""])
      : [[VALOR_CAMPO_AUSENTE_COLA, VALOR_CAMPO_AUSENTE_COLA, "", ""]];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    theme: "grid",
    margin: { left: M, right: M },
    showHead: "everyPage",
    head: [
      [
        TEXTOS_PDF_COLA.colunaMedicamentoSN,
        TEXTOS_PDF_COLA.colunaRegraSN,
        TEXTOS_PDF_COLA.colunaUltimaDoseSN,
        TEXTOS_PDF_COLA.colunaProximaDoseSN,
      ],
    ],
    body: corpoSN,
    headStyles: { fillColor: TEAL, textColor: 255, fontSize: 9.5 },
    styles: {
      fontSize: 9,
      cellPadding: 2.2,
      textColor: INK,
      lineColor: LINE,
      valign: "middle",
    },
    columnStyles: {
      2: { cellWidth: 32 },
      3: { cellWidth: 36 },
    },
  });

  // 5. Legenda + 6. Pendências para o próximo plantão (4 linhas em branco)
  let y = doc.lastAutoTable.finalY + 6;
  const alturaNecessaria =
    14 + QUANTIDADE_LINHAS_PENDENCIAS * ALTURA_LINHA_PENDENCIA_MM;
  if (y + alturaNecessaria > alturaPagina - 14) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const [antesCirculo, depoisCirculo] = TEXTOS_PDF_COLA.legenda.split("○");
  if (depoisCirculo !== undefined) {
    doc.text(antesCirculo, M, y);
    const xCirculo = M + doc.getTextWidth(antesCirculo) + 1.2;
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.3);
    doc.circle(xCirculo, y - 1, 1, "S");
    doc.text(depoisCirculo, xCirculo + 1.3, y);
  } else {
    doc.text(TEXTOS_PDF_COLA.legenda, M, y);
  }

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(TEXTOS_PDF_COLA.pendenciasTitulo, M, y);

  doc.setDrawColor(...LINE);
  for (let i = 1; i <= QUANTIDADE_LINHAS_PENDENCIAS; i++) {
    const linhaY = y + i * ALTURA_LINHA_PENDENCIA_MM;
    doc.line(M, linhaY, larguraPagina - M, linhaY);
  }

  // 7. Rodapé em todas as páginas
  desenharRodape(doc, TEXTOS_PDF_COLA.rodape);

  return doc;
}
