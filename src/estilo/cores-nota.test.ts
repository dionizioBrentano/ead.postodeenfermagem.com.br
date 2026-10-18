import { describe, expect, it } from "vitest";
import { classeDaNota } from "./cores-nota";

describe("classeDaNota", () => {
  it("devolve nota-0 para 0", () => {
    expect(classeDaNota(0)).toBe("nota-0");
  });

  it("devolve nota-10 para 10", () => {
    expect(classeDaNota(10)).toBe("nota-10");
  });

  it("arredonda 4.6 para 5", () => {
    expect(classeDaNota(4.6)).toBe("nota-5");
  });

  it("limita valores abaixo de 0 para 0", () => {
    expect(classeDaNota(-1)).toBe("nota-0");
    expect(classeDaNota(-10)).toBe("nota-0");
  });

  it("limita valores acima de 10 para 10", () => {
    expect(classeDaNota(11)).toBe("nota-10");
    expect(classeDaNota(99)).toBe("nota-10");
  });
});
