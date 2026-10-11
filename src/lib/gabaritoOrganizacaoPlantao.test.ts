import { describe, it, expect } from "vitest";
import type { PayloadOrganizacaoPlantao } from "../api/ead";
import type {
  PrescricaoFicticia,
  PrescricaoItem,
  TarefaArrastavel,
} from "../data/prescricaoFicticia";
import {
  conferirOrganizacao,
  horariosDoItem,
} from "./gabaritoOrganizacaoPlantao";

function criarItemFicticio(
  parcial: Partial<PrescricaoItem> & Pick<PrescricaoItem, "id" | "horariosAprazados">
): PrescricaoItem {
  return {
    id: parcial.id,
    categoria: parcial.categoria ?? "medicamento",
    apresentacao: parcial.apresentacao ?? `Item ${parcial.id}`,
    dose: parcial.dose ?? "1 g",
    via: parcial.via ?? "EV",
    frequencia: parcial.frequencia ?? "8/8h",
    horariosAprazados: parcial.horariosAprazados,
    ...(parcial.exigeGlicemiaCapilar !== undefined
      ? { exigeGlicemiaCapilar: parcial.exigeGlicemiaCapilar }
      : {}),
  };
}

const PRESCRICAO_FICTICIA_TESTE: PrescricaoFicticia = {
  hospital: "Hospital Escola Simulado",
  unidade: "Clínica Cirúrgica",
  leito: "Leito 201-A (simulação)",
  prontuario: "000000-SIM",
  paciente: "Paciente Simulado de Teste",
  idade: "60 anos",
  peso: "75 kg",
  data: "10/10/2026",
  diagnostico: "Pós-operatório simulado",
  alergias: "Nega alergias medicamentosas conhecidas",
  nivel: 2,
  itens: [
    criarItemFicticio({
      id: "item-dieta",
      categoria: "dieta",
      apresentacao: "Dieta branda",
      dose: "—",
      via: "VO",
      frequencia: "Conforme rotina",
      horariosAprazados: "Horários da nutrição",
    }),
    criarItemFicticio({
      id: "item-curativo",
      categoria: "cuidado",
      apresentacao: "Curativo com SF 0,9%",
      dose: "—",
      via: "Tópica",
      frequencia: "1x ao dia",
      horariosAprazados: "10h",
    }),
    criarItemFicticio({
      id: "item-omeprazol",
      categoria: "medicamento",
      apresentacao: "Omeprazol 40 mg pó (diluir em 100 mL SF 0,9%)",
      dose: "40 mg",
      via: "EV",
      frequencia: "1x ao dia",
      horariosAprazados: "08h",
    }),
    criarItemFicticio({
      id: "item-metronidazol",
      categoria: "medicamento",
      apresentacao: "Metronidazol 500 mg bolsa",
      dose: "500 mg",
      via: "EV",
      frequencia: "8/8h",
      horariosAprazados: "06h - 14h - 22h",
    }),
    criarItemFicticio({
      id: "item-insulina",
      categoria: "medicamento",
      apresentacao: "Insulina regular 100 UI/mL frasco-ampola",
      dose: "Conforme escala de glicemia capilar",
      via: "SC",
      frequencia: "AA, AJ e 22h",
      horariosAprazados: "AA, AJ e 22h",
      exigeGlicemiaCapilar: true,
    }),
    criarItemFicticio({
      id: "item-dipirona-sn",
      categoria: "sn",
      apresentacao: "Dipirona 500 mg/mL ampola 2 mL",
      dose: "1 g",
      via: "EV",
      frequencia: "S/N",
      horariosAprazados: "S/N se dor ou febre (intervalo mínimo de 6 h)",
    }),
  ],
  eventos: [
    {
      horario: "10:00",
      itemId: "item-curativo",
      situacao: "reaprazado",
      horarioNovo: "11:00",
      relato:
        "Às 10h o paciente estava no exame de imagem. O curativo foi feito às 11h.",
    },
    {
      horario: "14:00",
      itemId: "item-metronidazol",
      situacao: "nao_feito",
      relato: "Às 14h a dose foi suspensa para procedimento.",
    },
  ],
};

describe("horariosDoItem", () => {
  it("'06h - 14h - 22h' devolve [6, 14, 22] e temParteNaoConferivel falso", () => {
    const res = horariosDoItem(
      criarItemFicticio({ id: "1", horariosAprazados: "06h - 14h - 22h" })
    );
    expect(res.horas).toEqual([6, 14, 22]);
    expect(res.temParteNaoConferivel).toBe(false);
  });

  it("'06h - 12h - 18h - 00h' inclui 0 e temParteNaoConferivel falso", () => {
    const res = horariosDoItem(
      criarItemFicticio({ id: "2", horariosAprazados: "06h - 12h - 18h - 00h" })
    );
    expect(res.horas).toContain(0);
    expect(res.horas).toEqual([6, 12, 18, 0]);
    expect(res.temParteNaoConferivel).toBe(false);
  });

  it("'Horários pares' devolve as 12 horas pares de 0 a 22", () => {
    const res = horariosDoItem(
      criarItemFicticio({ id: "3", horariosAprazados: "Horários pares" })
    );
    expect(res.horas).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
    expect(res.horas).toHaveLength(12);
    expect(res.temParteNaoConferivel).toBe(false);
  });

  it("'AA, AJ e 22h' devolve [22] com temParteNaoConferivel verdadeiro", () => {
    const res = horariosDoItem(
      criarItemFicticio({ id: "4", horariosAprazados: "AA, AJ e 22h" })
    );
    expect(res.horas).toEqual([22]);
    expect(res.temParteNaoConferivel).toBe(true);
  });

  it("'Contínuo', 'Horários da nutrição' e 'S/N se dor...' devolvem temParteNaoConferivel verdadeiro", () => {
    const continuo = horariosDoItem(
      criarItemFicticio({ id: "5", horariosAprazados: "Contínuo" })
    );
    expect(continuo.horas).toEqual([]);
    expect(continuo.temParteNaoConferivel).toBe(true);

    const nutricao = horariosDoItem(
      criarItemFicticio({ id: "6", horariosAprazados: "Horários da nutrição" })
    );
    expect(nutricao.horas).toEqual([]);
    expect(nutricao.temParteNaoConferivel).toBe(true);

    const sn = horariosDoItem(
      criarItemFicticio({
        id: "7",
        categoria: "sn",
        frequencia: "S/N",
        horariosAprazados: "S/N se dor ou febre (intervalo mínimo de 6 h)",
      })
    );
    expect(sn.horas).toEqual([]);
    expect(sn.temParteNaoConferivel).toBe(true);
  });
});

describe("conferirOrganizacao", () => {
  it("payload sem prescricaoTeste ou sem janelasHorarios devolve null", () => {
    expect(conferirOrganizacao(null)).toBeNull();
    expect(conferirOrganizacao(undefined)).toBeNull();
    expect(
      conferirOrganizacao({
        janelasHorarios: ["07:00", "08:00"],
      })
    ).toBeNull();
    expect(
      conferirOrganizacao({
        prescricaoTeste: PRESCRICAO_FICTICIA_TESTE,
        janelasHorarios: [],
      })
    ).toBeNull();
  });

  it("janelas: classifica certos, faltando, sobrando e identifica 'se necessário' colado em janela", () => {
    const tarefaOmeprazol: TarefaArrastavel = {
      id: "t-omeprazol",
      rotulo: "Omeprazol 40 mg pó 40 mg",
      itemIdOriginal: "item-omeprazol",
      categoria: "medicamento",
    };
    const tarefaMetronidazolErrada: TarefaArrastavel = {
      id: "t-metro",
      rotulo: "Metronidazol 500 mg bolsa 500 mg",
      itemIdOriginal: "item-metronidazol",
      categoria: "medicamento",
    };
    const tarefaDipironaSN: TarefaArrastavel = {
      id: "t-dipirona-sn",
      rotulo: "Dipirona 500 mg/mL ampola 2 mL 1 g",
      itemIdOriginal: "item-dipirona-sn",
      categoria: "sn",
      isSN: true,
    };

    const payload: PayloadOrganizacaoPlantao = {
      prescricaoTeste: PRESCRICAO_FICTICIA_TESTE,
      janelasHorarios: ["08:00", "10:00"],
      grade: {
        "08:00": [tarefaOmeprazol, tarefaMetronidazolErrada],
        "10:00": [tarefaDipironaSN],
      },
    };

    const conf = conferirOrganizacao(payload);
    expect(conf).not.toBeNull();
    if (!conf) return;

    const janela08 = conf.janelas.find((j) => j.horario === "08:00");
    expect(janela08).toEqual({
      horario: "08:00",
      certos: ["Omeprazol 40 mg pó 40 mg"],
      faltando: [],
      sobrando: ["Metronidazol 500 mg bolsa 500 mg"],
    });

    const janela10 = conf.janelas.find((j) => j.horario === "10:00");
    expect(janela10).toEqual({
      horario: "10:00",
      certos: [],
      faltando: ["Curativo com SF 0,9%"],
      sobrando: ["Dipirona 500 mg/mL ampola 2 mL 1 g"],
    });

    expect(conf.seNecessarioEmJanela).toEqual([
      "Dipirona 500 mg/mL ampola 2 mL 1 g",
    ]);
  });

  it("'Aferir HGT' é esperado na janela das 22h quando a insulina tem 22h e o turno inclui 22h", () => {
    const payload: PayloadOrganizacaoPlantao = {
      prescricaoTeste: PRESCRICAO_FICTICIA_TESTE,
      janelasHorarios: ["22:00"],
      grade: {
        "22:00": [
          {
            id: "hgt-22",
            rotulo: "Aferir HGT",
            itemIdOriginal: "item-insulina",
            categoria: "glicemia",
          },
        ],
      },
    };

    const conf = conferirOrganizacao(payload);
    expect(conf).not.toBeNull();
    if (!conf) return;

    const janela22 = conf.janelas[0];
    expect(janela22.certos).toContain("Aferir HGT");
    expect(janela22.faltando).toContain(
      "Insulina regular 100 UI/mL frasco-ampola Conforme escala de glicemia capilar"
    );
    expect(janela22.faltando).toContain("Metronidazol 500 mg bolsa 500 mg");
  });

  it("primeira via: confere evento dentro do turno, ignora evento fora do turno, checado, sem_marca, nao_conferido e horário novo de reaprazado", () => {
    // Turno das 07h às 10h: inclui 08h (Omeprazol) e 10h (Curativo com evento reaprazado para 11:00).
    // Não inclui 06h, 14h (evento do Metronidazol fica fora do turno) nem 22h.
    const payload: PayloadOrganizacaoPlantao = {
      prescricaoTeste: PRESCRICAO_FICTICIA_TESTE,
      janelasHorarios: ["07:00", "08:00", "09:00", "10:00"],
      marcasPrimeiraVia: {
        "item-curativo": {
          status: "circulado",
          motivo: "reaprazado",
          horarioNovo: "11:00",
        },
        "item-omeprazol": {
          status: "checado",
        },
        "item-metronidazol": {
          status: "nenhum",
        },
        "item-insulina": {
          status: "checado",
        },
        "item-dipirona-sn": {
          status: "nenhum",
        },
      },
    };

    const conf = conferirOrganizacao(payload);
    expect(conf).not.toBeNull();
    if (!conf) return;

    // 1. Item com evento dentro do turno (10:00) espera a situação do evento ("reaprazado", "11:00")
    const curativo = conf.primeiraVia.find((i) => i.itemId === "item-curativo");
    expect(curativo).toMatchObject({
      esperado: "reaprazado",
      horarioNovoEsperado: "11:00",
      marcado: "reaprazado",
      horarioNovoMarcado: "11:00",
      confere: true,
      relato:
        "Às 10h o paciente estava no exame de imagem. O curativo foi feito às 11h.",
    });

    // 2. Evento fora do turno (14:00 do Metronidazol) não conta; sem hora no turno (06h, 14h, 22h), espera "sem_marca"
    const metronidazol = conf.primeiraVia.find(
      (i) => i.itemId === "item-metronidazol"
    );
    expect(metronidazol).toMatchObject({
      esperado: "sem_marca",
      marcado: "sem_marca",
      confere: true,
    });
    expect(metronidazol?.relato).toBeUndefined();

    // 3. Item sem evento e com hora no turno (08h do Omeprazol) espera "checado"
    const omeprazol = conf.primeiraVia.find(
      (i) => i.itemId === "item-omeprazol"
    );
    expect(omeprazol).toMatchObject({
      esperado: "checado",
      marcado: "checado",
      confere: true,
    });

    // 4. Item com AA/AJ e item "se necessário" esperam "nao_conferido" com confere nulo
    const insulina = conf.primeiraVia.find((i) => i.itemId === "item-insulina");
    expect(insulina).toMatchObject({
      esperado: "nao_conferido",
      marcado: "checado",
      confere: null,
    });

    const dipirona = conf.primeiraVia.find(
      (i) => i.itemId === "item-dipirona-sn"
    );
    expect(dipirona).toMatchObject({
      esperado: "nao_conferido",
      marcado: "sem_marca",
      confere: null,
    });

    expect(conf.naoConferidos).toEqual([
      "Dieta branda",
      "Insulina regular 100 UI/mL frasco-ampola",
      "Dipirona 500 mg/mL ampola 2 mL",
    ]);
  });

  it("reaprazado com horário novo diferente do esperado devolve confere falso", () => {
    const payload: PayloadOrganizacaoPlantao = {
      prescricaoTeste: PRESCRICAO_FICTICIA_TESTE,
      janelasHorarios: ["10:00"],
      marcasPrimeiraVia: {
        "item-curativo": {
          status: "circulado",
          motivo: "reaprazado",
          horarioNovo: "11:30",
        },
      },
    };

    const conf = conferirOrganizacao(payload);
    expect(conf).not.toBeNull();
    if (!conf) return;

    const curativo = conf.primeiraVia.find((i) => i.itemId === "item-curativo");
    expect(curativo).toMatchObject({
      esperado: "reaprazado",
      horarioNovoEsperado: "11:00",
      marcado: "reaprazado",
      horarioNovoMarcado: "11:30",
      confere: false,
    });
  });
});
