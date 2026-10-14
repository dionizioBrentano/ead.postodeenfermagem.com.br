import type { SituacaoVinculo } from "../api/organizacao";

export const TAMANHO_MAXIMO_MATRICULA = 50;

export const TEXTOS_VALIDACAO_ALUNO = {
  nomeObrigatorio: "Informe o nome completo.",
  celularIncompleto: "Informe o celular com DDD (ao menos 10 dígitos).",
  matriculaLonga: "A matrícula deve ter no máximo 50 caracteres.",
} as const;

export const ROTULO_SITUACAO: Record<SituacaoVinculo, string> = {
  convidado: "Convidado",
  pendente: "Aguardando aprovação",
  ativo: "Ativo",
  revogado: "Revogado",
};

export const ROTULO_PRIMEIRO_ACESSO = {
  acessou: "Já entrou na Sala EAD",
  naoAcessou: "Ainda não entrou na Sala EAD",
} as const;

export const ROTULO_PAPEL = {
  docente: "Supervisor (docente)",
  administrador: "Administrador",
  aluno: "Aluno",
} as const;

export const ROTULO_PERFIL_PERSONALIZADO = "Personalizado";

export const ROTULO_REGISTRO_CONSELHO: Record<string, string> = {
  regular: "Regular",
  nao_conferido: "Não conferido",
  irregular: "Irregular",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
};

export const TEXTOS_ORGANIZACAO = {
  carregando: "Carregando...",
  fechar: "Fechar",
  confirmar: "Confirmar",
  erroGenerico: "Ocorreu um erro ao processar a solicitação.",
  catalogoIndisponivel: "Catálogo de atribuições indisponível no momento. A escolha de perfis está desativada.",
  docenteSemConfirmacao: "O docente não confirmou o e-mail/telefone.",
  perfilRotulo: "Perfil",
  perfilAtribuicoesLegend: "Perfil de atribuições",
  erroCarregarLista: "Não foi possível carregar a lista.",
  erroAprovar: "Não foi possível aprovar o vínculo.",
  erroRevogar: "Não foi possível revogar o vínculo.",
  erroReativar: "Não foi possível reativar o vínculo.",

  // Docentes
  docentesTitulo: "Supervisores",
  docentesVazio: "Nenhum supervisor encontrado.",
  aprovarDocente: "Aprovar",
  revogarDocente: "Revogar",
  reativarDocente: "Reativar",
  sucessoAprovarDocente: "Supervisor aprovado com sucesso.",
  sucessoRevogarDocente: "Supervisor revogado com sucesso.",
  sucessoReativarDocente: "Supervisor reativado com sucesso.",
  confirmarRevogacaoDocenteTitulo: "Revogar supervisor",
  confirmarRevogacaoDocenteTexto: "Tem certeza de que deseja revogar o acesso deste supervisor? Informe o motivo abaixo.",
  rotuloMotivo: "Motivo da revogação",

  // Administradores
  administradoresTitulo: "Administradores",
  administradoresVazio: "Nenhum administrador encontrado.",
  mudarPerfil: "Mudar perfil",
  revogarAdmin: "Revogar",
  reativarAdmin: "Reativar",
  sucessoMudarPerfil: "Perfil atualizado com sucesso.",
  sucessoRevogarAdmin: "Administrador revogado com sucesso.",
  sucessoReativarAdmin: "Administrador reativado com sucesso.",
  confirmarRevogacaoAdminTitulo: "Revogar administrador",
  confirmarRevogacaoAdminTexto: "Tem certeza de que deseja revogar o acesso deste administrador? Informe o motivo abaixo.",
  janelaMudarPerfilTitulo: "Mudar perfil do administrador",
  salvarPerfil: "Salvar perfil",

  // Alunos
  alunosTitulo: "Alunos",
  alunosVazio: "Nenhum aluno encontrado.",
  alunosContagem: (n: number) => (n === 1 ? "1 aluno" : `${n} alunos`),
  semMatricula: "Sem matrícula",
  matriculaRotulo: "Matrícula",
  cadastrarAluno: "Cadastrar aluno",
  corrigirAluno: "Corrigir",
  revogarAluno: "Revogar",
  reativarAluno: "Reativar",
  sucessoCadastrarAluno: "Aluno cadastrado com sucesso.",
  sucessoCorrigirAluno: "Dados do aluno atualizados com sucesso.",
  sucessoRevogarAluno: "Vínculo de aluno revogado com sucesso.",
  sucessoReativarAluno: "Vínculo de aluno reativado com sucesso.",
  confirmarRevogacaoAlunoTitulo: "Revogar aluno",
  confirmarRevogacaoAlunoTexto: "Tem certeza de que deseja revogar o acesso deste aluno? Informe o motivo abaixo.",
  buscaAlunosPlaceholder: "Buscar por nome, e-mail ou matrícula...",

  // Formulário de aluno
  formularioCadastrarTitulo: "Cadastrar aluno",
  formularioCorrigirTitulo: "Corrigir dados do aluno",
  nomeCampo: "Nome completo",
  celularCampo: "Celular com DDD",
  celularDicaTroca: "Preencha apenas se for alterar o número de celular.",
  matriculaCampo: "Matrícula (opcional)",
  matriculaDica: "Código do aluno na escola",
  bloqueioAlunoJaAcessou: "O aluno já entrou na Sala EAD. Nome e celular agora são corrigidos por ele.",
  salvarAluno: "Salvar",
  cancelar: "Cancelar",

  // Convites
  convitesTitulo: "Convites",
  novoConviteTitulo: "Novo convite",
  convitesPendentesTitulo: "Convites pendentes",
  convitesPendentesVazio: "Nenhum convite pendente.",
  emailCampo: "E-mail",
  papelCampo: "Papel",
  enviarConvite: "Enviar convite",
  cancelarConvite: "Cancelar",
  sucessoCriarConvite: "Convite enviado com sucesso.",
  sucessoCancelarConvite: "Convite cancelado com sucesso.",
  confirmarCancelarConviteTitulo: "Cancelar convite",
  confirmarCancelarConviteTexto: "Deseja realmente cancelar este convite?",
  perfilObrigatorioAdmin: "Selecione ao menos uma atribuição para convidar um administrador.",
} as const;
