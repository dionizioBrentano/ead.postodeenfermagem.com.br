import {
  CUIDADO_TESTE_CURATIVO,
  CUIDADO_TESTE_DECUBITO,
  CUIDADO_TESTE_DIETA,
  CUIDADO_TESTE_SSVV,
  type PrescricaoItem,
} from "./prescricaoFicticia";

export type FaixaEtaria = "adulto" | "pediatrico";

export interface MedicamentoFixoDoCenario {
  nome: string;
  dose: string;
  via: string;
  frequencia: string;
  exigeGlicemiaCapilar?: boolean;
}

export interface MedicamentoSeNecessarioDoCenario {
  nome: string;
  dose: string;
  via: string;
  criterio: string;
  intervaloMinimoHoras: number;
}

export interface CenarioPrescricaoTeste {
  chave: string;
  hospital: string;
  unidade: string;
  leito: string;
  prontuario: string;
  paciente: string;
  idadeAnos: number;
  pesoKg: number;
  diagnostico: string;
  alergias: string;
  cuidados: PrescricaoItem[];
  medicamentosFixos: MedicamentoFixoDoCenario[];
  medicamentosSeNecessario: MedicamentoSeNecessarioDoCenario[];
}

export const IDADE_MINIMA_APRESENTACAO_ADULTA = 12;

export const HORARIOS_POR_FREQUENCIA: Record<string, string> = {
  "4/4h": "06h - 10h - 14h - 18h - 22h - 02h",
  "6/6h": "06h - 12h - 18h - 00h",
  "8/8h": "06h - 14h - 22h",
  "12/12h": "06h - 18h",
  "1x ao dia": "08h",
};

export const FREQUENCIA_INSULINA_ESCALA = "AA, AJ e 22h";
export const DOSE_INSULINA_ESCALA = "Conforme escala de glicemia capilar";

export const TEXTO_PREPARANDO_PRESCRICAO = "Preparando a prescrição de teste...";

const HOSPITAL_SIMULADO = "Hospital Escola Simulado";
const PRONTUARIO_SIMULADO = "000000-SIM";
const PACIENTE_SIMULADO = "Paciente Simulado de Teste";
const ALERGIAS_SIMULADAS = "Nega alergias medicamentosas conhecidas";

export const CENARIOS_PRESCRICAO_TESTE: CenarioPrescricaoTeste[] = [
  {
    chave: "cirurgica-abdominal",
    hospital: HOSPITAL_SIMULADO,
    unidade: "Clínica Cirúrgica",
    leito: "Leito 208-A (simulação)",
    prontuario: PRONTUARIO_SIMULADO,
    paciente: PACIENTE_SIMULADO,
    idadeAnos: 61,
    pesoKg: 76,
    diagnostico: "Pós-operatório de laparotomia / infecção intra-abdominal / diabetes tipo 2",
    alergias: ALERGIAS_SIMULADAS,
    cuidados: [
      CUIDADO_TESTE_DIETA,
      CUIDADO_TESTE_SSVV,
      CUIDADO_TESTE_CURATIVO,
      CUIDADO_TESTE_DECUBITO,
    ],
    medicamentosFixos: [
      { nome: "Ceftriaxona", dose: "1 g", via: "EV", frequencia: "12/12h" },
      { nome: "Metronidazol", dose: "500 mg", via: "EV", frequencia: "8/8h" },
      { nome: "Omeprazol", dose: "40 mg", via: "EV", frequencia: "1x ao dia" },
      { nome: "Enoxaparina", dose: "40 mg", via: "SC", frequencia: "1x ao dia" },
      {
        nome: "Insulina regular",
        dose: DOSE_INSULINA_ESCALA,
        via: "SC",
        frequencia: FREQUENCIA_INSULINA_ESCALA,
        exigeGlicemiaCapilar: true,
      },
    ],
    medicamentosSeNecessario: [
      { nome: "Dipirona", dose: "1 g", via: "EV", criterio: "dor ou febre", intervaloMinimoHoras: 6 },
      { nome: "Ondansetrona", dose: "4 mg", via: "EV", criterio: "náuseas ou vômitos", intervaloMinimoHoras: 8 },
    ],
  },
  {
    chave: "clinica-medica-erisipela",
    hospital: HOSPITAL_SIMULADO,
    unidade: "Clínica Médica",
    leito: "Leito 312-B (simulação)",
    prontuario: PRONTUARIO_SIMULADO,
    paciente: PACIENTE_SIMULADO,
    idadeAnos: 72,
    pesoKg: 88,
    diagnostico: "Erisipela em membro inferior esquerdo / insuficiência cardíaca",
    alergias: ALERGIAS_SIMULADAS,
    cuidados: [
      {
        id: "teste-dieta-hipossodica",
        categoria: "dieta",
        apresentacao: "Dieta hipossódica",
        dose: "—",
        via: "VO",
        frequencia: "Conforme rotina",
        horariosAprazados: "Horários da nutrição",
      },
      CUIDADO_TESTE_SSVV,
      {
        id: "teste-elevacao-membro",
        categoria: "cuidado",
        apresentacao: "Manter membro inferior esquerdo elevado",
        dose: "—",
        via: "Leito",
        frequencia: "Contínuo",
        horariosAprazados: "Contínuo",
      },
      {
        id: "teste-peso",
        categoria: "cuidado",
        apresentacao: "Peso diário em jejum",
        dose: "—",
        via: "Beira do leito",
        frequencia: "1x ao dia",
        horariosAprazados: "06h",
      },
      {
        id: "teste-diurese",
        categoria: "cuidado",
        apresentacao: "Controle de diurese e balanço de eliminações",
        dose: "—",
        via: "Beira do leito",
        frequencia: "4/4h",
        horariosAprazados: "06h - 10h - 14h - 18h - 22h - 02h",
      },
    ],
    medicamentosFixos: [
      { nome: "Cefazolina", dose: "1 g", via: "EV", frequencia: "8/8h" },
      { nome: "Furosemida", dose: "20 mg", via: "EV", frequencia: "12/12h" },
      { nome: "Omeprazol", dose: "40 mg", via: "EV", frequencia: "1x ao dia" },
      { nome: "Enoxaparina", dose: "40 mg", via: "SC", frequencia: "1x ao dia" },
    ],
    medicamentosSeNecessario: [
      { nome: "Dipirona", dose: "1 g", via: "EV", criterio: "dor ou febre", intervaloMinimoHoras: 6 },
      { nome: "Tramadol", dose: "50 mg", via: "EV", criterio: "dor moderada", intervaloMinimoHoras: 6 },
    ],
  },
  {
    chave: "clinica-medica-pneumonia",
    hospital: HOSPITAL_SIMULADO,
    unidade: "Clínica Médica",
    leito: "Leito 315-A (simulação)",
    prontuario: PRONTUARIO_SIMULADO,
    paciente: PACIENTE_SIMULADO,
    idadeAnos: 68,
    pesoKg: 64,
    diagnostico: "Pneumonia hospitalar / doença pulmonar obstrutiva crônica exacerbada / diabetes tipo 2",
    alergias: ALERGIAS_SIMULADAS,
    cuidados: [
      CUIDADO_TESTE_DIETA,
      CUIDADO_TESTE_SSVV,
      {
        id: "teste-cabeceira",
        categoria: "cuidado",
        apresentacao: "Cabeceira elevada entre 30° e 45°",
        dose: "—",
        via: "Leito",
        frequencia: "Contínuo",
        horariosAprazados: "Contínuo",
      },
      {
        id: "teste-oxigenio",
        categoria: "cuidado",
        apresentacao: "Oxigênio por cateter nasal para manter SpO2 entre 88% e 92%",
        dose: "—",
        via: "Inalatória",
        frequencia: "Contínuo",
        horariosAprazados: "Contínuo",
      },
      CUIDADO_TESTE_DECUBITO,
    ],
    medicamentosFixos: [
      { nome: "Piperacilina + Tazobactam", dose: "4,5 g", via: "EV", frequencia: "6/6h" },
      { nome: "Hidrocortisona", dose: "100 mg", via: "EV", frequencia: "8/8h" },
      { nome: "Omeprazol", dose: "40 mg", via: "EV", frequencia: "1x ao dia" },
      { nome: "Enoxaparina", dose: "40 mg", via: "SC", frequencia: "1x ao dia" },
      {
        nome: "Insulina regular",
        dose: DOSE_INSULINA_ESCALA,
        via: "SC",
        frequencia: FREQUENCIA_INSULINA_ESCALA,
        exigeGlicemiaCapilar: true,
      },
    ],
    medicamentosSeNecessario: [
      { nome: "Dipirona", dose: "1 g", via: "EV", criterio: "dor ou febre", intervaloMinimoHoras: 6 },
      { nome: "Ondansetrona", dose: "4 mg", via: "EV", criterio: "náuseas ou vômitos", intervaloMinimoHoras: 8 },
    ],
  },
];
