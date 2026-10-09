export interface TarefaTeorica {
  id: string;
  data: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  objetivos: string[];
  topicos: string[];
  statusRotulo: string;
}

export const TAREFAS_TEORICAS: TarefaTeorica[] = [
  {
    id: "organizacao-plantao",
    data: "09/10/2026",
    titulo: "Organização do plantão",
    subtitulo: "Guia prático e transcrição de cuidados a partir da prescrição do paciente no turno de estágio",
    descricao:
      "Exercício prático de transcrição da prescrição médica e de enfermagem para organização das rotinas, horários de administração, tolerâncias de infusão e checagens à beira do leito.",
    objetivos: [
      "Aprender a transcrever prescrições médicas e de enfermagem para o rascunho de trabalho do plantão.",
      "Distribuir os horários conforme a frequência prescrita e a duração do turno (estágio de 4 horas ou jornadas de 6h e 12h).",
      "Aplicar as regras universais de checagem da enfermagem: barra (/) para administrado e círculo (O) para não administrado com justificativa.",
      "Identificar conflitos de horário na mesma via venosa e aplicar as margens de tolerância de infusão.",
    ],
    topicos: [
      "Mapeamento do turno e horários de refeição",
      "Itens de horário fixo, contínuos e se necessário (SN)",
      "Checagem e registro legal do cuidado",
      "Resolução de prescrições fictícias com gabarito comentado",
    ],
    statusRotulo: "Em elaboração",
  },
];
