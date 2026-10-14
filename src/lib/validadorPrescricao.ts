import type { SugestaoPreparo } from "../api/ead";
import { DOSE_INSULINA_ESCALA } from "../data/cenariosPrescricaoTeste";
import {
  COMBINACOES_PROIBIDAS,
  DIETA_ZERO,
  FREQUENCIAS_DE_MEDICAMENTO,
  MEDICAMENTOS_SEM_CATALOGO,
  VIA_SONDA_NASOENTERAL,
} from "../data/prescricaoPerfis";
import {
  encontrarSugestaoPreparo,
  faixaEtariaDoPaciente,
} from "./prescricaoTeste";
import type { ItemPrescrito, PrescricaoGerada } from "./prescricaoGerada";

export const REGRA_GLICEMIA_SO_COM_INSULINA = "glicemia-so-com-insulina";
export const REGRA_MEDICAMENTO_UNICO = "medicamento-unico";
export const REGRA_DOSE_COM_UNIDADE = "dose-com-unidade";
export const REGRA_FREQUENCIA_CONHECIDA = "frequencia-conhecida";
export const REGRA_SE_NECESSARIO_COMPLETO = "se-necessario-completo";
export const REGRA_COMBINACAO_PROIBIDA = "combinacao-proibida";
export const REGRA_APRESENTACAO_ENCONTRADA = "apresentacao-encontrada";
export const REGRA_DIETA_ZERO_SEM_VIA_ORAL = "dieta-zero-sem-via-oral";
export const REGRA_SINAIS_VITAIS_PRESENTES = "sinais-vitais-presentes";
export const REGRA_IDS_UNICOS = "ids-unicos";

export const REGEX_DOSE_COM_UNIDADE =
  /(?:\d+(?:[.,]\d+)?|\d{1,3}(?:\.\d{3})+)\s*(?:mg|g|UI|mL|gotas)\b/i;

export interface ProblemaPrescricao {
  regra: string;
  mensagem: string;
}

export function extrairNomeMedicamento(
  item: ItemPrescrito,
  catalogo?: SugestaoPreparo[]
): string {
  if (item.nome && item.nome.trim().length > 0) {
    return item.nome.trim();
  }
  if (catalogo) {
    const doCat = catalogo.find(
      (c) =>
        item.apresentacao.toLowerCase().startsWith(c.nome.toLowerCase()) ||
        c.apresentacao === item.apresentacao
    );
    if (doCat) {
      return doCat.nome;
    }
  }
  const semCat = MEDICAMENTOS_SEM_CATALOGO.find(
    (m) =>
      m.apresentacao === item.apresentacao ||
      item.apresentacao.toLowerCase().startsWith(m.nome.toLowerCase())
  );
  if (semCat) {
    return semCat.nome;
  }
  const match = item.apresentacao.match(/^([a-zA-ZÀ-ÿ\s+]+?)(?=\s+\d|\s+comprimido|\s+cápsula|$)/);
  if (match) {
    return match[1].trim();
  }
  return item.apresentacao.trim();
}

export function ehMedicamento(item: ItemPrescrito): boolean {
  return item.categoria === "medicamento" || item.categoria === "sn";
}

function ehInsulina(nome: string, item: ItemPrescrito): boolean {
  return (
    nome.toLowerCase().includes("insulina") ||
    item.apresentacao.toLowerCase().includes("insulina")
  );
}

export function validarGlicemiaSoComInsulina(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  for (const item of prescricao.itens) {
    const nome = extrairNomeMedicamento(item, catalogo);
    const insulina = ehInsulina(nome, item);

    if (item.exigeGlicemiaCapilar && !insulina) {
      problemas.push({
        regra: REGRA_GLICEMIA_SO_COM_INSULINA,
        mensagem: `Item "${item.apresentacao}" possui exigência de glicemia capilar sem ser insulina.`,
      });
    }

    if (insulina && !item.exigeGlicemiaCapilar) {
      problemas.push({
        regra: REGRA_GLICEMIA_SO_COM_INSULINA,
        mensagem: `Medicamento "${nome}" é insulina e deve ter exigência de glicemia capilar ativada.`,
      });
    }
  }
  return problemas;
}

export function validarMedicamentoUnico(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  const medicamentos = prescricao.itens.filter(ehMedicamento);
  const contagem = new Map<string, number>();

  for (const med of medicamentos) {
    const chave = extrairNomeMedicamento(med, catalogo).toLowerCase();
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const reportados = new Set<string>();
  for (const med of medicamentos) {
    const nome = extrairNomeMedicamento(med, catalogo);
    const chave = nome.toLowerCase();
    if ((contagem.get(chave) ?? 0) > 1 && !reportados.has(chave)) {
      reportados.add(chave);
      problemas.push({
        regra: REGRA_MEDICAMENTO_UNICO,
        mensagem: `${nome} aparece mais de uma vez na prescrição (contando fixos e se necessário).`,
      });
    }
  }

  return problemas;
}

export function validarDoseComUnidade(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  for (const item of prescricao.itens.filter(ehMedicamento)) {
    const nome = extrairNomeMedicamento(item, catalogo);
    const valida =
      item.dose === DOSE_INSULINA_ESCALA ||
      REGEX_DOSE_COM_UNIDADE.test(item.dose);
    if (!valida) {
      problemas.push({
        regra: REGRA_DOSE_COM_UNIDADE,
        mensagem: `${nome}: dose "${item.dose}" não possui valor numérico com unidade válida (mg, g, UI, mL ou gotas).`,
      });
    }
  }
  return problemas;
}

export function validarFrequenciaConhecida(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  for (const item of prescricao.itens.filter((i) => i.categoria === "medicamento")) {
    const nome = extrairNomeMedicamento(item, catalogo);
    if (!FREQUENCIAS_DE_MEDICAMENTO.includes(item.frequencia)) {
      problemas.push({
        regra: REGRA_FREQUENCIA_CONHECIDA,
        mensagem: `${nome}: frequência "${item.frequencia}" não pertence à lista de frequências válidas para medicamento fixo.`,
      });
    }
  }
  return problemas;
}

export function validarSeNecessarioCompleto(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  for (const item of prescricao.itens.filter((i) => i.categoria === "sn")) {
    const nome = extrairNomeMedicamento(item, catalogo);
    const temCriterio = Boolean(item.criterio && item.criterio.trim().length > 0);
    const temIntervalo =
      typeof item.intervaloMinimoHoras === "number" &&
      item.intervaloMinimoHoras > 0;
    if (!temCriterio || !temIntervalo) {
      problemas.push({
        regra: REGRA_SE_NECESSARIO_COMPLETO,
        mensagem: `${nome}: medicamento se necessário deve conter critério clínico e intervalo mínimo maior que zero.`,
      });
    }
  }
  return problemas;
}

export function validarCombinacaoProibida(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  const medicamentos = prescricao.itens.filter(ehMedicamento);
  const nomesNaPrescricao = new Set(
    medicamentos.map((m) => extrairNomeMedicamento(m, catalogo).toLowerCase())
  );

  for (const [medA, medB] of COMBINACOES_PROIBIDAS) {
    if (
      nomesNaPrescricao.has(medA.toLowerCase()) &&
      nomesNaPrescricao.has(medB.toLowerCase())
    ) {
      problemas.push({
        regra: REGRA_COMBINACAO_PROIBIDA,
        mensagem: `Combinação proibida encontrada: ${medA} associado com ${medB}.`,
      });
    }
  }
  return problemas;
}

export function validarApresentacaoEncontrada(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  const faixa = faixaEtariaDoPaciente(prescricao.paciente.idadeAnos);

  for (const item of prescricao.itens.filter(ehMedicamento)) {
    const nome = extrairNomeMedicamento(item, catalogo);
    const viaBuscada =
      item.via === VIA_SONDA_NASOENTERAL ? "VO" : item.via;
    const semCatalogo = MEDICAMENTOS_SEM_CATALOGO.find(
      (m) =>
        m.nome.toLowerCase() === nome.toLowerCase() &&
        m.via === viaBuscada
    );

    if (semCatalogo) {
      continue;
    }

    if (item.via === "EV" || item.via === "SC") {
      const sugestao = encontrarSugestaoPreparo(
        catalogo,
        nome,
        item.via,
        faixa
      );
      if (!sugestao) {
        problemas.push({
          regra: REGRA_APRESENTACAO_ENCONTRADA,
          mensagem: `${nome}: apresentação não encontrada no catálogo de preparo para via ${item.via} e faixa ${faixa}.`,
        });
      }
    } else {
      problemas.push({
        regra: REGRA_APRESENTACAO_ENCONTRADA,
        mensagem: `${nome}: medicamento da via ${item.via} não encontrado na lista de medicamentos sem catálogo.`,
      });
    }
  }
  return problemas;
}

export function validarDietaZeroSemViaOral(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  const temDietaZero = prescricao.itens.some(
    (i) =>
      i.categoria === "dieta" &&
      (i.apresentacao === DIETA_ZERO ||
        i.apresentacao.toLowerCase().includes("dieta zero"))
  );

  if (temDietaZero) {
    for (const item of prescricao.itens.filter(ehMedicamento)) {
      if (item.via === "VO") {
        const nome = extrairNomeMedicamento(item, catalogo);
        problemas.push({
          regra: REGRA_DIETA_ZERO_SEM_VIA_ORAL,
          mensagem: `Paciente em dieta zero não pode receber medicamento por via oral (${nome}).`,
        });
      }
    }
  }
  return problemas;
}

export function validarSinaisVitaisPresentes(
  prescricao: PrescricaoGerada
): ProblemaPrescricao[] {
  const itensSinais = prescricao.itens.filter(
    (i) => i.categoria === "sinais_vitais"
  );
  if (itensSinais.length !== 1) {
    return [
      {
        regra: REGRA_SINAIS_VITAIS_PRESENTES,
        mensagem: `A prescrição deve conter exatamente um item de sinais vitais (encontrados: ${itensSinais.length}).`,
      },
    ];
  }
  return [];
}

export function validarIdsUnicos(
  prescricao: PrescricaoGerada
): ProblemaPrescricao[] {
  const problemas: ProblemaPrescricao[] = [];
  const vistos = new Set<string>();

  for (const item of prescricao.itens) {
    if (vistos.has(item.id)) {
      problemas.push({
        regra: REGRA_IDS_UNICOS,
        mensagem: `Identificador de item duplicado na prescrição: "${item.id}".`,
      });
    }
    vistos.add(item.id);
  }
  return problemas;
}

export function validarPrescricao(
  prescricao: PrescricaoGerada,
  catalogo: SugestaoPreparo[]
): ProblemaPrescricao[] {
  return [
    ...validarGlicemiaSoComInsulina(prescricao, catalogo),
    ...validarMedicamentoUnico(prescricao, catalogo),
    ...validarDoseComUnidade(prescricao, catalogo),
    ...validarFrequenciaConhecida(prescricao, catalogo),
    ...validarSeNecessarioCompleto(prescricao, catalogo),
    ...validarCombinacaoProibida(prescricao, catalogo),
    ...validarApresentacaoEncontrada(prescricao, catalogo),
    ...validarDietaZeroSemViaOral(prescricao, catalogo),
    ...validarSinaisVitaisPresentes(prescricao),
    ...validarIdsUnicos(prescricao),
  ];
}
