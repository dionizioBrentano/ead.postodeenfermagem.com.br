import { describe, expect, it } from "vitest";
import { ATIVIDADES } from "../data/itens";
import { TEXTOS_ASSUNTOS_ESTUDO } from "../data/textosAssuntosEstudo";
import type { ItemFichaRef, PromptEstudo, RevisaoAssunto } from "../types/ead";
import {
  ciclosDoAssunto,
  fontesPorIds,
  itemDaFicha,
  LIMITE_DUVIDA,
  montarPromptDeEstudo,
  mostrarAvisoRascunho,
  podeCopiarPrompt,
  rotasDosAssuntos,
  slugDoAssuntoNaRota,
} from "./assuntosEstudo";

describe("assuntosEstudo - regras puras", () => {
  const slugs = ["sinais-vitais-glicemia", "cuidados-higiene"] as const;

  it("slugDoAssuntoNaRota reconhece rotas válidas e rejeita outras", () => {
    expect(slugDoAssuntoNaRota("/estudo/sinais-vitais-glicemia", slugs)).toBe("sinais-vitais-glicemia");
    expect(slugDoAssuntoNaRota("/estudo/sinais-vitais-glicemia/", slugs)).toBe("sinais-vitais-glicemia");
    expect(slugDoAssuntoNaRota("/estudo", slugs)).toBeNull();
    expect(slugDoAssuntoNaRota("/sinais-vitais-glicemia", slugs)).toBeNull();
    expect(slugDoAssuntoNaRota("/estudo/outro-assunto", slugs)).toBeNull();
  });

  it("rotasDosAssuntos preserva a ordem dos slugs", () => {
    expect(rotasDosAssuntos(slugs)).toEqual([
      "estudo/sinais-vitais-glicemia",
      "estudo/cuidados-higiene",
    ]);
  });

  it("itemDaFicha localiza item 4 de atividades e lança erro para número fora da lista", () => {
    const refAtividade4: ItemFichaRef = { block: "atividades", number: 4 };
    const item = itemDaFicha(refAtividade4);
    expect(item.texto).toBe(ATIVIDADES[3]?.texto);

    const refInvalido: ItemFichaRef = { block: "atividades", number: 999 };
    expect(() => itemDaFicha(refInvalido)).toThrow(
      "Item da ficha inexistente no bloco atividades: número 999.",
    );

    const refGeraisInvalido: ItemFichaRef = { block: "gerais", number: 0 };
    expect(() => itemDaFicha(refGeraisInvalido)).toThrow(
      "Item da ficha inexistente no bloco gerais: número 0.",
    );
  });

  it("ciclosDoAssunto consolida ciclos sem repetição e em ordem crescente", () => {
    // ATIVIDADES[3] (item 4) tem desde: 1
    // ATIVIDADES[9] (item 10) tem desde: 2
    // ATIVIDADES[16] (item 17) tem desde: 3
    const itens: ItemFichaRef[] = [
      { block: "atividades", number: 10 },
      { block: "atividades", number: 4 },
      { block: "gerais", number: 1 },
      { block: "atividades", number: 4 },
      { block: "atividades", number: 17 },
    ];
    expect(ciclosDoAssunto(itens)).toEqual([1, 2, 3]);
  });

  it("fontesPorIds retorna as fontes na ordem dos IDs e omite inexistentes", () => {
    const fontes = [
      { id: "f1", title: "Fonte 1", type: "book" },
      { id: "f2", title: "Fonte 2", type: "article" },
    ];
    expect(fontesPorIds(["f2", "f1", "fInexistente"], fontes)).toEqual([
      fontes[1],
      fontes[0],
    ]);
    expect(fontesPorIds(undefined, fontes)).toEqual([]);
  });

  it("montarPromptDeEstudo e podeCopiarPrompt tratam as três situações de dúvida", () => {
    const promptFixo: PromptEstudo = {
      id: "p1",
      title: "Explicação",
      text: "Explique a técnica.",
      accepts_question: false,
    };
    const promptDuvida: PromptEstudo = {
      id: "p2",
      title: "Tire sua dúvida",
      text: "Você é um supervisor docente.",
      accepts_question: true,
    };

    // 1. prompt sem accepts_question: copia sempre texto direto
    expect(podeCopiarPrompt(promptFixo, "")).toBe(true);
    expect(podeCopiarPrompt(promptFixo, "   ")).toBe(true);
    expect(montarPromptDeEstudo(promptFixo, "")).toBe("Explique a técnica.");

    // 2. prompt com accepts_question e dúvida vazia ou com espaços: não pode copiar
    expect(podeCopiarPrompt(promptDuvida, "")).toBe(false);
    expect(podeCopiarPrompt(promptDuvida, "   ")).toBe(false);

    // 3. prompt com accepts_question e dúvida preenchida: pode copiar e anexa prefixo
    expect(podeCopiarPrompt(promptDuvida, "Qual o valor da glicemia?")).toBe(true);
    const montado = montarPromptDeEstudo(promptDuvida, "  Qual o valor da glicemia?  ");
    expect(montado).toBe(
      `Você é um supervisor docente.\n\n${TEXTOS_ASSUNTOS_ESTUDO.prefixoDuvida} Qual o valor da glicemia?`,
    );
  });

  it("LIMITE_DUVIDA é 1000", () => {
    expect(LIMITE_DUVIDA).toBe(1000);
  });

  it("mostrarAvisoRascunho retorna verdadeiro para rascunho e revisado, falso para publicado", () => {
    const baseRevisao: Omit<RevisaoAssunto, "status"> = {
      version: 1,
      created_at: "2026-10-15",
      reviewed_by: null,
      reviewed_at: null,
      next_review: null,
    };

    expect(mostrarAvisoRascunho({ ...baseRevisao, status: "rascunho" })).toBe(true);
    expect(mostrarAvisoRascunho({ ...baseRevisao, status: "revisado" })).toBe(true);
    expect(mostrarAvisoRascunho({ ...baseRevisao, status: "publicado" })).toBe(false);
  });
});
