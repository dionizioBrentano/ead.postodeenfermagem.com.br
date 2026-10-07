import { useState, useEffect } from "react";
import {
  adminGetTurmas,
  getFrequenciaTurma,
  getAulasTurma,
  getChamada,
  getChamadaHistorico,
  avaliarJustificativa,
} from "../api/ead";
import { getUserToken } from "../api/client";

export default function FrequenciaAdmin({ atribuicoes }: { atribuicoes: string[] }) {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState<string>("");
  const [frequencias, setFrequencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"frequencia" | "aulas">("frequencia");

  const [aulas, setAulas] = useState<any[]>([]);
  const [aulaId, setAulaId] = useState<string>("");
  const [chamada, setChamada] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  // Modal de justificativa
  const [recusandoAluno, setRecusandoAluno] = useState<any | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [arquivoModal, setArquivoModal] = useState<{ alunoNome: string; url: string } | null>(null);
  const [processandoAvaliacao, setProcessandoAvaliacao] = useState(false);

  const token = getUserToken();
  const canCorrigir = atribuicoes.includes("frequencia.corrigir") || atribuicoes.includes("turmas.gerenciar");

  useEffect(() => {
    if (!token) return;
    adminGetTurmas(token).then(setTurmas).catch(console.error);
  }, [token]);

  const carregarFrequencias = () => {
    if (!turmaId || !token) {
      setFrequencias([]);
      return;
    }
    setLoading(true);
    getFrequenciaTurma(token, turmaId)
      .then(setFrequencias)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarFrequencias();
  }, [turmaId, token]);

  const turmaSelecionada = turmas.find((x) => x.id === turmaId);

  const loadAulas = async () => {
    if (!turmaId || !token) return;
    setView("aulas");
    setLoading(true);
    const t = turmas.find((x) => x.id === turmaId);
    if (!t) {
      setLoading(false);
      return;
    }
    const de = t.inicio || t.data_inicio || "1970-01-01";
    const ate = t.fim || t.data_fim || "2099-12-31";
    try {
      const au = await getAulasTurma(token, turmaId, de, ate);
      setAulas(au);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChamada = async (id: string) => {
    setAulaId(id);
    if (!token) return;
    setLoading(true);
    try {
      const data: any = await getChamada(token, id);
      setChamada(data && data.chamada ? data.chamada : []);
      const hist = await getChamadaHistorico(token, id);
      setHistorico(hist || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAceitarJustificativa = async (c: any) => {
    if (!token || !aulaId) return;
    setProcessandoAvaliacao(true);
    try {
      await avaliarJustificativa(token, aulaId, c.user_id, {
        decisao: "aceitar",
      });
      alert(`Justificativa de ${c.nome} aceita com sucesso.`);
      await loadChamada(aulaId);
    } catch (e: any) {
      alert(e.message || "Erro ao aceitar justificativa.");
    } finally {
      setProcessandoAvaliacao(false);
    }
  };

  const handleConfirmarRecusa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !aulaId || !recusandoAluno) return;
    if (!motivoRecusa.trim()) {
      alert("Informe o motivo da recusa.");
      return;
    }

    setProcessandoAvaliacao(true);
    try {
      await avaliarJustificativa(token, aulaId, recusandoAluno.user_id, {
        decisao: "recusar",
        motivo_recusa: motivoRecusa.trim(),
      });
      alert(`Justificativa de ${recusandoAluno.nome} foi recusada.`);
      setRecusandoAluno(null);
      setMotivoRecusa("");
      await loadChamada(aulaId);
    } catch (e: any) {
      alert(e.message || "Erro ao recusar justificativa.");
    } finally {
      setProcessandoAvaliacao(false);
    }
  };

  return (
    <div className="box sec" style={{ padding: "24px 20px" }}>
      <h2>Frequência e Fechamento das Turmas</h2>
      
      <div style={{ marginBottom: 20, display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontWeight: "bold" }}>Selecione a Turma: </label>
        <select
          value={turmaId}
          onChange={(e) => {
            setTurmaId(e.target.value);
            setView("frequencia");
            setAulaId("");
          }}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "220px" }}
        >
          <option value="">-- Selecione uma turma --</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} {t.campo_estagio ? `(${t.campo_estagio})` : ""}
            </option>
          ))}
        </select>

        {turmaId && view === "frequencia" && (
          <button className="btn small" onClick={loadAulas}>
            Ver Aulas e Chamada Diária
          </button>
        )}
        {view === "aulas" && (
          <button
            className="btn ghost small"
            onClick={() => {
              setView("frequencia");
              setAulaId("");
              carregarFrequencias();
            }}
          >
            ← Voltar para Resumo da Turma
          </button>
        )}
      </div>

      {turmaSelecionada && view === "frequencia" && (
        <div style={{ marginBottom: "16px", fontSize: "0.9em", color: "#555" }}>
          Regra de Aprovação:{" "}
          <strong>
            {turmaSelecionada.campo_estagio
              ? "Estágio Prático: 100% de frequência obrigatória (presença, reposição ou atestado aceito)."
              : "Sala de Aula (Teórico): Mínimo 75% de frequência."}
          </strong>{" "}
          <em style={{ color: "#c62828" }}>Falta sem resolução não fecha.</em>
        </div>
      )}

      {loading && <p>Carregando...</p>}

      {/* Tabela de Resumo dos Alunos */}
      {!loading && turmaId && view === "frequencia" && (
        <div style={{ overflowX: "auto" }}>
          <table className="heat" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Presenças</th>
                <th>Faltas</th>
                <th>Atestados Aceitos</th>
                <th>Recuperações</th>
                <th>Faltas s/ Resolução</th>
                <th>Frequência (%)</th>
                <th>Situação de Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {frequencias.map((f) => {
                const temPendencia = (f.faltas_sem_resolucao || 0) > 0;
                const aprovado = f.aprovado_frequencia;

                return (
                  <tr key={f.aluno_id || f.id || Math.random()}>
                    <td>
                      <strong>{f.nome || f.usuario?.name || "Aluno"}</strong>
                    </td>
                    <td style={{ color: "#2e7d32", fontWeight: 600 }}>{f.presencas || 0}</td>
                    <td style={{ color: "#c62828", fontWeight: 600 }}>{f.faltas || 0}</td>
                    <td style={{ color: "#0277bd", fontWeight: 600 }}>{f.faltas_justificadas || 0}</td>
                    <td style={{ color: "#6a1b9a", fontWeight: 600 }}>{f.recuperacoes || 0}</td>
                    <td>
                      {temPendencia ? (
                        <span style={{ color: "#e65100", fontWeight: "bold" }}>
                          ⚠️ {f.faltas_sem_resolucao} pendente(s)
                        </span>
                      ) : (
                        <span style={{ color: "#2e7d32" }}>0 (OK)</span>
                      )}
                    </td>
                    <td>
                      <strong>{f.percentual || 0}%</strong>
                    </td>
                    <td>
                      {f.total === 0 ? (
                        <span className="muted">Sem aulas lançadas</span>
                      ) : aprovado ? (
                        <span style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ Aprovado / Apto</span>
                      ) : temPendencia ? (
                        <span style={{ color: "#e65100", fontWeight: "bold" }}>
                          ⛔ Não fecha (Faltas sem resolução)
                        </span>
                      ) : (
                        <span style={{ color: "#c62828", fontWeight: "bold" }}>✕ Abaixo da Meta</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {frequencias.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                    Nenhum registro de aluno encontrado nesta turma.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Aulas */}
      {!loading && turmaId && view === "aulas" && !aulaId && (
        <div style={{ overflowX: "auto" }}>
          <table className="heat" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Situação</th>
                <th>Chamada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {aulas.map((a) => (
                <tr key={a.id}>
                  <td>{a.data ? new Date(a.data + "T12:00:00").toLocaleDateString() : "-"}</td>
                  <td>{a.situacao}</td>
                  <td>{a.has_chamada ? "✓ Realizada" : "Pendente"}</td>
                  <td>
                    <button className="btn ghost small" onClick={() => loadChamada(a.id)}>
                      Ver Detalhes da Chamada
                    </button>
                  </td>
                </tr>
              ))}
              {aulas.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>
                    Nenhuma aula encontrada neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detalhe da Chamada da Aula */}
      {!loading && view === "aulas" && aulaId && (
        <div>
          <button
            className="btn ghost small"
            style={{ marginBottom: 15 }}
            onClick={() => setAulaId("")}
          >
            ← Voltar para Lista de Aulas
          </button>
          
          <h3>Registro da Chamada da Aula</h3>

          <div style={{ overflowX: "auto" }}>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Situação</th>
                  <th>Declaração de Presença</th>
                  <th>Justificativa / Atestado</th>
                  <th>Status da Justificativa</th>
                  {canCorrigir && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {chamada.map((c: any) => {
                  const statusJust = c.justificativa_status;

                  return (
                    <tr key={c.user_id}>
                      <td>
                        <strong>{c.nome || c.user_id}</strong>
                      </td>
                      <td>
                        {c.situacao === "presente" && <span style={{ color: "#2e7d32", fontWeight: 600 }}>Presente</span>}
                        {c.situacao === "falta" && <span style={{ color: "#c62828", fontWeight: 600 }}>Falta</span>}
                        {c.situacao === "falta_justificada" && <span style={{ color: "#0277bd", fontWeight: 600 }}>Falta Justificada</span>}
                        {c.situacao === "recuperacao" && <span style={{ color: "#6a1b9a", fontWeight: 600 }}>Recuperação</span>}
                        {!["presente", "falta", "falta_justificada", "recuperacao"].includes(c.situacao) && (
                          <span className="muted">{c.situacao || "Pendente"}</span>
                        )}
                      </td>
                      <td>
                        {c.presenca_declarada_em ? (
                          <span style={{ color: "#2e7d32", fontSize: "0.85em" }}>
                            ✓ Declarada ({new Date(c.presenca_declarada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {c.justificativa ? (
                          <div style={{ fontSize: "0.9em" }}>
                            <em>"{c.justificativa}"</em>
                            {c.justificativa_arquivo && (
                              <div style={{ marginTop: 4 }}>
                                <button
                                  type="button"
                                  className="btn ghost small"
                                  onClick={() => setArquivoModal({ alunoNome: c.nome, url: c.justificativa_arquivo })}
                                >
                                  📎 Ver Arquivo
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                      <td>
                        {statusJust === "pendente" && (
                          <span style={{ padding: "2px 8px", backgroundColor: "#fff8e1", color: "#b78103", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                            ⏳ Pendente
                          </span>
                        )}
                        {statusJust === "aceita" && (
                          <span style={{ padding: "2px 8px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                            ✓ Aceita
                          </span>
                        )}
                        {statusJust === "recusada" && (
                          <div>
                            <span style={{ padding: "2px 8px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                              ✕ Recusada
                            </span>
                            {c.justificativa_recusa_motivo && (
                              <div style={{ fontSize: "0.8em", color: "#c62828", marginTop: 2 }}>
                                <strong>Motivo:</strong> {c.justificativa_recusa_motivo}
                              </div>
                            )}
                          </div>
                        )}
                        {!statusJust && <span className="muted">-</span>}
                      </td>
                      {canCorrigir && (
                        <td>
                          {c.justificativa && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="btn outline small"
                                style={{ color: "#2e7d32" }}
                                disabled={processandoAvaliacao || statusJust === "aceita"}
                                onClick={() => handleAceitarJustificativa(c)}
                              >
                                Aceitar
                              </button>
                              <button
                                type="button"
                                className="btn outline small"
                                style={{ color: "#c62828" }}
                                disabled={processandoAvaliacao}
                                onClick={() => {
                                  setRecusandoAluno(c);
                                  setMotivoRecusa("");
                                }}
                              >
                                Recusar
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {chamada.length === 0 && (
                  <tr>
                    <td colSpan={canCorrigir ? 6 : 5} style={{ textAlign: "center", padding: "20px" }}>
                      Nenhum registro de chamada encontrado para esta aula.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: 24 }}>Histórico de Alterações na Chamada</h4>
          <div style={{ overflowX: "auto" }}>
            <table className="heat" style={{ width: "100%", textAlign: "left", fontSize: "0.9em" }}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Autor</th>
                  <th>Motivo da Alteração</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h: any, idx) => (
                  <tr key={idx}>
                    <td>{new Date(h.created_at || h.data).toLocaleString()}</td>
                    <td>{h.autor_nome || h.ator?.name || "Sistema"}</td>
                    <td>{h.motivo || "Primeiro lançamento"}</td>
                  </tr>
                ))}
                {historico.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "12px" }}>
                      Nenhum histórico registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Informar Motivo da Recusa */}
      {recusandoAluno && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="box"
            style={{
              background: "white",
              width: "100%",
              maxWidth: 480,
              padding: "24px",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Recusar Justificativa</h3>
              <button className="btn ghost small" onClick={() => setRecusandoAluno(null)}>✕</button>
            </div>

            <p style={{ fontSize: "0.9em", color: "#444", marginBottom: 14 }}>
              Aluno: <strong>{recusandoAluno.nome}</strong>
            </p>

            <form onSubmit={handleConfirmarRecusa} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>
                  Motivo da Recusa (obrigatório):
                </label>
                <textarea
                  className="input"
                  rows={3}
                  style={{ width: "100%", padding: "8px" }}
                  placeholder="Ex.: Documento ilegível, atestado fora do prazo regulamentar, etc."
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: 10 }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setRecusandoAluno(null)}
                  disabled={processandoAvaliacao}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  style={{ backgroundColor: "#c62828", borderColor: "#c62828" }}
                  disabled={processandoAvaliacao}
                >
                  {processandoAvaliacao ? "Processando..." : "Confirmar Recusa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualizar Anexo/Atestado */}
      {arquivoModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="box"
            style={{
              background: "white",
              width: "100%",
              maxWidth: 700,
              padding: "20px",
              borderRadius: "8px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Atestado / Documento - {arquivoModal.alunoNome}</h3>
              <button className="btn ghost small" onClick={() => setArquivoModal(null)}>✕</button>
            </div>

            <div style={{ textAlign: "center", minHeight: "200px" }}>
              {arquivoModal.url.startsWith("data:image/") || arquivoModal.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={arquivoModal.url}
                  alt="Atestado"
                  style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 4 }}
                />
              ) : (
                <div>
                  <iframe
                    src={arquivoModal.url}
                    title="Documento anexo"
                    style={{ width: "100%", height: "60vh", border: "1px solid #ccc", borderRadius: 4 }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <a href={arquivoModal.url} target="_blank" rel="noreferrer" className="btn outline small">
                      Abrir em nova aba
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
