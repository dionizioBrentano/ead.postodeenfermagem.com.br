import { describe, it, expect } from "vitest";
import type { PrescricaoFicticia, TarefaArrastavel } from "../data/prescricaoFicticia";
import { montarCola } from "./colaPlantao";
import { gerarPdfCola, nomeArquivoCola } from "./pdfCola";

const PRESCRICAO_EXEMPLO: PrescricaoFicticia = {
  hospital: "Hospital Escola Simulado",
  unidade: "Clínica Cirúrgica",
  leito: "Leito 208-A (simulação)",
  prontuario: "000000-SIM",
  paciente: "Paciente Simulado de Teste",
  idade: "61 anos",
  peso: "76 kg",
  data: "10/10/2026",
  diagnostico: "Pós-operatório de laparotomia",
  alergias: "Nega alergias medicamentosas conhecidas",
  itens: [
    {
      id: "teste-omeprazol",
      categoria: "medicamento",
      apresentacao: "Omeprazol 40 mg pó",
      dose: "40 mg",
      via: "EV",
      frequencia: "1x ao dia",
      horariosAprazados: "08h",
    },
    {
      id: "teste-curativo",
      categoria: "cuidado",
      apresentacao: "Curativo com SF 0,9%",
      dose: "—",
      via: "Tópica",
      frequencia: "1x ao dia",
      horariosAprazados: "10h",
    },
    {
      id: "teste-dipirona-sn",
      categoria: "sn",
      apresentacao: "Dipirona 500 mg/mL ampola",
      dose: "1 g",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se dor ou febre (intervalo mínimo de 6 h)",
    },
  ],
};

describe("montarCola", () => {
  it("gera linhas na ordem das janelas e dos cuidados colados, e janela sem cuidado gera linha com '—'", () => {
    const t1: TarefaArrastavel = {
      id: "1",
      rotulo: "Omeprazol 40 mg pó 40 mg",
      itemIdOriginal: "teste-omeprazol",
      categoria: "medicamento",
      detalhes: "EV · 08h",
    };
    const t2: TarefaArrastavel = {
      id: "2",
      rotulo: "Aferir PA",
      itemIdOriginal: "teste-ssvv",
      categoria: "sinais_vitais",
      detalhes: "Pressão Arterial · 4/4h",
    };
    const t3: TarefaArrastavel = {
      id: "3",
      rotulo: "Curativo com SF 0,9%",
      itemIdOriginal: "teste-curativo",
      categoria: "cuidado",
      detalhes: "Tópica · 10h",
    };

    const cola = montarCola({
      prescricao: PRESCRICAO_EXEMPLO,
      turno: "4 horas (estágio)",
      janelasHorarios: ["07:00", "08:00", "09:00", "10:00"],
      grade: {
        "08:00": [t1, t2],
        "10:00": [t3],
      },
      seNecessario: [],
    });

    expect(cola.linhas).toEqual([
      { horario: "07:00", cuidado: "—", detalhes: "—" },
      {
        horario: "08:00",
        cuidado: "Omeprazol 40 mg pó 40 mg",
        detalhes: "EV · 08h",
      },
      {
        horario: "08:00",
        cuidado: "Aferir PA",
        detalhes: "Pressão Arterial · 4/4h",
      },
      { horario: "09:00", cuidado: "—", detalhes: "—" },
      {
        horario: "10:00",
        cuidado: "Curativo com SF 0,9%",
        detalhes: "Tópica · 10h",
      },
    ]);
  });

  it("'se necessário' traz a regra do item (horariosAprazados)", () => {
    const sn: TarefaArrastavel = {
      id: "sn-1",
      rotulo: "Dipirona 500 mg/mL ampola 1 g",
      itemIdOriginal: "teste-dipirona-sn",
      categoria: "sn",
      detalhes: "EV · S/N se dor ou febre (intervalo mínimo de 6 h)",
      isSN: true,
    };

    const cola = montarCola({
      prescricao: PRESCRICAO_EXEMPLO,
      turno: "6 horas (manhã)",
      janelasHorarios: ["07:00"],
      grade: {},
      seNecessario: [sn],
    });

    expect(cola.seNecessario).toEqual([
      {
        cuidado: "Dipirona 500 mg/mL ampola 1 g",
        regra: "S/N se dor ou febre (intervalo mínimo de 6 h)",
      },
    ]);
  });

  it("campo ausente no cabeçalho (como peso ausente em prescrição antiga) vira '—'", () => {
    const { peso: _peso, ...prescricaoSemPeso } = PRESCRICAO_EXEMPLO;

    const cola = montarCola({
      prescricao: prescricaoSemPeso,
      turno: "",
      janelasHorarios: ["07:00"],
      grade: {},
      seNecessario: [],
    });

    expect(cola.cabecalho.peso).toBe("—");
    expect(cola.cabecalho.turno).toBe("—");
    expect(cola.cabecalho.paciente).toBe("Paciente Simulado de Teste");
  });

  it("prescrição sem eventos dá relato vazio e com eventos devolve em ordem de horário", () => {
    const colaSemEventos = montarCola({
      prescricao: PRESCRICAO_EXEMPLO,
      turno: "4 horas (estágio)",
      janelasHorarios: ["07:00"],
      grade: {},
      seNecessario: [],
    });
    expect(colaSemEventos.relato).toEqual([]);

    const colaComEventos = montarCola({
      prescricao: {
        ...PRESCRICAO_EXEMPLO,
        eventos: [
          {
            horario: "22:00",
            itemId: "teste-omeprazol",
            situacao: "reaprazado",
            horarioNovo: "22:40",
            relato: "Evento das 22h",
          },
          {
            horario: "10:00",
            itemId: "teste-curativo",
            situacao: "nao_feito",
            relato: "Evento das 10h",
          },
        ],
      },
      turno: "4 horas (estágio)",
      janelasHorarios: ["07:00"],
      grade: {},
      seNecessario: [],
    });

    expect(colaComEventos.relato.map((e) => e.horario)).toEqual([
      "10:00",
      "22:00",
    ]);
  });
});

describe("gerarPdfCola e nomeArquivoCola", () => {
  it("gera documento PDF com pelo menos uma página e nomeia o arquivo com data com hífens e turno com slug", () => {
    const cola = montarCola({
      prescricao: PRESCRICAO_EXEMPLO,
      turno: "4 horas (estágio)",
      janelasHorarios: ["07:00", "08:00", "09:00", "10:00"],
      grade: {
        "08:00": [
          {
            id: "1",
            rotulo: "Omeprazol 40 mg pó 40 mg",
            itemIdOriginal: "teste-omeprazol",
            categoria: "medicamento",
            detalhes: "EV · 08h",
          },
        ],
      },
      seNecessario: [
        {
          id: "sn-1",
          rotulo: "Dipirona 500 mg/mL ampola 1 g",
          itemIdOriginal: "teste-dipirona-sn",
          categoria: "sn",
          isSN: true,
        },
      ],
    });

    expect(nomeArquivoCola(cola)).toBe(
      "organizacao-plantao_10-10-2026_4-horas-estagio.pdf"
    );

    const doc = gerarPdfCola(cola);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
