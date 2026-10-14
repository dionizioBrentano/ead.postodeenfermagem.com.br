import {
  COMORBIDADE_DO_PERFIL,
  DIABETES_ADULTO_COM_HIPERTENSAO,
  DIABETES_ADULTO_SEM_HIPERTENSAO,
  DISTRIBUICAO_TIPO_CUIDADO,
  FAIXA_PESO_KG,
  FAIXA_PESO_KG_OBESIDADE,
  FREQUENCIA_COMORBIDADE,
  IDADE_IDOSO,
  ORDEM_COMORBIDADES,
  PERFIS_EPIDEMIOLOGICOS,
  PREFIXO_LEITO,
  ROTULO_COMORBIDADE,
  SEPARADOR_DIAGNOSTICO,
  TIPOS_CUIDADO_DA_ENFERMARIA,
  type Comorbidade,
  type EventoPossivel,
  type PerfilEpidemiologico,
  type Setor,
  type Sexo,
  type TipoCuidado,
} from "../data/perfisEpidemiologicos";
import { cabeNoPlantao, horasTecnicoPorPaciente } from "./cargaPlantao";
import {
  sortearChance,
  sortearIndice,
  sortearInteiro,
  sortearPonderado,
  type Aleatorio,
} from "./sorteio";

export const TENTATIVAS_SEM_CABER = 10;
export const DIGITOS_NUMERO_LEITO = 2;

const CARACTERE_ZERO_ESQUERDA = "0";
const PRIMEIRO_LEITO = 1;

export interface PacienteGerado {
  chavePerfil: string;
  setor: Setor;
  leito: string;
  idadeAnos: number;
  sexo: Sexo;
  pesoKg: number;
  motivo: string;
  comorbidades: Comorbidade[]; // na ordem de Comorbidade, sem repetição
  diagnostico: string; // motivo e rótulos das comorbidades, separados por " / "
  tipoCuidado: TipoCuidado;
  horasTecnico: number;
  eventosPossiveis: EventoPossivel[];
}

export interface PlantaoGerado {
  setor: Setor;
  horasTurno: number;
  horasUsadas: number;
  pacientes: PacienteGerado[];
}

export function formatarLeito(numero: number): string {
  return `${PREFIXO_LEITO}${String(numero).padStart(
    DIGITOS_NUMERO_LEITO,
    CARACTERE_ZERO_ESQUERDA
  )}`;
}

export function sortearTipoCuidado(
  setor: Setor,
  aleatorio: Aleatorio = Math.random
): TipoCuidado {
  const distribuicao = DISTRIBUICAO_TIPO_CUIDADO[setor];
  const opcoes = TIPOS_CUIDADO_DA_ENFERMARIA.map((tipo) => ({
    valor: tipo,
    peso: distribuicao[tipo],
  }));
  return sortearPonderado(opcoes, aleatorio);
}

export function sortearPerfil(
  setor: Setor,
  tipo: TipoCuidado,
  aleatorio: Aleatorio = Math.random
): PerfilEpidemiologico | null {
  const candidatos = PERFIS_EPIDEMIOLOGICOS.filter(
    (perfil) =>
      perfil.setor === setor &&
      perfil.tiposCuidado.includes(tipo) &&
      perfil.peso > 0
  );
  if (candidatos.length === 0) {
    return null;
  }

  return sortearPonderado(
    candidatos.map((perfil) => ({ valor: perfil, peso: perfil.peso })),
    aleatorio
  );
}

function descobrirComorbidadeDoMotivo(
  perfil: PerfilEpidemiologico,
  motivo: string
): Comorbidade | undefined {
  const peloPerfil = COMORBIDADE_DO_PERFIL[perfil.chave];
  if (peloPerfil) {
    return peloPerfil;
  }
  const perfilDoMotivo = PERFIS_EPIDEMIOLOGICOS.find((p) =>
    p.motivos.includes(motivo)
  );
  return perfilDoMotivo ? COMORBIDADE_DO_PERFIL[perfilDoMotivo.chave] : undefined;
}

export function sortearComorbidades(
  perfil: PerfilEpidemiologico,
  idadeAnos: number,
  motivo: string,
  aleatorio: Aleatorio = Math.random
): Comorbidade[] {
  const comorbidadeDoMotivo = descobrirComorbidadeDoMotivo(perfil, motivo);
  const selecionadas = new Set<Comorbidade>();

  for (const obrigatoria of perfil.comorbidadesObrigatorias) {
    if (obrigatoria !== comorbidadeDoMotivo) {
      selecionadas.add(obrigatoria);
    }
  }

  const possiveis = new Set<Comorbidade>(perfil.comorbidadesPossiveis);
  const ehIdoso = idadeAnos >= IDADE_IDOSO;

  for (const comorbidade of ORDEM_COMORBIDADES) {
    if (
      comorbidade === comorbidadeDoMotivo ||
      selecionadas.has(comorbidade) ||
      !possiveis.has(comorbidade)
    ) {
      continue;
    }

    let probabilidade: number;
    if (ehIdoso) {
      probabilidade = FREQUENCIA_COMORBIDADE[comorbidade].idoso;
    } else if (comorbidade === "diabetes") {
      probabilidade = selecionadas.has("hipertensao")
        ? DIABETES_ADULTO_COM_HIPERTENSAO
        : DIABETES_ADULTO_SEM_HIPERTENSAO;
    } else {
      probabilidade = FREQUENCIA_COMORBIDADE[comorbidade].adulto;
    }

    if (sortearChance(probabilidade, aleatorio)) {
      selecionadas.add(comorbidade);
    }
  }

  return ORDEM_COMORBIDADES.filter((c) => selecionadas.has(c));
}

export function sortearPesoKg(
  sexo: Sexo,
  comorbidades: Comorbidade[],
  aleatorio: Aleatorio = Math.random
): number {
  const faixa = comorbidades.includes("obesidade")
    ? FAIXA_PESO_KG_OBESIDADE[sexo]
    : FAIXA_PESO_KG[sexo];
  return sortearInteiro(faixa.minimo, faixa.maximo, aleatorio);
}

export function gerarPaciente(
  perfil: PerfilEpidemiologico,
  tipo: TipoCuidado,
  leito: string,
  horasTurno: number,
  aleatorio: Aleatorio = Math.random
): PacienteGerado {
  const idadeAnos = sortearInteiro(
    perfil.idadeMinima,
    perfil.idadeMaxima,
    aleatorio
  );
  const sexo: Sexo = sortearChance(perfil.proporcaoMulheres, aleatorio)
    ? "feminino"
    : "masculino";
  const motivo =
    perfil.motivos[sortearIndice(perfil.motivos.length, aleatorio)];
  const comorbidades = sortearComorbidades(
    perfil,
    idadeAnos,
    motivo,
    aleatorio
  );
  const pesoKg = sortearPesoKg(sexo, comorbidades, aleatorio);
  const diagnostico = [
    motivo,
    ...comorbidades.map((c) => ROTULO_COMORBIDADE[c]),
  ].join(SEPARADOR_DIAGNOSTICO);
  const horasTecnico = horasTecnicoPorPaciente(tipo, horasTurno);

  return {
    chavePerfil: perfil.chave,
    setor: perfil.setor,
    leito,
    idadeAnos,
    sexo,
    pesoKg,
    motivo,
    comorbidades,
    diagnostico,
    tipoCuidado: tipo,
    horasTecnico,
    eventosPossiveis: [...perfil.eventosPossiveis],
  };
}

export function gerarPlantao(
  setor: Setor,
  horasTurno: number,
  aleatorio: Aleatorio = Math.random
): PlantaoGerado {
  const pacientes: PacienteGerado[] = [];
  let horasUsadas = 0;
  let tentativasSemCaber = 0;

  while (tentativasSemCaber < TENTATIVAS_SEM_CABER) {
    const tipo = sortearTipoCuidado(setor, aleatorio);
    const perfil = sortearPerfil(setor, tipo, aleatorio);
    if (!perfil) {
      continue;
    }

    const horasPaciente = horasTecnicoPorPaciente(tipo, horasTurno);
    const ehPrimeiroPaciente = pacientes.length === 0;

    if (
      ehPrimeiroPaciente ||
      cabeNoPlantao(horasUsadas, horasPaciente, horasTurno)
    ) {
      const leito = formatarLeito(pacientes.length + PRIMEIRO_LEITO);
      const paciente = gerarPaciente(
        perfil,
        tipo,
        leito,
        horasTurno,
        aleatorio
      );
      pacientes.push(paciente);
      horasUsadas += horasPaciente;
      tentativasSemCaber = 0;
    } else {
      tentativasSemCaber += 1;
    }
  }

  return {
    setor,
    horasTurno,
    horasUsadas,
    pacientes,
  };
}
