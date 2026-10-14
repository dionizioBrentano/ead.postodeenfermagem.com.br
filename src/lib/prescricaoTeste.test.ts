import { describe, it, expect } from "vitest";
import type { SugestaoPreparo } from "../api/ead";
import { CENARIOS_PRESCRICAO_TESTE, type CenarioPrescricaoTeste } from "../data/cenariosPrescricaoTeste";
import { PRESCRICAO_ESTUDO, PRESCRICAO_TESTE } from "../data/prescricaoFicticia";
import { extrairTarefasDaPrescricao } from "./organizacaoPlantao";
import { horariosDoItem } from "./gabaritoOrganizacaoPlantao";
import {
  descreverApresentacao,
  escolherPrescricaoTeste,
  faixaEtariaDoPaciente,
  montarPrescricaoTeste,
} from "./prescricaoTeste";
import { verificarRegrasClinicasDaPrescricao } from "./verificacoesClinicas.test-utils";

import {
  CATALOGO_TESTE_COMPLETO as CATALOGO_FICTICIO,
  ANOTACAO_INTERNA,
} from "./catalogoTeste.test-utils";

describe("faixaEtariaDoPaciente", () => {
  it("com 11 anos devolve 'pediatrico'", () => {
    expect(faixaEtariaDoPaciente(11)).toBe("pediatrico");
  });

  it("com 12 anos devolve 'adulto'", () => {
    expect(faixaEtariaDoPaciente(12)).toBe("adulto");
  });

  it("com 61 anos devolve 'adulto'", () => {
    expect(faixaEtariaDoPaciente(61)).toBe("adulto");
  });
});

describe("montarPrescricaoTeste nos três cenários clínicos", () => {
  for (const cenario of CENARIOS_PRESCRICAO_TESTE) {
    it(`cenário '${cenario.chave}' monta prescrição válida com verificações clínicas, conflito EV, diagnóstico, idade, peso e sem campos internos do catálogo`, () => {
      const prescricao = montarPrescricaoTeste(CATALOGO_FICTICIO, cenario, "10/10/2026");

      expect(prescricao).not.toBeNull();
      if (!prescricao) return;

      verificarRegrasClinicasDaPrescricao(prescricao, { exigeConflitoEV: true });

      expect(prescricao.diagnostico).toBe(cenario.diagnostico);
      expect(prescricao.idade).toBe(`${cenario.idadeAnos} anos`);
      expect(prescricao.peso).toBe(`${cenario.pesoKg} kg`);
      expect(JSON.stringify(prescricao)).not.toContain(ANOTACAO_INTERNA);
    });
  }

  it("a dose de cada medicamento montado é exatamente a do cenário e nunca algo vindo do catálogo", () => {
    for (const cenario of CENARIOS_PRESCRICAO_TESTE) {
      const prescricao = montarPrescricaoTeste(CATALOGO_FICTICIO, cenario, "10/10/2026");
      expect(prescricao).not.toBeNull();
      if (!prescricao) continue;

      const itensFixos = prescricao.itens.filter((i) => i.categoria === "medicamento");
      expect(itensFixos.map((i) => i.dose)).toEqual(
        cenario.medicamentosFixos.map((m) => m.dose)
      );

      const itensSN = prescricao.itens.filter((i) => i.categoria === "sn");
      expect(itensSN.map((i) => i.dose)).toEqual(
        cenario.medicamentosSeNecessario.map((m) => m.dose)
      );
    }
  });

  it("para paciente adulto a apresentação da dipirona é a de adulto (nunca a pediátrica), e cenário copiado do cenário 1 com idadeAnos 8 devolve null", () => {
    const cenarioAdulto = CENARIOS_PRESCRICAO_TESTE[0];
    const prescricaoAdulto = montarPrescricaoTeste(CATALOGO_FICTICIO, cenarioAdulto, "10/10/2026");
    expect(prescricaoAdulto).not.toBeNull();

    const dipironaMontada = prescricaoAdulto?.itens.find((i) =>
      i.apresentacao.startsWith("Dipirona")
    );
    expect(dipironaMontada).toBeDefined();
    expect(dipironaMontada?.apresentacao).toContain("ampola 2 mL");
    expect(dipironaMontada?.apresentacao).not.toContain("gotas");

    const cenarioPediatricoIncompleto: CenarioPrescricaoTeste = {
      ...cenarioAdulto,
      idadeAnos: 8,
    };
    expect(
      montarPrescricaoTeste(CATALOGO_FICTICIO, cenarioPediatricoIncompleto, "10/10/2026")
    ).toBeNull();
  });

  it("item sem faixa_etaria não combina e faz montarPrescricaoTeste devolver null", () => {
    const catalogoSemFaixa: SugestaoPreparo[] = CATALOGO_FICTICIO.map(
      ({ faixa_etaria: _faixa, ...resto }) => resto
    );
    expect(
      montarPrescricaoTeste(catalogoSemFaixa, CENARIOS_PRESCRICAO_TESTE[0], "10/10/2026")
    ).toBeNull();
  });

  it("catálogo vazio ou sem um dos medicamentos do cenário faz montarPrescricaoTeste devolver null", () => {
    const cenario = CENARIOS_PRESCRICAO_TESTE[0];
    expect(montarPrescricaoTeste([], cenario, "10/10/2026")).toBeNull();

    const catalogoSemMetronidazol = CATALOGO_FICTICIO.filter(
      (item) => item.nome !== "Metronidazol"
    );
    expect(
      montarPrescricaoTeste(catalogoSemMetronidazol, cenario, "10/10/2026")
    ).toBeNull();
  });

  it("frequência fora de HORARIOS_POR_FREQUENCIA ('de hora em hora') faz montarPrescricaoTeste devolver null", () => {
    const base = CENARIOS_PRESCRICAO_TESTE[0];
    const cenarioInvalido: CenarioPrescricaoTeste = {
      ...base,
      medicamentosFixos: base.medicamentosFixos.map((m, idx) =>
        idx === 0 ? { ...m, frequencia: "de hora em hora" } : m
      ),
    };
    expect(
      montarPrescricaoTeste(CATALOGO_FICTICIO, cenarioInvalido, "10/10/2026")
    ).toBeNull();
  });

  it("o mesmo nome em medicamentosFixos e medicamentosSeNecessario faz montarPrescricaoTeste devolver null", () => {
    const base = CENARIOS_PRESCRICAO_TESTE[0];
    const cenarioDuplicado: CenarioPrescricaoTeste = {
      ...base,
      medicamentosFixos: [
        ...base.medicamentosFixos,
        { nome: "Dipirona", dose: "1 g", via: "EV", frequencia: "6/6h" },
      ],
    };
    expect(
      montarPrescricaoTeste(CATALOGO_FICTICIO, cenarioDuplicado, "10/10/2026")
    ).toBeNull();
  });

  it("a insulina montada tem 'Aferir HGT' logo antes dela em extrairTarefasDaPrescricao e a enoxaparina não tem", () => {
    const prescricao = montarPrescricaoTeste(
      CATALOGO_FICTICIO,
      CENARIOS_PRESCRICAO_TESTE[0],
      "10/10/2026"
    );
    expect(prescricao).not.toBeNull();
    if (!prescricao) return;

    const tarefas = extrairTarefasDaPrescricao(prescricao);

    const idxInsulina = tarefas.findIndex(
      (t) => t.rotulo.toLowerCase().includes("insulina") && t.categoria !== "glicemia"
    );
    expect(idxInsulina).toBeGreaterThan(0);
    expect(tarefas[idxInsulina - 1].rotulo).toBe("Aferir HGT");

    const idxEnoxaparina = tarefas.findIndex((t) =>
      t.rotulo.toLowerCase().includes("enoxaparina")
    );
    expect(idxEnoxaparina).toBeGreaterThanOrEqual(0);
    expect(tarefas[idxEnoxaparina - 1]?.rotulo).not.toBe("Aferir HGT");
  });
});

describe("escolherPrescricaoTeste", () => {
  it("com prescrição salva devolve a salva mesmo havendo prescrição montada", () => {
    const montada = montarPrescricaoTeste(
      CATALOGO_FICTICIO,
      CENARIOS_PRESCRICAO_TESTE[1],
      "10/10/2026"
    );
    expect(escolherPrescricaoTeste({ salva: PRESCRICAO_ESTUDO, montada })).toBe(
      PRESCRICAO_ESTUDO
    );
  });

  it("sem prescrição salva devolve a prescrição montada", () => {
    const montada = montarPrescricaoTeste(
      CATALOGO_FICTICIO,
      CENARIOS_PRESCRICAO_TESTE[1],
      "10/10/2026"
    );
    expect(montada).not.toBeNull();
    expect(escolherPrescricaoTeste({ salva: null, montada })).toBe(montada);
  });

  it("sem prescrição salva e sem montada devolve PRESCRICAO_TESTE", () => {
    expect(escolherPrescricaoTeste({ salva: null, montada: null })).toBe(
      PRESCRICAO_TESTE
    );
  });
});

describe("descreverApresentacao", () => {
  it("com preparo e tempo inclui 'sugestão de preparo:' e 'tempo:' entre parênteses", () => {
    const texto = descreverApresentacao({
      id: "1",
      nome: "Ceftriaxona",
      apresentacao: "1 g pó liofilizado",
      via_preferencial: "EV",
      preparo: "Diluir em 100 mL SF 0,9%",
      tempo_administracao: "30 min",
    });

    expect(texto).toBe(
      "Ceftriaxona 1 g pó liofilizado (sugestão de preparo: Diluir em 100 mL SF 0,9%; tempo: 30 min)"
    );
  });

  it("sem preparo e sem tempo devolve apenas nome e apresentação sem parênteses", () => {
    const texto = descreverApresentacao({
      id: "2",
      nome: "Insulina regular",
      apresentacao: "100 UI/mL frasco-ampola",
      via_preferencial: "SC",
      preparo: null,
      tempo_administracao: null,
    });

    expect(texto).toBe("Insulina regular 100 UI/mL frasco-ampola");
    expect(texto).not.toContain("(");
    expect(texto).not.toContain(")");
  });
});

describe("níveis de dificuldade e eventos do plantão nos cenários", () => {
  it("cada cenário tem nível único de 1 a 3 e o número de eventos cresce com o nível", () => {
    const niveis = CENARIOS_PRESCRICAO_TESTE.map((c) => c.nivel);
    expect(new Set(niveis)).toEqual(new Set([1, 2, 3]));

    const ordenadosPorNivel = [...CENARIOS_PRESCRICAO_TESTE].sort(
      (a, b) => a.nivel - b.nivel
    );
    for (let i = 1; i < ordenadosPorNivel.length; i++) {
      expect(ordenadosPorNivel[i].eventos.length).toBeGreaterThan(
        ordenadosPorNivel[i - 1].eventos.length
      );
    }
  });

  it("todo evento montado aponta para um item existente, tem horário entre as horas do item e respeita horarioNovo conforme a situação", () => {
    for (const cenario of CENARIOS_PRESCRICAO_TESTE) {
      const prescricao = montarPrescricaoTeste(
        CATALOGO_FICTICIO,
        cenario,
        "10/10/2026"
      );
      expect(prescricao).not.toBeNull();
      if (!prescricao) continue;

      expect(prescricao.nivel).toBe(cenario.nivel);
      expect(prescricao.eventos).toBeDefined();
      const eventos = prescricao.eventos ?? [];
      expect(eventos).toHaveLength(cenario.eventos.length);

      for (const ev of eventos) {
        const item = prescricao.itens.find((i) => i.id === ev.itemId);
        expect(item).toBeDefined();
        if (!item) continue;

        const horaEvento = parseInt(ev.horario.split(":")[0] ?? "", 10);
        const { horas } = horariosDoItem(item);
        expect(horas).toContain(horaEvento);

        if (ev.situacao === "reaprazado") {
          expect(ev.horarioNovo).toBeTruthy();
        } else {
          expect(ev.horarioNovo).toBeUndefined();
        }
      }
    }
  });

  it("alvo de evento inexistente (cuidadoId ou medicamento) faz montarPrescricaoTeste devolver null", () => {
    const base = CENARIOS_PRESCRICAO_TESTE[0];

    const comCuidadoInexistente: CenarioPrescricaoTeste = {
      ...base,
      eventos: [
        ...base.eventos,
        {
          horario: "10:00",
          alvo: { cuidadoId: "teste-cuidado-inexistente" },
          situacao: "nao_feito",
          relato: "Relato fictício",
        },
      ],
    };
    expect(
      montarPrescricaoTeste(
        CATALOGO_FICTICIO,
        comCuidadoInexistente,
        "10/10/2026"
      )
    ).toBeNull();

    const comMedicamentoInexistente: CenarioPrescricaoTeste = {
      ...base,
      eventos: [
        ...base.eventos,
        {
          horario: "10:00",
          alvo: { medicamento: "Medicamento Inexistente" },
          situacao: "nao_feito",
          relato: "Relato fictício",
        },
      ],
    };
    expect(
      montarPrescricaoTeste(
        CATALOGO_FICTICIO,
        comMedicamentoInexistente,
        "10/10/2026"
      )
    ).toBeNull();
  });
});

