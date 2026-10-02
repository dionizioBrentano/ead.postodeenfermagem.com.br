// Itens da ficha "04 AVALIAÇÃO ESTÁGIO HOSPITAIS".
// "desde" = etapa a partir da qual a atividade passa a ser cobrada (proposta do guia).

export type Item = { texto: string; curto: string; desde?: number };

export const GERAIS: Item[] = [
  { texto: "Assiduidade e pontualidade.", curto: "Assiduidade" },
  { texto: "Apresentação pessoal, uniforme completo, crachá.", curto: "Apresentação pessoal" },
  { texto: "Interesse na aprendizagem.", curto: "Interesse" },
  { texto: "Cumprimento das normas de biossegurança, uso dos equipamentos de proteção individual.", curto: "Biossegurança" },
  { texto: "Relacionamento interpessoal, com colegas, supervisores, equipe multiprofissional e paciente.", curto: "Relacionamento" },
  { texto: "Postura ética e profissional.", curto: "Postura ética" },
  { texto: "Reconhece os diferentes profissionais da equipe, respeitando a hierarquia, acolhendo os direcionamentos recebidos.", curto: "Hierarquia e equipe" },
  { texto: "Proatividade, disponibilidade e capacidade de observação e julgamento para as atividades propostas e escolha de prioridades.", curto: "Proatividade" },
  { texto: "Aceitação positiva frente às orientações e críticas construtivas.", curto: "Aceita críticas" },
  { texto: "Planejamento e organização do tempo para desempenho das atividades de forma clara e objetiva.", curto: "Organização do tempo" },
  { texto: "Relação teoria e prática, contextualização.", curto: "Teoria e prática" },
];

export const ATIVIDADES: Item[] = [
  { texto: "Demonstra habilidades mínimas para realização dos procedimentos de enfermagem.", curto: "Habilidades mínimas", desde: 1 },
  { texto: "Aceita e faz o rodízio pelos setores da unidade para observação e compreensão da rotina e do processo de trabalho conforme escala pré-definida.", curto: "Rodízio de setores", desde: 1 },
  { texto: "Admissão e acolhimento de pacientes.", curto: "Admissão e acolhimento", desde: 1 },
  { texto: "Aferição de sinais vitais e hemoglicoteste: conhecimento e utilização das técnicas e parâmetros.", curto: "Sinais vitais e glicemia", desde: 1 },
  { texto: "Realização de medidas antropométricas.", curto: "Medidas antropométricas", desde: 1 },
  { texto: "Preparo do leito.", curto: "Preparo do leito", desde: 1 },
  { texto: "Higiene do paciente: higiene oral, banho de aspersão, banho de leito, hidratação cutânea, medidas de prevenção para lesões de pele, dentre outros.", curto: "Higiene do paciente", desde: 1 },
  { texto: "Segurança e conforto do paciente: realiza e conhece as medidas de prevenção de lesões por pressão, mudança de decúbito.", curto: "Lesão por pressão", desde: 1 },
  { texto: "Garante a segurança do paciente: verifica e conhece a pulseira amarela, mantém grades elevadas e contenções conforme prescrições e necessidade.", curto: "Pulseira amarela e grades", desde: 1 },
  { texto: "Realização de curativos, retirada de pontos, reconhecimento e manuseio dos diferentes tipos de drenos.", curto: "Curativos e drenos", desde: 2 },
  { texto: "Auxílio e montagem das bandejas para sondagens gástricas, entéricas, vesicais.", curto: "Bandejas de sondagem", desde: 2 },
  { texto: "Auxilia na alimentação (oral, sondas), reconhece diferentes sondas e cuidados específicos para cada.", curto: "Alimentação e sondas", desde: 2 },
  { texto: "Auxilia nas eliminações (espontâneas, fraldas, sondas) e cuidados específicos para cada.", curto: "Eliminações", desde: 1 },
  { texto: "Leitura, interpretação e preparo de medicamentos através de prescrições/receitas: nebulizações, inalações, medicações tópicas, enterais e parenterais.", curto: "Preparo de medicamentos", desde: 2 },
  { texto: "Reconhece as 6 metas internacionais para segurança do paciente, em especial identificação e uso da pulseira vermelha.", curto: "Metas de segurança", desde: 1 },
  { texto: "Reconhecimento de grupos farmacológicos: ações, efeitos colaterais e interações medicamentosas.", curto: "Grupos farmacológicos", desde: 2 },
  { texto: "Punção venosa periférica.", curto: "Punção venosa", desde: 3 },
  { texto: "Preparo de soluções parenterais: controle de gotejamento, manejo de bombas de infusão.", curto: "Soluções e bombas", desde: 3 },
  { texto: "Atendimento em situações de urgência e emergência.", curto: "Urgência e emergência", desde: 4 },
  { texto: "Saber onde se encontra na unidade o carro de urgência, conhecer materiais e medicamentos do carro.", curto: "Carro de urgência", desde: 4 },
  { texto: "Realizar registros de enfermagem, utilizando linguagem técnica de forma clara e objetiva.", curto: "Registros de enfermagem", desde: 1 },
  { texto: "Realiza a passagem de plantão de forma organizada, objetiva e clara.", curto: "Passagem de plantão", desde: 4 },
  { texto: "Meta 1 de segurança do paciente: identifica corretamente o paciente, conferindo nome e data de nascimento e usando a pulseira de identificação.", curto: "Meta 1 · Identificação", desde: 1 },
  { texto: "Meta 2 de segurança do paciente: comunicação efetiva entre a equipe, com informação clara na passagem de plantão e nos registros.", curto: "Meta 2 · Comunicação", desde: 1 },
  { texto: "Meta 3 de segurança do paciente: segurança na prescrição, no uso e na administração de medicamentos, inclusive os de alta vigilância.", curto: "Meta 3 · Medicamentos", desde: 1 },
  { texto: "Meta 4 de segurança do paciente: cirurgia segura, confirmando paciente, procedimento e local corretos.", curto: "Meta 4 · Cirurgia segura", desde: 1 },
  { texto: "Meta 5 de segurança do paciente: reduz o risco de infecção, com higienização das mãos e precaução conforme o caso.", curto: "Meta 5 · Infecção", desde: 1 },
  { texto: "Meta 6 de segurança do paciente: reduz o risco de queda e de lesão, com grades, pulseira amarela e prevenção de lesão por pressão.", curto: "Meta 6 · Quedas e lesões", desde: 1 },
];

export const TOTAL_ITENS = GERAIS.length + ATIVIDADES.length;

export const MOMENTOS = ["Início", "Meio", "Final"] as const;
export type Momento = (typeof MOMENTOS)[number];
export const ETAPAS = [1, 2, 3, 4] as const;

/** Nota de 0 a 10, "na" = ainda não pratiquei, null = sem resposta */
export type Nota = number | "na" | null;
