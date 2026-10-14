import { describe, expect, it } from "vitest";
import type {
  AtribuicaoCatalogo,
  MembroOrganizacao,
  PerfilAtribuicoes,
} from "../api/organizacao";
import {
  alternarAtribuicao,
  filtrarMembros,
  mensagemDoErro,
  perfilDasAtribuicoes,
  rotulosDasAtribuicoes,
  validarDadosAluno,
} from "./organizacao";
import { ApiError } from "../api/client";
import { TEXTOS_VALIDACAO_ALUNO } from "../data/textosOrganizacao";

describe("organizacao", () => {
  describe("alternarAtribuicao", () => {
    it("adiciona chave quando ela nao existe na lista", () => {
      const original = ["alunos.ler"];
      const resultado = alternarAtribuicao(original, "alunos.cadastrar");

      expect(resultado).toEqual(["alunos.ler", "alunos.cadastrar"]);
    });

    it("remove chave quando ela ja existe na lista", () => {
      const original = ["alunos.ler", "alunos.cadastrar"];
      const resultado = alternarAtribuicao(original, "alunos.cadastrar");

      expect(resultado).toEqual(["alunos.ler"]);
    });

    it("nao altera a lista original recebida", () => {
      const original = ["alunos.ler"];
      alternarAtribuicao(original, "alunos.cadastrar");

      expect(original).toEqual(["alunos.ler"]);
    });
  });

  describe("perfilDasAtribuicoes", () => {
    const perfis: PerfilAtribuicoes[] = [
      {
        chave: "coordenador",
        rotulo: "Coordenador administrativo",
        descricao: "Descrição do coordenador",
        atribuicoes: ["alunos.ler", "alunos.cadastrar", "turmas.gerenciar"],
      },
      {
        chave: "gerente",
        rotulo: "Gerente da escola",
        descricao: "Descrição do gerente",
        atribuicoes: [
          "alunos.ler",
          "alunos.cadastrar",
          "turmas.gerenciar",
          "avaliacoes.ler",
        ],
      },
    ];

    it("atribuicoes iguais em outra ordem retornam o perfil", () => {
      const resultado = perfilDasAtribuicoes(
        ["turmas.gerenciar", "alunos.cadastrar", "alunos.ler"],
        perfis
      );

      expect(resultado?.chave).toBe("coordenador");
    });

    it("atribuicoes com uma a mais retornam null", () => {
      const resultado = perfilDasAtribuicoes(
        ["alunos.ler", "alunos.cadastrar", "turmas.gerenciar", "extra.atrib"],
        perfis
      );

      expect(resultado).toBeNull();
    });

    it("atribuicoes com uma a menos retornam null", () => {
      const resultado = perfilDasAtribuicoes(
        ["alunos.ler", "alunos.cadastrar"],
        perfis
      );

      expect(resultado).toBeNull();
    });

    it("lista vazia retorna null", () => {
      const resultado = perfilDasAtribuicoes([], perfis);

      expect(resultado).toBeNull();
    });

    it("repeticao na lista nao atrapalha o reconhecimento do perfil", () => {
      const resultado = perfilDasAtribuicoes(
        [
          "alunos.ler",
          "alunos.cadastrar",
          "turmas.gerenciar",
          "alunos.ler",
          "alunos.cadastrar",
        ],
        perfis
      );

      expect(resultado?.chave).toBe("coordenador");
    });
  });

  describe("rotulosDasAtribuicoes", () => {
    const catalogo: AtribuicaoCatalogo[] = [
      { chave: "docentes.gerenciar", rotulo: "Gerenciar supervisores" },
      { chave: "alunos.ler", rotulo: "Ver lista de alunos" },
      { chave: "alunos.cadastrar", rotulo: "Cadastrar e corrigir alunos" },
      { chave: "turmas.gerenciar", rotulo: "Gerenciar turmas" },
    ];

    it("retorna rotulos na ordem do catalogo", () => {
      const atribuicoes = ["turmas.gerenciar", "alunos.ler"];
      const resultado = rotulosDasAtribuicoes(atribuicoes, catalogo);

      expect(resultado).toEqual(["Ver lista de alunos", "Gerenciar turmas"]);
    });

    it("coloca chaves desconhecidas fora do catalogo no final como a propria chave", () => {
      const atribuicoes = ["chave.desconhecida", "alunos.ler"];
      const resultado = rotulosDasAtribuicoes(atribuicoes, catalogo);

      expect(resultado).toEqual(["Ver lista de alunos", "chave.desconhecida"]);
    });
  });

  describe("filtrarMembros", () => {
    const lista: MembroOrganizacao[] = [
      {
        id: "m1",
        user_id: "u1",
        usuario: { id: "u1", name: "José da Silva", email: "jose@escola.com.br" },
        papel: "aluno",
        situacao: "ativo",
        atribuicoes: [],
        concedido_em: null,
        registros_profissionais: [],
        matricula: "MAT-2026-01",
        primeiro_acesso_feito: true,
        celular_mascarado: "(51) ******01",
      },
      {
        id: "m2",
        user_id: "u2",
        usuario: { id: "u2", name: "Maria Oliveira", email: "maria@escola.com.br" },
        papel: "aluno",
        situacao: "ativo",
        atribuicoes: [],
        concedido_em: null,
        registros_profissionais: [],
        matricula: "MAT-2026-02",
        primeiro_acesso_feito: false,
        celular_mascarado: "(51) ******02",
      },
    ];

    it("acha José buscando por jose sem acento e em minusculo", () => {
      const resultado = filtrarMembros(lista, "jose");

      expect(resultado).toHaveLength(1);
      expect(resultado[0].usuario?.name).toBe("José da Silva");
    });

    it("acha pela matricula", () => {
      const resultado = filtrarMembros(lista, "2026-02");

      expect(resultado).toHaveLength(1);
      expect(resultado[0].usuario?.name).toBe("Maria Oliveira");
    });

    it("busca vazia ou com espacos devolve todos os membros", () => {
      expect(filtrarMembros(lista, "")).toHaveLength(2);
      expect(filtrarMembros(lista, "   ")).toHaveLength(2);
    });

    it("busca sem resultado devolve lista vazia", () => {
      const resultado = filtrarMembros(lista, "inexistente");

      expect(resultado).toHaveLength(0);
    });
  });

  describe("validarDadosAluno", () => {
    it("dados corretos retornam todos os campos como null", () => {
      const resultado = validarDadosAluno({
        nome: "Aluna Teste",
        celular: "51990000001",
        matricula: "MAT-01",
      });

      expect(resultado).toEqual({
        nome: null,
        celular: null,
        matricula: null,
      });
    });

    it("nome vazio retorna erro de nome", () => {
      const resultado = validarDadosAluno({
        nome: "   ",
        celular: "51990000001",
        matricula: "MAT-01",
      });

      expect(resultado.nome).toBe(TEXTOS_VALIDACAO_ALUNO.nomeObrigatorio);
      expect(resultado.celular).toBeNull();
      expect(resultado.matricula).toBeNull();
    });

    it("celular com menos de 10 digitos retorna erro de celular", () => {
      const resultado = validarDadosAluno({
        nome: "Aluna Teste",
        celular: "5199000",
        matricula: "MAT-01",
      });

      expect(resultado.nome).toBeNull();
      expect(resultado.celular).toBe(TEXTOS_VALIDACAO_ALUNO.celularIncompleto);
      expect(resultado.matricula).toBeNull();
    });

    it("matricula com mais de 50 caracteres retorna erro de matricula", () => {
      const resultado = validarDadosAluno({
        nome: "Aluna Teste",
        celular: "51990000001",
        matricula: "M".repeat(51),
      });

      expect(resultado.nome).toBeNull();
      expect(resultado.celular).toBeNull();
      expect(resultado.matricula).toBe(TEXTOS_VALIDACAO_ALUNO.matriculaLonga);
    });

    it("celular opcional vazio na correcao nao gera erro", () => {
      const resultado = validarDadosAluno(
        {
          nome: "Aluna Teste",
          celular: "",
          matricula: "MAT-01",
        },
        true
      );

      expect(resultado).toEqual({
        nome: null,
        celular: null,
        matricula: null,
      });
    });
  });

  describe("mensagemDoErro", () => {
    it("ApiError com mensagem retorna a mensagem", () => {
      const erro = new ApiError(422, "Mensagem da API", { code: "erro_teste" });
      expect(mensagemDoErro(erro, "Padrão")).toBe("Mensagem da API");
    });

    it("Error comum retorna a mensagem", () => {
      const erro = new Error("Erro de rede");
      expect(mensagemDoErro(erro, "Padrão")).toBe("Erro de rede");
    });

    it("texto solto retorna o padrão", () => {
      expect(mensagemDoErro("falha estranha", "Padrão")).toBe("Padrão");
    });

    it("null ou undefined retorna o padrão", () => {
      expect(mensagemDoErro(null, "Padrão")).toBe("Padrão");
      expect(mensagemDoErro(undefined, "Padrão")).toBe("Padrão");
    });

    it("Error com mensagem vazia retorna o padrão", () => {
      expect(mensagemDoErro(new Error("   "), "Padrão")).toBe("Padrão");
    });
  });
});

