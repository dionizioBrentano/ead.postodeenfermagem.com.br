import { describe, it, expect } from "vitest";
import type { PrescricaoFicticia } from "../data/prescricaoFicticia";
import { montarLeituraOrganizacao } from "./leituraOrganizacaoPlantao";

function criarPrescricaoFicticia(): PrescricaoFicticia {
  return {
    hospital: "Hospital de Ensino Simulado",
    unidade: "Unidade Clínica",
    leito: "Leito 10",
    prontuario: "000100",
    paciente: "Paciente Simulado Leitura",
    idade: "60 anos",
    peso: "70 kg",
    data: "10/10/2026",
    diagnostico: "Hipertensão arterial sistêmica",
    alergias: "Nega alergias conhecidas",
    itens: [
      {
        id: "item-1",
        categoria: "medicamento",
        apresentacao: "Losartana 50 mg comprimido",
        dose: "50 mg",
        via: "VO",
        frequencia: "1x ao dia",
        horariosAprazados: "08h",
      },
      {
        id: "item-2",
        categoria: "medicamento",
        apresentacao: "Omeprazol 20 mg cápsula",
        dose: "20 mg",
        via: "VO",
        frequencia: "1x ao dia",
        horariosAprazados: "07h",
      },
      {
        id: "item-3",
        categoria: "medicamento",
        apresentacao: "Ceftriaxona 1 g pó para solução injetável",
        dose: "1 g",
        via: "EV",
        frequencia: "12/12h",
        horariosAprazados: "08h - 20h",
      },
      {
        id: "item-4",
        categoria: "cuidado",
        apresentacao: "Cabeceira elevada a 30°",
        dose: "—",
        via: "Leito",
        frequencia: "Contínuo",
        horariosAprazados: "Contínuo",
      },
      {
        id: "item-5",
        categoria: "sinais_vitais",
        apresentacao: "Aferir PA e FC",
        dose: "—",
        via: "Beira do leito",
        frequencia: "6/6h",
        horariosAprazados: "06h - 12h - 18h - 24h",
      },
    ],
  };
}

describe("montarLeituraOrganizacao", () => {
  it("quando recebe janelasHorarios e grade preenchidos, retorna as janelas na ordem de janelasHorarios com seus cuidados e lista vazia nas janelas sem cuidado", () => {
    const leitura = montarLeituraOrganizacao({
      janelasHorarios: ["08:00", "07:00", "09:00"],
      grade: {
        "07:00": [
          {
            id: "t-1",
            rotulo: "Omeprazol 20 mg",
            itemIdOriginal: "item-2",
            categoria: "medicamento",
            detalhes: "20 mg · VO · 07h",
          },
        ],
        "08:00": [
          {
            id: "t-2",
            rotulo: "Losartana 50 mg",
            itemIdOriginal: "item-1",
            categoria: "medicamento",
            detalhes: "50 mg · VO · 08h",
          },
          {
            id: "t-3",
            rotulo: "Aferir PA",
            itemIdOriginal: "item-5",
            categoria: "sinais_vitais",
          },
        ],
      },
    });

    expect(leitura.temConteudo).toBe(true);
    expect(leitura.janelas).toEqual([
      {
        horario: "08:00",
        cuidados: [
          { rotulo: "Losartana 50 mg", detalhes: "50 mg · VO · 08h" },
          { rotulo: "Aferir PA" },
        ],
      },
      {
        horario: "07:00",
        cuidados: [{ rotulo: "Omeprazol 20 mg", detalhes: "20 mg · VO · 07h" }],
      },
      {
        horario: "09:00",
        cuidados: [],
      },
    ]);
  });

  it("quando a grade possui horários fora de janelasHorarios, acrescenta esses horários no fim em ordem crescente", () => {
    const leitura = montarLeituraOrganizacao({
      janelasHorarios: ["07:00", "08:00"],
      grade: {
        "10:30": [
          {
            id: "t-10",
            rotulo: "Curativo",
            itemIdOriginal: "item-4",
            categoria: "cuidado",
          },
        ],
        "08:30": [
          {
            id: "t-8",
            rotulo: "Glicemia capilar",
            itemIdOriginal: "item-5",
            categoria: "glicemia",
          },
        ],
        "07:00": [],
      },
    });

    expect(leitura.janelas.map((j) => j.horario)).toEqual([
      "07:00",
      "08:00",
      "08:30",
      "10:30",
    ]);
    expect(leitura.janelas[2].cuidados).toEqual([{ rotulo: "Glicemia capilar" }]);
    expect(leitura.janelas[3].cuidados).toEqual([{ rotulo: "Curativo" }]);
  });

  it("quando há prescrição e marcas na primeira via, classifica checado, nao_feito, reaprazado com horário novo, circulado sem motivo como nao_feito e item sem marca como sem_marca", () => {
    const prescricao = criarPrescricaoFicticia();
    const leitura = montarLeituraOrganizacao({
      janelasHorarios: ["07:00"],
      prescricaoTeste: prescricao,
      marcasPrimeiraVia: {
        "item-1": { status: "checado" },
        "item-2": { status: "circulado", motivo: "nao_feito" },
        "item-3": {
          status: "circulado",
          motivo: "reaprazado",
          horarioNovo: "09:30",
        },
        "item-4": { status: "circulado" },
      },
    });

    expect(leitura.primeiraVia).toEqual([
      {
        itemId: "item-1",
        apresentacao: "Losartana 50 mg comprimido",
        dose: "50 mg",
        via: "VO",
        horariosAprazados: "08h",
        situacao: "checado",
      },
      {
        itemId: "item-2",
        apresentacao: "Omeprazol 20 mg cápsula",
        dose: "20 mg",
        via: "VO",
        horariosAprazados: "07h",
        situacao: "nao_feito",
      },
      {
        itemId: "item-3",
        apresentacao: "Ceftriaxona 1 g pó para solução injetável",
        dose: "1 g",
        via: "EV",
        horariosAprazados: "08h - 20h",
        situacao: "reaprazado",
        horarioNovo: "09:30",
      },
      {
        itemId: "item-4",
        apresentacao: "Cabeceira elevada a 30°",
        dose: "—",
        via: "Leito",
        horariosAprazados: "Contínuo",
        situacao: "nao_feito",
      },
      {
        itemId: "item-5",
        apresentacao: "Aferir PA e FC",
        dose: "—",
        via: "Beira do leito",
        horariosAprazados: "06h - 12h - 18h - 24h",
        situacao: "sem_marca",
      },
    ]);
  });

  it("quando o payload não possui prescricaoTeste, retorna prescricao nula e primeiraVia vazia sem erro", () => {
    const leitura = montarLeituraOrganizacao({
      janelasHorarios: ["07:00"],
      marcasPrimeiraVia: {
        "item-1": { status: "checado" },
      },
      conduta: "Paciente estável no turno.",
    });

    expect(leitura.prescricao).toBeNull();
    expect(leitura.primeiraVia).toEqual([]);
    expect(leitura.conduta).toBe("Paciente estável no turno.");
  });

  it("quando o payload é nulo, indefinido ou vazio sem janelasHorarios e sem grade, retorna temConteudo falso", () => {
    expect(montarLeituraOrganizacao(null).temConteudo).toBe(false);
    expect(montarLeituraOrganizacao(undefined).temConteudo).toBe(false);
    expect(montarLeituraOrganizacao({}).temConteudo).toBe(false);
    expect(
      montarLeituraOrganizacao({ janelasHorarios: [], grade: {} }).temConteudo
    ).toBe(false);
  });

  it("quando o turno traz duracaoHoras e inicio, formata turnoTexto com duração e horário de início", () => {
    const leitura = montarLeituraOrganizacao({
      janelasHorarios: ["07:00"],
      turno: { duracaoHoras: 4, inicio: "07:00" },
    });

    expect(leitura.turnoTexto).toBe("4 horas, início 07:00");
  });

  it("quando o turno traz apenas tipo sem duracaoHoras, busca a duração em OPCOES_TURNO", () => {
    const leituraApenasTipo = montarLeituraOrganizacao({
      janelasHorarios: ["13:00"],
      turno: { tipo: "6h_tarde" },
    });
    expect(leituraApenasTipo.turnoTexto).toBe("6 horas");

    const leituraTipoComInicio = montarLeituraOrganizacao({
      janelasHorarios: ["19:00"],
      turno: { tipo: "12h_noite", inicio: "19:00" },
    });
    expect(leituraTipoComInicio.turnoTexto).toBe("12 horas, início 19:00");
  });

  it("quando o turno não é informado, retorna Turno não informado", () => {
    expect(montarLeituraOrganizacao({ janelasHorarios: ["07:00"] }).turnoTexto).toBe(
      "Turno não informado"
    );
    expect(
      montarLeituraOrganizacao({ janelasHorarios: ["07:00"], turno: {} }).turnoTexto
    ).toBe("Turno não informado");
  });
});
