/**
 * Textos fixos da página de módulo EAD.
 * Regra F-10: nada de valor fixo dentro de componente.
 */

export const TEXTOS_MODULOS_EAD = {
  navAriaLabel: "Navegação da Sala EAD",
  voltarSala: "← Voltar para a Sala EAD",
  tituloObjetivos: "Objetivos de Aprendizagem",
  tituloTopicos: "Tópicos de Conteúdo",
  tituloQuiz: "Quiz de Fixação",
  descricaoQuiz: "Selecione a resposta correta em cada uma das questões abaixo para verificar sua fixação:",
  tituloFontes: "Fontes e Referências Bibliográficas",
  alertaWarning: "Atenção",
  alertaInfo: "Ponto de Atenção",
  recursoVisual: "[Recurso Visual]",
  opcaoCorreta: "Correta",
  opcaoErrada: "Sua escolha (Incorreta)",
  feedbackAcerto: "✓ Resposta Correta",
  feedbackErro: "✕ Resposta Incorreta",
  rotuloQuestao: "Questão",
  rotuloTopico: "Tópico",
  metaInstituicao: "Instituição:",
  metaAutor: "Autor:",
  metaAutores: "Autores:",
  metaEdicao: "Edição:",
  metaCapitulo: "Capítulo:",
  metaOrigem: "Origem:",
  linkMaterialOriginal: "Consultar material original ↗",
  tipoFonteVideo: "Vídeo",
  tipoFonteLivro: "Livro",
  tipoFonteArtigo: "Artigo",
} as const;

export function rotuloSeloModulo(numero: number): string {
  return `Módulo ${numero} • Teórico`;
}
