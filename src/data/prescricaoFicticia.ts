export interface PrescricaoItem {
  id: string;
  categoria: "dieta" | "cuidado" | "sinais_vitais" | "medicamento" | "sn";
  apresentacao: string;
  dose: string;
  via: string;
  frequencia: string;
  horariosAprazados: string;
  exigeGlicemiaCapilar?: boolean;
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
  isSN?: boolean;
}

export interface PrescricaoFicticia {
  hospital: string;
  unidade: string;
  leito: string;
  prontuario: string;
  paciente: string;
  idade: string;
  peso: string;
  data: string;
  diagnostico: string;
  alergias: string;
  itens: PrescricaoItem[];
}

/**
 * Bloco 1: Prescrição de estudo (fixa, imutável, para leitura do aluno).
 * O aluno não organiza esta prescrição.
 */
export const PRESCRICAO_ESTUDO: PrescricaoFicticia = {
  hospital: "Hospital de Ensino Simulado",
  unidade: "Clínica Cirúrgica",
  leito: "Leito 104-B (Simulado)",
  prontuario: "000842",
  paciente: "Paciente Simulado de Estágio",
  idade: "54 anos",
  peso: "82 kg",
  data: "09/10/2026",
  diagnostico: "Pós-operatório de colecistectomia videolaparoscópica / HAS / DM2",
  alergias: "Nega alergias medicamentosas conhecidas",
  itens: [
    {
      id: "estudo-dieta",
      categoria: "dieta",
      apresentacao: "Dieta branda para DM e HAS",
      dose: "—",
      via: "VO",
      frequencia: "Conforme rotina",
      horariosAprazados: "Horários da nutrição",
    },
    {
      id: "estudo-cabiceira",
      categoria: "cuidado",
      apresentacao: "Repouso no leito com cabeceira elevada a 30°",
      dose: "—",
      via: "Leito",
      frequencia: "Contínuo",
      horariosAprazados: "Contínuo",
    },
    {
      id: "estudo-ssvv",
      categoria: "sinais_vitais",
      apresentacao: "Aferição de sinais vitais (PA, FC, FR, TAx, SpO2)",
      dose: "—",
      via: "Beira do leito",
      frequencia: "4/4h",
      horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
    },
    {
      id: "estudo-omeprazol",
      categoria: "medicamento",
      apresentacao: "Omeprazol pó liofilizado (diluir em 100 mL SF 0,9%)",
      dose: "40 mg",
      via: "EV",
      frequencia: "1x ao dia",
      horariosAprazados: "08h",
    },
    {
      id: "estudo-cefazolina",
      categoria: "medicamento",
      apresentacao: "Cefazolina pó para solução injetável (diluir em 100 mL SF 0,9%)",
      dose: "1 g",
      via: "EV",
      frequencia: "8/8h",
      horariosAprazados: "06h - 14h - 22h",
    },
    {
      id: "estudo-insulina-hgt",
      categoria: "medicamento",
      apresentacao: "Insulina Regular 100 UI/mL frasco-ampola",
      dose: "Conforme escala HGT",
      via: "SC",
      frequencia: "AA, AJ e 22h",
      horariosAprazados: "S/N (se glicemia > 180 mg/dL)",
      exigeGlicemiaCapilar: true,
    },
    {
      id: "estudo-enoxaparina",
      categoria: "medicamento",
      apresentacao: "Enoxaparina sódica seringa preenchida",
      dose: "40 mg (0,4 mL)",
      via: "SC",
      frequencia: "1x ao dia",
      horariosAprazados: "22h",
    },
    {
      id: "estudo-curativo",
      categoria: "cuidado",
      apresentacao: "Curativo oclusivo em ferida cirúrgica com SF 0,9%",
      dose: "—",
      via: "Tópica",
      frequencia: "1x ao dia",
      horariosAprazados: "10h",
    },
    {
      id: "estudo-diurese",
      categoria: "cuidado",
      apresentacao: "Controle de diurese e balanço de eliminações",
      dose: "—",
      via: "Beira do leito",
      frequencia: "4/4h",
      horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
    },
    {
      id: "estudo-decubito",
      categoria: "cuidado",
      apresentacao: "Mudança de decúbito e deambulação assistida",
      dose: "—",
      via: "Leito",
      frequencia: "A cada 2 horas",
      horariosAprazados: "Horários pares",
    },
    {
      id: "estudo-avp",
      categoria: "cuidado",
      apresentacao: "Salinização de cateter venoso periférico com SF 0,9%",
      dose: "3 mL",
      via: "EV",
      frequencia: "12/12h",
      horariosAprazados: "08h - 20h",
    },
    {
      id: "estudo-metoclopramida-sn",
      categoria: "sn",
      apresentacao: "Metoclopramida 5 mg/mL solução injetável (diluir em 10 mL SF 0,9%)",
      dose: "10 mg (2 mL)",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se náuseas ou vômitos (até 8/8h)",
    },
    {
      id: "estudo-dipirona-sn",
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
 * Bloco 2: Passos do método "Como organizar".
 * Ordem rigorosa exigida pelas diretrizes de enfermagem.
 */
export const PASSOS_COMO_ORGANIZAR: string[] = [
  "escolha o turno;",
  "crie uma janela para cada hora do turno;",
  "copie o cuidado da prescrição de teste para a janela do horário aprazado;",
  "S/N não entra em hora fixa, fica na lista de se necessário;",
  "no mesmo horário e no mesmo acesso, antecipe a infusão mais curta e atrase a mais demorada, até 30 minutos;",
  "na 1ª via, checar o realizado e circular o não feito ou o reaprazado;",
  "na conduta, escreva o que checou, o que circulou, o motivo e o horário novo.",
];

export const CUIDADO_TESTE_DIETA: PrescricaoItem = {
  id: "teste-dieta",
  categoria: "dieta",
  apresentacao: "Dieta branda para diabetes",
  dose: "—",
  via: "VO",
  frequencia: "Conforme rotina",
  horariosAprazados: "Horários da nutrição",
};

export const CUIDADO_TESTE_SSVV: PrescricaoItem = {
  id: "teste-ssvv",
  categoria: "sinais_vitais",
  apresentacao: "Aferição de sinais vitais (PA, FC, FR, TAx, SpO2)",
  dose: "—",
  via: "Beira do leito",
  frequencia: "4/4h",
  horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
};

export const CUIDADO_TESTE_CURATIVO: PrescricaoItem = {
  id: "teste-curativo",
  categoria: "cuidado",
  apresentacao: "Curativo da ferida operatória com SF 0,9%",
  dose: "—",
  via: "Tópica",
  frequencia: "1x ao dia",
  horariosAprazados: "10h",
};

export const CUIDADO_TESTE_DECUBITO: PrescricaoItem = {
  id: "teste-decubito",
  categoria: "cuidado",
  apresentacao: "Mudança de decúbito e alívio de pontos de pressão",
  dose: "—",
  via: "Leito",
  frequencia: "A cada 2 horas",
  horariosAprazados: "Horários pares",
};

/**
 * Bloco 3: Prescrição de teste fixa (imutável, com conflito EV às 06h).
 */
export const PRESCRICAO_TESTE: PrescricaoFicticia = {
  hospital: "Hospital Escola Simulado",
  unidade: "Clínica Cirúrgica",
  leito: "Leito 208-A (simulação)",
  prontuario: "000000-SIM",
  paciente: "Paciente Simulado de Teste",
  idade: "61 anos",
  peso: "76 kg",
  data: "09/10/2026",
  diagnostico: "Pós-operatório de laparotomia / infecção intra-abdominal / diabetes tipo 2",
  alergias: "Nega alergias medicamentosas conhecidas",
  itens: [
    CUIDADO_TESTE_DIETA,
    CUIDADO_TESTE_SSVV,
    CUIDADO_TESTE_CURATIVO,
    CUIDADO_TESTE_DECUBITO,
    {
      id: "teste-ceftriaxona",
      categoria: "medicamento",
      apresentacao: "Ceftriaxona 1 g pó (reconstituir em 10 mL de AD, diluir em 100 mL de SF 0,9%, administrar em 30 min)",
      dose: "1 g",
      via: "EV",
      frequencia: "12/12h",
      horariosAprazados: "06h - 18h",
    },
    {
      id: "teste-metronidazol",
      categoria: "medicamento",
      apresentacao: "Metronidazol 500 mg/100 mL bolsa (pronto para uso, administrar em 60 min)",
      dose: "500 mg",
      via: "EV",
      frequencia: "8/8h",
      horariosAprazados: "06h - 14h - 22h",
    },
    {
      id: "teste-omeprazol",
      categoria: "medicamento",
      apresentacao: "Omeprazol 40 mg pó (diluir em 100 mL de SF 0,9%, administrar em 30 min)",
      dose: "40 mg",
      via: "EV",
      frequencia: "1x ao dia",
      horariosAprazados: "08h",
    },
    {
      id: "teste-enoxaparina",
      categoria: "medicamento",
      apresentacao: "Enoxaparina sódica 40 mg/0,4 mL seringa preenchida",
      dose: "40 mg",
      via: "SC",
      frequencia: "1x ao dia",
      horariosAprazados: "22h",
    },
    {
      id: "teste-insulina",
      categoria: "medicamento",
      apresentacao: "Insulina regular 100 UI/mL frasco-ampola",
      dose: "Conforme escala de glicemia capilar",
      via: "SC",
      frequencia: "AA, AJ e 22h",
      horariosAprazados: "AA, AJ e 22h",
      exigeGlicemiaCapilar: true,
    },
    {
      id: "teste-dipirona-sn",
      categoria: "sn",
      apresentacao: "Dipirona 500 mg/mL ampola 2 mL (diluir em 10 a 20 mL de SF 0,9%, administrar em 10 min)",
      dose: "1 g",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se dor ou febre (intervalo mínimo de 6 h)",
    },
    {
      id: "teste-ondansetrona-sn",
      categoria: "sn",
      apresentacao: "Ondansetrona 2 mg/mL ampola (EV direto lento, em 2 min)",
      dose: "4 mg",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se náuseas ou vômitos (intervalo mínimo de 8 h)",
    },
  ],
};

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

export const MENSAGEM_ERRO_SALVAR_SEM_TOKEN =
  "Você precisa entrar novamente para salvar.";
export const MENSAGEM_ERRO_SALVAR_API =
  "Não foi possível salvar. Confira a conexão e tente de novo.";
export const MENSAGEM_SUCESSO_RASCUNHO =
  "Rascunho da organização salvo com sucesso!";
export const MENSAGEM_SUCESSO_ENTREGUE_ALUNO =
  "Organização do plantão entregue com sucesso! A presença é decidida pelo professor.";
export const MENSAGEM_SUCESSO_ENTREGUE_DOCENTE =
  "Organização do plantão enviada com sucesso em modo de teste (origem: teste).";

