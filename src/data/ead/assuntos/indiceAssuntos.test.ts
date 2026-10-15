import { describe, expect, it } from "vitest";
import { itemDaFicha } from "../../../lib/assuntosEstudo";
import {
  ASSUNTOS_ESTUDO,
  conteudoDoAssunto,
  SLUGS_ASSUNTOS_ESTUDO,
} from "./indiceAssuntos";

describe("indiceAssuntos - integridade dos assuntos de estudo EAD", () => {
  it("carrega conteúdo para todo item de indice.json e valida format", () => {
    expect(ASSUNTOS_ESTUDO.length).toBeGreaterThan(0);
    for (const item of ASSUNTOS_ESTUDO) {
      const assunto = conteudoDoAssunto(item.slug);
      expect(assunto).not.toBeNull();
      expect(assunto?.format).toBe("assunto-estudo-v1");
      expect(assunto?.slug).toBe(item.slug);
    }
  });

  it("não possui slugs repetidos", () => {
    const slugs = ASSUNTOS_ESTUDO.map((a) => a.slug);
    const conjunto = new Set(slugs);
    expect(conjunto.size).toBe(slugs.length);
    expect(SLUGS_ASSUNTOS_ESTUDO).toEqual(slugs);
  });

  it("garante integridade estrutural, fontes, referências e revisão para todo assunto", () => {
    const situacoesValidas = new Set(["rascunho", "revisado", "publicado"]);

    for (const item of ASSUNTOS_ESTUDO) {
      const assunto = conteudoDoAssunto(item.slug);
      expect(assunto).not.toBeNull();
      if (!assunto) continue;

      // há pelo menos um tópico e um objetivo
      expect(assunto.learning_objectives.length).toBeGreaterThan(0);
      expect(assunto.topics.length).toBeGreaterThan(0);

      // IDs de fontes não se repetem e têm validação
      const idsFontes = new Set<string>();
      for (const fonte of assunto.sources) {
        expect(fonte.id).toBeDefined();
        expect(typeof fonte.id).toBe("string");
        expect(idsFontes.has(fonte.id!)).toBe(false);
        idsFontes.add(fonte.id!);

        expect(fonte.validation).toBeDefined();
        expect(["validada", "pendente"]).toContain(fonte.validation?.status);
      }

      // source_ids de competence apontam para fontes existentes
      for (const id of assunto.competence.source_ids) {
        expect(idsFontes.has(id)).toBe(true);
      }

      // source_ids de blocos apontam para fontes existentes
      for (const topico of assunto.topics) {
        expect(topico.content_blocks.length).toBeGreaterThan(0);
        for (const bloco of topico.content_blocks) {
          if (bloco.source_ids) {
            for (const id of bloco.source_ids) {
              expect(idsFontes.has(id)).toBe(true);
            }
          }
        }
      }

      // source_ids e correct_index de questões
      expect(assunto.quiz.length).toBeGreaterThan(0);
      for (const questao of assunto.quiz) {
        expect(questao.options.length).toBeGreaterThan(1);
        expect(questao.correct_index).toBeGreaterThanOrEqual(0);
        expect(questao.correct_index).toBeLessThan(questao.options.length);
        expect(questao.options[questao.correct_index]).toBeDefined();

        if (questao.source_ids) {
          for (const id of questao.source_ids) {
            expect(idsFontes.has(id)).toBe(true);
          }
        }
      }

      // todo item de assessment_items existe (itemDaFicha não dá erro)
      expect(assunto.assessment_items.length).toBeGreaterThan(0);
      for (const ref of assunto.assessment_items) {
        expect(() => itemDaFicha(ref)).not.toThrow();
        const fichaItem = itemDaFicha(ref);
        expect(fichaItem.texto).toBeDefined();
      }

      // os IDs de study_prompts não se repetem
      const idsPrompts = new Set<string>();
      for (const prompt of assunto.study_prompts) {
        expect(prompt.id).toBeDefined();
        expect(idsPrompts.has(prompt.id)).toBe(false);
        idsPrompts.add(prompt.id);
      }

      // review.status é um dos três valores
      expect(situacoesValidas.has(assunto.review.status)).toBe(true);
    }
  });

  it("retorna null para slug inexistente e lança erro caso dataFile não exista", () => {
    expect(conteudoDoAssunto("assunto-inexistente")).toBeNull();
  });
});
