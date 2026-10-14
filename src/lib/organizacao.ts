import type {
  AtribuicaoCatalogo,
  MembroOrganizacao,
  PerfilAtribuicoes,
} from "../api/organizacao";
import {
  TAMANHO_MAXIMO_MATRICULA,
  TEXTOS_VALIDACAO_ALUNO,
} from "../data/textosOrganizacao";

export function alternarAtribuicao(lista: string[], chave: string): string[] {
  if (lista.includes(chave)) {
    return lista.filter((item) => item !== chave);
  }
  return [...lista, chave];
}

export function perfilDasAtribuicoes(
  atribuicoes: string[],
  perfis: PerfilAtribuicoes[]
): PerfilAtribuicoes | null {
  const setAtual = new Set(atribuicoes);
  if (setAtual.size === 0) {
    return null;
  }

  for (const perfil of perfis) {
    const setPerfil = new Set(perfil.atribuicoes);
    if (setAtual.size === setPerfil.size) {
      let igual = true;
      for (const item of setAtual) {
        if (!setPerfil.has(item)) {
          igual = false;
          break;
        }
      }
      if (igual) {
        return perfil;
      }
    }
  }

  return null;
}

export function rotulosDasAtribuicoes(
  atribuicoes: string[],
  catalogo: AtribuicaoCatalogo[]
): string[] {
  const setAtribuicoes = new Set(atribuicoes);
  const rotulos: string[] = [];
  const chavesConhecidas = new Set<string>();

  for (const item of catalogo) {
    if (setAtribuicoes.has(item.chave)) {
      rotulos.push(item.rotulo);
      chavesConhecidas.add(item.chave);
    }
  }

  for (const chave of atribuicoes) {
    if (!chavesConhecidas.has(chave) && !rotulos.includes(chave)) {
      rotulos.push(chave);
    }
  }

  return rotulos;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function filtrarMembros(
  lista: MembroOrganizacao[],
  busca: string
): MembroOrganizacao[] {
  const termo = normalizar(busca.trim());
  if (!termo) {
    return lista;
  }

  return lista.filter((membro) => {
    const nome = normalizar(membro.usuario?.name ?? "");
    const email = normalizar(membro.usuario?.email ?? "");
    const matricula = normalizar(membro.matricula ?? "");

    return (
      nome.includes(termo) ||
      email.includes(termo) ||
      matricula.includes(termo)
    );
  });
}

export function validarDadosAluno(
  dados: { nome: string; celular: string; matricula: string },
  celularOpcional = false
): Record<"nome" | "celular" | "matricula", string | null> {
  const nomeTrim = dados.nome.trim();
  const celularDigitos = dados.celular.replace(/\D+/g, "");
  const matriculaTrim = dados.matricula.trim();

  let erroNome: string | null = null;
  if (!nomeTrim) {
    erroNome = TEXTOS_VALIDACAO_ALUNO.nomeObrigatorio;
  }

  let erroCelular: string | null = null;
  if (celularOpcional && dados.celular.trim() === "") {
    erroCelular = null;
  } else if (celularDigitos.length < 10) {
    erroCelular = TEXTOS_VALIDACAO_ALUNO.celularIncompleto;
  }

  let erroMatricula: string | null = null;
  if (matriculaTrim.length > TAMANHO_MAXIMO_MATRICULA) {
    erroMatricula = TEXTOS_VALIDACAO_ALUNO.matriculaLonga;
  }

  return {
    nome: erroNome,
    celular: erroCelular,
    matricula: erroMatricula,
  };
}

export function mensagemDoErro(erro: unknown, padrao: string): string {
  if (erro instanceof Error && erro.message && erro.message.trim().length > 0) {
    return erro.message;
  }
  return padrao;
}
