import { describe, expect, it } from "vitest";
import { ABAS_SUPERVISAO_DO_MENU } from "../data/abasMenu";
import {
  abaInicialDaBusca,
  CHAVE_DASHBOARD,
  CHAVE_INICIO,
  destinoDoItemDoMenu,
  itemDoMenuAtivo,
} from "./navegacaoMenu";

describe("destinoDoItemDoMenu", () => {
  it("item sem rota devolve troca de aba com a chave correspondente", () => {
    const destino = destinoDoItemDoMenu("/supervisao", "avaliacao_sup");
    expect(destino).toEqual({ tipo: "aba", chave: "avaliacao_sup" });
  });

  it("item com rota igual à atual (/administracao em /administracao, chave convites) devolve troca de aba com a chave convites", () => {
    const destino = destinoDoItemDoMenu(
      "/administracao",
      "convites",
      "/administracao"
    );
    expect(destino).toEqual({ tipo: "aba", chave: "convites" });
  });

  it("item com rota diferente (/supervisao vindo de /administracao, chave paralelo) devolve rota /supervisao?aba=paralelo", () => {
    const destino = destinoDoItemDoMenu(
      "/administracao",
      "paralelo",
      "/supervisao"
    );
    expect(destino).toEqual({
      tipo: "rota",
      para: "/supervisao?aba=paralelo",
    });
  });

  it("chave com caractere especial sai codificada no endereço", () => {
    const destino = destinoDoItemDoMenu(
      "/administracao",
      "aba teste&especial=1",
      "/supervisao"
    );
    expect(destino).toEqual({
      tipo: "rota",
      para: "/supervisao?aba=aba%20teste%26especial%3D1",
    });
  });
});

describe("abaInicialDaBusca", () => {
  const permitidas = ["avaliacao_sup", "paralelo", "grafico"] as const;
  const padrao = "avaliacao_sup";

  it("?aba=paralelo com paralelo permitida devolve paralelo", () => {
    expect(abaInicialDaBusca("?aba=paralelo", permitidas, padrao)).toBe(
      "paralelo"
    );
  });

  it("busca vazia devolve o valor padrão", () => {
    expect(abaInicialDaBusca("", permitidas, padrao)).toBe(padrao);
  });

  it("?aba= vazio devolve o valor padrão", () => {
    expect(abaInicialDaBusca("?aba=", permitidas, padrao)).toBe(padrao);
  });

  it("?aba=xyz (não permitida) devolve o valor padrão", () => {
    expect(abaInicialDaBusca("?aba=xyz", permitidas, padrao)).toBe(padrao);
  });

  it("?outro=1&aba=grafico devolve grafico", () => {
    expect(
      abaInicialDaBusca("?outro=1&aba=grafico", permitidas, padrao)
    ).toBe("grafico");
  });

  it("aba existente mas fora da lista permitida (ex.: transcrever_auto com ABAS_SUPERVISAO_DO_MENU) devolve o valor padrão", () => {
    expect(
      abaInicialDaBusca(
        "?aba=transcrever_auto",
        ABAS_SUPERVISAO_DO_MENU,
        "avaliacao_sup"
      )
    ).toBe("avaliacao_sup");
  });
});

describe("itemDoMenuAtivo", () => {
  it("mesma chave e mesma rota devolve verdadeiro", () => {
    expect(
      itemDoMenuAtivo("/administracao", "convites", "convites", "/administracao")
    ).toBe(true);
  });

  it("mesma chave calendario, item com rota /administracao, estando em /supervisao devolve falso (evita calendário duplicado)", () => {
    expect(
      itemDoMenuAtivo("/supervisao", "calendario", "calendario", "/administracao")
    ).toBe(false);
  });

  it("item sem rota com a chave da aba ativa devolve verdadeiro", () => {
    expect(
      itemDoMenuAtivo("/supervisao", "avaliacao_sup", "avaliacao_sup")
    ).toBe(true);
  });

  it("chave inicio com aba ativa dashboard, e o inverso devolve verdadeiro", () => {
    expect(
      itemDoMenuAtivo("/sala", CHAVE_DASHBOARD, CHAVE_INICIO)
    ).toBe(true);
    expect(
      itemDoMenuAtivo("/sala", CHAVE_INICIO, CHAVE_DASHBOARD)
    ).toBe(true);
  });

  it("chaves diferentes devolve falso", () => {
    expect(
      itemDoMenuAtivo("/administracao", "docentes", "convites", "/administracao")
    ).toBe(false);
  });
});
