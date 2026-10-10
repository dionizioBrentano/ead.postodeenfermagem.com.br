import { describe, it, expect } from "vitest";
import {
  PRESCRICAO_ESTUDO,
  PRESCRICAO_TESTE,
  OPCOES_TURNO,
} from "../data/prescricaoFicticia";
import {
  extrairTarefasDaPrescricao,
  gerarHorariosTurno,
} from "./organizacaoPlantao";
import { verificarRegrasClinicasDaPrescricao } from "./verificacoesClinicas.test-utils";

describe("gerarHorariosTurno e OPCOES_TURNO", () => {
  it("opções de turno cobrem padrão 4 horas, 6h manhã, 6h tarde e 12h noite", () => {
    const chaves = OPCOES_TURNO.map((o) => o.chave);
    expect(chaves).toEqual(["4h", "6h_manha", "6h_tarde", "12h_noite"]);
    const padrao = OPCOES_TURNO[0];
    expect(padrao.chave).toBe("4h");
    expect(padrao.duracaoHoras).toBe(4);
  });

  it("gera 4 janelas para turno padrão de 4 horas", () => {
    const slots = gerarHorariosTurno("07:00", 4);
    expect(slots).toEqual(["07:00", "08:00", "09:00", "10:00"]);
  });

  it("gera 6 janelas para turno de 6 horas", () => {
    const slots = gerarHorariosTurno("07:00", 6);
    expect(slots).toEqual(["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]);
  });

  it("gera 12 janelas para turno de 12 horas noite", () => {
    const slots = gerarHorariosTurno("19:00", 12);
    expect(slots).toEqual([
      "19:00", "20:00", "21:00", "22:00", "23:00", "00:00",
      "01:00", "02:00", "03:00", "04:00", "05:00", "06:00",
    ]);
  });
});

describe("extrairTarefasDaPrescricao", () => {
  it("desmembra sinais vitais em tarefas separadas próprias", () => {
    const tarefas = extrairTarefasDaPrescricao(PRESCRICAO_TESTE);
    const rotulos = tarefas.map((t) => t.rotulo);

    expect(rotulos).toContain("Aferir PA");
    expect(rotulos).toContain("Aferir FC");
    expect(rotulos).toContain("Aferir FR");
    expect(rotulos).toContain("Aferir TAx");
    expect(rotulos).toContain("Aferir SpO2");
  });

  it("não cria marcos de refeição", () => {
    const tarefas = extrairTarefasDaPrescricao(PRESCRICAO_TESTE);
    const rotulos = tarefas.map((t) => t.rotulo.toLowerCase());

    expect(rotulos.some((r) => r.includes("almoço") || r.includes("jantar") || r.includes("café"))).toBe(false);
  });
});

describe("Vigilância clínica: PRESCRICAO_ESTUDO e PRESCRICAO_TESTE", () => {
  it("PRESCRICAO_ESTUDO cumpre as verificações clínicas (sem exigir conflito EV)", () => {
    verificarRegrasClinicasDaPrescricao(PRESCRICAO_ESTUDO, { exigeConflitoEV: false });
  });

  it("PRESCRICAO_TESTE cumpre as verificações clínicas (incluindo conflito EV)", () => {
    verificarRegrasClinicasDaPrescricao(PRESCRICAO_TESTE, { exigeConflitoEV: true });
  });
});

describe("Vigilância clínica: Ausência da tabela e sigla externa em src/", () => {
  it("nenhum arquivo dentro de src/ contém a sigla proibida em qualquer grafia", () => {
    const arquivos = import.meta.glob("/src/**/*.{ts,tsx,js,jsx,css,json,md,html}", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;

    const entradas = Object.entries(arquivos);
    expect(entradas.length).toBeGreaterThan(0);

    const siglaProibida = ["G", "H", "C"].join("").toLowerCase();
    const violacoes: string[] = [];

    for (const [caminho, conteudo] of entradas) {
      if (conteudo.toLowerCase().includes(siglaProibida)) {
        violacoes.push(caminho);
      }
    }

    expect(violacoes).toEqual([]);
  });
});
