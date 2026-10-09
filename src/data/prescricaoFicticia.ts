export interface PrescricaoItem {
  id: string;
  categoria: "dieta" | "cuidado" | "sinais_vitais" | "medicamento" | "sn";
  apresentacao: string;
  dose: string;
  via: string;
  frequencia: string;
  horariosAprazados: string;
  temAA_AJ_22h?: boolean;
}

export interface MarcaPrimeiraVia {
  status: "nenhum" | "checado" | "circulado";
  motivo?: "nao_feito" | "reaprazado";
  horarioNovo?: string;
}

export interface TarefaArrastavel {
  id: string;
  rotulo: string;
  itemIdOriginal: string;
  categoria: "dieta" | "cuidado" | "sinais_vitais" | "medicamento" | "sn" | "glicemia";
  detalhes?: string;
}

export interface PrescricaoFicticia {
  hospital: string;
  unidade: string;
  leito: string;
  prontuario: string;
  paciente: string;
  idade: string;
  data: string;
  diagnostico: string;
  alergias: string;
  itens: PrescricaoItem[];
}

export const PRESCRICAO_FICTICIA: PrescricaoFicticia = {
  hospital: "Hospital de Ensino Simulado",
  unidade: "Clínica Cirúrgica",
  leito: "Leito 104-B (Simulado)",
  prontuario: "000842",
  paciente: "Paciente Simulado de Estágio",
  idade: "54 anos",
  data: "09/10/2026",
  diagnostico: "Pós-operatório de colecistectomia videolaparoscópica / HAS / DM2",
  alergias: "Nega alergias medicamentosas conhecidas",
  itens: [
    {
      id: "item-dieta",
      categoria: "dieta",
      apresentacao: "Dieta branda para DM e HAS",
      dose: "—",
      via: "VO",
      frequencia: "Conforme rotina",
      horariosAprazados: "Horários da nutrição",
    },
    {
      id: "item-cabiceira",
      categoria: "cuidado",
      apresentacao: "Repouso no leito com cabeceira elevada a 30°",
      dose: "—",
      via: "Leito",
      frequencia: "Contínuo",
      horariosAprazados: "Contínuo",
    },
    {
      id: "item-ssvv",
      categoria: "sinais_vitais",
      apresentacao: "Aferição de sinais vitais (PA, FC, FR, TAx, SpO2)",
      dose: "—",
      via: "Beira do leito",
      frequencia: "4/4h",
      horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
    },
    {
      id: "item-omeprazol",
      categoria: "medicamento",
      apresentacao: "Omeprazol pó liofilizado (diluir em 100 mL SF 0,9%)",
      dose: "40 mg",
      via: "EV",
      frequencia: "1x ao dia",
      horariosAprazados: "08h",
    },
    {
      id: "item-dipirona-fixa",
      categoria: "medicamento",
      apresentacao: "Dipirona 500 mg/mL solução injetável (diluir em 18 mL AD)",
      dose: "1 g (2 mL)",
      via: "EV",
      frequencia: "6/6h",
      horariosAprazados: "06h - 12h - 18h - 24h",
    },
    {
      id: "item-cefazolina",
      categoria: "medicamento",
      apresentacao: "Cefazolina pó para solução injetável (diluir em 100 mL SF 0,9%)",
      dose: "1 g",
      via: "EV",
      frequencia: "8/8h",
      horariosAprazados: "06h - 14h - 22h",
    },
    {
      id: "item-insulina-hgt",
      categoria: "medicamento",
      apresentacao: "Insulina Regular 100 UI/mL frasco-ampola",
      dose: "Conforme escala HGT",
      via: "SC",
      frequencia: "AA, AJ e 22h",
      horariosAprazados: "S/N (se glicemia > 180 mg/dL)",
      temAA_AJ_22h: true,
    },
    {
      id: "item-enoxaparina",
      categoria: "medicamento",
      apresentacao: "Enoxaparina sódica seringa preenchida",
      dose: "40 mg (0,4 mL)",
      via: "SC",
      frequencia: "1x ao dia",
      horariosAprazados: "22h",
      temAA_AJ_22h: true,
    },
    {
      id: "item-curativo",
      categoria: "cuidado",
      apresentacao: "Curativo oclusivo em ferida cirúrgica com SF 0,9%",
      dose: "—",
      via: "Tópica",
      frequencia: "1x ao dia",
      horariosAprazados: "10h",
    },
    {
      id: "item-diurese",
      categoria: "cuidado",
      apresentacao: "Controle de diurese e balanço de eliminações",
      dose: "—",
      via: "Beira do leito",
      frequencia: "4/4h",
      horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
    },
    {
      id: "item-decubito",
      categoria: "cuidado",
      apresentacao: "Mudança de decúbito e deambulação assistida",
      dose: "—",
      via: "Leito",
      frequencia: "A cada 2 horas",
      horariosAprazados: "Horários pares",
    },
    {
      id: "item-avp",
      categoria: "cuidado",
      apresentacao: "Salinização de cateter venoso periférico com SF 0,9%",
      dose: "3 mL",
      via: "EV",
      frequencia: "12/12h",
      horariosAprazados: "08h - 20h",
    },
    {
      id: "item-metoclopramida-sn",
      categoria: "sn",
      apresentacao: "Metoclopramida 5 mg/mL solução injetável (diluir em 10 mL SF 0,9%)",
      dose: "10 mg (2 mL)",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se náuseas ou vômitos (até 8/8h)",
    },
    {
      id: "item-dipirona-sn",
      categoria: "sn",
      apresentacao: "Dipirona 500 mg/mL solução injetável (diluir em 18 mL AD)",
      dose: "1 g (2 mL)",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se dor intensa ou febre (até 6/6h)",
    },
  ],
};

/**
 * Converte os itens da prescrição fictícia nas tarefas arrastáveis.
 * Regras didáticas:
 * - Cada sinal vital vira tarefa própria: Aferir PA, Aferir FC, Aferir FR, Aferir TAx, Aferir SpO2.
 * - Se o item contiver AA, AJ ou 22h, inclui a tarefa "Aferir HGT" antes desse item.
 * - Não cria marcos de refeição. Não bloqueia horários rígidos.
 */
export function extrairTarefasDaPrescricao(prescricao: PrescricaoFicticia): TarefaArrastavel[] {
  const tarefas: TarefaArrastavel[] = [];

  for (const item of prescricao.itens) {
    if (item.categoria === "sinais_vitais") {
      tarefas.push(
        { id: `${item.id}-pa`, rotulo: "Aferir PA", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Pressão Arterial" },
        { id: `${item.id}-fc`, rotulo: "Aferir FC", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Frequência Cardíaca" },
        { id: `${item.id}-fr`, rotulo: "Aferir FR", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Frequência Respiratória" },
        { id: `${item.id}-tax`, rotulo: "Aferir TAx", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Temperatura Axilar" },
        { id: `${item.id}-spo2`, rotulo: "Aferir SpO2", itemIdOriginal: item.id, categoria: "sinais_vitais", detalhes: "Saturação de Oxigênio" }
      );
      continue;
    }

    // Regra: se o item tiver AA, AJ ou 22h, incluir "Aferir HGT" antes do item
    if (item.temAA_AJ_22h) {
      tarefas.push({
        id: `${item.id}-hgt-pre`,
        rotulo: "Aferir HGT",
        itemIdOriginal: item.id,
        categoria: "glicemia",
        detalhes: "Glicemia capilar prévia",
      });
    }

    if (item.id === "item-insulina-hgt") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Insulina Regular SC",
        itemIdOriginal: item.id,
        categoria: "medicamento",
        detalhes: "Conforme resultado do HGT",
      });
      continue;
    }

    if (item.id === "item-enoxaparina") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Enoxaparina 40 mg SC",
        itemIdOriginal: item.id,
        categoria: "medicamento",
        detalhes: "Horário previsto: 22h",
      });
      continue;
    }

    if (item.id === "item-omeprazol") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Omeprazol 40 mg EV",
        itemIdOriginal: item.id,
        categoria: "medicamento",
        detalhes: "08h",
      });
      continue;
    }

    if (item.id === "item-dipirona-fixa") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Dipirona 1 g EV",
        itemIdOriginal: item.id,
        categoria: "medicamento",
        detalhes: "Horários: 06h - 12h - 18h - 24h",
      });
      continue;
    }

    if (item.id === "item-cefazolina") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Cefazolina 1 g EV",
        itemIdOriginal: item.id,
        categoria: "medicamento",
        detalhes: "Horários: 06h - 14h - 22h",
      });
      continue;
    }

    if (item.id === "item-curativo") {
      tarefas.push({
        id: `${item.id}-tarefa`,
        rotulo: "Curativo incisão (SF 0,9%)",
        itemIdOriginal: item.id,
        categoria: "cuidado",
        detalhes: "10h",
      });
      continue;
    }

    // Itens gerais e cuidados
    tarefas.push({
      id: `${item.id}-tarefa`,
      rotulo: item.dose !== "—" ? `${item.apresentacao.split(" (")[0]} ${item.dose}` : item.apresentacao,
      itemIdOriginal: item.id,
      categoria: item.categoria,
      detalhes: `${item.via} · ${item.horariosAprazados || item.frequencia}`,
    });
  }

  return tarefas;
}

export type TipoTurno = "4h" | "6h_manha" | "6h_tarde" | "12h_noite";

export interface OpcaoTurno {
  chave: TipoTurno;
  rotulo: string;
  duracaoHoras: number;
  inicioPadrao: string;
}

export const OPCOES_TURNO: OpcaoTurno[] = [
  { chave: "4h", rotulo: "4 horas (estágio)", duracaoHoras: 4, inicioPadrao: "07:00" },
  { chave: "6h_manha", rotulo: "6 horas (manhã)", duracaoHoras: 6, inicioPadrao: "07:00" },
  { chave: "6h_tarde", rotulo: "6 horas (tarde)", duracaoHoras: 6, inicioPadrao: "13:00" },
  { chave: "12h_noite", rotulo: "12 horas (noite)", duracaoHoras: 12, inicioPadrao: "19:00" },
];

/**
 * Gera a grade de horários do turno a partir da hora de início e duração em horas.
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
