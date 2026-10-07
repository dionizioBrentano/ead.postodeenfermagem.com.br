import { useState, useEffect, useCallback } from "react";
import { getAulasTurma, getAula } from "../api/ead";
import { getUserToken } from "../api/client";

interface PlanejamentoAlunoProps {
  turmaId: string;
}

export default function PlanejamentoAluno({ turmaId }: PlanejamentoAlunoProps) {
  const [aulas, setAulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState<any | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mesAtual, setMesAtual] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const carregarAulas = useCallback(async () => {
    if (!turmaId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getUserToken();
      if (!token) return;
      const [y, m] = mesAtual.split("-");
      const de = `${y}-${m}-01`;
      const ate = `${y}-${m}-${new Date(Number(y), Number(m), 0).getDate()}`;

      const list = await getAulasTurma(token, turmaId, de, ate);
      setAulas(list || []);
      setAulaSelecionada(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar o planejamento das aulas.");
    } finally {
      setLoading(false);
    }
  }, [turmaId, mesAtual]);

  useEffect(() => {
    carregarAulas();
  }, [carregarAulas]);

  const irParaMes = (delta: number) => {
    const [y, m] = mesAtual.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMesAtual(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleVerDetalhes = async (aula: any) => {
    if (aulaSelecionada?.id === aula.id) {
      setAulaSelecionada(null);
      return;
    }
    setLoadingDetalhe(true);
    try {
      const token = getUserToken();
      if (!token) return;
      const data = await getAula(token, aula.id);
      setAulaSelecionada(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const formatarMes = (mesStr: string) => {
    const [y, m] = mesStr.split("-").map(Number);
    const nomes = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${nomes[m - 1]} de ${y}`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button type="button" className="btn ghost small" onClick={() => irParaMes(-1)}>
          ← Mês Anterior
        </button>
        <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--ink)" }}>
          {formatarMes(mesAtual)}
        </h3>
        <button type="button" className="btn ghost small" onClick={() => irParaMes(1)}>
          Próximo Mês →
        </button>
      </div>

      {error && <div className="alert err" style={{ marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>Carregando planejamento...</p>
      ) : aulas.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: "20px 0" }}>
          Nenhuma aula agendada para este mês no calendário da turma.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          <table className="heat" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Situação</th>
                <th>Tema / Plano</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {aulas.map((a) => {
                const isSelected = aulaSelecionada?.id === a.id;
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      {a.data ? new Date(a.data + "T12:00:00").toLocaleDateString() : "-"}
                    </td>
                    <td>{a.horario_inicio || "-"}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          color: a.situacao === "realizada" ? "var(--ok)" : a.situacao === "cancelada" ? "var(--no)" : "var(--ink)",
                        }}
                      >
                        {a.situacao}
                      </span>
                    </td>
                    <td>
                      {a.has_plano ? (
                        <span style={{ color: "var(--ok)", fontWeight: 600 }}>✓ Plano Registrado</span>
                      ) : (
                        <span className="muted">Aguardando registro</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn small ${isSelected ? "solid" : "ghost"}`}
                        onClick={() => handleVerDetalhes(a)}
                      >
                        {isSelected ? "Fechar" : "Ver Planejamento"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Detalhes do Plano da Aula Selecionada */}
          {aulaSelecionada && (
            <div className="box" style={{ background: "var(--paper)", border: "1.5px solid var(--accent)", marginTop: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "14px" }}>
                <h4 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Planejamento da Aula: {aulaSelecionada.data ? new Date(aulaSelecionada.data + "T12:00:00").toLocaleDateString() : ""}
                </h4>
                {aulaSelecionada.plano_atualizado_em && (
                  <span className="muted" style={{ fontSize: "12px" }}>
                    Atualizado pelo supervisor em: {new Date(aulaSelecionada.plano_atualizado_em).toLocaleString()}
                  </span>
                )}
              </div>

              {loadingDetalhe ? (
                <p className="muted">Carregando detalhes do plano...</p>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  {aulaSelecionada.plano_tema && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Tema da Aula:</strong>
                      <div style={{ fontWeight: 600, fontSize: "15px" }}>{aulaSelecionada.plano_tema}</div>
                    </div>
                  )}

                  {aulaSelecionada.plano_objetivos && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Objetivos de Aprendizagem:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{aulaSelecionada.plano_objetivos}</div>
                    </div>
                  )}

                  {aulaSelecionada.plano_conteudo && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Conteúdo Programático:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{aulaSelecionada.plano_conteudo}</div>
                    </div>
                  )}

                  {aulaSelecionada.plano_atividades && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Atividades Práticas de Campo:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{aulaSelecionada.plano_atividades}</div>
                    </div>
                  )}

                  {aulaSelecionada.plano_recursos && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Recursos e Materiais Utilizados:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{aulaSelecionada.plano_recursos}</div>
                    </div>
                  )}

                  {aulaSelecionada.plano_avaliacao && (
                    <div>
                      <strong style={{ color: "var(--accent)", display: "block", marginBottom: "2px" }}>Critérios de Avaliação Prática:</strong>
                      <div style={{ whiteSpace: "pre-wrap" }}>{aulaSelecionada.plano_avaliacao}</div>
                    </div>
                  )}

                  {!aulaSelecionada.plano_tema && !aulaSelecionada.plano_conteudo && (
                    <p className="muted">O supervisor ainda não gravou o plano para esta aula.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
