import { useState, useEffect } from "react";
import { getTarefasTeoricas, getEntregasTarefa, salvarPresencaTarefa } from "../api/ead";
import { getUserToken } from "../api/client";

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
    getTarefasTeoricas(turmaId, token)
      .then((res: any) => {
        if (Array.isArray(res)) {
          setTarefas(res);
          if (res.length > 0) {
            setTarefaSelecionadaId(res[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao buscar tarefas teóricas da turma", err);
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
      .catch((err) => {
        console.error("Erro ao carregar entregas da tarefa", err);
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

    try {
      await salvarPresencaTarefa(respostaId, dec.valeu, dec.comentario, token);
      setFeedback("Presença gravada com sucesso!");
      carregarEntregas();
    } catch (err: any) {
      alert("Erro ao gravar presença: " + (err.message || "tente novamente."));
    } finally {
      setGravandoId(null);
    }
  };

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e6e4e1",
        borderRadius: "12px",
        padding: "20px 24px",
        color: "#3a3a3a",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "#222222" }}>
            Tarefas Teóricas — Presença e Entregas dos Alunos
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
            Avaliação de presença para tarefas teóricas (exclusivo para entregas de origem aluno).
          </p>
        </div>

        {tarefas.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label htmlFor="select-tarefa-supervisao" style={{ fontSize: "13px", fontWeight: 600 }}>
              Tarefa:
            </label>
            <select
              id="select-tarefa-supervisao"
              value={tarefaSelecionadaId}
              onChange={(e) => setTarefaSelecionadaId(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid #e6e4e1",
                fontSize: "13px",
              }}
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

      {feedback && (
        <div
          style={{
            marginBottom: "16px",
            padding: "8px 12px",
            background: "#e8f8f0",
            border: "1px solid #b7ebd0",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#1a7040",
          }}
        >
          {feedback}
        </div>
      )}

      {carregando || carregandoEntregas ? (
        <p style={{ fontSize: "14px", color: "#666666" }}>Carregando entregas...</p>
      ) : entregas.length === 0 ? (
        <p style={{ fontSize: "14px", color: "#777777", margin: 0 }}>
          Nenhuma entrega de aluno registrada ainda para esta tarefa.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {entregas.map((entrega) => {
            const dec = decisoes[entrega.id] || { valeu: "sim", comentario: "" };
            const gravando = gravandoId === entrega.id;
            const payload = entrega.payload || {};
            const grade = payload.grade || {};
            const marcas = payload.marcasPrimeiraVia || {};
            const condutaTexto = payload.conduta || "";

            return (
              <div
                key={entrega.id}
                style={{
                  border: "1px solid #e6e4e1",
                  borderRadius: "8px",
                  padding: "16px",
                  background: "#faf9f6",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "15px", color: "#222222" }}>
                      {entrega.aluno?.name || "Aluno"}
                    </strong>
                    <span style={{ fontSize: "13px", color: "#666666", marginLeft: "8px" }}>
                      ({entrega.aluno?.email || ""})
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#888888" }}>
                    Entregue em: {entrega.entregue_em || "—"}
                  </span>
                </div>

                {/* Resumo da Entrega do Aluno */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6e4e1",
                    borderRadius: "6px",
                    padding: "12px",
                    marginBottom: "12px",
                    fontSize: "13px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <strong>Turno:</strong>{" "}
                    {payload.turno?.duracaoHoras ? `${payload.turno.duracaoHoras}h (início ${payload.turno.inicio || "—"})` : "—"}
                  </div>

                  {condutaTexto && (
                    <div>
                      <strong>Conduta registrada:</strong>
                      <p style={{ margin: "4px 0 0", color: "#555555", fontStyle: "italic", whiteSpace: "pre-wrap" }}>
                        "{condutaTexto}"
                      </p>
                    </div>
                  )}

                  <div style={{ fontSize: "12px", color: "#666666" }}>
                    <strong>Organização:</strong> {Object.keys(grade).length} horário(s) com tarefas coladas ·{" "}
                    <strong>1ª Via:</strong> {Object.keys(marcas).length} item(ns) checados/circulados
                  </div>
                </div>

                {/* Controle de Presença: Valeu ou Não Valeu com Comentário */}
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6e4e1",
                    borderRadius: "6px",
                    padding: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Presença valeu?</span>

                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
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

                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", cursor: "pointer" }}>
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

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Comentário sobre a organização do plantão (opcional)"
                      value={dec.comentario}
                      onChange={(e) =>
                        setDecisoes((prev) => ({
                          ...prev,
                          [entrega.id]: { ...dec, comentario: e.target.value },
                        }))
                      }
                      style={{
                        flex: 1,
                        minWidth: "240px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #e6e4e1",
                        fontSize: "13px",
                      }}
                    />

                    <button
                      type="button"
                      disabled={gravando}
                      onClick={() => handleSalvarPresenca(entrega.id)}
                      style={{
                        padding: "6px 14px",
                        background: "#1a3a35",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: gravando ? "not-allowed" : "pointer",
                      }}
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
