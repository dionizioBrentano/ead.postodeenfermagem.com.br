import { describe, expect, it } from "vitest";
import { deveIniciarArrasto } from "./arrastoToque";

describe("deveIniciarArrasto", () => {
  it("inicia arrasto quando parado por 350ms ou mais dentro da tolerância", () => {
    expect(
      deveIniciarArrasto({ x: 100, y: 100, t: 1000 }, { x: 103, y: 104, t: 1350 })
    ).toBe("iniciar");
  });

  it("aguarda quando parado por menos de 350ms", () => {
    expect(
      deveIniciarArrasto({ x: 100, y: 100, t: 1000 }, { x: 103, y: 104, t: 1349 })
    ).toBe("aguardar");
  });

  it("cancela quando o movimento ultrapassa 10px antes do toque longo", () => {
    expect(
      deveIniciarArrasto({ x: 100, y: 100, t: 1000 }, { x: 120, y: 100, t: 1200 })
    ).toBe("cancelar");
  });

  it("inicia arrasto quando a distância é exatamente 10px com 350ms", () => {
    expect(
      deveIniciarArrasto({ x: 100, y: 100, t: 1000 }, { x: 106, y: 108, t: 1350 })
    ).toBe("iniciar");
  });

  it("cancela quando a distância é maior que 10px mesmo após 350ms", () => {
    expect(
      deveIniciarArrasto({ x: 100, y: 100, t: 1000 }, { x: 107, y: 108, t: 1400 })
    ).toBe("cancelar");
  });
});
