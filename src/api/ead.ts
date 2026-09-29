import { request, getUserToken } from "./client";

export interface AvaliacaoPayload {
  item_chave: string;
  papel: "auto" | "supervisor";
  nota?: number | null;
  nao_praticou?: boolean;
  comentario?: string;
  etapa?: string;
  momento?: string;
  aluno_user_id?: string;
}

export async function saveAvaliacao(data: AvaliacaoPayload, token?: string | null) {
  const t = token || getUserToken();
  return request("POST", "/ead/avaliacoes", {
    bearer: t,
    body: data,
  });
}

export async function getAvaliacoes(aluno_user_id: string, papel: "auto" | "supervisor", token?: string | null) {
  const t = token || getUserToken();
  return request("GET", `/ead/avaliacoes?aluno_user_id=${aluno_user_id}&papel=${papel}`, {
    bearer: t,
  });
}

export async function getComparacao(aluno_user_id: string, token?: string | null) {
  const t = token || getUserToken();
  return request("GET", `/ead/avaliacoes/comparacao?aluno_user_id=${aluno_user_id}`, {
    bearer: t,
  });
}

export async function getAlunos(token?: string | null) {
  const t = token || getUserToken();
  return request("GET", `/ead/alunos`, {
    bearer: t,
  });
}

