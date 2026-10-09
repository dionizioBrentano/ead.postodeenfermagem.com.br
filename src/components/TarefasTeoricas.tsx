import { useState } from "react";
import { TAREFAS_TEORICAS, type TarefaTeorica } from "../data/tarefasTeoricas";
import { formatarTituloComData } from "../lib/tarefasTeoricas";

export default function TarefasTeoricas() {
  const [tarefaAtivaId, setTarefaAtivaId] = useState<string | null>(null);

  const tarefaAtiva: TarefaTeorica | undefined = TAREFAS_TEORICAS.find(
    (t) => t.id === tarefaAtivaId
  );

  if (tarefaAtiva) {
    return (
      <div className="guia-root">
        <div className="wrap">
          <button
            type="button"
            className="guia-btn-voltar"
            onClick={() => setTarefaAtivaId(null)}
          >
            ← Voltar às Tarefas Teóricas
          </button>

          <article className="guia-ficha-card">
            <header className="guia-ficha-cabecalho">
              <span className="guia-ficha-badge">
                {tarefaAtiva.data} · {tarefaAtiva.statusRotulo}
              </span>
              <h1 className="guia-ficha-titulo">
                {formatarTituloComData(tarefaAtiva)}
              </h1>
              <p className="guia-texto-objetivo">{tarefaAtiva.subtitulo}</p>
            </header>

            <section className="guia-secao" aria-label="Descrição">
              <h2 className="guia-secao-titulo">Descrição da Atividade</h2>
              <p className="guia-texto-objetivo">{tarefaAtiva.descricao}</p>
            </section>

            <section className="guia-secao" aria-label="Objetivos de aprendizagem">
              <h2 className="guia-secao-titulo">Objetivos de Aprendizagem</h2>
              <ul className="guia-lista-itens">
                {tarefaAtiva.objetivos.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </section>

            <section className="guia-secao" aria-label="Tópicos da atividade">
              <h2 className="guia-secao-titulo">Tópicos e Estrutura</h2>
              <ul className="guia-lista-itens">
                {tarefaAtiva.topicos.map((top, i) => (
                  <li key={i}>{top}</li>
                ))}
              </ul>
            </section>

            <div className="guia-alerta-box" role="status">
              <span className="guia-alerta-tag">Em Preparação</span>
              <p className="guia-alerta-texto">
                Esta tarefa teórica e seus módulos práticos (estudo de caso,
                prescrições-exemplo e gabarito comentado) estão em estruturação
                didática para a turma.
              </p>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="guia-root">
      <div className="wrap">
        <header className="guia-header">
          <h1 className="guia-header-titulo">Tarefas Teóricas</h1>
          <p className="guia-header-sub">
            Atividades didáticas e organização da prática de estágio hospitalar
          </p>
        </header>

        <div className="guia-lista-tabela" role="list">
          {TAREFAS_TEORICAS.map((tarefa) => {
            const rotuloCompleto = formatarTituloComData(tarefa);
            return (
              <button
                key={tarefa.id}
                type="button"
                className="guia-linha-item"
                onClick={() => setTarefaAtivaId(tarefa.id)}
              >
                <div className="guia-linha-corpo">
                  <span className="guia-ordem">{tarefa.data}</span>
                  <span className="guia-linha-titulo">{rotuloCompleto}</span>
                </div>
                <div className="guia-linha-lado-direito">
                  <span className="guia-linha-rotulo">{tarefa.statusRotulo}</span>
                  <span className="guia-linha-seta">→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
