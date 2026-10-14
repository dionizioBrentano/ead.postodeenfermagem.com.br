export type Setor = "clinica_medica" | "clinica_cirurgica";
export type TipoCuidado =
  | "minimo"
  | "intermediario"
  | "alta_dependencia"
  | "semi_intensivo"
  | "intensivo";
export type Sexo = "feminino" | "masculino";
export type Comorbidade =
  | "hipertensao"
  | "diabetes"
  | "obesidade"
  | "doenca_renal_cronica"
  | "depressao"
  | "colesterol_alto"
  | "tabagismo"
  | "insuficiencia_cardiaca"
  | "dpoc"
  | "avc_previo";
export type EventoPossivel =
  | "pressao_baixa_antes_anti_hipertensivo"
  | "pressao_alta"
  | "saturacao_baixa"
  | "hipoglicemia"
  | "glicemia_alta"
  | "dor"
  | "nausea"
  | "queda"
  | "risco_lesao_pressao"
  | "pedido_do_paciente";

export interface PerfilEpidemiologico {
  chave: string;
  setor: Setor;
  motivos: string[]; // diagnóstico principal; o gerador sorteia um
  peso: number; // chance do perfil dentro do setor
  idadeMinima: number;
  idadeMaxima: number;
  proporcaoMulheres: number; // de 0 a 1
  comorbidadesObrigatorias: Comorbidade[];
  comorbidadesPossiveis: Comorbidade[];
  tiposCuidado: TipoCuidado[];
  eventosPossiveis: EventoPossivel[];
}

export const ORDEM_COMORBIDADES: Comorbidade[] = [
  "hipertensao",
  "diabetes",
  "obesidade",
  "doenca_renal_cronica",
  "depressao",
  "colesterol_alto",
  "tabagismo",
  "insuficiencia_cardiaca",
  "dpoc",
  "avc_previo",
];

export const ROTULO_SETOR: Record<Setor, string> = {
  clinica_medica: "Clínica Médica",
  clinica_cirurgica: "Clínica Cirúrgica",
};

export const ROTULO_TIPO_CUIDADO: Record<TipoCuidado, string> = {
  minimo: "Cuidado mínimo",
  intermediario: "Cuidado intermediário",
  alta_dependencia: "Alta dependência",
  semi_intensivo: "Cuidado semi-intensivo",
  intensivo: "Cuidado intensivo",
};

export const ROTULO_COMORBIDADE: Record<Comorbidade, string> = {
  hipertensao: "Hipertensão arterial",
  diabetes: "Diabetes tipo 2",
  obesidade: "Obesidade",
  doenca_renal_cronica: "Doença renal crônica",
  depressao: "Depressão",
  colesterol_alto: "Colesterol alto",
  tabagismo: "Tabagismo",
  insuficiencia_cardiaca: "Insuficiência cardíaca",
  dpoc: "Doença pulmonar obstrutiva crônica",
  avc_previo: "AVC prévio",
};

export const ROTULO_EVENTO: Record<EventoPossivel, string> = {
  pressao_baixa_antes_anti_hipertensivo:
    "Pressão baixa antes do anti-hipertensivo",
  pressao_alta: "Pressão alta",
  saturacao_baixa: "Saturação baixa",
  hipoglicemia: "Hipoglicemia",
  glicemia_alta: "Glicemia alta",
  dor: "Dor",
  nausea: "Náusea",
  queda: "Queda",
  risco_lesao_pressao: "Risco de lesão por pressão",
  pedido_do_paciente: "Pedido do paciente sobre o horário de um cuidado",
};

// Resolução Cofen 543/2017, parâmetros mantidos pela Resolução Cofen 743/2024 e pelo Parecer Normativo Cofen 1/2024.
export const CARGA_COFEN: Record<
  TipoCuidado,
  { horasPor24h: number; percentualEnfermeiro: number }
> = {
  minimo: { horasPor24h: 4, percentualEnfermeiro: 33 },
  intermediario: { horasPor24h: 6, percentualEnfermeiro: 33 },
  alta_dependencia: { horasPor24h: 10, percentualEnfermeiro: 36 },
  semi_intensivo: { horasPor24h: 10, percentualEnfermeiro: 42 },
  intensivo: { horasPor24h: 18, percentualEnfermeiro: 52 },
};

// Paciente intensivo não entra no gerador da enfermaria (decisão de 11/10/2026).
export const TIPOS_CUIDADO_DA_ENFERMARIA: TipoCuidado[] = [
  "minimo",
  "intermediario",
  "alta_dependencia",
  "semi_intensivo",
];

export const DISTRIBUICAO_TIPO_CUIDADO: Record<
  Setor,
  Record<TipoCuidado, number>
> = {
  // Fugulin, clínica médica do Hospital Escola da UFPel, 2019 (Boeno e Porto)
  clinica_medica: {
    minimo: 45.5,
    intermediario: 25.4,
    alta_dependencia: 15.8,
    semi_intensivo: 11.8,
    intensivo: 1.4,
  },
  // Fugulin, clínica cirúrgica do Hospital Nossa Senhora da Conceição, 2020 (Peixoto, dissertação Grupo Hospitalar Conceição)
  clinica_cirurgica: {
    minimo: 14,
    intermediario: 33,
    alta_dependencia: 30,
    semi_intensivo: 17,
    intensivo: 6,
  },
};

// Estatuto da Pessoa Idosa, Lei 10.741/2003
export const IDADE_IDOSO = 60;

// PNS 2019 (Malta 2022)
export const DIABETES_ADULTO_COM_HIPERTENSAO = 0.206;
export const DIABETES_ADULTO_SEM_HIPERTENSAO = 0.037;

export const FREQUENCIA_COMORBIDADE: Record<
  Comorbidade,
  { adulto: number; idoso: number; fonte: string }
> = {
  hipertensao: {
    adulto: 0.239,
    idoso: 0.615,
    fonte:
      "adulto: PNS 2019 (Malta 2022); idoso: idosos internados em clínica médica, Uberaba (Buranello 2016)",
  },
  diabetes: {
    adulto: 0.077,
    idoso: 0.404,
    fonte: "adulto: PNS 2019 (Malta 2022); idoso: Buranello 2016",
  },
  obesidade: {
    adulto: 0.283,
    idoso: 0.224,
    fonte:
      "adulto: Vigitel 2023, Porto Alegre; idoso: Vigitel 2023, 65 anos ou mais",
  },
  doenca_renal_cronica: {
    adulto: 0.067,
    idoso: 0.214,
    fonte: "PNS 2014-2015, exame de sangue (Malta 2019)",
  },
  depressao: {
    adulto: 0.179,
    idoso: 0.179,
    fonte: "PNS 2019, Rio Grande do Sul (Brito 2022)",
  },
  colesterol_alto: {
    adulto: 0,
    idoso: 0.263,
    fonte:
      "idoso: PNS 2019, idosos sem plano de saúde (Francisco 2022); adulto sem dado na pesquisa",
  },
  tabagismo: {
    adulto: 0.128,
    idoso: 0.091,
    fonte: "adulto: PNS 2019; idoso: Vigitel 2023, 65 anos ou mais",
  },
  insuficiencia_cardiaca: {
    adulto: 0.0113,
    idoso: 0.2,
    fonte:
      "adulto: PNS 2019 (Simões 2021); idoso: clínica médica do HC-UFMG (Almeida 2020)",
  },
  dpoc: {
    adulto: 0.0166,
    idoso: 0.084,
    fonte: "adulto: PNS 2019 (Simões 2021); idoso: HC-UFMG (Almeida 2020)",
  },
  avc_previo: {
    adulto: 0.0196,
    idoso: 0.11,
    fonte: "adulto: PNS 2019 (Simões 2021); idoso: HC-UFMG (Almeida 2020)",
  },
};

// Estimativa do Claude, sem fonte; revisar.
export const FAIXA_PESO_KG: Record<Sexo, { minimo: number; maximo: number }> = {
  feminino: { minimo: 50, maximo: 80 },
  masculino: { minimo: 60, maximo: 95 },
};

// Estimativa do Claude, sem fonte; revisar.
export const FAIXA_PESO_KG_OBESIDADE: Record<
  Sexo,
  { minimo: number; maximo: number }
> = {
  feminino: { minimo: 80, maximo: 115 },
  masculino: { minimo: 95, maximo: 130 },
};

export const COMORBIDADE_DO_PERFIL: Partial<Record<string, Comorbidade>> = {
  "diabetes-descompensado": "diabetes",
  dpoc: "dpoc",
};

export const PREFIXO_LEITO = "Leito ";
export const SEPARADOR_DIAGNOSTICO = " / ";

// Pesos e faixas de idade são estimativa a partir da pesquisa de 11/10/2026 (guia-pratico-cola.md). Têm fonte direta: colecistite com 3 mulheres para 1 homem (Vittalle, FURG); fratura de fêmur com 58,2% de mulheres (Rev Bras Ortop 2020).
export const PERFIS_EPIDEMIOLOGICOS: PerfilEpidemiologico[] = [
  {
    chave: "pneumonia",
    setor: "clinica_medica",
    motivos: ["Pneumonia adquirida na comunidade"],
    peso: 25,
    idadeMinima: 65,
    idadeMaxima: 90,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "hipertensao",
      "diabetes",
      "insuficiencia_cardiaca",
      "dpoc",
      "doenca_renal_cronica",
      "obesidade",
      "depressao",
      "tabagismo",
    ],
    tiposCuidado: ["intermediario", "alta_dependencia"],
    eventosPossiveis: ["saturacao_baixa", "pedido_do_paciente", "queda"],
  },
  {
    chave: "insuficiencia-cardiaca",
    setor: "clinica_medica",
    motivos: ["Insuficiência cardíaca descompensada"],
    peso: 20,
    idadeMinima: 60,
    idadeMaxima: 85,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "hipertensao",
      "diabetes",
      "doenca_renal_cronica",
      "obesidade",
      "depressao",
      "dpoc",
    ],
    tiposCuidado: ["intermediario", "alta_dependencia"],
    eventosPossiveis: [
      "pressao_baixa_antes_anti_hipertensivo",
      "saturacao_baixa",
    ],
  },
  {
    chave: "avc",
    setor: "clinica_medica",
    motivos: ["Acidente vascular cerebral isquêmico com hemiparesia"],
    peso: 15,
    idadeMinima: 55,
    idadeMaxima: 85,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "hipertensao",
      "diabetes",
      "tabagismo",
      "colesterol_alto",
      "obesidade",
    ],
    tiposCuidado: ["alta_dependencia", "semi_intensivo"],
    eventosPossiveis: [
      "pressao_alta",
      "pressao_baixa_antes_anti_hipertensivo",
      "queda",
      "risco_lesao_pressao",
    ],
  },
  {
    chave: "dpoc",
    setor: "clinica_medica",
    motivos: ["Doença pulmonar obstrutiva crônica exacerbada"],
    peso: 15,
    idadeMinima: 55,
    idadeMaxima: 80,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: ["tabagismo"],
    comorbidadesPossiveis: [
      "hipertensao",
      "insuficiencia_cardiaca",
      "diabetes",
      "depressao",
    ],
    tiposCuidado: ["intermediario", "alta_dependencia"],
    eventosPossiveis: ["saturacao_baixa"],
  },
  {
    chave: "infeccao-urinaria",
    setor: "clinica_medica",
    motivos: ["Infecção urinária alta (pielonefrite)"],
    peso: 15,
    idadeMinima: 60,
    idadeMaxima: 85,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "diabetes",
      "hipertensao",
      "doenca_renal_cronica",
      "obesidade",
      "depressao",
    ],
    tiposCuidado: ["minimo", "intermediario"],
    eventosPossiveis: ["dor", "nausea", "pedido_do_paciente"],
  },
  {
    chave: "diabetes-descompensado",
    setor: "clinica_medica",
    motivos: ["Diabetes tipo 2 descompensado"],
    peso: 10,
    idadeMinima: 45,
    idadeMaxima: 75,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "hipertensao",
      "obesidade",
      "doenca_renal_cronica",
      "depressao",
      "colesterol_alto",
    ],
    tiposCuidado: ["minimo", "intermediario"],
    eventosPossiveis: ["hipoglicemia", "glicemia_alta"],
  },
  {
    chave: "vascular",
    setor: "clinica_cirurgica",
    motivos: [
      "Pós-operatório de revascularização de membro inferior",
      "Pós-operatório de amputação de membro inferior",
    ],
    peso: 30,
    idadeMinima: 55,
    idadeMaxima: 80,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: ["tabagismo"],
    comorbidadesPossiveis: [
      "diabetes",
      "hipertensao",
      "doenca_renal_cronica",
      "dpoc",
      "colesterol_alto",
    ],
    tiposCuidado: ["alta_dependencia"],
    eventosPossiveis: ["dor", "hipoglicemia", "queda"],
  },
  {
    chave: "colecistectomia",
    setor: "clinica_cirurgica",
    motivos: ["Pós-operatório de colecistectomia videolaparoscópica"],
    peso: 25,
    idadeMinima: 30,
    idadeMaxima: 65,
    proporcaoMulheres: 0.75,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "obesidade",
      "hipertensao",
      "diabetes",
      "depressao",
    ],
    tiposCuidado: ["minimo", "intermediario"],
    eventosPossiveis: ["dor", "nausea", "pedido_do_paciente"],
  },
  {
    chave: "laparotomia",
    setor: "clinica_cirurgica",
    motivos: [
      "Pós-operatório de laparotomia por oclusão intestinal",
      "Pós-operatório de laparotomia por câncer colorretal",
    ],
    peso: 20,
    idadeMinima: 50,
    idadeMaxima: 80,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: ["hipertensao", "tabagismo", "dpoc", "diabetes"],
    tiposCuidado: ["intermediario", "alta_dependencia", "semi_intensivo"],
    eventosPossiveis: [
      "dor",
      "nausea",
      "pressao_baixa_antes_anti_hipertensivo",
    ],
  },
  {
    chave: "fratura-femur",
    setor: "clinica_cirurgica",
    motivos: ["Pós-operatório de fratura de fêmur"],
    peso: 15,
    idadeMinima: 70,
    idadeMaxima: 95,
    proporcaoMulheres: 0.582,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: [
      "hipertensao",
      "diabetes",
      "doenca_renal_cronica",
      "depressao",
    ],
    tiposCuidado: ["alta_dependencia", "semi_intensivo"],
    eventosPossiveis: ["dor", "queda", "risco_lesao_pressao"],
  },
  {
    chave: "hernia",
    setor: "clinica_cirurgica",
    motivos: ["Pós-operatório de herniorrafia da parede abdominal"],
    peso: 5,
    idadeMinima: 30,
    idadeMaxima: 70,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: ["hipertensao", "obesidade", "tabagismo"],
    tiposCuidado: ["minimo"],
    eventosPossiveis: ["dor", "pedido_do_paciente"],
  },
  {
    chave: "apendicectomia",
    setor: "clinica_cirurgica",
    motivos: ["Pós-operatório de apendicectomia"],
    peso: 5,
    idadeMinima: 15,
    idadeMaxima: 40,
    proporcaoMulheres: 0.5,
    comorbidadesObrigatorias: [],
    comorbidadesPossiveis: ["tabagismo", "obesidade"],
    tiposCuidado: ["minimo"],
    eventosPossiveis: ["dor"],
  },
];
