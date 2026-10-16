import { describe, it, expect } from "vitest";
import {
  ENVIO_SIMULTANEOS,
  ENVIO_TENTATIVAS,
  ENVIO_ESPERA_BASE_MS,
  montarItensDaAvaliacao,
  ehFalhaPassageira,
  enviarEmLotes,
  motivoDaFalha,
} from "./envioAvaliacao";
import { ApiError } from "../api/client";
import { TEXTOS_ENVIO_AVALIACAO } from "../data/textosEnvioAvaliacao";
import { GERAIS, ATIVIDADES } from "../data/itens";

describe("envioAvaliacao", () => {
  describe("montarItensDaAvaliacao", () => {
    it("monta itens com notas numéricas, 'não pratiquei' e ignora null", () => {
      const gerais = GERAIS.map((_, i) => (i === 0 ? 8 : i === 1 ? ("na" as const) : null));
      const atividades = ATIVIDADES.map((_, i) => (i === 0 ? 9 : null));

      const itens = montarItensDaAvaliacao({
        alunoId: "aluno-1",
        papel: "auto",
        etapa: 1,
        momento: "Início",
        gerais,
        atividades,
        comentario: "Estudar mais sinais vitais",
      });

      expect(itens).toHaveLength(3);

      expect(itens[0]).toEqual({
        aluno_user_id: "aluno-1",
        item_chave: "gerais.0",
        item_texto: GERAIS[0].texto,
        grupo: "gerais",
        papel: "auto",
        nota: 8,
        nao_praticou: false,
        etapa: "1",
        momento: "Início",
        comentario: "Estudar mais sinais vitais",
      });

      expect(itens[1]).toEqual({
        aluno_user_id: "aluno-1",
        item_chave: "gerais.1",
        item_texto: GERAIS[1].texto,
        grupo: "gerais",
        papel: "auto",
        nota: null,
        nao_praticou: true,
        etapa: "1",
        momento: "Início",
        comentario: "Estudar mais sinais vitais",
      });

      expect(itens[2]).toEqual({
        aluno_user_id: "aluno-1",
        item_chave: "atividades.0",
        item_texto: ATIVIDADES[0].texto,
        grupo: "atividades",
        papel: "auto",
        nota: 9,
        nao_praticou: false,
        etapa: "1",
        momento: "Início",
        comentario: "Estudar mais sinais vitais",
      });
    });

    it("inclui o comentário em todos os itens montados", () => {
      const gerais = GERAIS.map(() => 10 as const);
      const atividades = ATIVIDADES.map(() => 10 as const);

      const itens = montarItensDaAvaliacao({
        alunoId: "aluno-2",
        papel: "supervisor",
        etapa: 2,
        momento: "Final",
        gerais,
        atividades,
        comentario: "Excelente postura e prática.",
      });

      expect(itens).toHaveLength(GERAIS.length + ATIVIDADES.length);
      for (const item of itens) {
        expect(item.comentario).toBe("Excelente postura e prática.");
        expect(item.aluno_user_id).toBe("aluno-2");
        expect(item.papel).toBe("supervisor");
        expect(item.etapa).toBe("2");
        expect(item.momento).toBe("Final");
      }
    });
  });

  describe("ehFalhaPassageira", () => {
    it("identifica falhas passageiras: status 0, 408, 429 e 500-599", () => {
      expect(ehFalhaPassageira(new ApiError(0, "Sem conexão", null))).toBe(true);
      expect(ehFalhaPassageira(new ApiError(408, "Timeout", null))).toBe(true);
      expect(ehFalhaPassageira(new ApiError(429, "Rate limit", null))).toBe(true);
      expect(ehFalhaPassageira(new ApiError(500, "Server error", null))).toBe(true);
      expect(ehFalhaPassageira(new ApiError(503, "Service unavailable", null))).toBe(true);
      expect(ehFalhaPassageira(new ApiError(599, "Gateway error", null))).toBe(true);
    });

    it("identifica falhas não passageiras: 400, 401, 403, 404, 422", () => {
      expect(ehFalhaPassageira(new ApiError(400, "Bad request", null))).toBe(false);
      expect(ehFalhaPassageira(new ApiError(401, "Unauthorized", null))).toBe(false);
      expect(ehFalhaPassageira(new ApiError(403, "Forbidden", null))).toBe(false);
      expect(ehFalhaPassageira(new ApiError(404, "Not found", null))).toBe(false);
      expect(ehFalhaPassageira(new ApiError(422, "Unprocessable", null))).toBe(false);
      expect(ehFalhaPassageira(new Error("Erro comum"))).toBe(false);
      expect(ehFalhaPassageira(null)).toBe(false);
    });
  });

  describe("enviarEmLotes", () => {
    it("nunca faz mais que 3 envios ao mesmo tempo", async () => {
      const itens = Array.from({ length: 15 }, (_, i) => `item-${i}`);
      let emAndamento = 0;
      let maxEmAndamento = 0;

      const fakeEnviar = async (_item: string) => {
        emAndamento++;
        if (emAndamento > maxEmAndamento) maxEmAndamento = emAndamento;
        await new Promise((r) => setTimeout(r, 5));
        emAndamento--;
      };

      const res = await enviarEmLotes(itens, fakeEnviar, {
        simultaneos: ENVIO_SIMULTANEOS,
        tentativas: ENVIO_TENTATIVAS,
        esperaBaseMs: ENVIO_ESPERA_BASE_MS,
        esperar: async () => {},
      });

      expect(maxEmAndamento).toBeLessThanOrEqual(3);
      expect(res.salvos).toHaveLength(15);
      expect(res.falhas).toHaveLength(0);
    });

    it("faz nova tentativa em 429, 0 e 503 até dar certo", async () => {
      const tentativasPorItem: Record<string, number> = {
        "item-429": 0,
        "item-0": 0,
        "item-503": 0,
      };

      const esperas: number[] = [];
      const fakeEsperar = async (ms: number) => {
        esperas.push(ms);
      };

      const fakeEnviar = async (item: string) => {
        tentativasPorItem[item]++;
        if (item === "item-429" && tentativasPorItem[item] < 2) {
          throw new ApiError(429, "Too many requests", null);
        }
        if (item === "item-0" && tentativasPorItem[item] < 2) {
          throw new ApiError(0, "Sem conexão", null);
        }
        if (item === "item-503" && tentativasPorItem[item] < 3) {
          throw new ApiError(503, "Unavailable", null);
        }
        return { ok: true };
      };

      const res = await enviarEmLotes(["item-429", "item-0", "item-503"], fakeEnviar, {
        simultaneos: 3,
        tentativas: 3,
        esperaBaseMs: 1500,
        esperar: fakeEsperar,
      });

      expect(res.salvos).toEqual(["item-429", "item-0", "item-503"]);
      expect(res.falhas).toHaveLength(0);
      expect(tentativasPorItem["item-429"]).toBe(2);
      expect(tentativasPorItem["item-0"]).toBe(2);
      expect(tentativasPorItem["item-503"]).toBe(3);
      expect(esperas.length).toBeGreaterThan(0);
      expect(esperas).toContain(1500); // 1500 * 1
      expect(esperas).toContain(3000); // 1500 * 2
    });

    it("desiste depois de 3 tentativas em falha passageira", async () => {
      let tentativas = 0;
      const fakeEnviar = async () => {
        tentativas++;
        throw new ApiError(429, "Rate limit", null);
      };

      const res = await enviarEmLotes(["item-limite"], fakeEnviar, {
        simultaneos: 1,
        tentativas: 3,
        esperaBaseMs: 1500,
        esperar: async () => {},
      });

      expect(tentativas).toBe(3);
      expect(res.salvos).toHaveLength(0);
      expect(res.falhas).toHaveLength(1);
      expect(res.falhas[0].item).toBe("item-limite");
    });

    it("sem nova tentativa em 403 e 422", async () => {
      const chamadas: Record<string, number> = { "it-403": 0, "it-422": 0 };

      const fakeEnviar = async (item: string) => {
        chamadas[item]++;
        if (item === "it-403") throw new ApiError(403, "Forbidden", null);
        if (item === "it-422") throw new ApiError(422, "Dados inválidos", null);
      };

      const res = await enviarEmLotes(["it-403", "it-422"], fakeEnviar, {
        simultaneos: 2,
        tentativas: 3,
        esperaBaseMs: 1500,
        esperar: async () => {},
      });

      expect(chamadas["it-403"]).toBe(1);
      expect(chamadas["it-422"]).toBe(1);
      expect(res.salvos).toHaveLength(0);
      expect(res.falhas).toHaveLength(2);
    });

    it("notifica progresso via aoAvancar", async () => {
      const passos: [number, number][] = [];
      await enviarEmLotes(
        ["a", "b", "c"],
        async () => {},
        {
          simultaneos: 1,
          tentativas: 1,
          esperaBaseMs: 100,
          esperar: async () => {},
          aoAvancar: (feitos, total) => passos.push([feitos, total]),
        }
      );

      expect(passos).toEqual([
        [1, 3],
        [2, 3],
        [3, 3],
      ]);
    });
  });

  describe("motivoDaFalha", () => {
    it("retorna texto correto para status 0 (sem conexão)", () => {
      const err = new ApiError(0, "qualquer", null);
      expect(motivoDaFalha(err)).toBe(TEXTOS_ENVIO_AVALIACAO.motivoSemConexao);
    });

    it("retorna texto correto para status 429 (limite)", () => {
      const err = new ApiError(429, "Too many requests", null);
      expect(motivoDaFalha(err)).toBe(TEXTOS_ENVIO_AVALIACAO.motivoLimite);
    });

    it("retorna texto com código e mensagem para outros códigos HTTP", () => {
      const err403 = new ApiError(403, "Sem permissão", null);
      expect(motivoDaFalha(err403)).toBe("código 403: Sem permissão");

      const err422 = new ApiError(422, "Item inválido", null);
      expect(motivoDaFalha(err422)).toBe("código 422: Item inválido");

      const err500 = new ApiError(500, "Erro interno", null);
      expect(motivoDaFalha(err500)).toBe("código 500: Erro interno");
    });

    it("retorna texto desconhecido para erros sem status", () => {
      expect(motivoDaFalha(new Error("Falha estranha"))).toBe(TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido);
      expect(motivoDaFalha(null)).toBe(TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido);
      expect(motivoDaFalha(undefined)).toBe(TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido);
    });
  });
});
