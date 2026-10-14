import { describe, expect, it } from "vitest";
import {
  COMORBIDADE_DO_PERFIL,
  FAIXA_PESO_KG,
  FAIXA_PESO_KG_OBESIDADE,
  ORDEM_COMORBIDADES,
  PERFIS_EPIDEMIOLOGICOS,
  ROTULO_COMORBIDADE,
  SEPARADOR_DIAGNOSTICO,
  TIPOS_CUIDADO_DA_ENFERMARIA,
  type Setor,
} from "../data/perfisEpidemiologicos";
import { TOLERANCIA_HORAS } from "./cargaPlantao";
import {
  formatarLeito,
  gerarPaciente,
  gerarPlantao,
  sortearComorbidades,
} from "./geradorPacientes";
import { criarAleatorioDeSequencia } from "./sorteio.test-utils";

const SETORES: Setor[] = ["clinica_medica", "clinica_cirurgica"];

describe("perfisEpidemiologicos e geradorPacientes", () => {
  it("todo perfil tem peso positivo, ao menos um motivo, ao menos um tipo da enfermaria, idade válida e proporcaoMulheres entre 0 e 1", () => {
    expect(PERFIS_EPIDEMIOLOGICOS.length).toBe(12);
    for (const perfil of PERFIS_EPIDEMIOLOGICOS) {
      expect(perfil.peso).toBeGreaterThan(0);
      expect(perfil.motivos.length).toBeGreaterThanOrEqual(1);
      const tiposValidosEnfermaria = perfil.tiposCuidado.filter((t) =>
        TIPOS_CUIDADO_DA_ENFERMARIA.includes(t)
      );
      expect(tiposValidosEnfermaria.length).toBeGreaterThanOrEqual(1);
      expect(perfil.idadeMinima).toBeLessThanOrEqual(perfil.idadeMaxima);
      expect(perfil.proporcaoMulheres).toBeGreaterThanOrEqual(0);
      expect(perfil.proporcaoMulheres).toBeLessThanOrEqual(1);
    }
  });

  it("para cada setor e cada tipo de cuidado da enfermaria existe ao menos um perfil que aceita o tipo", () => {
    const faltantes: string[] = [];
    for (const setor of SETORES) {
      for (const tipo of TIPOS_CUIDADO_DA_ENFERMARIA) {
        const aceita = PERFIS_EPIDEMIOLOGICOS.some(
          (p) => p.setor === setor && p.tiposCuidado.includes(tipo)
        );
        if (!aceita) {
          faltantes.push(`${setor}:${tipo}`);
        }
      }
    }
    expect(
      faltantes,
      `Faltam perfis para: ${faltantes.join(", ")}`
    ).toEqual([]);
  });

  it("em 500 plantões de cada setor (6h e 12h) respeita a carga do turno, as faixas dos perfis, comorbidades, ausência de intensivo e numeração dos leitos", () => {
    const mapaPerfis = new Map(
      PERFIS_EPIDEMIOLOGICOS.map((p) => [p.chave, p])
    );
    let totalPlantoes = 0;

    for (const setor of SETORES) {
      for (const horasTurno of [6, 12]) {
        for (let i = 0; i < 500; i++) {
          const plantao = gerarPlantao(setor, horasTurno);
          totalPlantoes += 1;

          if (plantao.pacientes.length < 1) {
            expect(plantao.pacientes.length).toBeGreaterThanOrEqual(1);
          }

          if (
            plantao.pacientes.length > 1 &&
            plantao.horasUsadas > horasTurno + TOLERANCIA_HORAS
          ) {
            expect(plantao.horasUsadas).toBeLessThanOrEqual(
              horasTurno + TOLERANCIA_HORAS
            );
          }

          plantao.pacientes.forEach((paciente, idx) => {
            const leitoEsperado = formatarLeito(idx + 1);
            if (paciente.leito !== leitoEsperado) {
              expect(paciente.leito).toBe(leitoEsperado);
            }
            if (paciente.tipoCuidado === "intensivo") {
              expect(paciente.tipoCuidado).not.toBe("intensivo");
            }

            const perfil = mapaPerfis.get(paciente.chavePerfil);
            if (!perfil) {
              expect(perfil).toBeDefined();
              return;
            }

            if (!perfil.tiposCuidado.includes(paciente.tipoCuidado)) {
              expect(perfil.tiposCuidado).toContain(paciente.tipoCuidado);
            }
            if (
              paciente.idadeAnos < perfil.idadeMinima ||
              paciente.idadeAnos > perfil.idadeMaxima
            ) {
              expect(paciente.idadeAnos).toBeGreaterThanOrEqual(
                perfil.idadeMinima
              );
              expect(paciente.idadeAnos).toBeLessThanOrEqual(
                perfil.idadeMaxima
              );
            }

            const faixaPeso = paciente.comorbidades.includes("obesidade")
              ? FAIXA_PESO_KG_OBESIDADE[paciente.sexo]
              : FAIXA_PESO_KG[paciente.sexo];
            if (
              paciente.pesoKg < faixaPeso.minimo ||
              paciente.pesoKg > faixaPeso.maximo
            ) {
              expect(paciente.pesoKg).toBeGreaterThanOrEqual(faixaPeso.minimo);
              expect(paciente.pesoKg).toBeLessThanOrEqual(faixaPeso.maximo);
            }

            for (const obrigatoria of perfil.comorbidadesObrigatorias) {
              if (!paciente.comorbidades.includes(obrigatoria)) {
                expect(paciente.comorbidades).toContain(obrigatoria);
              }
            }

            const permitidas = new Set([
              ...perfil.comorbidadesObrigatorias,
              ...perfil.comorbidadesPossiveis,
            ]);
            for (const comorbidade of paciente.comorbidades) {
              if (!permitidas.has(comorbidade)) {
                expect(permitidas.has(comorbidade)).toBe(true);
              }
            }

            // Sem repetição e na ordem de Comorbidade
            if (
              new Set(paciente.comorbidades).size !==
              paciente.comorbidades.length
            ) {
              expect(new Set(paciente.comorbidades).size).toBe(
                paciente.comorbidades.length
              );
            }
            const ordenadas = ORDEM_COMORBIDADES.filter((c) =>
              paciente.comorbidades.includes(c)
            );
            if (
              paciente.comorbidades.some((c, pos) => c !== ordenadas[pos])
            ) {
              expect(paciente.comorbidades).toEqual(ordenadas);
            }

            // Nenhuma comorbidade igual à doença do motivo
            const comorbidadeDoMotivo =
              COMORBIDADE_DO_PERFIL[perfil.chave];
            if (
              comorbidadeDoMotivo &&
              paciente.comorbidades.includes(comorbidadeDoMotivo)
            ) {
              expect(paciente.comorbidades).not.toContain(comorbidadeDoMotivo);
            }
          });
        }
      }
    }

    expect(totalPlantoes).toBe(2000);
  });

  it("adulto (< 60 anos) com hipertensão usa 0,206 para o diabetes e adulto sem hipertensão usa 0,037", () => {
    const perfilColecistectomia = PERFIS_EPIDEMIOLOGICOS.find(
      (p) => p.chave === "colecistectomia"
    );
    expect(perfilColecistectomia).toBeDefined();
    if (!perfilColecistectomia) return;

    // Possíveis em colecistectomia na ordem de Comorbidade: hipertensao, diabetes, obesidade, depressao
    // Caso 1: adulto (45 anos) COM hipertensão (0.10 < 0.239) e sorteio de diabetes em 0.205 (< 0.206) -> tem diabetes
    const comHipertensaoEDiabetes = sortearComorbidades(
      perfilColecistectomia,
      45,
      perfilColecistectomia.motivos[0],
      criarAleatorioDeSequencia([0.1, 0.205, 0.99, 0.99])
    );
    expect(comHipertensaoEDiabetes).toEqual(["hipertensao", "diabetes"]);

    // Caso 2: adulto (45 anos) COM hipertensão (0.10 < 0.239) e sorteio de diabetes em 0.206 (>= 0.206) -> não tem diabetes
    const comHipertensaoSemDiabetes = sortearComorbidades(
      perfilColecistectomia,
      45,
      perfilColecistectomia.motivos[0],
      criarAleatorioDeSequencia([0.1, 0.206, 0.99, 0.99])
    );
    expect(comHipertensaoSemDiabetes).toEqual(["hipertensao"]);

    // Caso 3: adulto (45 anos) SEM hipertensão (0.50 >= 0.239) e sorteio de diabetes em 0.036 (< 0.037) -> tem diabetes
    const semHipertensaoComDiabetes = sortearComorbidades(
      perfilColecistectomia,
      45,
      perfilColecistectomia.motivos[0],
      criarAleatorioDeSequencia([0.5, 0.036, 0.99, 0.99])
    );
    expect(semHipertensaoComDiabetes).toEqual(["diabetes"]);

    // Caso 4: adulto (45 anos) SEM hipertensão (0.50 >= 0.239) e sorteio de diabetes em 0.037 (>= 0.037) -> não tem diabetes
    const semHipertensaoSemDiabetes = sortearComorbidades(
      perfilColecistectomia,
      45,
      perfilColecistectomia.motivos[0],
      criarAleatorioDeSequencia([0.5, 0.037, 0.99, 0.99])
    );
    expect(semHipertensaoSemDiabetes).toEqual([]);
  });

  it("o diagnóstico é o motivo seguido dos rótulos das comorbidades separados por ' / '", () => {
    const perfilDpoc = PERFIS_EPIDEMIOLOGICOS.find((p) => p.chave === "dpoc");
    expect(perfilDpoc).toBeDefined();
    if (!perfilDpoc) return;

    // Possíveis em dpoc (além da obrigatória tabagismo): hipertensao, diabetes, depressao, insuficiencia_cardiaca
    // Com idade 70 (idoso), sorteamos hipertensao (0.1 < 0.615) e diabetes (0.1 < 0.404), recusando depressao (0.99) e insuficiencia_cardiaca (0.99)
    const aleatorio = criarAleatorioDeSequencia([
      0.5, // idade
      0.2, // sexo feminino
      0, // motivo
      0.1, // hipertensao: sim
      0.1, // diabetes: sim
      0.99, // depressao: não
      0.99, // insuficiencia_cardiaca: não
      0.5, // peso
    ]);

    const paciente = gerarPaciente(
      perfilDpoc,
      "intermediario",
      "Leito 01",
      6,
      aleatorio
    );

    expect(paciente.comorbidades).toEqual([
      "hipertensao",
      "diabetes",
      "tabagismo",
    ]);
    expect(paciente.diagnostico).toBe(
      [
        perfilDpoc.motivos[0],
        ROTULO_COMORBIDADE.hipertensao,
        ROTULO_COMORBIDADE.diabetes,
        ROTULO_COMORBIDADE.tabagismo,
      ].join(SEPARADOR_DIAGNOSTICO)
    );
  });
});
