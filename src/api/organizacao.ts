import { request } from "./client";

export type SituacaoVinculo = "convidado" | "pendente" | "ativo" | "revogado";

export interface RegistroProfissionalMembro {
  id: string;
  conselho: string;
  uf: string;
  numero: string;
  categoria: string;
  situacao: string;
  conferido_em?: string | null;
}

export interface MembroOrganizacao {
  id: string;
  user_id: string;
  usuario: { id: string; name: string | null; email: string | null } | null;
  papel: "aluno" | "docente" | "administrador";
  situacao: SituacaoVinculo;
  atribuicoes: string[];
  concedido_em: string | null;
  registros_profissionais: RegistroProfissionalMembro[];
  matricula: string | null;
  primeiro_acesso_feito: boolean | null;
  celular_mascarado: string | null;
}

export interface ConviteOrganizacao {
  id: string;
  email: string;
  papel: "docente" | "administrador";
  atribuicoes: string[] | null;
  situacao?: string;
  expira_em?: string;
}

export interface AtribuicaoCatalogo {
  chave: string;
  rotulo: string;
}

export interface PerfilAtribuicoes {
  chave: string;
  rotulo: string;
  descricao: string;
  atribuicoes: string[];
}

export interface CatalogoAtribuicoes {
  atribuicoes: AtribuicaoCatalogo[];
  perfis: PerfilAtribuicoes[];
}

export interface DadosAluno {
  name?: string;
  phone?: string;
  matricula?: string | null;
}

export async function adminGetMembros(bearer: string, query: string): Promise<MembroOrganizacao[]> {
  const data = await request("GET", `/organizacao/membros?${query}`, { bearer });
  return (Array.isArray(data) ? data : []) as MembroOrganizacao[];
}

export async function adminAprovarMembro(bearer: string, id: string): Promise<unknown> {
  return request("POST", `/organizacao/membros/${id}/aprovar`, { bearer });
}

export async function adminRevogarMembro(bearer: string, id: string, motivo: string): Promise<unknown> {
  return request("POST", `/organizacao/membros/${id}/revogar`, { bearer, body: { motivo } });
}

export async function adminReativarMembro(bearer: string, id: string): Promise<unknown> {
  return request("POST", `/organizacao/membros/${id}/reativar`, { bearer });
}

export async function adminSetAtribuicoes(bearer: string, id: string, atribuicoes: string[]): Promise<unknown> {
  return request("PATCH", `/organizacao/membros/${id}/atribuicoes`, { bearer, body: { atribuicoes } });
}

export async function adminGetConvites(bearer: string): Promise<ConviteOrganizacao[]> {
  const data = await request("GET", `/organizacao/convites`, { bearer });
  return (Array.isArray(data) ? data : []) as ConviteOrganizacao[];
}

export async function adminCriarConvite(
  bearer: string,
  payload: { email: string; papel: string; atribuicoes?: string[] }
): Promise<ConviteOrganizacao> {
  const data = await request("POST", `/organizacao/convites`, { bearer, body: payload });
  return data as ConviteOrganizacao;
}

export async function adminDeletarConvite(bearer: string, id: string): Promise<unknown> {
  return request("DELETE", `/organizacao/convites/${id}`, { bearer });
}

export async function getCatalogoAtribuicoes(bearer: string): Promise<CatalogoAtribuicoes> {
  const data = await request("GET", `/organizacao/atribuicoes`, { bearer });
  return (data ?? { atribuicoes: [], perfis: [] }) as CatalogoAtribuicoes;
}

export async function cadastrarAluno(
  bearer: string,
  dados: Required<Pick<DadosAluno, "name" | "phone">> & Pick<DadosAluno, "matricula">
): Promise<MembroOrganizacao> {
  const data = await request("POST", `/organizacao/alunos`, { bearer, body: dados });
  return data as MembroOrganizacao;
}

export async function corrigirAluno(
  bearer: string,
  vinculoId: string,
  dados: DadosAluno
): Promise<MembroOrganizacao> {
  const data = await request("PATCH", `/organizacao/alunos/${vinculoId}`, { bearer, body: dados });
  return data as MembroOrganizacao;
}
