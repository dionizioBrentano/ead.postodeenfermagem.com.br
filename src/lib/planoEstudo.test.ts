import { describe, expect, it } from "vitest";
import { ATIVIDADES, GERAIS, type Nota } from "../data/itens";
import { listarAssuntos } from "../data/ead/assuntos/indiceAssuntos";
import { slugPublicadoDoItem } from "./assuntosEstudo";
import type { AssuntoEstudo, ItemFichaRef } from "../types/ead";
import {
  acrescentarAoTexto,
  avaliacaoMaisRecente,
  ehAvaliacaoFinal,
  itensDeAtencao,
  itensDoProximoCiclo,
  NOTA_MINIMA_ATENCAO,
  podeSugerirPlano,
  promptsDoPlano,
  textoPlanoSugerido,
  type NotasDaAvaliacao,
} from "./planoEstudo";
import type { Avaliacao } from "./historico";

describe("planoEstudo - regras puras e plano de estudo sugerido", () => {
  const criarAvaliacaoBase = (
    gerais: Nota[],
    atividades: Nota[],
  ): NotasDaAvaliacao => ({
    etapa: 1,
    momento: "Final",
    gerais,
    atividades,
  });

  it("NOTA_MINIMA_ATENCAO é 7", () => {
    expect(NOTA_MINIMA_ATENCAO).toBe(7);
  });

  it("todas as notas 3: todos os itens avaliados entram porque nota < 7 mesmo sem estar abaixo da média", () => {
    const gerais = Array<Nota>(GERAIS.length).fill(3);
    const atividades = Array<Nota>(ATIVIDADES.length).fill(3);
    const av = criarAvaliacaoBase(gerais, atividades);

    const itens = itensDeAtencao(av);
    expect(itens.length).toBe(GERAIS.length + ATIVIDADES.length);
  });

  it("todas as notas 9 e uma 8: só o item com 8 entra (abaixo da média)", () => {
    const gerais = Array<Nota>(GERAIS.length).fill(9);
    const atividades = Array<Nota>(ATIVIDADES.length).fill(9);
    atividades[3] = 8; // item 4 de atividades com 8

    const av = criarAvaliacaoBase(gerais, atividades);
    const itens = itensDeAtencao(av);

    expect(itens.length).toBe(1);
    expect(itens[0]?.ref).toEqual({ block: "atividades", number: 4 });
    expect(itens[0]?.nota).toBe(8);
  });

  it("nota igual à média e maior ou igual a 7 não entra", () => {
    const gerais = Array<Nota>(GERAIS.length).fill(8);
    const atividades = Array<Nota>(ATIVIDADES.length).fill(8);
    const av = criarAvaliacaoBase(gerais, atividades);

    const itens = itensDeAtencao(av);
    expect(itens.length).toBe(0);
  });

  it("'na' e null nunca entram nos itens de atenção", () => {
    const gerais = Array<Nota>(GERAIS.length).fill(null);
    const atividades = Array<Nota>(ATIVIDADES.length).fill("na");
    gerais[0] = 5;

    const av = criarAvaliacaoBase(gerais, atividades);
    const itens = itensDeAtencao(av);

    expect(itens.length).toBe(1);
    expect(itens[0]?.ref).toEqual({ block: "gerais", number: 1 });
    expect(itens[0]?.nota).toBe(5);
  });

  it("ordena itens por ciclo crescente; dentro do mesmo ciclo, gerais antes de atividades, e por número", () => {
    // Ciclo 1 gerais (item 2, item 1)
    // Ciclo 1 atividade (item 4 tem desde: 1)
    // Ciclo 2 atividade (item 10 tem desde: 2)
    // Ciclo 3 atividade (item 17 tem desde: 3)
    const gerais = Array<Nota>(GERAIS.length).fill(10);
    const atividades = Array<Nota>(ATIVIDADES.length).fill(10);

    gerais[1] = 4; // gerais item 2, ciclo 1
    gerais[0] = 5; // gerais item 1, ciclo 1
    atividades[16] = 2; // atividade item 17, ciclo 3
    atividades[9] = 3; // atividade item 10, ciclo 2
    atividades[3] = 4; // atividade item 4, ciclo 1

    const av = criarAvaliacaoBase(gerais, atividades);
    const itens = itensDeAtencao(av);

    expect(itens.map((it) => `${it.ciclo}-${it.ref.block}-${it.ref.number}`)).toEqual([
      "1-gerais-1",
      "1-gerais-2",
      "1-atividades-4",
      "2-atividades-10",
      "3-atividades-17",
    ]);
  });

  it("itensDoProximoCiclo: Início e Meio devolvem null; Final da etapa 1 traz desde: 2; Final da etapa 4 devolve null", () => {
    const gerais = Array<Nota>(GERAIS.length).fill(8);
    const atividades = Array<Nota>(ATIVIDADES.length).fill(8);

    expect(itensDoProximoCiclo({ etapa: 1, momento: "Início", gerais, atividades })).toBeNull();
    expect(itensDoProximoCiclo({ etapa: 1, momento: "Meio", gerais, atividades })).toBeNull();

    const etapa1Final = itensDoProximoCiclo({ etapa: 1, momento: "Final", gerais, atividades });
    expect(etapa1Final).not.toBeNull();
    expect(etapa1Final?.ciclo).toBe(2);
    expect(etapa1Final?.itens.length).toBeGreaterThan(0);
    for (const item of etapa1Final!.itens) {
      expect(item.item.desde).toBe(2);
    }

    expect(itensDoProximoCiclo({ etapa: 4, momento: "Final", gerais, atividades })).toBeNull();
  });

  it("slugPublicadoDoItem: rascunho devolve null; publicado devolve slug", () => {
    const ref: ItemFichaRef = { block: "atividades", number: 4 };

    const assuntoRascunho = {
      format: "assunto-estudo-v1",
      slug: "assunto-teste",
      assessment_items: [ref],
      review: { status: "rascunho" },
    } as unknown as AssuntoEstudo;

    const assuntoPublicado = {
      format: "assunto-estudo-v1",
      slug: "assunto-publicado",
      assessment_items: [ref],
      review: { status: "publicado" },
    } as unknown as AssuntoEstudo;

    expect(slugPublicadoDoItem(ref, [assuntoRascunho])).toBeNull();
    expect(slugPublicadoDoItem(ref, [assuntoPublicado])).toBe("assunto-publicado");
  });

  it("textoPlanoSugerido monta o plano com itens, sem itens e com próximo ciclo", () => {
    const item1 = {
      ref: { block: "atividades", number: 4 } as ItemFichaRef,
      item: ATIVIDADES[3]!,
      nota: 6,
      ciclo: 1,
    };
    const proximo = {
      ciclo: 2,
      itens: [{ ref: { block: "atividades", number: 10 } as ItemFichaRef, item: ATIVIDADES[9]! }],
    };

    // Com itens e sem próximo
    const textoComItens = textoPlanoSugerido([item1], null);
    expect(textoComItens).toContain("Plano de estudo sugerido");
    expect(textoComItens).toContain("1. Sinais vitais e glicemia — nota 6 (Ciclo 1)");
    expect(textoComItens).not.toContain("Prepare-se para o Ciclo 2:");

    // Sem itens
    const textoSemItens = textoPlanoSugerido([], null);
    expect(textoSemItens).toContain("Nenhum item abaixo da sua média geral ou de 7 nesta autoavaliação.");

    // Com próximo ciclo
    const textoComProximo = textoPlanoSugerido([item1], proximo);
    expect(textoComProximo).toContain("Prepare-se para o Ciclo 2:");
    expect(textoComProximo).toContain("- Curativos e drenos");
  });

  it("acrescentarAoTexto trata texto vazio, só com espaços e preexistente", () => {
    expect(acrescentarAoTexto("", "Novo texto")).toBe("Novo texto");
    expect(acrescentarAoTexto("   ", "Novo texto")).toBe("Novo texto");
    expect(acrescentarAoTexto("Texto antigo", "Novo texto")).toBe("Texto antigo\n\nNovo texto");
  });

  it("podeSugerirPlano valida etapa, momento e presença de nota numérica", () => {
    const vazio: Nota[] = [null, null];
    const comNota: Nota[] = [null, 8];

    expect(podeSugerirPlano({ etapa: null, momento: "Final", gerais: comNota, atividades: vazio })).toBe(false);
    expect(podeSugerirPlano({ etapa: 1, momento: null, gerais: comNota, atividades: vazio })).toBe(false);
    expect(podeSugerirPlano({ etapa: 1, momento: "Final", gerais: vazio, atividades: vazio })).toBe(false);
    expect(podeSugerirPlano({ etapa: 1, momento: "Final", gerais: comNota, atividades: vazio })).toBe(true);
  });

  it("avaliacaoMaisRecente retorna a última avaliação ordenada", () => {
    const av1 = { etapa: 1, momento: "Início" } as Avaliacao;
    const av2 = { etapa: 1, momento: "Final" } as Avaliacao;
    expect(avaliacaoMaisRecente([])).toBeNull();
    expect(avaliacaoMaisRecente([av2, av1])).toBe(av2);
  });

  it("ehAvaliacaoFinal valida se momento é o último de MOMENTOS", () => {
    expect(ehAvaliacaoFinal("Início")).toBe(false);
    expect(ehAvaliacaoFinal("Meio")).toBe(false);
    expect(ehAvaliacaoFinal("Final")).toBe(true);
  });

  it("Passo 6: enquanto o piloto estiver em rascunho, slugPublicadoDoItem devolve null (muda quando o piloto for publicado)", () => {
    // Este teste muda quando o piloto for publicado
    const assuntos = listarAssuntos();
    const slug = slugPublicadoDoItem({ block: "atividades", number: 4 }, assuntos);
    expect(slug).toBeNull();
  });

  describe("promptsDoPlano", () => {
    it("lista vazia devolve lista vazia", () => {
      expect(promptsDoPlano([], 1)).toEqual([]);
    });

    it("mantém ordem e quantidade iguais às de itens, com id e accepts_question false", () => {
      const gerais = Array<Nota>(GERAIS.length).fill(9);
      const atividades = Array<Nota>(ATIVIDADES.length).fill(9);
      gerais[0] = 5;
      atividades[3] = 6;
      const av = criarAvaliacaoBase(gerais, atividades);
      const itens = itensDeAtencao(av);

      const prompts = promptsDoPlano(itens, 2);
      expect(prompts.length).toBe(itens.length);
      expect(prompts[0]?.id).toBe("plano-gerais-1");
      expect(prompts[0]?.accepts_question).toBe(false);
      expect(prompts[1]?.id).toBe("plano-atividades-4");
      expect(prompts[1]?.accepts_question).toBe(false);
    });

    it("o texto do prompt contém o texto completo do item, a nota e o ciclo do aluno", () => {
      const gerais = Array<Nota>(GERAIS.length).fill(10);
      const atividades = Array<Nota>(ATIVIDADES.length).fill(10);
      atividades[0] = 4;
      const av = criarAvaliacaoBase(gerais, atividades);
      const itens = itensDeAtencao(av);

      const cicloAluno = 3;
      const prompts = promptsDoPlano(itens, cicloAluno);
      expect(prompts.length).toBe(1);

      const p = prompts[0]!;
      expect(p.text).toContain(`no Ciclo ${cicloAluno}`);
      expect(p.text).toContain(`dei nota ${itens[0]!.nota} de 10`);
      expect(p.text).toContain(`"${itens[0]!.item.texto}"`);
    });
  });
});
