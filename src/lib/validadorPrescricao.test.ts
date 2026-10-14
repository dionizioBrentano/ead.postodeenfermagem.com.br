import { describe, expect, it } from "vitest";
import { CATALOGO_TESTE_COMPLETO } from "./catalogoTeste.test-utils";
import type { PrescricaoGerada } from "./prescricaoGerada";
import {
  REGRA_APRESENTACAO_ENCONTRADA,
  REGRA_COMBINACAO_PROIBIDA,
  REGRA_DIETA_ZERO_SEM_VIA_ORAL,
  REGRA_DOSE_COM_UNIDADE,
  REGRA_FREQUENCIA_CONHECIDA,
  REGRA_GLICEMIA_SO_COM_INSULINA,
  REGRA_IDS_UNICOS,
  REGRA_MEDICAMENTO_UNICO,
  REGRA_SE_NECESSARIO_COMPLETO,
  REGRA_SINAIS_VITAIS_PRESENTES,
  validarPrescricao,
} from "./validadorPrescricao";

function criarPrescricaoValida(): PrescricaoGerada {
  return {
    paciente: {
      chavePerfil: "pneumonia",
      setor: "clinica_medica",
      leito: "Leito 01",
      idadeAnos: 65,
      sexo: "masculino",
      pesoKg: 70,
      motivo: "Pneumonia adquirida na comunidade",
      comorbidades: [],
      diagnostico: "Pneumonia adquirida na comunidade",
      tipoCuidado: "intermediario",
      horasTecnico: 1.005,
      eventosPossiveis: [],
    },
    itens: [
      {
        id: "dieta-geral",
        categoria: "dieta",
        apresentacao: "Dieta geral",
        dose: "—",
        via: "VO",
        frequencia: "Conforme rotina",
      },
      {
        id: "cuidado-cabeceira",
        categoria: "cuidado",
        apresentacao: "Cabeceira elevada entre 30° e 45°",
        dose: "—",
        via: "Leito",
        frequencia: "Contínuo",
      },
      {
        id: "sinais-vitais-afericao",
        categoria: "sinais_vitais",
        apresentacao: "Aferição de sinais vitais (PA, FC, FR, TAx, SpO2)",
        dose: "—",
        via: "Beira do leito",
        frequencia: "6/6h",
      },
      {
        id: "med-ceftriaxona",
        categoria: "medicamento",
        nome: "Ceftriaxona",
        apresentacao:
          "Ceftriaxona 1 g pó liofilizado (sugestão de preparo: Reconstituir em 10 mL de AD e diluir em 100 mL de SF 0,9%; tempo: 30 min)",
        dose: "1 g",
        via: "EV",
        frequencia: "12/12h",
      },
      {
        id: "sn-dipirona",
        categoria: "sn",
        nome: "Dipirona",
        apresentacao:
          "Dipirona 500 mg/mL ampola 2 mL (sugestão de preparo: Diluir em 20 mL de SF 0,9%; tempo: 10 min)",
        dose: "1 g",
        via: "EV",
        frequencia: "Se necessário",
        criterio: "dor ou febre",
        intervaloMinimoHoras: 6,
      },
    ],
  };
}

describe("validadorPrescricao — 10 regras", () => {
  it("prescrição base válida é aprovada sem nenhum problema", () => {
    const prescricao = criarPrescricaoValida();
    const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
    expect(problemas).toEqual([]);
  });

  describe("1. glicemia-so-com-insulina", () => {
    it("acusa quando medicamento não-insulina exige glicemia capilar", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[3].exigeGlicemiaCapilar = true; // Ceftriaxona com glicemia

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_GLICEMIA_SO_COM_INSULINA);

      // Corrigida
      delete prescricao.itens[3].exigeGlicemiaCapilar;
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });

    it("acusa quando insulina não possui exigência de glicemia capilar", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens.push({
        id: "med-insulina",
        categoria: "medicamento",
        nome: "Insulina regular",
        apresentacao:
          "Insulina regular 100 UI/mL frasco-ampola (sugestão de preparo: Aspirar em seringa própria de insulina; tempo: Aplicação subcutânea)",
        dose: "Conforme escala de glicemia capilar",
        via: "SC",
        frequencia: "AA, AJ e 22h",
        exigeGlicemiaCapilar: false,
      });

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_GLICEMIA_SO_COM_INSULINA);

      // Corrigida
      prescricao.itens[prescricao.itens.length - 1].exigeGlicemiaCapilar = true;
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("2. medicamento-unico", () => {
    it("acusa quando o mesmo medicamento aparece duplicado na prescrição", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens.push({
        id: "med-ceftriaxona-duplicada",
        categoria: "medicamento",
        nome: "Ceftriaxona",
        apresentacao:
          "Ceftriaxona 1 g pó liofilizado (sugestão de preparo: Reconstituir em 10 mL de AD e diluir em 100 mL de SF 0,9%; tempo: 30 min)",
        dose: "1 g",
        via: "EV",
        frequencia: "1x ao dia",
      });

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_MEDICAMENTO_UNICO);

      // Corrigida
      prescricao.itens.pop();
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("3. dose-com-unidade", () => {
    it("acusa quando a dose não possui unidade reconhecida", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[3].dose = "10"; // Ceftriaxona sem g/mg

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_DOSE_COM_UNIDADE);

      // Corrigida
      prescricao.itens[3].dose = "1 g";
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("4. frequencia-conhecida", () => {
    it("acusa frequência desconhecida em medicamento fixo", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[3].frequencia = "3/3h";

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_FREQUENCIA_CONHECIDA);

      // Corrigida
      prescricao.itens[3].frequencia = "12/12h";
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("5. se-necessario-completo", () => {
    it("acusa se necessário sem critério ou com intervalo zero", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[4].criterio = ""; // Dipirona sem critério

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_SE_NECESSARIO_COMPLETO);

      // Corrigida
      prescricao.itens[4].criterio = "dor ou febre";
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("6. combinacao-proibida", () => {
    it("acusa associação proibida de anti-hipertensivos (Losartana + Enalapril)", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens.push(
        {
          id: "med-losartana",
          categoria: "medicamento",
          nome: "Losartana",
          apresentacao: "Losartana potássica 50 mg comprimido",
          dose: "50 mg",
          via: "VO",
          frequencia: "12/12h",
        },
        {
          id: "med-enalapril",
          categoria: "medicamento",
          nome: "Enalapril",
          apresentacao: "Maleato de enalapril 10 mg comprimido",
          dose: "10 mg",
          via: "VO",
          frequencia: "12/12h",
        }
      );

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_COMBINACAO_PROIBIDA);

      // Corrigida removendo o Enalapril
      prescricao.itens.pop();
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("7. apresentacao-encontrada", () => {
    it("acusa quando medicamento EV não existe no catálogo de preparo", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens.push({
        id: "med-desconhecido",
        categoria: "medicamento",
        nome: "Medicamento Desconhecido",
        apresentacao: "Medicamento Desconhecido 500 mg injetável",
        dose: "500 mg",
        via: "EV",
        frequencia: "12/12h",
      });

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_APRESENTACAO_ENCONTRADA);

      // Corrigida
      prescricao.itens.pop();
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("8. dieta-zero-sem-via-oral", () => {
    it("acusa quando paciente em dieta zero recebe medicamento por via oral", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[0].apresentacao = "Dieta zero";
      prescricao.itens.push({
        id: "med-azitromicina",
        categoria: "medicamento",
        nome: "Azitromicina",
        apresentacao: "Azitromicina 500 mg comprimido",
        dose: "500 mg",
        via: "VO",
        frequencia: "1x ao dia",
      });

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_DIETA_ZERO_SEM_VIA_ORAL);

      // Corrigida removendo o medicamento oral
      prescricao.itens.pop();
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("9. sinais-vitais-presentes", () => {
    it("acusa ausência de item de sinais vitais", () => {
      const prescricao = criarPrescricaoValida();
      const sinais = prescricao.itens.splice(2, 1)[0]; // Remove sinais vitais

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_SINAIS_VITAIS_PRESENTES);

      // Corrigida reinserindo sinais vitais
      prescricao.itens.splice(2, 0, sinais);
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });

  describe("10. ids-unicos", () => {
    it("acusa itens com identificadores duplicados", () => {
      const prescricao = criarPrescricaoValida();
      prescricao.itens[4].id = prescricao.itens[3].id; // Duplica id med-ceftriaxona

      const problemas = validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO);
      expect(problemas).toHaveLength(1);
      expect(problemas[0].regra).toBe(REGRA_IDS_UNICOS);

      // Corrigida
      prescricao.itens[4].id = "sn-dipirona";
      expect(validarPrescricao(prescricao, CATALOGO_TESTE_COMPLETO)).toEqual([]);
    });
  });
});
