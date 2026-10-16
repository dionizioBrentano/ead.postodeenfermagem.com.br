import { describe, it, expect } from "vitest";
import {
  medicaoAtiva,
  enderecoParaAnalise,
  dadosDaOrganizacao,
  PADRAO_ID_MEDICAO,
} from "./analise";
import type { Membership } from "../api/client";

describe("analise", () => {
  describe("PADRAO_ID_MEDICAO", () => {
    it("valida o formato esperado do identificador de medicao", () => {
      expect(PADRAO_ID_MEDICAO.test("G-ABC123XYZ")).toBe(true);
      expect(PADRAO_ID_MEDICAO.test("UA-12345-1")).toBe(false);
      expect(PADRAO_ID_MEDICAO.test("")).toBe(false);
    });
  });

  describe("medicaoAtiva", () => {
    it("devolve true para identificador valido em producao", () => {
      expect(medicaoAtiva("G-ABC123XYZ", false)).toBe(true);
    });

    it("devolve false para identificador vazio", () => {
      expect(medicaoAtiva("", false)).toBe(false);
    });

    it("devolve false para identificador invalido", () => {
      expect(medicaoAtiva("invalido", false)).toBe(false);
      expect(medicaoAtiva("UA-12345", false)).toBe(false);
      expect(medicaoAtiva("g-abc123xyz", false)).toBe(false);
    });

    it("devolve false quando em desenvolvimento, mesmo com identificador valido", () => {
      expect(medicaoAtiva("G-ABC123XYZ", true)).toBe(false);
    });
  });

  describe("enderecoParaAnalise", () => {
    it("remove parametros de busca de /convite?token=abc", () => {
      const res = enderecoParaAnalise("https://exemplo.com.br", "/convite?token=abc");
      expect(res).toBe("https://exemplo.com.br/convite");
    });

    it("remove parametros e hash de /entrar/retorno?code=x#y", () => {
      const res = enderecoParaAnalise("https://exemplo.com.br", "/entrar/retorno?code=x#y");
      expect(res).toBe("https://exemplo.com.br/entrar/retorno");
    });

    it("preserva rota normal sem busca nem hash", () => {
      const res = enderecoParaAnalise("https://exemplo.com.br", "/sala");
      expect(res).toBe("https://exemplo.com.br/sala");
    });

    it("trata origem com barra final e caminho sem barra inicial", () => {
      const res = enderecoParaAnalise("https://exemplo.com.br/", "sala");
      expect(res).toBe("https://exemplo.com.br/sala");
    });
  });

  describe("dadosDaOrganizacao", () => {
    const vinculoEscolaA: Membership = {
      id: "vinc-1",
      organizacao: { id: "org-escola-a", nome: "Escola Tecnica Alfa", trilho_principal: "ensino" },
      trilho: "ensino",
      papel: "aluno",
      situacao: "ativo",
      atribuicoes: [],
    };

    const vinculoEscolaB: Membership = {
      id: "vinc-2",
      organizacao: { id: "org-escola-b", nome: "Escola Tecnica Beta", trilho_principal: "ensino" },
      trilho: "ensino",
      papel: "aluno",
      situacao: "ativo",
      atribuicoes: [],
    };

    it("com vinculo da organizacao: devolve id e nome da organizacao", () => {
      const dados = dadosDaOrganizacao("org-escola-a", [vinculoEscolaA, vinculoEscolaB]);
      expect(dados).toEqual({
        organizacao_id: "org-escola-a",
        organizacao_nome: "Escola Tecnica Alfa",
      });
    });

    it("com vinculo de outra organizacao: devolve apenas organizacao_id", () => {
      const dados = dadosDaOrganizacao("org-escola-c", [vinculoEscolaA, vinculoEscolaB]);
      expect(dados).toEqual({
        organizacao_id: "org-escola-c",
      });
    });

    it("sem vinculo: devolve apenas organizacao_id", () => {
      const dados = dadosDaOrganizacao("org-escola-a", []);
      expect(dados).toEqual({
        organizacao_id: "org-escola-a",
      });
    });
  });
});
