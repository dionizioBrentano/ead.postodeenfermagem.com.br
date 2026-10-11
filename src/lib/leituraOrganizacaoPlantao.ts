import type { PayloadOrganizacaoPlantao } from "../api/ead";
import {
  OPCOES_TURNO,
  TEXTO_TURNO_NAO_INFORMADO,
  type MarcaPrimeiraVia,
  type PrescricaoFicticia,
} from "../data/prescricaoFicticia";

export type SituacaoPrimeiraViaLeitura =
  | "checado"
  | "nao_feito"
  | "reaprazado"
  | "sem_marca";

export interface CuidadoJanelaLeitura {
  rotulo: string;
  detalhes?: string;
}

export interface JanelaLeitura {
  horario: string;
  cuidados: CuidadoJanelaLeitura[];
}

export interface ItemPrimeiraViaLeitura {
  itemId: string;
  apresentacao: string;
  dose: string;
  via: string;
  horariosAprazados: string;
  situacao: SituacaoPrimeiraViaLeitura;
  horarioNovo?: string;
}

export interface LeituraOrganizacao {
  temConteudo: boolean;
  prescricao: PrescricaoFicticia | null;
  turnoTexto: string;
  janelas: JanelaLeitura[];
  primeiraVia: ItemPrimeiraViaLeitura[];
  conduta: string;
}

export function classificarMarcaPrimeiraVia(
  marca: MarcaPrimeiraVia | undefined
): { situacao: SituacaoPrimeiraViaLeitura; horarioNovo?: string } {
  if (marca?.status === "checado") {
    return { situacao: "checado" };
  }
  if (marca?.status === "circulado") {
    if (marca.motivo === "reaprazado") {
      return marca.horarioNovo
        ? { situacao: "reaprazado", horarioNovo: marca.horarioNovo }
        : { situacao: "reaprazado" };
    }
    return { situacao: "nao_feito" };
  }
  return { situacao: "sem_marca" };
}

function formatarTurno(turno: PayloadOrganizacaoPlantao["turno"]): string {
  if (!turno) {
    return TEXTO_TURNO_NAO_INFORMADO;
  }

  const opcao = turno.tipo
    ? OPCOES_TURNO.find((op) => op.chave === turno.tipo)
    : undefined;
  const duracao =
    typeof turno.duracaoHoras === "number" && turno.duracaoHoras > 0
      ? turno.duracaoHoras
      : opcao?.duracaoHoras;
  const inicio = typeof turno.inicio === "string" ? turno.inicio.trim() : "";

  if (duracao && inicio) {
    return `${duracao} horas, início ${inicio}`;
  }
  if (duracao) {
    return `${duracao} horas`;
  }
  if (inicio) {
    return `Início ${inicio}`;
  }
  return TEXTO_TURNO_NAO_INFORMADO;
}

export function montarLeituraOrganizacao(
  payload: PayloadOrganizacaoPlantao | null | undefined
): LeituraOrganizacao {
  const janelasHorarios = Array.isArray(payload?.janelasHorarios)
    ? payload.janelasHorarios
    : [];
  const grade =
    payload?.grade && typeof payload.grade === "object" ? payload.grade : {};
  const horariosGrade = Object.keys(grade);

  const temConteudo = Boolean(
    payload && (janelasHorarios.length > 0 || horariosGrade.length > 0)
  );

  const prescricao = payload?.prescricaoTeste ?? null;
  const turnoTexto = formatarTurno(payload?.turno);

  const horariosExtras = horariosGrade
    .filter((horario) => !janelasHorarios.includes(horario))
    .sort((a, b) => a.localeCompare(b));
  const todosHorarios = [...janelasHorarios, ...horariosExtras];

  const janelas: JanelaLeitura[] = todosHorarios.map((horario) => {
    const lista = Array.isArray(grade[horario]) ? grade[horario] : [];
    return {
      horario,
      cuidados: lista.map((item) =>
        item.detalhes !== undefined
          ? { rotulo: item.rotulo, detalhes: item.detalhes }
          : { rotulo: item.rotulo }
      ),
    };
  });

  const marcas =
    payload?.marcasPrimeiraVia && typeof payload.marcasPrimeiraVia === "object"
      ? payload.marcasPrimeiraVia
      : {};

  const primeiraVia: ItemPrimeiraViaLeitura[] = Array.isArray(prescricao?.itens)
    ? prescricao.itens.map((item) => {
        const { situacao, horarioNovo } = classificarMarcaPrimeiraVia(marcas[item.id]);

        return {
          itemId: item.id,
          apresentacao: item.apresentacao,
          dose: item.dose,
          via: item.via,
          horariosAprazados: item.horariosAprazados,
          situacao,
          ...(horarioNovo !== undefined ? { horarioNovo } : {}),
        };
      })
    : [];

  const conduta = typeof payload?.conduta === "string" ? payload.conduta : "";

  return {
    temConteudo,
    prescricao,
    turnoTexto,
    janelas,
    primeiraVia,
    conduta,
  };
}
