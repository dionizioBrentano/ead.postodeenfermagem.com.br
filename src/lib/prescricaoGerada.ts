import type { SugestaoPreparo } from "../api/ead";
import {
  type MedicamentoFixoDoCenario,
  type MedicamentoSeNecessarioDoCenario,
} from "../data/cenariosPrescricaoTeste";
import {
  COMORBIDADE_DO_PERFIL,
  type Comorbidade,
  type Setor,
} from "../data/perfisEpidemiologicos";
import {
  APRESENTACAO_SINAIS_VITAIS,
  type PrescricaoItem,
} from "../data/prescricaoFicticia";
import {
  ANTI_HIPERTENSIVOS_DE_CASA,
  CHANCE_DISFAGIA_NO_AVC,
  COMBINACOES_PROIBIDAS,
  CUIDADO_SONDA_NASOENTERAL,
  DIETA_ENTERAL,
  DIETA_ZERO,
  FREQUENCIA_SINAIS_VITAIS,
  INSULINA_POR_ESCALA,
  MEDICAMENTOS_SEM_CATALOGO,
  PRESCRICAO_POR_PERFIL,
  QUANTIDADE_ANTI_HIPERTENSIVOS,
  REMEDIOS_DE_CASA_POR_COMORBIDADE,
  SUFIXO_DIETA_DIABETICO,
  SUFIXO_DIETA_HIPOSSODICA,
  VIA_SONDA_NASOENTERAL,
  type PrescricaoDoPerfil,
} from "../data/prescricaoPerfis";
import {
  formatarLeito,
  gerarPlantao,
  type PacienteGerado,
  type PlantaoGerado,
} from "./geradorPacientes";
import { slug } from "./pdfComum";
import {
  descreverApresentacao,
  encontrarSugestaoPreparo,
  faixaEtariaDoPaciente,
} from "./prescricaoTeste";
import {
  sortearChance,
  sortearPonderado,
  type Aleatorio,
} from "./sorteio";
import {
  validarPrescricao,
  type ProblemaPrescricao,
} from "./validadorPrescricao";

export const TENTATIVAS_PLANTAO = 5;
const DOSE_PADRAO_NAO_MEDICAMENTO = "—";
const VIA_SINAIS_VITAIS = "Beira do leito";
const VIA_ORAL = "VO";

export interface ItemPrescrito {
  id: string; // único na prescrição, montado com slug
  categoria: PrescricaoItem["categoria"];
  nome?: string;
  apresentacao: string;
  dose: string;
  via: string;
  frequencia: string;
  criterio?: string; // só em "se necessário"
  intervaloMinimoHoras?: number; // só em "se necessário"
  exigeGlicemiaCapilar?: boolean;
}

export interface PrescricaoGerada {
  paciente: PacienteGerado;
  itens: ItemPrescrito[];
}

export function temComorbidade(
  paciente: PacienteGerado,
  comorbidade: Comorbidade
): boolean {
  return (
    paciente.comorbidades.includes(comorbidade) ||
    COMORBIDADE_DO_PERFIL[paciente.chavePerfil] === comorbidade
  );
}

export function temDiabetes(paciente: PacienteGerado): boolean {
  return temComorbidade(paciente, "diabetes");
}

export function montarDieta(
  dietaBase: string,
  paciente: PacienteGerado
): string {
  if (dietaBase === DIETA_ZERO || dietaBase === DIETA_ENTERAL) {
    return dietaBase;
  }

  let dieta = dietaBase;
  const precisaHipossodica =
    temComorbidade(paciente, "hipertensao") ||
    temComorbidade(paciente, "insuficiencia_cardiaca");
  if (precisaHipossodica && !dieta.includes(SUFIXO_DIETA_HIPOSSODICA)) {
    dieta = `${dieta} ${SUFIXO_DIETA_HIPOSSODICA}`;
  }

  if (temDiabetes(paciente) && !dieta.includes(SUFIXO_DIETA_DIABETICO)) {
    dieta = `${dieta} ${SUFIXO_DIETA_DIABETICO}`;
  }

  return dieta;
}

function resolveApresentacaoMedicamento(
  nome: string,
  via: string,
  idadeAnos: number,
  catalogo: SugestaoPreparo[]
): string {
  const viaBuscada = via === VIA_SONDA_NASOENTERAL ? VIA_ORAL : via;
  const semCatalogo = MEDICAMENTOS_SEM_CATALOGO.find(
    (m) =>
      m.nome.toLowerCase() === nome.toLowerCase() &&
      m.via === viaBuscada
  );
  if (semCatalogo) {
    return semCatalogo.apresentacao;
  }

  if (via === "EV" || via === "SC") {
    const faixa = faixaEtariaDoPaciente(idadeAnos);
    const sugestao = encontrarSugestaoPreparo(catalogo, nome, via, faixa);
    return sugestao ? descreverApresentacao(sugestao) : "";
  }

  return "";
}

function temConflitoProibido(
  nomeNovo: string,
  nomesJaPresentes: Set<string>
): boolean {
  for (const [medA, medB] of COMBINACOES_PROIBIDAS) {
    if (
      nomeNovo.toLowerCase() === medA.toLowerCase() &&
      nomesJaPresentes.has(medB.toLowerCase())
    ) {
      return true;
    }
    if (
      nomeNovo.toLowerCase() === medB.toLowerCase() &&
      nomesJaPresentes.has(medA.toLowerCase())
    ) {
      return true;
    }
  }
  return false;
}

export function montarRemediosDeCasa(
  paciente: PacienteGerado,
  prescricaoDoPerfil: PrescricaoDoPerfil,
  nomesJaPresentes: Set<string>,
  aleatorio: Aleatorio = Math.random
): MedicamentoFixoDoCenario[] {
  const remediosAdicionados: MedicamentoFixoDoCenario[] = [];

  function adicionarSeNaoPresente(med: MedicamentoFixoDoCenario): boolean {
    const chave = med.nome.toLowerCase();
    if (nomesJaPresentes.has(chave)) {
      return false;
    }
    nomesJaPresentes.add(chave);
    remediosAdicionados.push({ ...med });
    return true;
  }

  // 1. Insuficiência cardíaca
  if (temComorbidade(paciente, "insuficiencia_cardiaca")) {
    const lista = REMEDIOS_DE_CASA_POR_COMORBIDADE.insuficiencia_cardiaca ?? [];
    for (const med of lista) {
      adicionarSeNaoPresente(med);
    }
  }

  // 2. Colesterol alto
  if (temComorbidade(paciente, "colesterol_alto")) {
    const lista = REMEDIOS_DE_CASA_POR_COMORBIDADE.colesterol_alto ?? [];
    for (const med of lista) {
      adicionarSeNaoPresente(med);
    }
  }

  // 3. Depressão
  if (temComorbidade(paciente, "depressao")) {
    const lista = REMEDIOS_DE_CASA_POR_COMORBIDADE.depressao ?? [];
    for (const med of lista) {
      adicionarSeNaoPresente(med);
    }
  }

  // 4. Anti-hipertensivos
  if (
    temComorbidade(paciente, "hipertensao") &&
    !prescricaoDoPerfil.substituiAntiHipertensivosDeCasa
  ) {
    const opcoesQtd = QUANTIDADE_ANTI_HIPERTENSIVOS.map((q) => ({
      valor: q.quantidade,
      peso: q.peso,
    }));
    const qtdDesejada = sortearPonderado(opcoesQtd, aleatorio);

    for (let i = 0; i < qtdDesejada; i++) {
      const candidatos = ANTI_HIPERTENSIVOS_DE_CASA.filter((c) => {
        const nome = c.medicamento.nome;
        if (nomesJaPresentes.has(nome.toLowerCase())) {
          return false;
        }
        if (temConflitoProibido(nome, nomesJaPresentes)) {
          return false;
        }
        return true;
      });

      if (candidatos.length === 0) {
        break;
      }

      const sorteado = sortearPonderado(
        candidatos.map((c) => ({ valor: c.medicamento, peso: c.peso })),
        aleatorio
      );
      adicionarSeNaoPresente(sorteado);
    }
  }

  return remediosAdicionados;
}

function gerarIdUnico(
  categoria: string,
  identificador: string,
  idsUsados: Set<string>
): string {
  const base = slug(`${categoria}-${identificador}`);
  let candidato = base;
  let contador = 2;
  while (idsUsados.has(candidato)) {
    candidato = `${base}-${contador}`;
    contador++;
  }
  idsUsados.add(candidato);
  return candidato;
}

export function gerarPrescricao(
  paciente: PacienteGerado,
  catalogo: SugestaoPreparo[],
  aleatorio: Aleatorio = Math.random
): {
  prescricao: PrescricaoGerada | null;
  problemas: ProblemaPrescricao[];
} {
  const prescricaoDoPerfil = PRESCRICAO_POR_PERFIL[paciente.chavePerfil];
  if (!prescricaoDoPerfil) {
    return {
      prescricao: null,
      problemas: [
        {
          regra: "perfil-existente",
          mensagem: `Perfil epidemiológico "${paciente.chavePerfil}" não possui modelo de prescrição cadastrado.`,
        },
      ],
    };
  }

  const ehAvcComDisfagia =
    paciente.chavePerfil === "avc" &&
    sortearChance(CHANCE_DISFAGIA_NO_AVC, aleatorio);

  let dietaFinal = montarDieta(prescricaoDoPerfil.dietaBase, paciente);
  if (ehAvcComDisfagia) {
    dietaFinal = DIETA_ENTERAL;
  }

  const cuidadosFinais = [...prescricaoDoPerfil.cuidados];
  if (ehAvcComDisfagia) {
    cuidadosFinais.push(CUIDADO_SONDA_NASOENTERAL);
  }

  // Medicamentos do perfil
  const nomesPresentes = new Set<string>();
  const fixosPerfil: MedicamentoFixoDoCenario[] = [];
  for (const med of prescricaoDoPerfil.medicamentosFixos) {
    nomesPresentes.add(med.nome.toLowerCase());
    fixosPerfil.push({ ...med });
  }

  // Medicamentos de casa
  const remediosCasa = montarRemediosDeCasa(
    paciente,
    prescricaoDoPerfil,
    nomesPresentes,
    aleatorio
  );

  let todosFixos = [...fixosPerfil, ...remediosCasa];

  // Insulina por escala
  if (temDiabetes(paciente)) {
    todosFixos.push({ ...INSULINA_POR_ESCALA });
    nomesPresentes.add(INSULINA_POR_ESCALA.nome.toLowerCase());
  }

  // Se necessário do perfil
  const todosSN: MedicamentoSeNecessarioDoCenario[] = [];
  for (const med of prescricaoDoPerfil.medicamentosSeNecessario) {
    todosSN.push({ ...med });
    nomesPresentes.add(med.nome.toLowerCase());
  }

  // Regra de Dieta Zero: nenhum medicamento por via oral entra
  if (dietaFinal === DIETA_ZERO) {
    todosFixos = todosFixos.filter((m) => m.via !== VIA_ORAL);
  }

  // Regra de AVC com disfagia: todo medicamento por VO passa para Sonda nasoenteral
  if (ehAvcComDisfagia) {
    todosFixos = todosFixos.map((m) =>
      m.via === VIA_ORAL ? { ...m, via: VIA_SONDA_NASOENTERAL } : m
    );
  }

  const idsUsados = new Set<string>();
  const itens: ItemPrescrito[] = [];

  // 1. Dieta
  itens.push({
    id: gerarIdUnico("dieta", dietaFinal, idsUsados),
    categoria: "dieta",
    apresentacao: dietaFinal,
    dose: DOSE_PADRAO_NAO_MEDICAMENTO,
    via: ehAvcComDisfagia ? VIA_SONDA_NASOENTERAL : VIA_ORAL,
    frequencia: "Conforme rotina",
  });

  // 2. Cuidados
  for (const cuidado of cuidadosFinais) {
    itens.push({
      id: gerarIdUnico("cuidado", cuidado.chave, idsUsados),
      categoria: "cuidado",
      apresentacao: cuidado.apresentacao,
      dose: DOSE_PADRAO_NAO_MEDICAMENTO,
      via: "Leito",
      frequencia: cuidado.frequencia,
    });
  }

  // 3. Sinais vitais
  itens.push({
    id: gerarIdUnico("sinais-vitais", "afericao", idsUsados),
    categoria: "sinais_vitais",
    apresentacao: APRESENTACAO_SINAIS_VITAIS,
    dose: DOSE_PADRAO_NAO_MEDICAMENTO,
    via: VIA_SINAIS_VITAIS,
    frequencia: FREQUENCIA_SINAIS_VITAIS[paciente.tipoCuidado],
  });

  // 4. Medicamentos fixos
  for (const med of todosFixos) {
    const apresentacao = resolveApresentacaoMedicamento(
      med.nome,
      med.via,
      paciente.idadeAnos,
      catalogo
    );
    itens.push({
      id: gerarIdUnico("med", med.nome, idsUsados),
      categoria: "medicamento",
      nome: med.nome,
      apresentacao,
      dose: med.dose,
      via: med.via,
      frequencia: med.frequencia,
      ...(med.exigeGlicemiaCapilar ? { exigeGlicemiaCapilar: true } : {}),
    });
  }

  // 5. Medicamentos se necessário
  for (const med of todosSN) {
    const apresentacao = resolveApresentacaoMedicamento(
      med.nome,
      med.via,
      paciente.idadeAnos,
      catalogo
    );
    itens.push({
      id: gerarIdUnico("sn", med.nome, idsUsados),
      categoria: "sn",
      nome: med.nome,
      apresentacao,
      dose: med.dose,
      via: med.via,
      frequencia: "Se necessário",
      criterio: med.criterio,
      intervaloMinimoHoras: med.intervaloMinimoHoras,
    });
  }

  const prescricaoCandidata: PrescricaoGerada = {
    paciente,
    itens,
  };

  const problemas = validarPrescricao(prescricaoCandidata, catalogo);
  if (problemas.length > 0) {
    return {
      prescricao: null,
      problemas,
    };
  }

  return {
    prescricao: prescricaoCandidata,
    problemas: [],
  };
}

export function gerarPlantaoComPrescricoes(
  setor: Setor,
  horasTurno: number,
  catalogo: SugestaoPreparo[],
  aleatorio: Aleatorio = Math.random
): {
  plantao: PlantaoGerado;
  prescricoes: PrescricaoGerada[];
  descartados: { chavePerfil: string; problemas: ProblemaPrescricao[] }[];
} {
  let ultimosProblemas: ProblemaPrescricao[] = [];

  for (let tentativa = 0; tentativa < TENTATIVAS_PLANTAO; tentativa++) {
    const plantaoBase = gerarPlantao(setor, horasTurno, aleatorio);
    const descartados: {
      chavePerfil: string;
      problemas: ProblemaPrescricao[];
    }[] = [];
    const prescricoesValidas: PrescricaoGerada[] = [];

    for (const paciente of plantaoBase.pacientes) {
      const resultado = gerarPrescricao(paciente, catalogo, aleatorio);
      if (resultado.prescricao) {
        prescricoesValidas.push(resultado.prescricao);
      } else {
        descartados.push({
          chavePerfil: paciente.chavePerfil,
          problemas: resultado.problemas,
        });
        ultimosProblemas = resultado.problemas;
      }
    }

    if (prescricoesValidas.length > 0) {
      // Renumera os leitos dos pacientes aprovados
      const pacientesFinais: PacienteGerado[] = [];
      let horasUsadas = 0;

      for (let idx = 0; idx < prescricoesValidas.length; idx++) {
        const pres = prescricoesValidas[idx];
        const novoLeito = formatarLeito(idx + 1);
        pres.paciente.leito = novoLeito;
        pacientesFinais.push(pres.paciente);
        horasUsadas += pres.paciente.horasTecnico;
      }

      return {
        plantao: {
          setor,
          horasTurno,
          horasUsadas,
          pacientes: pacientesFinais,
        },
        prescricoes: prescricoesValidas,
        descartados,
      };
    }
  }

  throw new Error(
    `Não foi possível gerar um plantão com prescrições válidas após ${TENTATIVAS_PLANTAO} tentativas. Últimos problemas: ${JSON.stringify(
      ultimosProblemas
    )}`
  );
}
