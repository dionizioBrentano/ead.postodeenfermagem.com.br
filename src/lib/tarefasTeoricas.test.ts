import { describe, it, expect } from "vitest";
import { formatarTituloComData } from "./tarefasTeoricas";
import { TAREFAS_TEORICAS } from "../data/tarefasTeoricas";

describe("formatarTituloComData", () => {
  it("expõe a tarefa teórica pela data + título no padrão DD/MM/AAAA - Título sem menção a cola", () => {
    const tarefa = TAREFAS_TEORICAS[0];
    expect(formatarTituloComData(tarefa)).toBe("09/10/2026 - Organização do plantão");
    expect(formatarTituloComData(tarefa).toLowerCase()).not.toContain("cola");
  });
});
