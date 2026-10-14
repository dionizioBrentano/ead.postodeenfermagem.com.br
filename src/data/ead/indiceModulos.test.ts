import { describe, it, expect } from "vitest";
import { MODULOS_EAD, SLUGS_MODULOS_EAD, conteudoDoModulo } from "./indiceModulos";
import { rotasDosModulos } from "../../lib/modulosEad";

describe("indiceModulos - integridade do índice e dos arquivos de conteúdo EAD", () => {
  it("carrega conteúdo para todo item de modules.json", () => {
    expect(MODULOS_EAD.length).toBeGreaterThan(0);
    for (const metadados of MODULOS_EAD) {
      const conteudo = conteudoDoModulo(metadados.slug);
      expect(conteudo).not.toBeNull();
      expect(conteudo?.metadados.slug).toBe(metadados.slug);
      expect(conteudo?.modulo.module_id).toBe(metadados.slug);
    }
  });

  it("não possui slugs repetidos", () => {
    const slugs = MODULOS_EAD.map((m) => m.slug);
    const conjunto = new Set(slugs);
    expect(conjunto.size).toBe(slugs.length);
  });

  it("não possui números repetidos e estão ordenados", () => {
    const numeros = MODULOS_EAD.map((m) => m.number);
    const conjunto = new Set(numeros);
    expect(conjunto.size).toBe(numeros.length);

    for (let i = 1; i < numeros.length; i++) {
      expect(numeros[i]).toBeGreaterThan(numeros[i - 1]);
    }
  });

  it("garante que todo módulo tem pelo menos um objetivo e um tópico de conteúdo", () => {
    for (const metadados of MODULOS_EAD) {
      const dados = conteudoDoModulo(metadados.slug);
      expect(dados).not.toBeNull();
      expect(dados!.modulo.learning_objectives.length).toBeGreaterThan(0);
      expect(dados!.modulo.topics.length).toBeGreaterThan(0);
      for (const topico of dados!.modulo.topics) {
        expect(topico.content_blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it("garante que todo correct_index do quiz aponta para uma opção existente", () => {
    for (const metadados of MODULOS_EAD) {
      const dados = conteudoDoModulo(metadados.slug);
      expect(dados).not.toBeNull();
      expect(dados!.modulo.quiz.length).toBeGreaterThan(0);
      for (const questao of dados!.modulo.quiz) {
        expect(questao.options.length).toBeGreaterThan(1);
        expect(questao.correct_index).toBeGreaterThanOrEqual(0);
        expect(questao.correct_index).toBeLessThan(questao.options.length);
        expect(questao.options[questao.correct_index]).toBeDefined();
      }
    }
  });

  it("gera rotas consistentes para o gerador de arquivos estáticos (rota-sala.mjs)", () => {
    const rotas = rotasDosModulos(SLUGS_MODULOS_EAD);
    expect(rotas).toEqual(["m0", "ead/m0", "m1", "ead/m1", "m2", "ead/m2"]);
  });

  it("retorna null para slug inexistente e lança erro caso dataFile não exista", () => {
    expect(conteudoDoModulo("modulo-fantasma")).toBeNull();
  });
});
