import {
  DOSE_INSULINA_ESCALA,
  FREQUENCIA_INSULINA_ESCALA,
  type MedicamentoFixoDoCenario,
  type MedicamentoSeNecessarioDoCenario,
} from "./cenariosPrescricaoTeste";
import type { Comorbidade, TipoCuidado } from "./perfisEpidemiologicos";

export const FREQUENCIA_1X_DIA = "1x ao dia";
export const FREQUENCIA_1X_DIA_NOITE = "1x ao dia, à noite";
export const FREQUENCIA_12_12H = "12/12h";
export const FREQUENCIA_8_8H = "8/8h";
export const FREQUENCIA_6_6H = "6/6h";
export const FREQUENCIA_4_4H = "4/4h";
export const FREQUENCIA_2_2H = "A cada 2 horas";
export const FREQUENCIA_CONTINUO = "Contínuo";
export const FREQUENCIA_ROTINA = "Conforme rotina";
export const FREQUENCIA_TOLERANCIA = "Conforme tolerância";
export const FREQUENCIA_JEJUM = "1x ao dia, em jejum";

export const FREQUENCIAS_DE_MEDICAMENTO: string[] = [
  FREQUENCIA_1X_DIA,
  FREQUENCIA_1X_DIA_NOITE,
  FREQUENCIA_12_12H,
  FREQUENCIA_8_8H,
  FREQUENCIA_6_6H,
  FREQUENCIA_4_4H,
  FREQUENCIA_INSULINA_ESCALA,
];

export interface MedicamentoSemCatalogo {
  nome: string;
  via: string;
  apresentacao: string;
}

/**
 * Medicamentos que não utilizam o catálogo de preparo de injetáveis.
 * Fonte das apresentações: "RENAME 2024, componente básico", exceto onde indicado.
 */
export const MEDICAMENTOS_SEM_CATALOGO: MedicamentoSemCatalogo[] = [
  {
    nome: "Azitromicina",
    via: "VO",
    apresentacao: "Azitromicina 500 mg comprimido",
  },
  {
    nome: "Ácido acetilsalicílico",
    via: "VO",
    apresentacao: "Ácido acetilsalicílico 100 mg comprimido",
  },
  {
    nome: "Sinvastatina",
    via: "VO",
    apresentacao: "Sinvastatina comprimido (20 mg ou 40 mg)",
  },
  {
    nome: "Carvedilol",
    via: "VO",
    apresentacao: "Carvedilol 6,25 mg comprimido",
  },
  {
    nome: "Enalapril",
    via: "VO",
    apresentacao: "Maleato de enalapril 10 mg comprimido",
  },
  {
    nome: "Espironolactona",
    via: "VO",
    apresentacao: "Espironolactona 25 mg comprimido",
  },
  {
    nome: "Furosemida",
    via: "VO",
    apresentacao: "Furosemida 40 mg comprimido",
  },
  {
    nome: "Hidroclorotiazida",
    via: "VO",
    apresentacao: "Hidroclorotiazida 25 mg comprimido",
  },
  {
    nome: "Losartana",
    via: "VO",
    apresentacao: "Losartana potássica 50 mg comprimido",
  },
  {
    nome: "Captopril",
    via: "VO",
    apresentacao: "Captopril 25 mg comprimido",
  },
  {
    nome: "Atenolol",
    via: "VO",
    apresentacao: "Atenolol 50 mg comprimido",
  },
  {
    nome: "Anlodipino",
    via: "VO",
    apresentacao: "Besilato de anlodipino 5 mg comprimido",
  },
  {
    nome: "Fluoxetina",
    via: "VO",
    apresentacao: "Cloridrato de fluoxetina 20 mg cápsula", // Fonte: Presença na RENAME 2024 não conferida
  },
  {
    nome: "Ipratrópio e fenoterol",
    via: "Inalatória",
    apresentacao:
      "Brometo de ipratrópio 0,25 mg/mL e bromidrato de fenoterol 5 mg/mL, soluções para inalação", // Fonte: Prescrição aprovada pelo Dionizio em 11/10/2026; fenoterol não conferido na RENAME
  },
  {
    nome: "Soro fisiológico 0,9%",
    via: "EV",
    apresentacao: "Cloreto de sódio 0,9% bolsa de 1.000 mL, pronto para uso", // Fonte: Prescrição aprovada pelo Dionizio em 11/10/2026
  },
];

export const VIA_SONDA_NASOENTERAL = "Sonda nasoenteral";

export interface CuidadoModelo {
  chave: string;
  categoria: "cuidado";
  apresentacao: string;
  frequencia: string;
}

export interface PrescricaoDoPerfil {
  dietaBase: string;
  cuidados: CuidadoModelo[];
  medicamentosFixos: MedicamentoFixoDoCenario[];
  medicamentosSeNecessario: MedicamentoSeNecessarioDoCenario[];
  substituiAntiHipertensivosDeCasa: boolean;
}

export const CUIDADO_OXIGENIO_94_98: CuidadoModelo = {
  chave: "oxigenio-94-98",
  categoria: "cuidado",
  apresentacao: "Oxigênio por cateter nasal para manter SpO2 entre 94% e 98%",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CUIDADO_OXIGENIO_88_92: CuidadoModelo = {
  chave: "oxigenio-88-92",
  categoria: "cuidado",
  apresentacao: "Oxigênio por cateter nasal para manter SpO2 entre 88% e 92%",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CUIDADO_CABECEIRA_30_45: CuidadoModelo = {
  chave: "cabeceira-30-45",
  categoria: "cuidado",
  apresentacao: "Cabeceira elevada entre 30° e 45°",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CUIDADO_CABECEIRA_30: CuidadoModelo = {
  chave: "cabeceira-30",
  categoria: "cuidado",
  apresentacao: "Cabeceira elevada a 30°",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CUIDADO_PESO_DIARIO: CuidadoModelo = {
  chave: "peso-diario",
  categoria: "cuidado",
  apresentacao: "Peso diário em jejum",
  frequencia: FREQUENCIA_JEJUM,
};

export const CUIDADO_BALANCO_HIDRICO: CuidadoModelo = {
  chave: "balanco-hidrico",
  categoria: "cuidado",
  apresentacao: "Controle de balanço hídrico",
  frequencia: FREQUENCIA_ROTINA,
};

export const CUIDADO_RESTRICAO_HIDRICA: CuidadoModelo = {
  chave: "restricao-hidrica",
  categoria: "cuidado",
  apresentacao: "Restrição hídrica de 1.000 mL em 24 horas",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CUIDADO_DECUBITO: CuidadoModelo = {
  chave: "decubito",
  categoria: "cuidado",
  apresentacao: "Mudança de decúbito e alívio de pontos de pressão",
  frequencia: FREQUENCIA_2_2H,
};

export const CUIDADO_CURATIVO_FERIDA: CuidadoModelo = {
  chave: "curativo-ferida",
  categoria: "cuidado",
  apresentacao: "Curativo da ferida operatória com SF 0,9%",
  frequencia: FREQUENCIA_1X_DIA,
};

export const CUIDADO_CURATIVO_MEMBRO: CuidadoModelo = {
  chave: "curativo-membro",
  categoria: "cuidado",
  apresentacao: "Curativo do membro operado com SF 0,9%",
  frequencia: FREQUENCIA_1X_DIA,
};

export const CUIDADO_DEAMBULACAO: CuidadoModelo = {
  chave: "deambulacao",
  categoria: "cuidado",
  apresentacao: "Estimular deambulação",
  frequencia: FREQUENCIA_TOLERANCIA,
};

export const CUIDADO_SONDA_NASOGASTRICA: CuidadoModelo = {
  chave: "sonda-nasogastrica",
  categoria: "cuidado",
  apresentacao: "Sonda nasogástrica aberta em frasco coletor",
  frequencia: FREQUENCIA_CONTINUO,
};

export const CRITERIO_DOR_OU_FEBRE = "dor ou febre";
export const CRITERIO_DOR_MODERADA = "dor moderada";
export const CRITERIO_NAUSEA = "náuseas ou vômitos";

/**
 * Prescrição fictícia proposta pelo Claude e aprovada pelo Dionizio em 11/10/2026.
 */
export const PRESCRICAO_POR_PERFIL: Record<string, PrescricaoDoPerfil> = {
  pneumonia: {
    dietaBase: "Dieta geral",
    cuidados: [CUIDADO_OXIGENIO_94_98, CUIDADO_CABECEIRA_30_45],
    medicamentosFixos: [
      {
        nome: "Ceftriaxona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Azitromicina",
        dose: "500 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        criterio: CRITERIO_DOR_OU_FEBRE,
        intervaloMinimoHoras: 6,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  "insuficiencia-cardiaca": {
    dietaBase: "Dieta hipossódica",
    cuidados: [
      CUIDADO_PESO_DIARIO,
      CUIDADO_BALANCO_HIDRICO,
      CUIDADO_RESTRICAO_HIDRICA,
      CUIDADO_CABECEIRA_30_45,
    ],
    medicamentosFixos: [
      {
        nome: "Furosemida",
        dose: "20 mg",
        via: "EV",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Carvedilol",
        dose: "6,25 mg",
        via: "VO",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Enalapril",
        dose: "10 mg",
        via: "VO",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Espironolactona",
        dose: "25 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Ácido acetilsalicílico",
        dose: "100 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [],
    substituiAntiHipertensivosDeCasa: true,
  },
  avc: {
    dietaBase: "Dieta branda",
    cuidados: [CUIDADO_DECUBITO, CUIDADO_CABECEIRA_30],
    medicamentosFixos: [
      {
        nome: "Ácido acetilsalicílico",
        dose: "100 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Sinvastatina",
        dose: "40 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA_NOITE,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [],
    substituiAntiHipertensivosDeCasa: false,
  },
  dpoc: {
    dietaBase: "Dieta geral",
    cuidados: [CUIDADO_OXIGENIO_88_92],
    medicamentosFixos: [
      {
        nome: "Hidrocortisona",
        dose: "100 mg",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
      {
        nome: "Ipratrópio e fenoterol",
        dose: "40 gotas de ipratrópio e 10 gotas de fenoterol em 5 mL de SF 0,9%",
        via: "Inalatória",
        frequencia: FREQUENCIA_6_6H,
      },
      {
        nome: "Ceftriaxona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [],
    substituiAntiHipertensivosDeCasa: false,
  },
  "infeccao-urinaria": {
    dietaBase: "Dieta geral",
    cuidados: [],
    medicamentosFixos: [
      {
        nome: "Ceftriaxona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        criterio: CRITERIO_DOR_OU_FEBRE,
        intervaloMinimoHoras: 6,
      },
      {
        nome: "Ondansetrona",
        dose: "4 mg",
        via: "EV",
        criterio: CRITERIO_NAUSEA,
        intervaloMinimoHoras: 8,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  "diabetes-descompensado": {
    dietaBase: "Dieta para diabético",
    cuidados: [],
    medicamentosFixos: [],
    medicamentosSeNecessario: [],
    substituiAntiHipertensivosDeCasa: false,
  },
  vascular: {
    dietaBase: "Dieta geral",
    cuidados: [CUIDADO_CURATIVO_MEMBRO],
    medicamentosFixos: [
      {
        nome: "Cefazolina",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_6_6H,
      },
      {
        nome: "Ácido acetilsalicílico",
        dose: "100 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Sinvastatina",
        dose: "40 mg",
        via: "VO",
        frequencia: FREQUENCIA_1X_DIA_NOITE,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Tramadol",
        dose: "50 mg",
        via: "EV",
        criterio: CRITERIO_DOR_MODERADA,
        intervaloMinimoHoras: 6,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  colecistectomia: {
    dietaBase: "Dieta branda",
    cuidados: [CUIDADO_DEAMBULACAO, CUIDADO_CURATIVO_FERIDA],
    medicamentosFixos: [
      {
        nome: "Cefazolina",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_6_6H,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Tramadol",
        dose: "50 mg",
        via: "EV",
        criterio: CRITERIO_DOR_MODERADA,
        intervaloMinimoHoras: 6,
      },
      {
        nome: "Ondansetrona",
        dose: "4 mg",
        via: "EV",
        criterio: CRITERIO_NAUSEA,
        intervaloMinimoHoras: 8,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  laparotomia: {
    dietaBase: "Dieta zero",
    cuidados: [CUIDADO_SONDA_NASOGASTRICA, CUIDADO_CURATIVO_FERIDA],
    medicamentosFixos: [
      {
        nome: "Ceftriaxona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Metronidazol",
        dose: "500 mg",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
      {
        nome: "Omeprazol",
        dose: "40 mg",
        via: "EV",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_6_6H,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
      {
        nome: "Soro fisiológico 0,9%",
        dose: "1.000 mL",
        via: "EV",
        frequencia: FREQUENCIA_12_12H,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Tramadol",
        dose: "50 mg",
        via: "EV",
        criterio: CRITERIO_DOR_MODERADA,
        intervaloMinimoHoras: 6,
      },
      {
        nome: "Ondansetrona",
        dose: "4 mg",
        via: "EV",
        criterio: CRITERIO_NAUSEA,
        intervaloMinimoHoras: 8,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  "fratura-femur": {
    dietaBase: "Dieta geral",
    cuidados: [CUIDADO_DECUBITO, CUIDADO_CURATIVO_FERIDA],
    medicamentosFixos: [
      {
        nome: "Cefazolina",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_6_6H,
      },
      {
        nome: "Enoxaparina",
        dose: "40 mg",
        via: "SC",
        frequencia: FREQUENCIA_1X_DIA,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Tramadol",
        dose: "50 mg",
        via: "EV",
        criterio: CRITERIO_DOR_MODERADA,
        intervaloMinimoHoras: 6,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  hernia: {
    dietaBase: "Dieta geral",
    cuidados: [CUIDADO_CURATIVO_FERIDA],
    medicamentosFixos: [],
    medicamentosSeNecessario: [
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        criterio: CRITERIO_DOR_OU_FEBRE,
        intervaloMinimoHoras: 6,
      },
      {
        nome: "Tramadol",
        dose: "50 mg",
        via: "EV",
        criterio: CRITERIO_DOR_MODERADA,
        intervaloMinimoHoras: 6,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
  apendicectomia: {
    dietaBase: "Dieta branda",
    cuidados: [CUIDADO_CURATIVO_FERIDA],
    medicamentosFixos: [
      {
        nome: "Ceftriaxona",
        dose: "1 g",
        via: "EV",
        frequencia: FREQUENCIA_12_12H,
      },
      {
        nome: "Metronidazol",
        dose: "500 mg",
        via: "EV",
        frequencia: FREQUENCIA_8_8H,
      },
    ],
    medicamentosSeNecessario: [
      {
        nome: "Dipirona",
        dose: "1 g",
        via: "EV",
        criterio: CRITERIO_DOR_OU_FEBRE,
        intervaloMinimoHoras: 6,
      },
    ],
    substituiAntiHipertensivosDeCasa: false,
  },
};

/**
 * Anti-hipertensivos de casa com pesos baseados na PNAUM 2014.
 */
export const ANTI_HIPERTENSIVOS_DE_CASA: {
  medicamento: MedicamentoFixoDoCenario;
  peso: number;
}[] = [
  {
    medicamento: {
      nome: "Hidroclorotiazida",
      dose: "25 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA,
    },
    peso: 23.9,
  },
  {
    medicamento: {
      nome: "Losartana",
      dose: "50 mg",
      via: "VO",
      frequencia: FREQUENCIA_12_12H,
    },
    peso: 20.1,
  },
  {
    medicamento: {
      nome: "Captopril",
      dose: "25 mg",
      via: "VO",
      frequencia: FREQUENCIA_8_8H,
    },
    peso: 11.2,
  },
  {
    medicamento: {
      nome: "Enalapril",
      dose: "10 mg",
      via: "VO",
      frequencia: FREQUENCIA_12_12H,
    },
    peso: 10.5,
  },
  {
    medicamento: {
      nome: "Atenolol",
      dose: "50 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA,
    },
    peso: 9.0,
  },
  {
    medicamento: {
      nome: "Anlodipino",
      dose: "5 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA,
    },
    peso: 6.0,
  },
];

export const QUANTIDADE_ANTI_HIPERTENSIVOS: {
  quantidade: number;
  peso: number;
}[] = [
  { quantidade: 1, peso: 49.9 },
  { quantidade: 2, peso: 36.1 },
  { quantidade: 3, peso: 13.5 },
];

/**
 * Não associar bloqueador do receptor de angiotensina com inibidor da enzima conversora,
 * nem dois inibidores da enzima conversora.
 */
export const COMBINACOES_PROIBIDAS: [string, string][] = [
  ["Losartana", "Captopril"],
  ["Losartana", "Enalapril"],
  ["Captopril", "Enalapril"],
];

export const REMEDIOS_DE_CASA_POR_COMORBIDADE: Partial<
  Record<Comorbidade, MedicamentoFixoDoCenario[]>
> = {
  insuficiencia_cardiaca: [
    {
      nome: "Furosemida",
      dose: "40 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA,
    },
    {
      nome: "Carvedilol",
      dose: "6,25 mg",
      via: "VO",
      frequencia: FREQUENCIA_12_12H,
    },
    {
      nome: "Enalapril",
      dose: "10 mg",
      via: "VO",
      frequencia: FREQUENCIA_12_12H,
    },
  ],
  colesterol_alto: [
    {
      nome: "Sinvastatina",
      dose: "20 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA_NOITE,
    },
  ],
  depressao: [
    {
      nome: "Fluoxetina",
      dose: "20 mg",
      via: "VO",
      frequencia: FREQUENCIA_1X_DIA,
    },
  ],
};

/**
 * Na internação, metformina e glibenclamida ficam suspensas e entra insulina regular
 * por escala (decisão aprovada pelo Dionizio em 11/10/2026).
 */
export const INSULINA_POR_ESCALA: MedicamentoFixoDoCenario = {
  nome: "Insulina regular",
  dose: DOSE_INSULINA_ESCALA,
  via: "SC",
  frequencia: FREQUENCIA_INSULINA_ESCALA,
  exigeGlicemiaCapilar: true,
};

/**
 * Proposta de frequência de verificação de sinais vitais aprovada pelo Dionizio em 11/10/2026.
 */
export const FREQUENCIA_SINAIS_VITAIS: Record<TipoCuidado, string> = {
  minimo: FREQUENCIA_6_6H,
  intermediario: FREQUENCIA_6_6H,
  alta_dependencia: FREQUENCIA_4_4H,
  semi_intensivo: FREQUENCIA_4_4H,
  intensivo: FREQUENCIA_4_4H,
};

export const DIETA_ZERO = "Dieta zero";
export const DIETA_ENTERAL = "Dieta enteral por sonda nasoenteral";
export const SUFIXO_DIETA_HIPOSSODICA = "hipossódica";
export const SUFIXO_DIETA_DIABETICO = "para diabético";

/**
 * Estimativa do Claude, sem fonte; revisar.
 */
export const CHANCE_DISFAGIA_NO_AVC = 0.5;

export const CUIDADO_SONDA_NASOENTERAL: CuidadoModelo = {
  chave: "sonda-nasoenteral-pervia",
  categoria: "cuidado",
  apresentacao:
    "Manter sonda nasoenteral pérvia e cabeceira elevada durante a dieta",
  frequencia: FREQUENCIA_CONTINUO,
};
