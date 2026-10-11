import type { PayloadOrganizacaoPlantao } from "../api/ead";
import type { PrescricaoItem } from "../data/prescricaoFicticia";
import {
  classificarMarcaPrimeiraVia,
  type SituacaoPrimeiraViaLeitura,
} from "./leituraOrganizacaoPlantao";
import { extrairTarefasDaPrescricao } from "./organizacaoPlantao";

export type SituacaoEsperadaPrimeiraVia =
  | SituacaoPrimeiraViaLeitura
  | "nao_conferido";

export interface ConferenciaJanela {
  horario: string;
  certos: string[];
  faltando: string[];
  sobrando: string[];
}

export interface ConferenciaItemPrimeiraVia {
  itemId: string;
  apresentacao: string;
  esperado: SituacaoEsperadaPrimeiraVia;
  marcado: SituacaoPrimeiraViaLeitura;
  horarioNovoEsperado?: string;
  horarioNovoMarcado?: string;
  confere: boolean | null;
  relato?: string;
}

export interface ConferenciaOrganizacao {
  janelas: ConferenciaJanela[];
  seNecessarioEmJanela: string[];
  primeiraVia: ConferenciaItemPrimeiraVia[];
  naoConferidos: string[];
}

function extrairHoraDeHorario(horario: string): number | null {
  const [hStr] = horario.trim().split(":");
  const numero = parseInt(hStr ?? "", 10);
  if (Number.isNaN(numero)) {
    return null;
  }
  const normalizada = numero === 24 ? 0 : numero;
  return normalizada >= 0 && normalizada <= 23 ? normalizada : null;
}

function itemEhSeNecessario(item: PrescricaoItem): boolean {
  return (
    item.categoria === "sn" ||
    item.frequencia === "S/N" ||
    item.horariosAprazados.trim().startsWith("S/N")
  );
}

export function horariosDoItem(item: PrescricaoItem): {
  horas: number[];
  temParteNaoConferivel: boolean;
} {
  const texto = item.horariosAprazados.trim();
  const comecaComSN = texto.startsWith("S/N");
  const temParteNaoConferivel =
    comecaComSN ||
    /\bAA\b/.test(texto) ||
    /\bAJ\b/.test(texto) ||
    texto.includes("Contínuo") ||
    texto.includes("Horários da nutrição");

  if (comecaComSN) {
    return { horas: [], temParteNaoConferivel: true };
  }

  const horas: number[] = [];
  const adicionarHora = (h: number) => {
    if (!horas.includes(h)) {
      horas.push(h);
    }
  };

  if (texto.includes("Horários pares")) {
    for (let h = 0; h <= 22; h += 2) {
      adicionarHora(h);
    }
  }

  const regexHora = /\b(\d{1,2})h\b/g;
  let match: RegExpExecArray | null = regexHora.exec(texto);
  while (match !== null) {
    const numero = parseInt(match[1], 10);
    const horaNormalizada = numero === 24 ? 0 : numero;
    if (horaNormalizada >= 0 && horaNormalizada <= 23) {
      adicionarHora(horaNormalizada);
    }
    match = regexHora.exec(texto);
  }

  return { horas, temParteNaoConferivel };
}

export function conferirOrganizacao(
  payload: PayloadOrganizacaoPlantao | null | undefined
): ConferenciaOrganizacao | null {
  const prescricao = payload?.prescricaoTeste;
  const janelasHorarios = payload?.janelasHorarios;

  if (
    !prescricao ||
    !Array.isArray(prescricao.itens) ||
    !Array.isArray(janelasHorarios) ||
    janelasHorarios.length === 0
  ) {
    return null;
  }

  const grade =
    payload.grade && typeof payload.grade === "object" ? payload.grade : {};
  const marcas =
    payload.marcasPrimeiraVia && typeof payload.marcasPrimeiraVia === "object"
      ? payload.marcasPrimeiraVia
      : {};

  const infoHorariosPorItem = new Map<
    string,
    { horas: number[]; temParteNaoConferivel: boolean }
  >();
  const idsItensSN = new Set<string>();
  const naoConferidos: string[] = [];

  for (const item of prescricao.itens) {
    const info = horariosDoItem(item);
    infoHorariosPorItem.set(item.id, info);
    if (itemEhSeNecessario(item)) {
      idsItensSN.add(item.id);
    }
    if (info.temParteNaoConferivel) {
      naoConferidos.push(item.apresentacao);
    }
  }

  const todasTarefas = extrairTarefasDaPrescricao(prescricao);
  const seNecessarioEmJanela: string[] = [];

  const horasJanelas = new Set<number>();
  for (const horario of janelasHorarios) {
    const h = extrairHoraDeHorario(horario);
    if (h !== null) {
      horasJanelas.add(h);
    }
  }

  const janelas: ConferenciaJanela[] = janelasHorarios.map((horario) => {
    const horaJanela = extrairHoraDeHorario(horario);
    const coladas = Array.isArray(grade[horario]) ? grade[horario] : [];

    for (const colada of coladas) {
      const ehSN =
        Boolean(colada.isSN) ||
        colada.categoria === "sn" ||
        idsItensSN.has(colada.itemIdOriginal);
      if (ehSN && !seNecessarioEmJanela.includes(colada.rotulo)) {
        seNecessarioEmJanela.push(colada.rotulo);
      }
    }

    const esperadas = todasTarefas.filter((tarefa) => {
      if (tarefa.isSN || idsItensSN.has(tarefa.itemIdOriginal)) {
        return false;
      }
      if (horaJanela === null) {
        return false;
      }
      const infoItem = infoHorariosPorItem.get(tarefa.itemIdOriginal);
      return infoItem ? infoItem.horas.includes(horaJanela) : false;
    });

    const chavesEsperadas = new Set(
      esperadas.map((t) => `${t.itemIdOriginal}|${t.rotulo}`)
    );
    const chavesColadas = new Set(
      coladas.map((t) => `${t.itemIdOriginal}|${t.rotulo}`)
    );

    const certos: string[] = [];
    const faltando: string[] = [];
    for (const esperada of esperadas) {
      const chave = `${esperada.itemIdOriginal}|${esperada.rotulo}`;
      if (chavesColadas.has(chave)) {
        certos.push(esperada.rotulo);
      } else {
        faltando.push(esperada.rotulo);
      }
    }

    const sobrando: string[] = [];
    for (const colada of coladas) {
      const chave = `${colada.itemIdOriginal}|${colada.rotulo}`;
      if (!chavesEsperadas.has(chave)) {
        sobrando.push(colada.rotulo);
      }
    }

    return {
      horario,
      certos,
      faltando,
      sobrando,
    };
  });

  const eventos = Array.isArray(prescricao.eventos) ? prescricao.eventos : [];

  const primeiraVia: ConferenciaItemPrimeiraVia[] = prescricao.itens.map(
    (item) => {
      const info = infoHorariosPorItem.get(item.id) ?? horariosDoItem(item);
      const eventoNoTurno = eventos.find((ev) => {
        if (ev.itemId !== item.id) {
          return false;
        }
        const horaEv = extrairHoraDeHorario(ev.horario);
        return horaEv !== null && horasJanelas.has(horaEv);
      });

      let esperado: SituacaoEsperadaPrimeiraVia;
      let horarioNovoEsperado: string | undefined;
      let relato: string | undefined;

      if (eventoNoTurno) {
        esperado = eventoNoTurno.situacao;
        if (
          eventoNoTurno.situacao === "reaprazado" &&
          eventoNoTurno.horarioNovo
        ) {
          horarioNovoEsperado = eventoNoTurno.horarioNovo;
        }
        relato = eventoNoTurno.relato;
      } else if (info.temParteNaoConferivel || itemEhSeNecessario(item)) {
        esperado = "nao_conferido";
      } else if (info.horas.some((h) => horasJanelas.has(h))) {
        esperado = "checado";
      } else {
        esperado = "sem_marca";
      }

      const classificado = classificarMarcaPrimeiraVia(marcas[item.id]);
      const marcado = classificado.situacao;
      const horarioNovoMarcado = classificado.horarioNovo;

      let confere: boolean | null;
      if (esperado === "nao_conferido") {
        confere = null;
      } else if (esperado === "reaprazado") {
        confere =
          marcado === "reaprazado" &&
          Boolean(horarioNovoEsperado) &&
          horarioNovoEsperado === horarioNovoMarcado;
      } else {
        confere = marcado === esperado;
      }

      return {
        itemId: item.id,
        apresentacao: item.apresentacao,
        esperado,
        marcado,
        ...(horarioNovoEsperado !== undefined ? { horarioNovoEsperado } : {}),
        ...(horarioNovoMarcado !== undefined ? { horarioNovoMarcado } : {}),
        confere,
        ...(relato !== undefined ? { relato } : {}),
      };
    }
  );

  return {
    janelas,
    seNecessarioEmJanela,
    primeiraVia,
    naoConferidos,
  };
}
