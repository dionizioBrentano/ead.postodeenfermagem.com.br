import { describe, it, expect } from "vitest";
import { historicoParaPdf, ordenar, type Avaliacao } from "./historico";

function mockAvaliacao(etapa: number, momento: "Início" | "Meio" | "Final", nome = "Teste"): Avaliacao {
  return {
    etapa,
    momento,
    data: "2026-10-16",
    nome,
    turma: "Turma A",
    unidade: "Hospital Escola",
    gerais: [8, 9],
    atividades: [7, 8],
    obs: `Obs etapa ${etapa} momento ${momento}`,
    criadoEm: "2026-10-16T10:00:00Z",
  };
}

describe("historico", () => {
  describe("ordenar", () => {
    it("ordena avaliações por etapa e depois por momento", () => {
      const a1 = mockAvaliacao(1, "Final");
      const a2 = mockAvaliacao(1, "Início");
      const a3 = mockAvaliacao(2, "Início");
      const a4 = mockAvaliacao(1, "Meio");

      const res = ordenar([a1, a2, a3, a4]);
      expect(res.map((x) => `${x.etapa}-${x.momento}`)).toEqual([
        "1-Início",
        "1-Meio",
        "1-Final",
        "2-Início",
      ]);
    });
  });

  describe("historicoParaPdf", () => {
    it("junta lista existente com a nova avaliação ordenada", () => {
      const e1i = mockAvaliacao(1, "Início");
      const e1m = mockAvaliacao(1, "Meio");
      const e1f = mockAvaliacao(1, "Final");

      const res = historicoParaPdf([e1i, e1m], e1f);
      expect(res.map((x) => `${x.etapa}-${x.momento}`)).toEqual([
        "1-Início",
        "1-Meio",
        "1-Final",
      ]);
    });

    it("substitui avaliação anterior se tiver mesma etapa e momento", () => {
      const e1iAntiga = mockAvaliacao(1, "Início", "Antigo");
      const e1iNova = mockAvaliacao(1, "Início", "Novo");
      const e1m = mockAvaliacao(1, "Meio");

      const res = historicoParaPdf([e1iAntiga, e1m], e1iNova);
      // e1m é posterior a e1iNova, portanto é filtrada fora
      expect(res).toHaveLength(1);
      expect(res[0].nome).toBe("Novo");
    });

    it("mantém apenas avaliações até a etapa e momento da nova avaliação", () => {
      const e1i = mockAvaliacao(1, "Início");
      const e1m = mockAvaliacao(1, "Meio");
      const e1f = mockAvaliacao(1, "Final");
      const e2i = mockAvaliacao(2, "Início");
      const e2f = mockAvaliacao(2, "Final");

      // Gerando para Etapa 2 Início: descarta Etapa 2 Final que possa estar na lista
      const res = historicoParaPdf([e1i, e1m, e1f, e2f], e2i);
      expect(res.map((x) => `${x.etapa}-${x.momento}`)).toEqual([
        "1-Início",
        "1-Meio",
        "1-Final",
        "2-Início",
      ]);
    });

    it("mantém histórico vazio se lista for vazia e devolve apenas a avaliação atual", () => {
      const e1i = mockAvaliacao(1, "Início");
      const res = historicoParaPdf([], e1i);
      expect(res).toEqual([e1i]);
    });
  });
});
