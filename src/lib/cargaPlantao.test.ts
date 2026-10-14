import { describe, expect, it } from "vitest";
import type { TipoCuidado } from "../data/perfisEpidemiologicos";
import { cabeNoPlantao, horasTecnicoPorPaciente } from "./cargaPlantao";

describe("cargaPlantao", () => {
  it("calcula as horas de técnico por paciente em turno de 6 horas conforme os parâmetros do Cofen", () => {
    expect(horasTecnicoPorPaciente("minimo", 6)).toBeCloseTo(0.67, 5);
    expect(horasTecnicoPorPaciente("intermediario", 6)).toBeCloseTo(1.005, 5);
    expect(horasTecnicoPorPaciente("alta_dependencia", 6)).toBeCloseTo(1.6, 5);
    expect(horasTecnicoPorPaciente("semi_intensivo", 6)).toBeCloseTo(1.45, 5);
    expect(horasTecnicoPorPaciente("intensivo", 6)).toBeCloseTo(2.16, 5);
  });

  it("turno de 12 horas dá o dobro das horas de um turno de 6 horas", () => {
    const tipos: TipoCuidado[] = [
      "minimo",
      "intermediario",
      "alta_dependencia",
      "semi_intensivo",
      "intensivo",
    ];
    for (const tipo of tipos) {
      expect(horasTecnicoPorPaciente(tipo, 12)).toBeCloseTo(
        horasTecnicoPorPaciente(tipo, 6) * 2,
        6
      );
    }
  });

  it("cabeNoPlantao aceita a soma exata das horas do turno e recusa o que passa", () => {
    expect(cabeNoPlantao(4.4, 1.6, 6)).toBe(true);
    expect(cabeNoPlantao(5.0, 1.0, 6)).toBe(true);
    expect(cabeNoPlantao(5.0, 1.01, 6)).toBe(false);
    expect(cabeNoPlantao(4.5, 1.6, 6)).toBe(false);
  });
});
