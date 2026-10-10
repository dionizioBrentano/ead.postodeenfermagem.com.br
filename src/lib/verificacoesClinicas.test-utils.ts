import { expect } from "vitest";
import type { PrescricaoFicticia } from "../data/prescricaoFicticia";
import { extrairTarefasDaPrescricao } from "./organizacaoPlantao";

export interface OpcoesVerificacaoClinica {
  exigeConflitoEV?: boolean;
}

export function verificarRegrasClinicasDaPrescricao(
  prescricao: PrescricaoFicticia,
  opcoes: OpcoesVerificacaoClinica = {}
): void {
  // 1. idade e peso preenchidos
  expect(prescricao.idade.trim().length).toBeGreaterThan(0);
  expect(prescricao.peso.trim().length).toBeGreaterThan(0);

  // 2. "Aferir HGT" só antes de item com exigeGlicemiaCapilar (e nunca antes de enoxaparina)
  const tarefas = extrairTarefasDaPrescricao(prescricao);

  const indicesHgt = tarefas
    .map((t, idx) => (t.rotulo === "Aferir HGT" ? idx : -1))
    .filter((idx) => idx !== -1);

  const itensComGlicemia = prescricao.itens.filter((i) => i.exigeGlicemiaCapilar);
  expect(indicesHgt.length).toBe(itensComGlicemia.length);

  for (const idx of indicesHgt) {
    const proximaTarefa = tarefas[idx + 1];
    expect(proximaTarefa).toBeDefined();

    const itemAlvo = prescricao.itens.find((i) => i.id === proximaTarefa.itemIdOriginal);
    expect(itemAlvo).toBeDefined();
    expect(itemAlvo?.exigeGlicemiaCapilar).toBe(true);
    expect(itemAlvo?.apresentacao.toLowerCase()).not.toContain("enoxaparina");
  }

  for (const item of itensComGlicemia) {
    const idxItem = tarefas.findIndex(
      (t) => t.itemIdOriginal === item.id && t.categoria !== "glicemia"
    );
    expect(idxItem).toBeGreaterThan(0);
    expect(tarefas[idxItem - 1].rotulo).toBe("Aferir HGT");
  }

  const idxEnox = tarefas.findIndex((t) => t.rotulo.toLowerCase().includes("enoxaparina"));
  if (idxEnox !== -1) {
    expect(tarefas[idxEnox - 1]?.rotulo).not.toBe("Aferir HGT");
  }

  // 3. nenhuma droga fixa e "se necessário" ao mesmo tempo (primeira palavra da apresentação, sem diferenciar maiúsculas)
  const medsFixos = prescricao.itens
    .filter((i) => i.categoria === "medicamento")
    .map((i) => i.apresentacao.trim().split(/\s+/)[0].toLowerCase());

  const medsSN = prescricao.itens
    .filter((i) => i.categoria === "sn")
    .map((i) => i.apresentacao.trim().split(/\s+/)[0].toLowerCase());

  const intersecao = medsFixos.filter((primeiraPalavra) => medsSN.includes(primeiraPalavra));
  expect(intersecao).toEqual([]);

  // 4. dose com número e unidade (mg, g, UI, mL, cp, gotas) ou começando com "Conforme"
  const itensFarmaco = prescricao.itens.filter(
    (i) => i.categoria === "medicamento" || i.categoria === "sn"
  );
  expect(itensFarmaco.length).toBeGreaterThan(0);

  const regexDose = /\d+([.,]\d+)?\s*(mg|g|UI|mL|cp|gotas)\b/i;

  for (const item of itensFarmaco) {
    const doseValida = item.dose.startsWith("Conforme") || regexDose.test(item.dose);
    expect(
      doseValida,
      `Item ${item.id} (${item.apresentacao}) tem dose inválida: '${item.dose}'`
    ).toBe(true);
  }

  // 5. opção exigeConflitoEV: pelo menos dois itens com via "EV" no mesmo horário
  if (opcoes.exigeConflitoEV) {
    const itensEV = prescricao.itens.filter((i) => i.via === "EV");
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
  }
}
