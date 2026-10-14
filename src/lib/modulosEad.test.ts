import { describe, it, expect } from "vitest";
import {
  slugDoModuloNaRota,
  rotasDosModulos,
  rotuloTipoFonte,
} from "./modulosEad";
import { TEXTOS_MODULOS_EAD } from "../data/textosModulosEad";

describe("modulosEad - regras puras de rotas e tipos dos módulos", () => {
  const slugsExemplo = ["m0", "m1", "m2"] as const;

  it("identifica slug do módulo em rotas diretas (/m1) e prefixadas (/ead/m1), e null para desconhecido", () => {
    expect(slugDoModuloNaRota("/m1", slugsExemplo)).toBe("m1");
    expect(slugDoModuloNaRota("/ead/m1", slugsExemplo)).toBe("m1");
    expect(slugDoModuloNaRota("/m0", slugsExemplo)).toBe("m0");
    expect(slugDoModuloNaRota("/ead/m0", slugsExemplo)).toBe("m0");
    expect(slugDoModuloNaRota("/m2", slugsExemplo)).toBe("m2");
    expect(slugDoModuloNaRota("/ead/m2", slugsExemplo)).toBe("m2");
    expect(slugDoModuloNaRota("/m3", slugsExemplo)).toBeNull();
    expect(slugDoModuloNaRota("/sala", slugsExemplo)).toBeNull();
  });

  it("trata rotas com barra no fim (/m1/ e /ead/m1/) corretamente", () => {
    expect(slugDoModuloNaRota("/m1/", slugsExemplo)).toBe("m1");
    expect(slugDoModuloNaRota("/ead/m1/", slugsExemplo)).toBe("m1");
  });

  it("gera lista de rotas dos módulos respeitando a ordem de slug e ead/slug", () => {
    const rotas = rotasDosModulos(["m0", "m1", "m2"]);
    expect(rotas).toEqual(["m0", "ead/m0", "m1", "ead/m1", "m2", "ead/m2"]);
  });

  it("converte tipo de fonte conhecido para rótulo legível e mantém tipo desconhecido", () => {
    expect(rotuloTipoFonte("video")).toBe(TEXTOS_MODULOS_EAD.tipoFonteVideo);
    expect(rotuloTipoFonte("book")).toBe(TEXTOS_MODULOS_EAD.tipoFonteLivro);
    expect(rotuloTipoFonte("article")).toBe(TEXTOS_MODULOS_EAD.tipoFonteArtigo);
    expect(rotuloTipoFonte("podcast")).toBe("podcast");
    expect(rotuloTipoFonte("diretriz")).toBe("diretriz");
  });
});
