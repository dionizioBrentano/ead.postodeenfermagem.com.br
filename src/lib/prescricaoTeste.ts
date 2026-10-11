import type { SugestaoPreparo } from "../api/ead";
import {
  FREQUENCIA_INSULINA_ESCALA,
  HORARIOS_POR_FREQUENCIA,
  IDADE_MINIMA_APRESENTACAO_ADULTA,
  type CenarioPrescricaoTeste,
  type FaixaEtaria,
} from "../data/cenariosPrescricaoTeste";
import {
  PRESCRICAO_TESTE,
  type EventoPlantao,
  type PrescricaoFicticia,
  type PrescricaoItem,
} from "../data/prescricaoFicticia";

export function faixaEtariaDoPaciente(idadeAnos: number): FaixaEtaria {
  return idadeAnos >= IDADE_MINIMA_APRESENTACAO_ADULTA ? "adulto" : "pediatrico";
}

export function encontrarSugestaoPreparo(
  catalogo: SugestaoPreparo[],
  nome: string,
  via: string,
  faixa: FaixaEtaria
): SugestaoPreparo | null {
  for (const item of catalogo) {
    if (!item.faixa_etaria) {
      continue;
    }
    if (
      item.nome === nome &&
      item.via_preferencial === via &&
      item.faixa_etaria === faixa
    ) {
      return item;
    }
  }
  return null;
}

export function descreverApresentacao(sugestao: SugestaoPreparo): string {
  const base = `${sugestao.nome} ${sugestao.apresentacao}`;
  const partes: string[] = [];

  if (sugestao.preparo && sugestao.preparo.trim().length > 0) {
    partes.push(`sugestão de preparo: ${sugestao.preparo.trim()}`);
  }
  if (sugestao.tempo_administracao && sugestao.tempo_administracao.trim().length > 0) {
    partes.push(`tempo: ${sugestao.tempo_administracao.trim()}`);
  }

  if (partes.length === 0) {
    return base;
  }

  return `${base} (${partes.join("; ")})`;
}

export function montarPrescricaoTeste(
  catalogo: SugestaoPreparo[],
  cenario: CenarioPrescricaoTeste,
  data: string
): PrescricaoFicticia | null {
  const nomesFixos = new Set(
    cenario.medicamentosFixos.map((m) => m.nome.trim().toLowerCase())
  );
  for (const sn of cenario.medicamentosSeNecessario) {
    if (nomesFixos.has(sn.nome.trim().toLowerCase())) {
      return null;
    }
  }

  const faixa = faixaEtariaDoPaciente(cenario.idadeAnos);
  const itens: PrescricaoItem[] = [...cenario.cuidados];
  const idsCuidados = new Set(cenario.cuidados.map((c) => c.id));
  const idPorNomeMedicamento = new Map<string, string>();

  for (const fixo of cenario.medicamentosFixos) {
    const horariosAprazados =
      fixo.frequencia === FREQUENCIA_INSULINA_ESCALA
        ? FREQUENCIA_INSULINA_ESCALA
        : HORARIOS_POR_FREQUENCIA[fixo.frequencia];

    if (!horariosAprazados) {
      return null;
    }

    const sugestao = encontrarSugestaoPreparo(catalogo, fixo.nome, fixo.via, faixa);
    if (!sugestao) {
      return null;
    }

    const itemId = `teste-${sugestao.id}`;
    const item: PrescricaoItem = {
      id: itemId,
      categoria: "medicamento",
      apresentacao: descreverApresentacao(sugestao),
      dose: fixo.dose,
      via: fixo.via,
      frequencia: fixo.frequencia,
      horariosAprazados,
    };

    if (fixo.exigeGlicemiaCapilar !== undefined) {
      item.exigeGlicemiaCapilar = fixo.exigeGlicemiaCapilar;
    }

    itens.push(item);
    idPorNomeMedicamento.set(fixo.nome, itemId);
  }

  for (const sn of cenario.medicamentosSeNecessario) {
    const sugestao = encontrarSugestaoPreparo(catalogo, sn.nome, sn.via, faixa);
    if (!sugestao) {
      return null;
    }

    const itemId = `teste-${sugestao.id}`;
    itens.push({
      id: itemId,
      categoria: "sn",
      apresentacao: descreverApresentacao(sugestao),
      dose: sn.dose,
      via: sn.via,
      frequencia: "S/N",
      horariosAprazados: `S/N se ${sn.criterio} (intervalo mínimo de ${sn.intervaloMinimoHoras} h)`,
    });
    idPorNomeMedicamento.set(sn.nome, itemId);
  }

  const eventos: EventoPlantao[] = [];
  for (const ev of cenario.eventos) {
    let itemId: string | undefined;
    if ("cuidadoId" in ev.alvo) {
      if (idsCuidados.has(ev.alvo.cuidadoId)) {
        itemId = ev.alvo.cuidadoId;
      }
    } else {
      itemId = idPorNomeMedicamento.get(ev.alvo.medicamento);
    }

    if (!itemId) {
      return null;
    }

    eventos.push({
      horario: ev.horario,
      itemId,
      situacao: ev.situacao,
      ...(ev.horarioNovo !== undefined ? { horarioNovo: ev.horarioNovo } : {}),
      relato: ev.relato,
    });
  }

  eventos.sort((a, b) => a.horario.localeCompare(b.horario));

  return {
    hospital: cenario.hospital,
    unidade: cenario.unidade,
    leito: cenario.leito,
    prontuario: cenario.prontuario,
    paciente: cenario.paciente,
    idade: `${cenario.idadeAnos} anos`,
    peso: `${cenario.pesoKg} kg`,
    data,
    diagnostico: cenario.diagnostico,
    alergias: cenario.alergias,
    itens,
    nivel: cenario.nivel,
    eventos,
  };
}

export function escolherPrescricaoTeste(opcoes: {
  salva: PrescricaoFicticia | null;
  montada: PrescricaoFicticia | null;
}): PrescricaoFicticia {
  if (opcoes.salva) {
    return opcoes.salva;
  }
  if (opcoes.montada) {
    return opcoes.montada;
  }
  return PRESCRICAO_TESTE;
}

export function sortearIndice(quantidade: number): number {
  return Math.floor(Math.random() * quantidade);
}
