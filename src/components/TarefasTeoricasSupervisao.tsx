import { useState, useEffect } from "react";
import { getTarefasTeoricas, getEntregasTarefa, salvarPresencaTarefa } from "../api/ead";
import { getUserToken } from "../api/client";
import "./TarefasTeoricasSupervisao.css";

const ERRO_CARREGAR_TAREFAS = "Não foi possível carregar as tarefas da turma.";
const ERRO_CARREGAR_ENTREGAS = "Não foi possível carregar as entregas desta tarefa.";
const ERRO_GRAVAR_PRESENCA = "Não foi possível gravar a presença. Tente novamente.";
const SUCESSO_GRAVAR_PRESENCA = "Presença gravada com sucesso!";

interface Props {
  turmaId?: string;
}

export default function TarefasTeoricasSupervisao({ turmaId }: Props) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [tarefaSelecionadaId, setTarefaSelecionadaId] = useState<string>("");
  const [entregas, setEntregas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoEntregas, setCarregandoEntregas] = useState(false);
  const [decisoes, setDecisoes] = useState<Record<string, { valeu: "sim" | "nao"; comentario: string }>>({});
  const [gravandoId, setGravandoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega tarefas teóricas da turma
  useEffect(() => {
    if (!turmaId) {
      setTarefas([]);
      setTarefaSelecionadaId("");
      return;
    }

    const token = getUserToken();
    if (!token) return;

    setCarregando(true);
    setErro(null);
    getTarefasTeoricas(turmaId, token)
      .then((res: any) => {
        if (Array.isArray(res)) {
          setTarefas(res);
          if (res.length > 0) {
            setTarefaSelecionadaId(res[0].id);
          }
        }
      })
      .catch(() => {
        setErro(ERRO_CARREGAR_TAREFAS);
      })
      .finally(() => setCarregando(false));
  }, [turmaId]);

  // Carrega entregas de origem aluno da tarefa selecionada
  const carregarEntregas = () => {
    if (!tarefaSelecionadaId) {
      setEntregas([]);
      return;
    }

    const token = getUserToken();
    if (!token) return;

    setCarregandoEntregas(true);
    getEntregasTarefa(tarefaSelecionadaId, token)
      .then((res: any) => {
        if (Array.isArray(res)) {
          // Garante filtro rigoroso de origem aluno (Requisito 5)
          const apenasAlunos = res.filter((e) => e.origem === "aluno");
          setEntregas(apenasAlunos);

          const mapa: Record<string, { valeu: "sim" | "nao"; comentario: string }> = {};
          apenasAlunos.forEach((e) => {
            if (e.presenca) {
              mapa[e.id] = {
                valeu: e.presenca.valeu,
                comentario: e.presenca.comentario || "",
              };
            }
          });
          setDecisoes((prev) => ({ ...prev, ...mapa }));
        }
      })
      .catch(() => {
        setErro(ERRO_CARREGAR_ENTREGAS);
      })
      .finally(() => setCarregandoEntregas(false));
  };

  useEffect(() => {
    carregarEntregas();
  }, [tarefaSelecionadaId]);

  const handleSalvarPresenca = async (respostaId: string) => {
    const dec = decisoes[respostaId] || { valeu: "sim", comentario: "" };
    const token = getUserToken();
    if (!token) return;

    setGravandoId(respostaId);
    setFeedback(null);
    setErro(null);

    try {
      await salvarPresencaTarefa(respostaId, dec.valeu, dec.comentario, token);
      setFeedback(SUCESSO_GRAVAR_PRESENCA);
      carregarEntregas();
    } catch {
      setErro(ERRO_GRAVAR_PRESENCA);
    } finally {
      setGravandoId(null);
    }
  };

  return (
    <section className="supervisao-painel">
      <div className="supervisao-cabecalho">
        <div>
          <h2 className="supervisao-titulo">
            Tarefas Teóricas — Presença e Entregas dos Alunos
          </h2>
          <p className="supervisao-subtitulo">
            Avaliação de presença para tarefas teóricas (exclusivo para entregas de origem aluno).
          </p>
        </div>

        {tarefas.length > 1 && (
          <div className="supervisao-filtro">
            <label htmlFor="select-tarefa-supervisao" className="supervisao-filtro-rotulo">
              Tarefa:
            </label>
            <select
              id="select-tarefa-supervisao"
              className="supervisao-filtro-selecao"
              value={tarefaSelecionadaId}
              onChange={(e) => setTarefaSelecionadaId(e.target.value)}
            >
              {tarefas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.data_lista || ""} - {t.titulo}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {erro && (
        <div className="alert err supervisao-alerta" role="alert">
          {erro}
        </div>
      )}

      {feedback && (
        <div className="alert info supervisao-alerta">
          {feedback}
        </div>
      )}

      {carregando || carregandoEntregas ? (
        <p className="muted supervisao-aviso">Carregando entregas...</p>
      ) : entregas.length === 0 ? (
        <p className="muted supervisao-aviso">
          Nenhuma entrega de aluno registrada ainda para esta tarefa.
        </p>
      ) : (
        <div className="supervisao-lista-entregas">
          {entregas.map((entrega) => {
            const dec = decisoes[entrega.id] || { valeu: "sim", comentario: "" };
            const gravando = gravandoId === entrega.id;
            const payload = entrega.payload || {};
            const grade = payload.grade || {};
            const marcas = payload.marcasPrimeiraVia || {};
            const condutaTexto = payload.conduta || "";
            const comentarioInputId = `supervisao-comentario-${entrega.id}`;

            return (
              <div key={entrega.id} className="supervisao-entrega">
                <div className="supervisao-entrega-topo">
                  <div>
                    <strong className="supervisao-aluno-nome">
                      {entrega.aluno?.name || "Aluno"}
                    </strong>
                    <span className="supervisao-aluno-email">
                      ({entrega.aluno?.email || ""})
                    </span>
                  </div>
                  <span className="supervisao-entrega-data">
                    Entregue em: {entrega.entregue_em || "—"}
                  </span>
                </div>

                {/* Resumo da Entrega do Aluno */}
                <div className="supervisao-resumo">
                  <div>
                    <strong>Turno:</strong>{" "}
                    {payload.turno?.duracaoHoras ? `${payload.turno.duracaoHoras}h (início ${payload.turno.inicio || "—"})` : "—"}
                  </div>

                  {condutaTexto && (
                    <div>
                      <strong>Conduta registrada:</strong>
                      <p className="supervisao-conduta">
                        "{condutaTexto}"
                      </p>
                    </div>
                  )}

                  <div className="supervisao-contagem">
                    <strong>Organização:</strong> {Object.keys(grade).length} horário(s) com tarefas coladas ·{" "}
                    <strong>1ª Via:</strong> {Object.keys(marcas).length} item(ns) checados/circulados
                  </div>
                </div>

                {/* Controle de Presença: Valeu ou Não Valeu com Comentário */}
                <div className="supervisao-presenca">
                  <div className="supervisao-opcoes">
                    <span className="supervisao-opcoes-pergunta">Presença valeu?</span>

                    <label className="supervisao-opcao">
                      <input
                        type="radio"
                        name={`supervisao-valeu-${entrega.id}`}
                        value="sim"
                        checked={dec.valeu === "sim"}
                        onChange={() =>
                          setDecisoes((prev) => ({
                            ...prev,
                            [entrega.id]: { ...dec, valeu: "sim" },
                          }))
                        }
                      />
                      Valeu (Sim)
                    </label>

                    <label className="supervisao-opcao">
                      <input
                        type="radio"
                        name={`supervisao-valeu-${entrega.id}`}
                        value="nao"
                        checked={dec.valeu === "nao"}
                        onChange={() =>
                          setDecisoes((prev) => ({
                            ...prev,
                            [entrega.id]: { ...dec, valeu: "nao" },
                          }))
                        }
                      />
                      Não valeu (Não)
                    </label>
                  </div>

                  <div className="supervisao-comentario">
                    <div className="field supervisao-comentario-campo">
                      <label htmlFor={comentarioInputId} className="l">
                        Comentário
                      </label>
                      <input
                        id={comentarioInputId}
                        type="text"
                        className="supervisao-comentario-entrada"
                        placeholder="Comentário sobre a organização do plantão (opcional)"
                        value={dec.comentario}
                        onChange={(e) =>
                          setDecisoes((prev) => ({
                            ...prev,
                            [entrega.id]: { ...dec, comentario: e.target.value },
                          }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="supervisao-botao-gravar"
                      disabled={gravando}
                      onClick={() => handleSalvarPresenca(entrega.id)}
                    >
                      {gravando ? "Gravando..." : "Gravar Presença"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
