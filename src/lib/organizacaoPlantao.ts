import type { PrescricaoFicticia, TarefaArrastavel } from "../data/prescricaoFicticia";

/**
 * Converte os itens da prescrição fictícia nas tarefas arrastáveis/copiáveis.
 * Regras didáticas:
 * - Cada sinal vital vira tarefa própria: Aferir PA, Aferir FC, Aferir FR, Aferir TAx, Aferir SpO2.
 * - A tarefa "Aferir HGT" entra antes do item somente quando exigeGlicemiaCapilar for verdadeiro.
 * - Não cria marcos de refeição.
 * - Identifica itens Se Necessário (S/N).
 */
export function extrairTarefasDaPrescricao(prescricao: PrescricaoFicticia): TarefaArrastavel[] {
  const tarefas: TarefaArrastavel[] = [];

  for (const item of prescricao.itens) {
    if (item.categoria === "sinais_vitais") {
      tarefas.push(
        { id: `${item.id}-pa`, rotulo: "Aferir PA", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Pressão Arterial · 4/4h" },
        { id: `${item.id}-fc`, rotulo: "Aferir FC", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Frequência Cardíaca · 4/4h" },
        { id: `${item.id}-fr`, rotulo: "Aferir FR", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Frequência Respiratória · 4/4h" },
        { id: `${item.id}-tax`, rotulo: "Aferir TAx", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Temperatura Axilar · 4/4h" },
        { id: `${item.id}-spo2`, rotulo: "Aferir SpO2", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Saturação de Oxigênio · 4/4h" }
      );
      continue;
    }

    // Regra: se exigeGlicemiaCapilar for verdadeiro, incluir "Aferir HGT" antes do item
    if (item.exigeGlicemiaCapilar) {
      tarefas.push({
        id: `${item.id}-hgt-pre`,
        rotulo: "Aferir HGT",
        itemIdOriginal: item.id,
        categoria: "glicemia",
        detalhes: "Glicemia capilar prévia obrigatória",
      });
    }

    const isSN = item.categoria === "sn" || item.frequencia === "S/N" || item.horariosAprazados.startsWith("S/N");

    const detalhes = `${item.via} · ${item.horariosAprazados}`;

    const rotuloBase = item.apresentacao.split(" (")[0];
    const rotulo = item.dose !== "—" ? `${rotuloBase} ${item.dose}` : rotuloBase;

    tarefas.push({
      id: `${item.id}-tarefa`,
      rotulo,
      itemIdOriginal: item.id,
      categoria: item.categoria,
      detalhes,
      isSN,
    });
  }

  return tarefas;
}

/**
 * Gera as janelas horárias do turno a partir da hora de início e duração em horas.
 */
export function gerarHorariosTurno(inicioHora: string, duracaoHoras: number): string[] {
  const [hStr, mStr] = inicioHora.split(":");
  const h = parseInt(hStr || "7", 10);
  const m = mStr || "00";
  const slots: string[] = [];

  for (let i = 0; i < duracaoHoras; i++) {
    const hora = (h + i) % 24;
    slots.push(`${String(hora).padStart(2, "0")}:${m}`);
  }

  return slots;
}
