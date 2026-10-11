import type {
  EventoPlantao,
  PrescricaoFicticia,
  TarefaArrastavel,
} from "../data/prescricaoFicticia";

export const VALOR_CAMPO_AUSENTE_COLA = "—";

export interface EntradaColaPlantao {
  prescricao: Partial<PrescricaoFicticia> & Pick<PrescricaoFicticia, "itens">;
  turno: string;
  janelasHorarios: string[];
  grade: Record<string, TarefaArrastavel[]>;
  seNecessario: TarefaArrastavel[];
}

export interface CabecalhoColaPlantao {
  paciente: string;
  leito: string;
  idade: string;
  peso: string;
  diagnostico: string;
  alergias: string;
  data: string;
  turno: string;
}

export interface LinhaColaPlantao {
  horario: string;
  cuidado: string;
  detalhes: string;
}

export interface ItemSeNecessarioCola {
  cuidado: string;
  regra: string;
}

export interface ColaPlantao {
  cabecalho: CabecalhoColaPlantao;
  linhas: LinhaColaPlantao[];
  seNecessario: ItemSeNecessarioCola[];
  relato: EventoPlantao[];
}

function textoOuTraco(valor: string | undefined | null): string {
  if (typeof valor !== "string") {
    return VALOR_CAMPO_AUSENTE_COLA;
  }
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : VALOR_CAMPO_AUSENTE_COLA;
}

export function montarCola(entrada: EntradaColaPlantao): ColaPlantao {
  const { prescricao, turno, janelasHorarios, grade, seNecessario } = entrada;

  const cabecalho: CabecalhoColaPlantao = {
    paciente: textoOuTraco(prescricao.paciente),
    leito: textoOuTraco(prescricao.leito),
    idade: textoOuTraco(prescricao.idade),
    peso: textoOuTraco(prescricao.peso),
    diagnostico: textoOuTraco(prescricao.diagnostico),
    alergias: textoOuTraco(prescricao.alergias),
    data: textoOuTraco(prescricao.data),
    turno: textoOuTraco(turno),
  };

  const linhas: LinhaColaPlantao[] = [];
  for (const horario of janelasHorarios) {
    const cuidadosJanela = Array.isArray(grade[horario]) ? grade[horario] : [];
    if (cuidadosJanela.length === 0) {
      linhas.push({
        horario,
        cuidado: VALOR_CAMPO_AUSENTE_COLA,
        detalhes: VALOR_CAMPO_AUSENTE_COLA,
      });
      continue;
    }

    for (const item of cuidadosJanela) {
      linhas.push({
        horario,
        cuidado: textoOuTraco(item.rotulo),
        detalhes: textoOuTraco(item.detalhes),
      });
    }
  }

  const itensPorId = new Map(
    (Array.isArray(prescricao.itens) ? prescricao.itens : []).map((it) => [
      it.id,
      it,
    ])
  );

  const listaSeNecessario: ItemSeNecessarioCola[] = seNecessario.map((sn) => {
    const itemOriginal = itensPorId.get(sn.itemIdOriginal);
    const regra = itemOriginal?.horariosAprazados
      ? textoOuTraco(itemOriginal.horariosAprazados)
      : textoOuTraco(sn.detalhes);
    return {
      cuidado: textoOuTraco(sn.rotulo),
      regra,
    };
  });

  const relato: EventoPlantao[] = Array.isArray(prescricao.eventos)
    ? [...prescricao.eventos].sort((a, b) => a.horario.localeCompare(b.horario))
    : [];

  return {
    cabecalho,
    linhas,
    seNecessario: listaSeNecessario,
    relato,
  };
}
