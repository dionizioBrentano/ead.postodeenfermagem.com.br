export const PARAMETRO_ABA = "aba";

export const ABAS_ADMINISTRACAO = [
  "docentes",
  "convites",
  "administradores",
  "alunos",
  "turmas",
  "calendario",
  "frequencia",
] as const;
export type AbaAdministracao = (typeof ABAS_ADMINISTRACAO)[number];

// Abas da supervisão que o menu pode abrir. "transcrever_auto" só abre por /supervisao/lancamento,
// e "meu_registro" não está no menu: as duas ficam fora desta lista de propósito.
export const ABAS_SUPERVISAO_DO_MENU = [
  "avaliacao_sup",
  "autoavaliacoes_aluno",
  "paralelo",
  "grafico",
  "anotacoes_campo",
  "selecionar_alunos",
  "calendario",
  "aulas",
  "chamada",
] as const;
export type AbaSupervisao =
  | (typeof ABAS_SUPERVISAO_DO_MENU)[number]
  | "transcrever_auto"
  | "meu_registro";
