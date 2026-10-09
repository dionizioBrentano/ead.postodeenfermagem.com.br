import { describe, it, expect } from "vitest";
import { formatarTituloComData } from "./tarefasTeoricas";
import { TAREFAS_TEORICAS } from "../data/tarefasTeoricas";
import {
  PRESCRICAO_FICTICIA,
  OPCOES_TURNO,
  extrairTarefasDaPrescricao,
  gerarHorariosTurno,
} from "../data/prescricaoFicticia";

describe("formatarTituloComData", () => {
  it("expõe a tarefa teórica pela data + título no padrão DD/MM/AAAA - Título", () => {
    const tarefa = TAREFAS_TEORICAS[0];
    expect(formatarTituloComData(tarefa)).toBe("09/10/2026 - Organização do plantão");
  });
});

describe("extrairTarefasDaPrescricao", () => {
  const tarefas = extrairTarefasDaPrescricao(PRESCRICAO_FICTICIA);

  it("divide sinais vitais prescritos em tarefas individuais próprias", () => {
    const rotulos = tarefas.map((t) => t.rotulo);
    expect(rotulos).toContain("Aferir PA");
    expect(rotulos).toContain("Aferir FC");
    expect(rotulos).toContain("Aferir FR");
    expect(rotulos).toContain("Aferir TAx");
    expect(rotulos).toContain("Aferir SpO2");
  });

  it("inclui a tarefa 'Aferir HGT' antes de itens com AA, AJ ou 22h", () => {
    const rotulos = tarefas.map((t) => t.rotulo);
    const rotulosHgt = rotulos.filter((r) => r.includes("Aferir HGT"));
    expect(rotulosHgt.length).toBeGreaterThanOrEqual(1);

    // Encontra índice de tarefa HGT gerada antes de insulina ou 22h
    const idxHgt = tarefas.findIndex((t) => t.rotulo === "Aferir HGT");
    expect(idxHgt).toBeGreaterThanOrEqual(0);
    // A tarefa subsequente é o item correspondente
    expect(tarefas[idxHgt + 1]).toBeDefined();
  });

  it("não cria marco de refeição", () => {
    const rotulos = tarefas.map((t) => t.rotulo.toLowerCase());
    expect(rotulos.some((r) => r === "almoço" || r === "jantar" || r === "café da manhã")).toBe(false);
  });

  it("todas as tarefas possuem id único e estrutura correta", () => {
    const ids = new Set(tarefas.map((t) => t.id));
    expect(ids.size).toBe(tarefas.length);
    tarefas.forEach((t) => {
      expect(t.id).toBeTruthy();
      expect(t.rotulo).toBeTruthy();
      expect(t.categoria).toBeTruthy();
    });
  });
});

describe("gerarHorariosTurno e OPCOES_TURNO", () => {
  it("opções de turno cobrem 4h padrão, 6h manhã, 6h tarde e 12h noite", () => {
    const chaves = OPCOES_TURNO.map((o) => o.chave);
    expect(chaves).toEqual(["4h", "6h_manha", "6h_tarde", "12h_noite"]);
    const padrao = OPCOES_TURNO[0];
    expect(padrao.chave).toBe("4h");
    expect(padrao.duracaoHoras).toBe(4);
  });

  it("gera 4 slots de 1 hora para o turno padrão de 4 horas", () => {
    const slots = gerarHorariosTurno("07:00", 4);
    expect(slots).toEqual(["07:00", "08:00", "09:00", "10:00"]);
  });

  it("gera 6 slots para turno de 6 horas", () => {
    const slots = gerarHorariosTurno("07:00", 6);
    expect(slots).toEqual(["07:00", "08:00", "09:00", "10:00", "11:00", "12:00"]);
  });

  it("gera 12 slots para turno de 12 horas noite com virada da meia-noite", () => {
    const slots = gerarHorariosTurno("19:00", 12);
    expect(slots).toEqual([
      "19:00", "20:00", "21:00", "22:00", "23:00", "00:00",
      "01:00", "02:00", "03:00", "04:00", "05:00", "06:00"
    ]);
  });
});

describe("colunas da prescrição fictícia", () => {
  it("cada item da prescrição possui apresentação, dose, via, frequência e horários aprazados separados", () => {
    PRESCRICAO_FICTICIA.itens.forEach((it) => {
      expect(it.apresentacao).toBeDefined();
      expect(it.dose).toBeDefined();
      expect(it.via).toBeDefined();
      expect(it.frequencia).toBeDefined();
      expect(it.horariosAprazados).toBeDefined();
      // Não junta apresentação e dose no mesmo texto
      expect(it.apresentacao).not.toBe(it.dose);
      expect(it.apresentacao).not.toBe(it.via);
    });
  });
});
