import { useState, useEffect, useRef } from "react";
import { getUserToken } from "../api/client";
import { getMinhaFrequencia, getAula, declararPresenca, enviarJustificativa } from "../api/ead";

export default function MinhaFrequencia({ turmaId }: { turmaId: string }) {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Modal de Plano de Aula
  const [verPlanoAulaId, setVerPlanoAulaId] = useState<string | null>(null);
  const [plano, setPlano] = useState<any>(null);
  const [carregandoPlano, setCarregandoPlano] = useState(false);

  // Modal de Justificativa / Atestado
  const [justificarAula, setJustificarAula] = useState<any | null>(null);
  const [textoJustificativa, setTextoJustificativa] = useState("");
  const [arquivoData, setArquivoData] = useState<string>("");
  const [nomeArquivo, setNomeArquivo] = useState<string>("");
  const [enviandoJustificativa, setEnviandoJustificativa] = useState(false);

  // Ação de Declarar Presença
  const [declarandoAulaId, setDeclarandoAulaId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const carregarFrequencia = async () => {
    try {
      setCarregando(true);
      const token = getUserToken();
      if (!token) return;
      const res = await getMinhaFrequencia(token, turmaId);
      setDados(res);
    } catch (e) {
      console.error(e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarFrequencia();
  }, [turmaId]);

  const handleVerPlano = async (id: string) => {
    setVerPlanoAulaId(id);
    setCarregandoPlano(true);
    const token = getUserToken();
    if (token) {
      try {
        const res = await getAula(token, id);
        setPlano(res);
      } catch (e) {
        console.error(e);
      }
    }
    setCarregandoPlano(false);
  };

  const handleDeclararPresenca = async (aulaId: string) => {
    const token = getUserToken();
    if (!token) return;
    if (!window.confirm("Confirmar sua declaração de presença nesta aula?")) return;

    setDeclarandoAulaId(aulaId);
    try {
      await declararPresenca(token, aulaId);
      alert("Presença declarada com sucesso!");
      await carregarFrequencia();
    } catch (e: any) {
      alert(e.message || "Erro ao declarar presença.");
    } finally {
      setDeclarandoAulaId(null);
    }
  };

  const handleAbrirJustificativa = (aula: any) => {
    setJustificarAula(aula);
    setTextoJustificativa(aula.justificativa || "");
    setArquivoData(aula.justificativa_arquivo || "");
    setNomeArquivo(aula.justificativa_arquivo ? "Arquivo anexado anteriormente" : "");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo selecionado deve ter no máximo 5MB.");
      return;
    }

    setNomeArquivo(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setArquivoData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEnviarJustificativa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificarAula) return;
    const token = getUserToken();
    if (!token) return;

    if (!textoJustificativa.trim() && !arquivoData) {
      alert("Informe o motivo da justificativa ou anexe o atestado/comprovante.");
      return;
    }

    setEnviandoJustificativa(true);
    try {
      await enviarJustificativa(token, justificarAula.aula_id, {
        justificativa: textoJustificativa,
        arquivo: arquivoData || undefined,
      });
      alert("Justificativa enviada com sucesso! Aguarde a validação do supervisor.");
      setJustificarAula(null);
      await carregarFrequencia();
    } catch (e: any) {
      alert(e.message || "Erro ao enviar justificativa.");
    } finally {
      setEnviandoJustificativa(false);
    }
  };

  if (carregando) {
    return (
      <div className="box sec" style={{ padding: "30px 20px", textAlign: "center" }}>
        <p>Carregando frequência...</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="box sec" style={{ padding: "30px 20px", textAlign: "center" }}>
        <p>Não foi possível carregar os dados de frequência da turma.</p>
      </div>
    );
  }

  const resumo = dados.resumo || {};
  const ehEstagio = resumo.eh_estagio;
  const meta = resumo.meta_percentual || (ehEstagio ? 100 : 75);
  const temFaltaSemResolucao = (resumo.faltas_sem_resolucao || 0) > 0;

  return (
    <div className="box sec" style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Minha Frequência</h2>
          <span className="muted" style={{ fontSize: "0.9em" }}>
            Modalidade: <strong>{ehEstagio ? "Estágio Prático" : "Sala de Aula (Teórico)"}</strong> | Meta para Aprovação: <strong>{meta}%</strong>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {resumo.total > 0 && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontWeight: "bold",
                fontSize: "0.85em",
                backgroundColor: resumo.aprovado_frequencia ? "#e8f5e9" : (temFaltaSemResolucao ? "#fff3e0" : "#ffebee"),
                color: resumo.aprovado_frequencia ? "#2e7d32" : (temFaltaSemResolucao ? "#e65100" : "#c62828"),
                border: `1px solid ${resumo.aprovado_frequencia ? "#a5d6a7" : (temFaltaSemResolucao ? "#ffb74d" : "#ef9a9a")}`,
              }}
            >
              {resumo.aprovado_frequencia
                ? "✓ Aprovado por Frequência"
                : (temFaltaSemResolucao ? "⚠ Pendente de Resolução" : "✕ Abaixo da Frequência Mínima")}
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Falta sem Resolução */}
      {temFaltaSemResolucao && (
        <div
          style={{
            backgroundColor: "#fff8e1",
            border: "1px solid #ffe082",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong style={{ color: "#b78103", display: "block" }}>
              Falta sem resolução não fecha!
            </strong>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.9em", color: "#5d4037" }}>
              Você possui <strong>{resumo.faltas_sem_resolucao} falta(s)</strong> sem justificativa aceita nem trabalho de recuperação.
              Para fechamento e aprovação no {ehEstagio ? "estágio (100%)" : "ciclo letivo (75%)"}, envie o atestado médico ou solicite trabalho de recuperação ao supervisor.
            </p>
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div className="box" style={{ padding: "14px", textAlign: "center", background: "#f8f9fa" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2e7d32" }}>{resumo.presencas || 0}</div>
          <div className="muted" style={{ fontSize: "0.85em" }}>Presenças</div>
        </div>
        <div className="box" style={{ padding: "14px", textAlign: "center", background: "#f8f9fa" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#c62828" }}>{resumo.faltas || 0}</div>
          <div className="muted" style={{ fontSize: "0.85em" }}>Faltas</div>
        </div>
        <div className="box" style={{ padding: "14px", textAlign: "center", background: "#f8f9fa" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0277bd" }}>{resumo.faltas_justificadas || 0}</div>
          <div className="muted" style={{ fontSize: "0.85em" }}>Atestados Aceitos</div>
        </div>
        <div className="box" style={{ padding: "14px", textAlign: "center", background: "#f8f9fa" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#6a1b9a" }}>{resumo.recuperacoes || 0}</div>
          <div className="muted" style={{ fontSize: "0.85em" }}>Recuperações</div>
        </div>
        <div className="box" style={{ padding: "14px", textAlign: "center", background: "#f8f9fa" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: resumo.percentual >= meta ? "#2e7d32" : "#c62828" }}>
            {resumo.percentual || 0}%
          </div>
          <div className="muted" style={{ fontSize: "0.85em" }}>Frequência Geral</div>
        </div>
      </div>

      <h3 style={{ marginBottom: "12px" }}>Registro de Aulas e Chamada</h3>
      
      <div style={{ overflowX: "auto" }}>
        <table className="heat" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Situação</th>
              <th>Declaração / Atestado</th>
              <th>Status do Atestado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(dados.aulas || []).map((aula: any, i: number) => {
              const temFalta = aula.situacao === "falta";
              const temDeclaracao = !!aula.presenca_declarada_em;
              const statusJust = aula.justificativa_status;

              return (
                <tr key={i}>
                  <td>
                    <strong>{aula.data ? new Date(aula.data + "T12:00:00").toLocaleDateString() : "-"}</strong>
                  </td>
                  <td>
                    {aula.situacao === "presente" && (
                      <span style={{ color: "#2e7d32", fontWeight: "bold" }}>● Presente</span>
                    )}
                    {aula.situacao === "falta" && (
                      <span style={{ color: "#c62828", fontWeight: "bold" }}>✕ Falta</span>
                    )}
                    {aula.situacao === "falta_justificada" && (
                      <span style={{ color: "#0277bd", fontWeight: "bold" }}>✓ Falta Justificada</span>
                    )}
                    {aula.situacao === "recuperacao" && (
                      <span style={{ color: "#6a1b9a", fontWeight: "bold" }}>★ Recuperação</span>
                    )}
                    {(!aula.situacao || aula.situacao === "prevista") && (
                      <span className="muted">Prevista</span>
                    )}
                  </td>
                  <td>
                    {temDeclaracao && (
                      <div style={{ fontSize: "0.85em", color: "#2e7d32", marginBottom: 4 }}>
                        ✓ Presença declarada ({new Date(aula.presenca_declarada_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </div>
                    )}
                    {aula.justificativa ? (
                      <div style={{ fontSize: "0.9em" }}>
                        <em>"{aula.justificativa}"</em>
                        {aula.justificativa_arquivo && (
                          <div style={{ marginTop: 4 }}>
                            <a
                              href={aula.justificativa_arquivo}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#0277bd", fontSize: "0.85em", textDecoration: "underline" }}
                            >
                              📎 Ver arquivo anexo
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      !temDeclaracao && <span className="muted">-</span>
                    )}
                  </td>
                  <td>
                    {statusJust === "pendente" && (
                      <span style={{ padding: "2px 8px", backgroundColor: "#fff8e1", color: "#b78103", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                        ⏳ Pendente de Análise
                      </span>
                    )}
                    {statusJust === "aceita" && (
                      <span style={{ padding: "2px 8px", backgroundColor: "#e8f5e9", color: "#2e7d32", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                        ✓ Aceita pelo Supervisor
                      </span>
                    )}
                    {statusJust === "recusada" && (
                      <div>
                        <span style={{ padding: "2px 8px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: 4, fontSize: "0.8em", fontWeight: 600 }}>
                          ✕ Recusada
                        </span>
                        {aula.justificativa_recusa_motivo && (
                          <div style={{ fontSize: "0.8em", color: "#c62828", marginTop: 4 }}>
                            <strong>Motivo:</strong> {aula.justificativa_recusa_motivo}
                          </div>
                        )}
                      </div>
                    )}
                    {!statusJust && <span className="muted">-</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {!temDeclaracao && aula.situacao !== "presente" && (
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => handleDeclararPresenca(aula.aula_id)}
                          disabled={declarandoAulaId === aula.aula_id}
                          title="Declarar presença nesta aula"
                        >
                          {declarandoAulaId === aula.aula_id ? "Enviando..." : "Declarar Presença"}
                        </button>
                      )}

                      {(temFalta || statusJust === "recusada" || !statusJust) && (
                        <button
                          type="button"
                          className="btn outline small"
                          onClick={() => handleAbrirJustificativa(aula)}
                        >
                          {aula.justificativa ? "Editar Atestado" : "Enviar Atestado"}
                        </button>
                      )}

                      {aula.aula_id && (
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => handleVerPlano(aula.aula_id)}
                        >
                          Plano
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!dados.aulas || dados.aulas.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                  Nenhum registro de aula lançado nesta turma.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Justificativa / Atestado */}
      {justificarAula && (
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
              maxWidth: 550,
              padding: "24px",
              borderRadius: "8px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Justificativa / Envio de Atestado</h3>
              <button className="btn ghost small" onClick={() => setJustificarAula(null)}>✕</button>
            </div>

            <p style={{ fontSize: "0.9em", color: "#666", marginBottom: 16 }}>
              Aula do dia: <strong>{new Date(justificarAula.data + "T12:00:00").toLocaleDateString()}</strong>
            </p>

            <form onSubmit={handleEnviarJustificativa} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>
                  Motivo da Falta / Justificativa:
                </label>
                <textarea
                  className="input"
                  rows={4}
                  style={{ width: "100%", padding: "8px" }}
                  placeholder="Descreva o motivo da ausência..."
                  value={textoJustificativa}
                  onChange={(e) => setTextoJustificativa(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: "bold" }}>
                  Atestado Médico / Comprovante (PDF ou Imagem):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  style={{ width: "100%" }}
                />
                {nomeArquivo && (
                  <p style={{ fontSize: "0.85em", color: "#2e7d32", marginTop: 6 }}>
                    ✓ Arquivo selecionado: {nomeArquivo}
                  </p>
                )}
              </div>

              {justificarAula.justificativa_recusa_motivo && (
                <div style={{ backgroundColor: "#ffebee", padding: "10px", borderRadius: 4, color: "#c62828", fontSize: "0.85em" }}>
                  <strong>Motivo da recusa anterior:</strong> {justificarAula.justificativa_recusa_motivo}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: 10 }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setJustificarAula(null)}
                  disabled={enviandoJustificativa}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn solid"
                  disabled={enviandoJustificativa}
                >
                  {enviandoJustificativa ? "Enviando..." : "Enviar Justificativa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Plano de Aula */}
      {verPlanoAulaId && (
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
              maxWidth: 600,
              padding: "24px",
              borderRadius: "8px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Plano de Aula</h3>
              <button className="btn ghost small" onClick={() => setVerPlanoAulaId(null)}>✕</button>
            </div>
            {carregandoPlano ? (
              <p>Carregando plano...</p>
            ) : plano ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><strong>Tema:</strong> <p style={{ margin: "4px 0" }}>{plano.tema || "Não informado"}</p></div>
                <div><strong>Objetivos:</strong> <p style={{ margin: "4px 0" }}>{plano.objetivos || "Não informado"}</p></div>
                <div><strong>Conteúdo:</strong> <p style={{ margin: "4px 0" }}>{plano.conteudo || "Não informado"}</p></div>
                <div><strong>Atividades:</strong> <p style={{ margin: "4px 0" }}>{plano.atividades || "Não informado"}</p></div>
                <div><strong>Recursos:</strong> <p style={{ margin: "4px 0" }}>{plano.recursos || "Não informado"}</p></div>
                <div><strong>Avaliação:</strong> <p style={{ margin: "4px 0" }}>{plano.avaliacao || "Não informado"}</p></div>
              </div>
            ) : (
              <p>Não foi possível carregar o plano desta aula.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
