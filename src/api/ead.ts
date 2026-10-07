import { request, getUserToken, obj } from "./client";

export interface AvaliacaoPayload {
  item_chave: string;
  papel: "auto" | "supervisor";
  nota?: number | null;
  nao_praticou?: boolean;
  comentario?: string;
  etapa?: string;
  momento?: string | null;
  aluno_user_id?: string;
  grupo?: string;
  item_texto?: string;
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

export async function getAlunos(turma_id?: string, token?: string | null) {
  const t = token || getUserToken();
  const q = turma_id ? `?turma_id=${turma_id}` : "";
  return request("GET", `/ead/alunos${q}`, {
    bearer: t,
  });
}

// Turmas (Admin)
export async function adminGetTurmas(bearer: string) {
  return request("GET", "/ead/turmas", { bearer }) as Promise<any[]>;
}
export async function adminCreateTurma(bearer: string, payload: any) {
  return request("POST", "/ead/turmas", { bearer, body: payload });
}
export async function adminUpdateTurma(bearer: string, id: string, payload: any) {
  return request("PATCH", `/ead/turmas/${id}`, { bearer, body: payload });
}
export async function adminDeleteTurma(bearer: string, id: string) {
  return request("DELETE", `/ead/turmas/${id}`, { bearer });
}
export async function adminGetTurma(bearer: string, id: string) {
  return obj(await request("GET", `/ead/turmas/${id}`, { bearer }));
}
export async function adminAddMembroTurma(bearer: string, turmaId: string, payload: { user_id: string, papel: 'aluno'|'docente' }) {
  return request("POST", `/ead/turmas/${turmaId}/membros`, { bearer, body: payload });
}
export async function adminRemoveMembroTurma(bearer: string, turmaId: string, membroId: string) {
  return request("DELETE", `/ead/turmas/${turmaId}/membros/${membroId}`, { bearer });
}
export async function adminDistribuirEscala(bearer: string, turmaId: string) {
  return obj(await request("POST", `/ead/turmas/${turmaId}/distribuir-escala`, { bearer }));
}
export async function adminDistribuirTodasEscalas(bearer: string) {
  return obj(await request("POST", "/ead/turmas/distribuir-todas-escalas", { bearer }));
}

// Calendário Padrão (Admin)
export async function adminGetCalendarioPadrao(bearer: string) {
  return request("GET", "/ead/calendario-padrao", { bearer }) as Promise<any[]>;
}
export async function adminAddCalendarioPadrao(bearer: string, payload: any) {
  return request("POST", "/ead/calendario-padrao", { bearer, body: payload });
}
export async function adminDeleteCalendarioPadrao(bearer: string, id: string) {
  return request("DELETE", `/ead/calendario-padrao/${id}`, { bearer });
}
export async function adminRatificarCalendarioPadrao(bearer: string, ano: number) {
  return obj(await request("POST", "/ead/calendario-padrao/ratificar", { bearer, body: { ano } }));
}

// Calendário Turma (Admin & Geral)
export async function getCalendarioTurma(bearer: string, turmaId: string) {
  return request("GET", `/ead/turmas/${turmaId}/calendario`, { bearer }) as Promise<any[]>;
}
export async function addCalendarioTurma(bearer: string, turmaId: string, payload: any) {
  return request("POST", `/ead/turmas/${turmaId}/calendario`, { bearer, body: payload });
}
export async function deleteCalendarioTurma(bearer: string, turmaId: string, eventoId: string) {
  return request("DELETE", `/ead/turmas/${turmaId}/calendario/${eventoId}`, { bearer });
}
export async function ratificarCalendarioTurma(bearer: string, turmaId: string) {
  return obj(await request("POST", `/ead/turmas/${turmaId}/calendario/ratificar`, { bearer }));
}
export async function gerarAulasTurma(bearer: string, turmaId: string) {
  return obj(await request("POST", `/ead/turmas/${turmaId}/gerar-aulas`, { bearer }));
}

// Turmas (Geral)
export async function getMinhasTurmas(bearer: string) {
  return request("GET", "/ead/minhas-turmas", { bearer }) as Promise<any[]>;
}
export async function getAulasTurma(bearer: string, turmaId: string, de: string, ate: string) {
  return request("GET", `/ead/turmas/${turmaId}/aulas?de=${de}&ate=${ate}`, { bearer }) as Promise<any[]>;
}

// Plano de Aulas e Chamada
export async function getAula(bearer: string, aula_id: string) {
  return obj(await request("GET", `/ead/aulas/${aula_id}`, { bearer }));
}
export async function updatePlanoAula(bearer: string, aula_id: string, payload: any) {
  return request("PATCH", `/ead/aulas/${aula_id}/plano`, { bearer, body: payload });
}
export async function getChamada(bearer: string, aula_id: string) {
  return obj(await request("GET", `/ead/aulas/${aula_id}/chamada`, { bearer }));
}
export async function updateChamada(bearer: string, aula_id: string, payload: any) {
  return obj(await request("PUT", `/ead/aulas/${aula_id}/chamada`, { bearer, body: payload }));
}
export async function getChamadaHistorico(bearer: string, aula_id: string) {
  return request("GET", `/ead/aulas/${aula_id}/chamada/historico`, { bearer }) as Promise<any[]>;
}
export async function declararPresenca(bearer: string, aula_id: string) {
  return obj(await request("POST", `/ead/aulas/${aula_id}/declarar-presenca`, { bearer }));
}
export async function enviarJustificativa(bearer: string, aula_id: string, payload: { justificativa: string; arquivo?: string }) {
  return obj(await request("POST", `/ead/aulas/${aula_id}/justificar`, { bearer, body: payload }));
}
export async function avaliarJustificativa(bearer: string, aula_id: string, aluno_id: string, payload: { decisao: 'aceitar' | 'recusar'; motivo_recusa?: string }) {
  return obj(await request("POST", `/ead/aulas/${aula_id}/chamada/${aluno_id}/avaliar-justificativa`, { bearer, body: payload }));
}
export async function getMinhaFrequencia(bearer: string, turma_id?: string) {
  const q = turma_id ? `?turma_id=${turma_id}` : "";
  return obj(await request("GET", `/ead/minha-frequencia${q}`, { bearer }));
}
export async function getFrequenciaTurma(bearer: string, turma_id: string) {
  return request("GET", `/ead/turmas/${turma_id}/frequencia`, { bearer }) as Promise<any[]>;
}

// Sprint 4: Anotações de Campo
export interface AnotacaoCampoItem {
  item_chave: string;
  item_texto: string;
  o_que_fez?: string | null;
  dificuldade?: string | null;
  expectativa?: string | null;
  descricao_do_feito?: string | null;
}

export async function getAnotacoesCampo(aluno_user_id: string, data?: string, token?: string | null) {
  const t = token || getUserToken();
  const qData = data ? `&data=${data}` : "";
  return request("GET", `/ead/anotacoes-campo?aluno_user_id=${aluno_user_id}${qData}`, {
    bearer: t,
  }) as Promise<any[]>;
}

export async function getDiasAnotacoesCampo(aluno_user_id: string, token?: string | null) {
  const t = token || getUserToken();
  return request("GET", `/ead/anotacoes-campo/dias?aluno_user_id=${aluno_user_id}`, {
    bearer: t,
  }) as Promise<{ data: string; total_procedimentos: number }[]>;
}

export async function salvarAnotacoesCampo(
  payload: { aluno_user_id: string; data: string; itens: AnotacaoCampoItem[] },
  token?: string | null
) {
  const t = token || getUserToken();
  return obj(
    await request("POST", "/ead/anotacoes-campo", {
      bearer: t,
      body: payload,
    })
  );
}

