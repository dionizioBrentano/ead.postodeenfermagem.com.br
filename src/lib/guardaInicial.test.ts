import { describe, expect, it } from "vitest";
import type { Membership } from "../api/client";
import { guardaInicial } from "./guardaInicial";

const PERFIL = { name: "Pessoa Ficticia" };
const VINCULOS: Membership[] = [
  {
    id: "vinculo-1",
    organizacao: { id: "organizacao-1", nome: "Escola Ficticia", trilho_principal: "ensino" },
    trilho: "ensino",
    papel: "aluno",
    situacao: "ativo",
    atribuicoes: [],
  },
];

describe("guardaInicial", () => {
  it("abre na hora quando token, perfil e vinculos estao guardados", () => {
    expect(guardaInicial("token-ficticio", PERFIL, VINCULOS)).toEqual({
      estado: "ok",
      perfil: PERFIL,
      memberships: VINCULOS,
    });
  });

  it("abre na hora com lista de vinculos guardada vazia", () => {
    expect(guardaInicial("token-ficticio", PERFIL, [])).toEqual({
      estado: "ok",
      perfil: PERFIL,
      memberships: [],
    });
  });

  it("confirma antes quando nao ha token", () => {
    expect(guardaInicial(null, PERFIL, VINCULOS)).toEqual({ estado: "verificando" });
  });

  it("confirma antes quando nao ha perfil guardado", () => {
    expect(guardaInicial("token-ficticio", null, VINCULOS)).toEqual({ estado: "verificando" });
  });

  it("confirma antes quando nao ha vinculos guardados", () => {
    expect(guardaInicial("token-ficticio", PERFIL, null)).toEqual({ estado: "verificando" });
  });
});
