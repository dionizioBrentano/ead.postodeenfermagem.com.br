import type { TarefaTeorica } from "../data/tarefasTeoricas";

/**
 * Retorna o título da tarefa teórica precedido de sua data,
 * conforme o padrão exigido: "DD/MM/AAAA - Título".
 */
export function formatarTituloComData(tarefa: TarefaTeorica): string {
  return `${tarefa.data} - ${tarefa.titulo}`;
}
