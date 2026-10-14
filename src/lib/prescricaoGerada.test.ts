import { describe, expect, it } from "vitest";
import { CATALOGO_TESTE_COMPLETO } from "./catalogoTeste.test-utils";
import { type PacienteGerado } from "./geradorPacientes";
import {
  gerarPlantaoComPrescricoes,
  gerarPrescricao,
  montarDieta,
} from "./prescricaoGerada";
import {
  CUIDADO_SONDA_NASOENTERAL,
  DIETA_ENTERAL,
  DIETA_ZERO,
  INSULINA_POR_ESCALA,
  VIA_SONDA_NASOENTERAL,
} from "../data/prescricaoPerfis";
import { REGRA_APRESENTACAO_ENCONTRADA } from "./validadorPrescricao";

function criarPacienteBase(parciais?: Partial<PacienteGerado>): PacienteGerado {
  return {
    chavePerfil: "pneumonia",
    setor: "clinica_medica",
    leito: "Leito 01",
    idadeAnos: 65,
    sexo: "feminino",
    pesoKg: 65,
    motivo: "Pneumonia adquirida na comunidade",
    comorbidades: [],
    diagnostico: "Pneumonia adquirida na comunidade",
    tipoCuidado: "intermediario",
    horasTecnico: 1.005,
    eventosPossiveis: [],
    ...parciais,
  };
}

describe("prescricaoGerada", () => {
  it("1. montarDieta: quatro casos e dietas zero/enteral sem mudança", () => {
    // Sem comorbidade
    const pSem = criarPacienteBase({ comorbidades: [] });
    expect(montarDieta("Dieta geral", pSem)).toBe("Dieta geral");

    // Só hipertensão
    const pHipertensao = criarPacienteBase({ comorbidades: ["hipertensao"] });
    expect(montarDieta("Dieta geral", pHipertensao)).toBe("Dieta geral hipossódica");

    // Só diabetes
    const pDiabetes = criarPacienteBase({ comorbidades: ["diabetes"] });
    expect(montarDieta("Dieta geral", pDiabetes)).toBe("Dieta geral para diabético");

    // As duas
    const pAmbos = criarPacienteBase({
      comorbidades: ["hipertensao", "diabetes"],
    });
    expect(montarDieta("Dieta geral", pAmbos)).toBe(
      "Dieta geral hipossódica para diabético"
    );

    // Dieta zero e enteral permanecem inalteradas
    expect(montarDieta(DIETA_ZERO, pAmbos)).toBe(DIETA_ZERO);
    expect(montarDieta(DIETA_ENTERAL, pAmbos)).toBe(DIETA_ENTERAL);
  });

  it("2. Paciente do perfil insuficiencia-cardiaca com hipertensão não recebe anti-hipertensivo de casa além do esquema do perfil", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "insuficiencia-cardiaca",
      comorbidades: ["hipertensao"],
      motivo: "Insuficiência cardíaca descompensada",
    });

    const { prescricao, problemas } = gerarPrescricao(
      paciente,
      CATALOGO_TESTE_COMPLETO
    );
    expect(problemas).toEqual([]);
    expect(prescricao).not.toBeNull();

    const nomes = prescricao?.itens
      .filter((i) => i.categoria === "medicamento")
      .map((i) => i.nome);

    // Não deve conter Losartana, Captopril, Atenolol ou Anlodipino
    expect(nomes).not.toContain("Losartana");
    expect(nomes).not.toContain("Captopril");
    expect(nomes).not.toContain("Atenolol");
    expect(nomes).not.toContain("Anlodipino");
    // Deve conter os fixos do perfil (Enalapril, Carvedilol, Furosemida, Espironolactona, AAS, Enoxaparina)
    expect(nomes).toContain("Enalapril");
    expect(nomes).toContain("Carvedilol");
  });

  it("3. Paciente com insuficiência cardíaca como comorbidade e hipertensão nunca recebe Losartana nem Captopril (Enalapril já entrou)", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "pneumonia",
      comorbidades: ["insuficiencia_cardiaca", "hipertensao"],
    });

    const { prescricao, problemas } = gerarPrescricao(
      paciente,
      CATALOGO_TESTE_COMPLETO
    );
    expect(problemas).toEqual([]);
    expect(prescricao).not.toBeNull();

    const nomes = prescricao?.itens
      .filter((i) => i.categoria === "medicamento")
      .map((i) => i.nome);

    expect(nomes).toContain("Enalapril");
    expect(nomes).not.toContain("Losartana");
    expect(nomes).not.toContain("Captopril");
  });

  it("4. Paciente com colesterol alto no perfil avc fica com uma Sinvastatina só, a de 40 mg", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "avc",
      comorbidades: ["colesterol_alto"],
      motivo: "Acidente vascular cerebral isquêmico com hemiparesia",
    });

    const { prescricao, problemas } = gerarPrescricao(
      paciente,
      CATALOGO_TESTE_COMPLETO
    );
    expect(problemas).toEqual([]);
    expect(prescricao).not.toBeNull();

    const sinvastatinas = prescricao?.itens.filter(
      (i) => i.nome === "Sinvastatina"
    );
    expect(sinvastatinas).toHaveLength(1);
    expect(sinvastatinas?.[0].dose).toBe("40 mg");
  });

  it("5. Paciente do perfil laparotomia com hipertensão, colesterol alto e depressão não tem nenhum medicamento por via oral", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "laparotomia",
      setor: "clinica_cirurgica",
      motivo: "Pós-operatório de laparotomia por oclusão intestinal",
      comorbidades: ["hipertensao", "colesterol_alto", "depressao"],
    });

    const { prescricao, problemas } = gerarPrescricao(
      paciente,
      CATALOGO_TESTE_COMPLETO
    );
    expect(problemas).toEqual([]);
    expect(prescricao).not.toBeNull();

    const itensVO = prescricao?.itens.filter(
      (i) => (i.categoria === "medicamento" || i.categoria === "sn") && i.via === "VO"
    );
    expect(itensVO).toHaveLength(0);
  });

  it("6. Paciente com diabetes tem insulina por escala; sem diabetes, não tem", () => {
    const comDiabetes = criarPacienteBase({
      comorbidades: ["diabetes"],
    });
    const semDiabetes = criarPacienteBase({
      comorbidades: [],
    });
    const perfilDiabetes = criarPacienteBase({
      chavePerfil: "diabetes-descompensado",
      motivo: "Diabetes tipo 2 descompensado",
      comorbidades: [],
    });

    const resCom = gerarPrescricao(comDiabetes, CATALOGO_TESTE_COMPLETO);
    const resSem = gerarPrescricao(semDiabetes, CATALOGO_TESTE_COMPLETO);
    const resPerfil = gerarPrescricao(perfilDiabetes, CATALOGO_TESTE_COMPLETO);

    expect(
      resCom.prescricao?.itens.some((i) => i.nome === INSULINA_POR_ESCALA.nome)
    ).toBe(true);
    expect(
      resSem.prescricao?.itens.some((i) => i.nome === INSULINA_POR_ESCALA.nome)
    ).toBe(false);
    expect(
      resPerfil.prescricao?.itens.some((i) => i.nome === INSULINA_POR_ESCALA.nome)
    ).toBe(true);
  });

  it("7. AVC com disfagia: dieta enteral, cuidado da sonda e medicamentos orais pela sonda", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "avc",
      motivo: "Acidente vascular cerebral isquêmico com hemiparesia",
      comorbidades: [],
    });

    // aleatorio que retorna 0.1 forçando sortearChance(CHANCE_DISFAGIA_NO_AVC) === true
    const aleatorioComDisfagia = () => 0.1;

    const { prescricao, problemas } = gerarPrescricao(
      paciente,
      CATALOGO_TESTE_COMPLETO,
      aleatorioComDisfagia
    );
    expect(problemas).toEqual([]);
    expect(prescricao).not.toBeNull();

    const dieta = prescricao?.itens.find((i) => i.categoria === "dieta");
    expect(dieta?.apresentacao).toBe(DIETA_ENTERAL);
    expect(dieta?.via).toBe(VIA_SONDA_NASOENTERAL);

    const temCuidadoSonda = prescricao?.itens.some(
      (i) => i.apresentacao === CUIDADO_SONDA_NASOENTERAL.apresentacao
    );
    expect(temCuidadoSonda).toBe(true);

    const orais = prescricao?.itens.filter(
      (i) => i.categoria === "medicamento" && i.nome !== "Enoxaparina"
    );
    expect(orais?.length).toBeGreaterThan(0);
    for (const med of orais ?? []) {
      expect(med.via).toBe(VIA_SONDA_NASOENTERAL);
    }
  });

  it("8. Medicamento EV fora do catálogo de teste: gerarPrescricao devolve null e problema apresentacao-encontrada", () => {
    const paciente = criarPacienteBase({
      chavePerfil: "pneumonia",
    });

    // Catálogo vazio: Ceftriaxona EV não será encontrada
    const { prescricao, problemas } = gerarPrescricao(paciente, []);
    expect(prescricao).toBeNull();
    expect(
      problemas.some((p) => p.regra === REGRA_APRESENTACAO_ENCONTRADA)
    ).toBe(true);
  });

  it("9. Com catálogo completo (16 itens), 500 plantões de cada setor em 6h e 12h: nenhum descartado e toda prescrição passa", () => {
    const setores = ["clinica_medica", "clinica_cirurgica"] as const;
    const turnos = [6, 12];

    for (const setor of setores) {
      for (const horasTurno of turnos) {
        for (let i = 0; i < 500; i++) {
          const { plantao, prescricoes, descartados } =
            gerarPlantaoComPrescricoes(
              setor,
              horasTurno,
              CATALOGO_TESTE_COMPLETO,
              Math.random
            );

          expect(descartados).toHaveLength(0);
          expect(prescricoes.length).toBeGreaterThan(0);
          expect(plantao.pacientes.length).toBe(prescricoes.length);

          for (const prescricao of prescricoes) {
            expect(prescricao.itens.length).toBeGreaterThan(0);
          }
        }
      }
    }
  }, 30000); // 30s timeout para 2.000 plantões com prescrições completas
});
