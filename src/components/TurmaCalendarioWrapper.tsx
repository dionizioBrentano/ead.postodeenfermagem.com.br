import { useState, useEffect, useCallback } from "react";
import {
  getCalendarioTurma,
  getAulasTurma,
  getAula,
  addCalendarioTurma,
  deleteCalendarioTurma,
  ratificarCalendarioTurma,
  gerarAulasTurma
} from "../api/ead";
import { getUserToken } from "../api/client";
import CalendarioMensal, { type EventoCalendario, type AulaCalendario } from "./CalendarioMensal";

interface TurmaCalendarioWrapperProps {
  turmaId: string;
  inicioTurma: string;
  fimTurma: string;
  modoGestao?: boolean;
  onCalendarioAlterado?: () => void;
}

export default function TurmaCalendarioWrapper({
  turmaId,
  inicioTurma,
  fimTurma,
  modoGestao = false,
  onCalendarioAlterado,
}: TurmaCalendarioWrapperProps) {
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [aulas, setAulas] = useState<AulaCalendario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [aulaSelecionadaId, setAulaSelecionadaId] = useState<string | null>(null);
  const [detalheAula, setDetalheAula] = useState<any>(null);
  const [loadingPlano, setLoadingPlano] = useState(false);

  // Gestão de Eventos (Supervisor / Administrador)
  const [mostrandoFormNovo, setMostrandoFormNovo] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [ratificando, setRatificando] = useState(false);

  const [novoDataInicio, setNovoDataInicio] = useState("");
  const [novoDataFim, setNovoDataFim] = useState("");
  const [novoTipo, setNovoTipo] = useState<"feriado" | "recesso" | "avaliacao" | "letivo_extra">("recesso");
  const [novoDescricao, setNovoDescricao] = useState("");

  // Mês atual exibido
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const tStart = new Date(inicioTurma + "T12:00:00");
    const tEnd = new Date(fimTurma + "T12:00:00");
    if (now < tStart) return new Date(tStart.getFullYear(), tStart.getMonth(), 1);
    if (now > tEnd) return new Date(tEnd.getFullYear(), tEnd.getMonth(), 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const carregarDados = useCallback(async () => {
    if (!turmaId) return;
    setLoading(true);
    setError(null);
    const token = getUserToken();
    if (!token) return;

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const de = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const ate = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`;

    try {
      const [ev, au] = await Promise.all([
        getCalendarioTurma(token, turmaId),
        getAulasTurma(token, turmaId, de, ate)
      ]);
      setEventos(ev || []);
      setAulas(au || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erro ao carregar o calendário da turma.");
    } finally {
      setLoading(false);
    }
  }, [turmaId, currentDate]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleMudarMes = (offset: number) => {
    setCurrentDate(prev => {
      const nova = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      const dStart = new Date(inicioTurma + "T12:00:00");
      const dEnd = new Date(fimTurma + "T12:00:00");
      const minDate = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
      const maxDate = new Date(dEnd.getFullYear(), dEnd.getMonth(), 1);
      
      if (nova < minDate) return minDate;
      if (nova > maxDate) return maxDate;
      return nova;
    });
    setDataSelecionada(null);
    setAulaSelecionadaId(null);
    setDetalheAula(null);
  };

  const handleVerPlano = async (aulaId: string) => {
    if (aulaSelecionadaId === aulaId) {
      setAulaSelecionadaId(null);
      setDetalheAula(null);
      return;
    }
    setAulaSelecionadaId(aulaId);
    setLoadingPlano(true);
    try {
      const token = getUserToken();
      if (!token) return;
      const data = await getAula(token, aulaId);
      setDetalheAula(data);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar os detalhes do plano de aula.");
    } finally {
      setLoadingPlano(false);
    }
  };

  const handleRatificarCiclo = async () => {
    if (!window.confirm("Deseja ratificar o ciclo regional (1º ao penúltimo dia útil, feriados nacionais e do RS) para esta turma?")) {
      return;
    }
    setRatificando(true);
    setSucessoMsg(null);
    setError(null);
    try {
      const token = getUserToken();
      if (!token) return;
      const res: any = await ratificarCalendarioTurma(token, turmaId);
      setSucessoMsg(`Ciclo regional ratificado com sucesso! ${res?.novos_eventos || 0} novos eventos registrados e aulas atualizadas.`);
      await carregarDados();
      if (onCalendarioAlterado) onCalendarioAlterado();
    } catch (err: any) {
      setError(err?.message || "Erro ao ratificar ciclo regional.");
    } finally {
      setRatificando(false);
    }
  };

  const handleCriarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoEvento(true);
    setSucessoMsg(null);
    setError(null);
    try {
      const token = getUserToken();
      if (!token) return;
      await addCalendarioTurma(token, turmaId, {
        data_inicio: novoDataInicio,
        data_fim: novoDataFim || novoDataInicio,
        tipo: novoTipo,
        descricao: novoDescricao,
      });
      setSucessoMsg("Evento adicionado com sucesso e aulas recalculadas.");
      setNovoDataInicio("");
      setNovoDataFim("");
      setNovoDescricao("");
      setMostrandoFormNovo(false);
      await carregarDados();
      if (onCalendarioAlterado) onCalendarioAlterado();
    } catch (err: any) {
      setError(err?.message || "Erro ao adicionar evento ao calendário.");
    } finally {
      setSalvandoEvento(false);
    }
  };

  const handleExcluirEvento = async (eventoId: string) => {
    if (!window.confirm("Deseja remover este evento do calendário da turma?")) return;
    try {
      const token = getUserToken();
      if (!token) return;
      await deleteCalendarioTurma(token, turmaId, eventoId);
      setSucessoMsg("Evento removido com sucesso.");
      await carregarDados();
      if (onCalendarioAlterado) onCalendarioAlterado();
    } catch (err: any) {
      setError(err?.message || "Erro ao remover evento.");
    }
  };

  const handleRecalcularAulas = async () => {
    try {
      const token = getUserToken();
      if (!token) return;
      const res: any = await gerarAulasTurma(token, turmaId);
      setSucessoMsg(`Aulas recalculadas: ${res?.aulas_previstas || 0} previstas, ${res?.aulas_canceladas || 0} canceladas.`);
      await carregarDados();
      if (onCalendarioAlterado) onCalendarioAlterado();
    } catch (err: any) {
      setError(err?.message || "Erro ao recalcular aulas.");
    }
  };

  // Filtrar aulas se houver dia selecionado
  const aulasExibidas = dataSelecionada
    ? aulas.filter(a => a.data === dataSelecionada)
    : aulas;

  const eventosTurmaEspecificos = eventos.filter(e => e.origem === 'turma');

  return (
    <div className="turma-calendario">
      {error && <div className="alert err" style={{ marginBottom: "16px" }}>{error}</div>}
      {sucessoMsg && <div className="alert info" style={{ marginBottom: "16px" }}>{sucessoMsg}</div>}

      {/* Barra de Ações de Gestão (Supervisor / Administrador) */}
      {modoGestao && (
        <div className="box" style={{ marginBottom: "20px", background: "var(--bg)", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={handleRatificarCiclo}
              disabled={ratificando}
            >
              {ratificando ? "Ratificando..." : "✓ Ratificar Ciclo Regional"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setMostrandoFormNovo(!mostrandoFormNovo)}
            >
              {mostrandoFormNovo ? "Fechar Formulário" : "+ Novo Dia Não Letivo / Evento"}
            </button>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={handleRecalcularAulas}
            title="Recalcula as aulas previstas conforme o calendário"
          >
            ↻ Sincronizar Aulas
          </button>
        </div>
      )}

      {/* Formulário de Novo Evento */}
      {modoGestao && mostrandoFormNovo && (
        <div className="box" style={{ marginBottom: "20px", border: "1.5px solid var(--accent)" }}>
          <h4 style={{ margin: "0 0 12px 0" }}>Adicionar Evento ao Calendário da Turma</h4>
          <form onSubmit={handleCriarEvento} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "140px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Data Início</label>
                <input
                  type="date"
                  value={novoDataInicio}
                  onChange={(e) => setNovoDataInicio(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: "140px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Data Fim (opcional)</label>
                <input
                  type="date"
                  value={novoDataFim}
                  onChange={(e) => setNovoDataFim(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Tipo</label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as any)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "9px", border: "1px solid var(--line)", background: "var(--bg)" }}
                >
                  <option value="recesso">Recesso / Dia Não Letivo</option>
                  <option value="feriado">Feriado Municipal/Local</option>
                  <option value="avaliacao">Avaliação / Prova</option>
                  <option value="letivo_extra">Dia Letivo Extra</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "4px" }}>Descrição do Evento</label>
              <input
                type="text"
                placeholder="Ex.: Recesso local, Visita técnica, etc."
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn solid" disabled={salvandoEvento}>
                {salvandoEvento ? "Salvando..." : "Salvar no Calendário"}
              </button>
              <button type="button" className="btn ghost" onClick={() => setMostrandoFormNovo(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", margin: "10px 0", color: "var(--muted)" }}>Carregando mês...</div>}

      {/* Calendário Mensal */}
      <CalendarioMensal
        ano={currentDate.getFullYear()}
        mes={currentDate.getMonth()}
        eventos={eventos}
        aulas={aulas}
        dataSelecionada={dataSelecionada}
        onMudarMes={handleMudarMes}
        onSelecionarDia={(dataStr) => {
          setDataSelecionada(dataSelecionada === dataStr ? null : dataStr);
        }}
      />

      {/* Lista de Eventos Específicos da Turma (se em modo gestão) */}
      {modoGestao && eventosTurmaEspecificos.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h4>Alterações e Eventos Específicos desta Turma</h4>
          <table className="heat" style={{ width: "100%", textAlign: "left", marginTop: "8px" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {eventosTurmaEspecificos.map(ev => (
                <tr key={ev.id || ev.data}>
                  <td>{ev.data}</td>
                  <td><span style={{ textTransform: "capitalize" }}>{ev.tipo.replace('_', ' ')}</span></td>
                  <td>{ev.descricao}</td>
                  <td>
                    {ev.id && (
                      <button className="btn ghost small" onClick={() => handleExcluirEvento(ev.id!)}>
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Listagem de Aulas e Detalhamento do Plano */}
      <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>
            {dataSelecionada ? `Aulas em ${dataSelecionada}` : "Aulas do Mês"}
          </h3>
          {dataSelecionada && (
            <button className="btn ghost small" onClick={() => setDataSelecionada(null)}>
              Ver todas do mês
            </button>
          )}
        </div>

        {aulasExibidas.length === 0 ? (
          <p className="muted">Nenhuma aula agendada para este período no calendário.</p>
        ) : (
          <table className="heat" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Situação</th>
                <th>Plano de Aula</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {aulasExibidas.map(a => (
                <tr key={a.id}>
                  <td>{a.data ? new Date(a.data + "T12:00:00").toLocaleDateString() : "-"}</td>
                  <td>{a.horario_inicio || "-"}</td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: a.situacao === "realizada" ? "var(--ok)" : a.situacao === "cancelada" ? "var(--no)" : "var(--ink)"
                    }}>
                      {a.situacao}
                    </span>
                  </td>
                  <td>{a.has_plano ? "✓ Registrado" : "Não informado"}</td>
                  <td>
                    <button className="btn small ghost" onClick={() => handleVerPlano(a.id)}>
                      {aulaSelecionadaId === a.id ? "Ocultar Plano" : "Ver Plano"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal/Card de Detalhe do Plano de Aula */}
        {aulaSelecionadaId && (
          <div className="box" style={{ marginTop: "20px", background: "var(--paper)", border: "1.5px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--line)", paddingBottom: "8px" }}>
              <h4 style={{ margin: 0 }}>
                Plano de Aula - {detalheAula?.data || ""}
              </h4>
              {detalheAula?.plano_atualizado_em && (
                <span className="muted" style={{ fontSize: "12.5px" }}>
                  Atualizado em: {new Date(detalheAula.plano_atualizado_em).toLocaleString()}
                </span>
              )}
            </div>

            {loadingPlano ? (
              <p className="muted">Carregando planejamento da aula...</p>
            ) : detalheAula ? (
              <div style={{ display: "grid", gap: "14px", fontSize: "14.5px" }}>
                {detalheAula.plano_tema && (
                  <div>
                    <strong>Tema:</strong>
                    <div style={{ marginTop: "4px", color: "var(--ink)", fontWeight: 600 }}>{detalheAula.plano_tema}</div>
                  </div>
                )}
                {detalheAula.plano_objetivos && (
                  <div>
                    <strong>Objetivos:</strong>
                    <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{detalheAula.plano_objetivos}</div>
                  </div>
                )}
                {detalheAula.plano_conteudo && (
                  <div>
                    <strong>Conteúdo Programático:</strong>
                    <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{detalheAula.plano_conteudo}</div>
                  </div>
                )}
                {detalheAula.plano_atividades && (
                  <div>
                    <strong>Atividades Práticas:</strong>
                    <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{detalheAula.plano_atividades}</div>
                  </div>
                )}
                {detalheAula.plano_recursos && (
                  <div>
                    <strong>Recursos:</strong>
                    <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{detalheAula.plano_recursos}</div>
                  </div>
                )}
                {detalheAula.plano_avaliacao && (
                  <div>
                    <strong>Avaliação:</strong>
                    <div style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{detalheAula.plano_avaliacao}</div>
                  </div>
                )}
                {!detalheAula.plano_tema && !detalheAula.plano_conteudo && (
                  <p className="muted">Nenhum plano detalhado foi gravado pelo supervisor para esta aula ainda.</p>
                )}
              </div>
            ) : (
              <p className="muted">Detalhes indisponíveis.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
