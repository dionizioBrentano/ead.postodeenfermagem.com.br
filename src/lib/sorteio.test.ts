import { describe, expect, it } from "vitest";
import {
  MENSAGEM_ERRO_SORTEIO_SEM_PESO_POSITIVO,
  sortearChance,
  sortearIndice,
  sortearInteiro,
  sortearPonderado,
} from "./sorteio";
import { criarAleatorioDeSequencia } from "./sorteio.test-utils";

describe("sorteio", () => {
  it("sortearPonderado respeita o peso nos limites de cada faixa e ignora peso zero ou negativo", () => {
    const opcoes = [
      { valor: "ignorada-zero", peso: 0 },
      { valor: "ignorada-negativa", peso: -5 },
      { valor: "a", peso: 20 },
      { valor: "b", peso: 30 },
      { valor: "c", peso: 50 },
    ];

    const aleatorio = criarAleatorioDeSequencia([
      0,
      0.1999,
      0.2,
      0.4999,
      0.5,
      0.9999,
    ]);

    expect(sortearPonderado(opcoes, aleatorio)).toBe("a");
    expect(sortearPonderado(opcoes, aleatorio)).toBe("a");
    expect(sortearPonderado(opcoes, aleatorio)).toBe("b");
    expect(sortearPonderado(opcoes, aleatorio)).toBe("b");
    expect(sortearPonderado(opcoes, aleatorio)).toBe("c");
    expect(sortearPonderado(opcoes, aleatorio)).toBe("c");
  });

  it("sortearPonderado sem peso positivo lança erro com mensagem clara", () => {
    expect(() =>
      sortearPonderado([
        { valor: "x", peso: 0 },
        { valor: "y", peso: -10 },
      ])
    ).toThrow(MENSAGEM_ERRO_SORTEIO_SEM_PESO_POSITIVO);

    expect(() => sortearPonderado([])).toThrow(
      MENSAGEM_ERRO_SORTEIO_SEM_PESO_POSITIVO
    );
  });

  it("sortearInteiro inclui os dois extremos", () => {
    const aleatorio = criarAleatorioDeSequencia([0, 0.5, 0.999999]);
    expect(sortearInteiro(10, 12, aleatorio)).toBe(10);
    expect(sortearInteiro(10, 12, aleatorio)).toBe(11);
    expect(sortearInteiro(10, 12, aleatorio)).toBe(12);
  });

  it("sortearIndice continua igual ao comportamento anterior", () => {
    const aleatorio = criarAleatorioDeSequencia([0, 0.34, 0.67, 0.999]);
    expect(sortearIndice(3, aleatorio)).toBe(0);
    expect(sortearIndice(3, aleatorio)).toBe(1);
    expect(sortearIndice(3, aleatorio)).toBe(2);
    expect(sortearIndice(3, aleatorio)).toBe(2);
  });

  it("sortearChance devolve verdadeiro somente quando aleatorio() é menor que a probabilidade", () => {
    const aleatorio = criarAleatorioDeSequencia([0.24, 0.25, 0.26]);
    expect(sortearChance(0.25, aleatorio)).toBe(true);
    expect(sortearChance(0.25, aleatorio)).toBe(false);
    expect(sortearChance(0.25, aleatorio)).toBe(false);
  });
});
