import { describe, it, expect } from "vitest";
// @ts-ignore
import * as fs from "node:fs";
// @ts-ignore
import * as path from "node:path";
import {
  PRESCRICAO_ESTUDO,
  PRESCRICAO_TESTE,
  OPCOES_TURNO,
  PASSOS_COMO_ORGANIZAR,
} from "../data/prescricaoFicticia";
import {
  extrairTarefasDaPrescricao,
  gerarHorariosTurno,
} from "./organizacaoPlantao";

describe("Bloco 1: Prescrição de estudo", () => {
  it("prescrição de estudo possui itens estruturados em 5 colunas", () => {
    expect(PRESCRICAO_ESTUDO.itens.length).toBeGreaterThan(0);
    PRESCRICAO_ESTUDO.itens.forEach((it) => {
      expect(it.apresentacao).toBeDefined();
      expect(it.dose).toBeDefined();
      expect(it.via).toBeDefined();
      expect(it.frequencia).toBeDefined();
      expect(it.horariosAprazados).toBeDefined();
      expect(it.apresentacao).not.toBe(it.dose);
      expect(it.apresentacao).not.toBe(it.via);
    });
  });
});

describe("Bloco 2: Como organizar", () => {
  it("passos seguem rigorosamente a ordem exigida pelas diretrizes de enfermagem", () => {
    expect(PASSOS_COMO_ORGANIZAR).toEqual([
      "escolha o turno;",
      "crie uma janela para cada hora do turno;",
      "copie o cuidado da prescrição de teste para a janela do horário aprazado;",
      "S/N não entra em hora fixa, fica na lista de se necessário;",
      "no mesmo horário e no mesmo acesso, antecipe a infusão mais curta e atrase a mais demorada, até 30 minutos;",
      "na 1ª via, checar o realizado e circular o não feito ou o reaprazado;",
      "na conduta, escreva o que checou, o que circulou, o motivo e o horário novo.",
    ]);
  });
});

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

describe("Vigilância clínica: Regra de glicemia capilar (Aferir HGT)", () => {
  const prescricoes = [
    { nome: "PRESCRICAO_ESTUDO", prescricao: PRESCRICAO_ESTUDO },
    { nome: "PRESCRICAO_TESTE", prescricao: PRESCRICAO_TESTE },
  ];

  prescricoes.forEach(({ nome, prescricao }) => {
    it(`em ${nome}, 'Aferir HGT' aparece só imediatamente antes de itens com exigeGlicemiaCapilar verdadeiro e nunca antes da enoxaparina`, () => {
      const tarefas = extrairTarefasDaPrescricao(prescricao);

      const indicesHgt = tarefas
        .map((t, idx) => (t.rotulo === "Aferir HGT" ? idx : -1))
        .filter((idx) => idx !== -1);

      expect(indicesHgt.length).toBeGreaterThan(0);

      indicesHgt.forEach((idx) => {
        const proximaTarefa = tarefas[idx + 1];
        expect(proximaTarefa).toBeDefined();

        const itemAlvo = prescricao.itens.find((i) => i.id === proximaTarefa.itemIdOriginal);
        expect(itemAlvo).toBeDefined();
        expect(itemAlvo?.exigeGlicemiaCapilar).toBe(true);
        expect(itemAlvo?.apresentacao.toLowerCase()).not.toContain("enoxaparina");
      });

      const itensComGlicemia = prescricao.itens.filter((i) => i.exigeGlicemiaCapilar);
      itensComGlicemia.forEach((item) => {
        const idxItem = tarefas.findIndex(
          (t) => t.itemIdOriginal === item.id && t.categoria !== "glicemia"
        );
        expect(idxItem).toBeGreaterThan(0);
        expect(tarefas[idxItem - 1].rotulo).toBe("Aferir HGT");
      });

      const idxEnox = tarefas.findIndex((t) => t.rotulo.toLowerCase().includes("enoxaparina"));
      if (idxEnox !== -1) {
        expect(tarefas[idxEnox - 1]?.rotulo).not.toBe("Aferir HGT");
      }
    });
  });
});

describe("Vigilância clínica: Não duplicidade fixa vs S/N do mesmo medicamento", () => {
  const prescricoes = [
    { nome: "PRESCRICAO_ESTUDO", prescricao: PRESCRICAO_ESTUDO },
    { nome: "PRESCRICAO_TESTE", prescricao: PRESCRICAO_TESTE },
  ];

  prescricoes.forEach(({ nome, prescricao }) => {
    it(`em ${nome}, nenhum medicamento aparece ao mesmo tempo com categoria 'medicamento' e 'sn'`, () => {
      const medsFixos = prescricao.itens
        .filter((i) => i.categoria === "medicamento")
        .map((i) => i.apresentacao.trim().split(/\s+/)[0].toLowerCase());

      const medsSN = prescricao.itens
        .filter((i) => i.categoria === "sn")
        .map((i) => i.apresentacao.trim().split(/\s+/)[0].toLowerCase());

      const intersecao = medsFixos.filter((primeiraPalavra) => medsSN.includes(primeiraPalavra));
      expect(intersecao).toEqual([]);
    });
  });
});

describe("Vigilância clínica: Validação de doses de medicamentos e S/N", () => {
  const prescricoes = [
    { nome: "PRESCRICAO_ESTUDO", prescricao: PRESCRICAO_ESTUDO },
    { nome: "PRESCRICAO_TESTE", prescricao: PRESCRICAO_TESTE },
  ];

  prescricoes.forEach(({ nome, prescricao }) => {
    it(`em ${nome}, todo item de medicamento e sn tem dose com número e unidade (mg, g, UI, mL ou cp) ou começa com 'Conforme'`, () => {
      const itensFarmaco = prescricao.itens.filter(
        (i) => i.categoria === "medicamento" || i.categoria === "sn"
      );
      expect(itensFarmaco.length).toBeGreaterThan(0);

      const regexDose = /\d+([.,]\d+)?\s*(mg|g|UI|mL|cp)\b/i;

      itensFarmaco.forEach((item) => {
        const doseValida = item.dose.startsWith("Conforme") || regexDose.test(item.dose);
        expect(doseValida, `Item ${item.id} (${item.apresentacao}) tem dose inválida: '${item.dose}'`).toBe(true);
      });
    });
  });
});

describe("Vigilância clínica: Conflito de horário EV na Prescrição de Teste", () => {
  it("PRESCRICAO_TESTE tem pelo menos dois itens com via 'EV' que compartilham o mesmo horário em horariosAprazados", () => {
    const itensEV = PRESCRICAO_TESTE.itens.filter((i) => i.via === "EV");
    expect(itensEV.length).toBeGreaterThanOrEqual(2);

    const ocorrenciasPorHorario: Record<string, string[]> = {};

    for (const item of itensEV) {
      const horarios = item.horariosAprazados.match(/\b\d{1,2}h\b/g) || [];
      for (const h of horarios) {
        ocorrenciasPorHorario[h] = ocorrenciasPorHorario[h] || [];
        ocorrenciasPorHorario[h].push(item.id);
      }
    }

    const horariosComConflito = Object.entries(ocorrenciasPorHorario).filter(
      ([_, itens]) => itens.length >= 2
    );

    expect(horariosComConflito.length).toBeGreaterThanOrEqual(1);

    const itensAs06h = ocorrenciasPorHorario["06h"] || [];
    expect(itensAs06h).toContain("teste-ceftriaxona");
    expect(itensAs06h).toContain("teste-metronidazol");
  });
});

describe("Vigilância clínica: Ausência da tabela e sigla externa em src/", () => {
  it("nenhum arquivo dentro de src/ contém a sigla proibida em qualquer grafia", () => {
    const srcDir = path.resolve("src");
    const siglaProibida = ["G", "H", "C"].join("").toLowerCase();

    function coletarArquivos(dir: string): string[] {
      const entradas = fs.readdirSync(dir, { withFileTypes: true });
      const arquivos: string[] = [];
      for (const entrada of entradas) {
        const caminhoCompleto = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
          arquivos.push(...coletarArquivos(caminhoCompleto));
        } else if (entrada.isFile()) {
          arquivos.push(caminhoCompleto);
        }
      }
      return arquivos;
    }

    const todosArquivos = coletarArquivos(srcDir);
    expect(todosArquivos.length).toBeGreaterThan(0);

    const violacoes: string[] = [];
    for (const arq of todosArquivos) {
      const conteudo = fs.readFileSync(arq, "utf-8").toLowerCase();
      if (conteudo.includes(siglaProibida)) {
        violacoes.push(path.relative(srcDir, arq));
      }
    }

    expect(violacoes).toEqual([]);
  });
});
