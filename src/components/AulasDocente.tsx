import { useState, useEffect } from "react";
import { getUserToken } from "../api/client";
import {
  getAulasTurma,
  updatePlanoAula,
  getChamada,
  updateChamada,
  getChamadaHistorico,
  avaliarJustificativa,
} from "../api/ead";

export default function AulasDocente({ turmaId }: { turmaId: string }) {
  const [aulas, setAulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAula, setSelectedAula] = useState<any>(null);
  const [abaDetalhe, setAbaDetalhe] = useState<"plano" | "chamada">("chamada");

  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const loadAulas = async () => {
    setLoading(true);
    try {
      const token = getUserToken();
      if (!token) return;
      const y = mesAtual.split("-")[0];
      const m = mesAtual.split("-")[1];
      const de = `${y}-${m}-01`;
      const ate = new Date(Number(y), Number(m), 0).toISOString().split("T")[0];

      const list = await getAulasTurma(token, turmaId, de, ate);
      setAulas(list);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar aulas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (turmaId) {
      loadAulas();
      setSelectedAula(null);
    }
  }, [turmaId, mesAtual]);

  const irParaMes = (delta: number) => {
    const d = new Date(`${mesAtual}-01T00:00:00`);
    d.setMonth(d.getMonth() + delta);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  if (selectedAula) {
    if (selectedAula.situacao === "cancelada") {
      return (
        <div>
          <button className="btn ghost small" onClick={() => setSelectedAula(null)}>
            ← Voltar para lista
          </button>
          <div style={{ marginTop: 20, textAlign: "center", color: "#666" }}>
            <p>Aula cancelada no calendário</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <button
          className="btn ghost small"
          onClick={() => {
            setSelectedAula(null);
            loadAulas();
          }}
        >
          ← Voltar para lista de aulas
        </button>
        <h3 style={{ marginTop: 15 }}>
          {selectedAula.data ? new Date(selectedAula.data + "T12:00:00").toLocaleDateString() : ""} {selectedAula.conteudo ? `- ${selectedAula.conteudo}` : ""}
        </h3>

        <nav className="nav" role="tablist" style={{ marginTop: 20 }}>
          <button
            role="tab"
            aria-selected={abaDetalhe === "chamada"}
            onClick={() => setAbaDetalhe("chamada")}
          >
            Chamada e Justificativas
          </button>
          <button
            role="tab"
            aria-selected={abaDetalhe === "plano"}
            onClick={() => setAbaDetalhe("plano")}
          >
            Plano de Aula
          </button>
        </nav>

        <div style={{ marginTop: 20 }}>
          {abaDetalhe === "plano" ? (
            <PlanoAulaForm aula={selectedAula} onSaved={loadAulas} />
          ) : (
            <ChamadaForm aula={selectedAula} onSaved={loadAulas} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="btn outline small" onClick={() => irParaMes(-1)}>
          Mês Anterior
        </button>
        <span style={{ fontWeight: "bold" }}>{mesAtual}</span>
        <button className="btn outline small" onClick={() => irParaMes(1)}>
          Próximo Mês
        </button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : aulas.length === 0 ? (
        <p>Nenhuma aula encontrada neste mês.</p>
      ) : (
        <table className="heat" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Situação</th>
              <th>Chamada</th>
              <th>Plano</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {aulas.map((a) => (
              <tr key={a.id}>
                <td>{a.data ? new Date(a.data + "T12:00:00").toLocaleDateString() : "-"}</td>
                <td>{a.situacao}</td>
                <td>
                  {a.has_chamada ? (
                    <span style={{ color: "#2e7d32", fontWeight: "bold" }}>✓ Realizada</span>
                  ) : (
                    <span className="muted">Pendente</span>
                  )}
                </td>
                <td>{a.has_plano ? "Sim" : "Não"}</td>
                <td>
                  <button className="btn ghost small" onClick={() => setSelectedAula(a)}>
                    Lançar Chamada / Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PlanoAulaForm({ aula, onSaved }: { aula: any; onSaved: () => void }) {
  const [form, setForm] = useState({
    tema: aula.plano_tema || "",
    objetivos: aula.plano_objetivos || "",
    conteudo: aula.plano_conteudo || "",
    atividades: aula.plano_atividades || "",
    recursos: aula.plano_recursos || "",
    avaliacao: aula.plano_avaliacao || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getUserToken();
      if (!token) return;
      await updatePlanoAula(token, aula.id, form);
      alert("Plano de aula salvo com sucesso!");
      onSaved();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar plano de aula.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: 600 }}>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Tema</label>
        <input name="tema" value={form.tema} onChange={handleChange} required className="input" style={{ width: "100%" }} />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Objetivos</label>
        <textarea name="objetivos" value={form.objetivos} onChange={handleChange} className="input" rows={3} style={{ width: "100%" }} />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Conteúdo</label>
        <textarea name="conteudo" value={form.conteudo} onChange={handleChange} className="input" rows={3} style={{ width: "100%" }} />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Atividades</label>
        <textarea name="atividades" value={form.atividades} onChange={handleChange} className="input" rows={3} style={{ width: "100%" }} />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Recursos</label>
        <textarea name="recursos" value={form.recursos} onChange={handleChange} className="input" rows={2} style={{ width: "100%" }} />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: 5 }}>Avaliação</label>
        <textarea name="avaliacao" value={form.avaliacao} onChange={handleChange} className="input" rows={2} style={{ width: "100%" }} />
      </div>
      <button type="submit" className="btn solid" disabled={saving}>
        {saving ? "Salvando..." : "Salvar Plano"}
      </button>
    </form>
  );
}

function ChamadaForm({ aula, onSaved }: { aula: any; onSaved: () => void }) {
  const [registros, setRegistros] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chamadaRealizada, setChamadaRealizada] = useState(false);

  // Modal para recusar justificativa
  const [recusandoAluno, setRecusandoAluno] = useState<any | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [processandoAvaliacao, setProcessandoAvaliacao] = useState(false);

  // Modal para visualizar anexo/atestado
  const [arquivoModal, setArquivoModal] = useState<{ alunoNome: string; url: string } | null>(null);

  const carregarChamada = async () => {
    try {
      const token = getUserToken();
      if (!token) return;
      const cham = (await getChamada(token, aula.id)) as any;
      const hist = await getChamadaHistorico(token, aula.id);
      setRegistros(cham?.registros || []);
      setChamadaRealizada(cham?.chamada_realizada || false);
      setHistorico(hist || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChamada();
  }, [aula.id]);

  const handleStatusChange = (index: number, status: string) => {
    const newRegs = [...registros];
    newRegs[index].status = status;
    if (status === "presente" || status === "recuperacao") {
      newRegs[index].justificativa_status = null;
    } else if (status === "falta_justificada") {
      newRegs[index].justificativa_status = "aceita";
    }
    setRegistros(newRegs);
  };

  const todosPresentes = () => {
    setRegistros(
      registros.map((r) => ({
        ...r,
        status: "presente",
        justificativa_status: null,
      }))
    );
  };

  const handleAceitarJustificativa = async (reg: any, index: number) => {
    const token = getUserToken();
    if (!token) return;
    setProcessandoAvaliacao(true);
    try {
      await avaliarJustificativa(token, aula.id, reg.aluno_user_id, {
        decisao: "aceitar",
      });
      alert(`Justificativa de ${reg.aluno_nome} aceita com sucesso.`);
      const newRegs = [...registros];
      newRegs[index].status = "falta_justificada";
      newRegs[index].justificativa_status = "aceita";
      newRegs[index].justificativa_recusa_motivo = null;
      setRegistros(newRegs);
    } catch (e: any) {
      alert(e.message || "Erro ao aceitar justificativa.");
    } finally {
      setProcessandoAvaliacao(false);
    }
  };

  const handleAbrirRecusa = (reg: any, index: number) => {
    setRecusandoAluno({ ...reg, index });
    setMotivoRecusa("");
  };

  const handleConfirmarRecusa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recusandoAluno) return;
    if (!motivoRecusa.trim()) {
      alert("Informe o motivo da recusa.");
      return;
    }

    const token = getUserToken();
    if (!token) return;

    setProcessandoAvaliacao(true);
    try {
      await avaliarJustificativa(token, aula.id, recusandoAluno.aluno_user_id, {
        decisao: "recusar",
        motivo_recusa: motivoRecusa.trim(),
      });
      alert(`Justificativa de ${recusandoAluno.aluno_nome} foi recusada.`);
      
      const newRegs = [...registros];
      newRegs[recusandoAluno.index].status = "falta";
      newRegs[recusandoAluno.index].justificativa_status = "recusada";
      newRegs[recusandoAluno.index].justificativa_recusa_motivo = motivoRecusa.trim();
      setRegistros(newRegs);

      setRecusandoAluno(null);
      setMotivoRecusa("");
    } catch (e: any) {
      alert(e.message || "Erro ao recusar justificativa.");
    } finally {
      setProcessandoAvaliacao(false);
    }
  };

  const handleSave = async () => {
    let motivo = undefined;
    if (chamadaRealizada) {
      motivo = prompt("A chamada desta aula já havia sido realizada. Qual o motivo da alteração?");
      if (motivo === null) return; // Cancelado
      if (motivo.trim() === "") {
        alert("Informe o motivo da alteração.");
        return;
      }
    }

    setSaving(true);
    try {
      const token = getUserToken();
      if (!token) return;
      await updateChamada(token, aula.id, { registros, motivo });
      alert("Chamada salva com sucesso!");
      onSaved();
      await carregarChamada();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar chamada.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando chamada...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15, flexWrap: "wrap", gap: 10 }}>
        <button type="button" className="btn outline" onClick={todosPresentes}>
          ✓ Marcar Todos como Presentes
        </button>
        <span className="muted" style={{ fontSize: "0.9em" }}>
          Regras: <strong>75%</strong> Teórico | <strong>100%</strong> Estágio (presença, atestado aceito ou recuperação).
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: 20 }}>
        {registros.map((reg, i) => {
          const temAtestado = !!reg.justificativa || !!reg.justificativa_arquivo;
          const statusJust = reg.justificativa_status;

          return (
            <div
              key={reg.aluno_user_id}
              style={{
                padding: "16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: reg.status === "falta" && statusJust !== "aceita" ? "#fff9f8" : "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                <div>
                  <strong style={{ fontSize: "1.05em" }}>{reg.aluno_nome}</strong>
                  {reg.presenca_declarada_em && (
                    <span
                      style={{
                        marginLeft: 10,
                        fontSize: "0.8em",
                        backgroundColor: "#e8f5e9",
                        color: "#2e7d32",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Presença declarada pelo aluno
                    </span>
                  )}
                </div>
              </div>

              {/* Botões de Seleção de Status */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: 10 }}>
                <button
                  type="button"
                  className={`btn ${reg.status === "presente" ? "solid" : "ghost"}`}
                  style={{ flex: 1, minWidth: "110px", minHeight: "38px" }}
                  onClick={() => handleStatusChange(i, "presente")}
                >
                  Presente
                </button>
                <button
                  type="button"
                  className={`btn ${reg.status === "falta" ? "solid" : "ghost"}`}
                  style={{ flex: 1, minWidth: "110px", minHeight: "38px" }}
                  onClick={() => handleStatusChange(i, "falta")}
                >
                  Falta
                </button>
                <button
                  type="button"
                  className={`btn ${reg.status === "falta_justificada" ? "solid" : "ghost"}`}
                  style={{ flex: 1, minWidth: "130px", minHeight: "38px" }}
                  onClick={() => handleStatusChange(i, "falta_justificada")}
                >
                  Falta Justificada
                </button>
                <button
                  type="button"
                  className={`btn ${reg.status === "recuperacao" ? "solid" : "ghost"}`}
                  style={{ flex: 1, minWidth: "130px", minHeight: "38px" }}
                  onClick={() => handleStatusChange(i, "recuperacao")}
                >
                  Recuperação
                </button>
              </div>

              {/* Bloco de Justificativa / Atestado */}
              {temAtestado && (
                <div
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    marginTop: "10px",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                    <span style={{ fontWeight: "bold", fontSize: "0.9em" }}>Justificativa do Aluno:</span>
                    <div>
                      {statusJust === "pendente" && (
                        <span style={{ padding: "2px 8px", backgroundColor: "#fff8e1", color: "#b78103", borderRadius: 4, fontSize: "0.8em", fontWeight: "bold" }}>
                          ⏳ Aguardando Avaliação
                        </span>
                      )}
                      {statusJust === "aceita" && (
                        <span style={{ padding: "2px 8px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: 4, fontSize: "0.8em", fontWeight: "bold" }}>
                          ✓ Atestado Aceito
                        </span>
                      )}
                      {statusJust === "recusada" && (
                        <span style={{ padding: "2px 8px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: 4, fontSize: "0.8em", fontWeight: "bold" }}>
                          ✕ Atestado Recusado
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ margin: "4px 0 8px 0", fontSize: "0.9em", color: "#333" }}>
                    {reg.justificativa || "Sem texto informado."}
                  </p>

                  {reg.justificativa_arquivo && (
                    <div style={{ marginBottom: 8 }}>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => setArquivoModal({ alunoNome: reg.aluno_nome, url: reg.justificativa_arquivo })}
                      >
                        📎 Ver Documento / Atestado Anexo
                      </button>
                    </div>
                  )}

                  {reg.justificativa_recusa_motivo && (
                    <div style={{ fontSize: "0.85em", color: "#c62828", marginTop: 4 }}>
                      <strong>Motivo da recusa:</strong> {reg.justificativa_recusa_motivo}
                    </div>
                  )}

                  {/* Ações de Aceitar / Recusar Justificativa */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button
                      type="button"
                      className="btn outline small"
                      style={{ color: "#2e7d32", borderColor: "#a5d6a7" }}
                      disabled={processandoAvaliacao || statusJust === "aceita"}
                      onClick={() => handleAceitarJustificativa(reg, i)}
                    >
                      ✓ Aceitar Atestado
                    </button>
                    <button
                      type="button"
                      className="btn outline small"
                      style={{ color: "#c62828", borderColor: "#ef9a9a" }}
                      disabled={processandoAvaliacao}
                      onClick={() => handleAbrirRecusa(reg, i)}
                    >
                      ✕ Recusar (Informe o Motivo)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="btn solid" onClick={handleSave} disabled={saving} style={{ minWidth: "160px" }}>
        {saving ? "Salvando..." : "Salvar Chamada"}
      </button>

      {historico.length > 0 && (
        <div style={{ marginTop: 30, borderTop: "1px solid #ccc", paddingTop: 20 }}>
          <h4>Histórico de Alterações</h4>
          <ul style={{ paddingLeft: 20 }}>
            {historico.map((h, i) => (
              <li key={i} style={{ marginBottom: 5, fontSize: "0.9em", color: "#555" }}>
                <strong>{new Date(h.created_at || h.data).toLocaleString()}</strong> - {h.motivo || "Sem motivo informado"}
                <br />
                <small>Por: {h.autor_nome}</small>
              </li>
            ))}
          </ul>
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
              Aluno: <strong>{recusandoAluno.aluno_nome}</strong>
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
                  placeholder="Ex.: Atestado ilegível, data incompatível com o dia letivo, etc."
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
