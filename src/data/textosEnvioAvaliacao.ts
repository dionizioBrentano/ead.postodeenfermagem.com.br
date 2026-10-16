export const TEXTOS_ENVIO_AVALIACAO = {
  tudoCerto: "PDF gerado e autoavaliação salva no servidor.",
  pdfFalhou: (motivo: string) =>
    `Não foi possível gerar o PDF (${motivo}). Suas respostas continuam guardadas neste aparelho.`,
  gravacaoParcial: (n: number, total: number, motivo: string) =>
    `PDF gerado. ${n} de ${total} itens não foram salvos no servidor (${motivo}). Suas respostas continuam guardadas neste aparelho. Toque em "Tentar salvar de novo".`,
  semSessao:
    "PDF gerado. Sua sessão terminou: entre de novo para salvar no servidor. Suas respostas continuam guardadas neste aparelho.",
  botaoNovaTentativa: "Tentar salvar de novo",
  enviando: (feitos: number, total: number) => `Salvando no servidor… ${feitos} de ${total}`,
  supervisorTudoCerto: "Avaliação salva com sucesso!",
  supervisorGravacaoParcial: (n: number, total: number, motivo: string) =>
    `${n} de ${total} itens não foram salvos no servidor (${motivo}). Toque em "Tentar salvar de novo".`,
  motivoSemConexao: "sem conexão com o servidor",
  motivoLimite: "o servidor pediu para esperar (código 429)",
  motivoComCodigo: (status: number, mensagem: string) => `código ${status}: ${mensagem}`,
  motivoDesconhecido: "erro inesperado",
};
