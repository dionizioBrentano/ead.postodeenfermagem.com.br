import { useState, useEffect } from "react";
import { adminGetTurmas, getFrequenciaTurma, getAulasTurma, getChamada, getChamadaHistorico } from "../api/ead";
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

  const token = getUserToken();
  const canCorrigir = atribuicoes.includes("frequencia.corrigir");

  useEffect(() => {
    if (!token) return;
    adminGetTurmas(token).then(setTurmas).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!turmaId || !token) {
      setFrequencias([]);
      return;
    }
    setLoading(true);
    getFrequenciaTurma(token, turmaId)
      .then(setFrequencias)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [turmaId, token]);

  const loadAulas = async () => {
    if (!turmaId || !token) return;
    setView("aulas");
    setLoading(true);
    const t = turmas.find(x => x.id === turmaId);
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
      setChamada((data && data.chamada) ? data.chamada : []);
      const hist = await getChamadaHistorico(token, id);
      setHistorico(hist || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="box">
      <h2>Frequência das Turmas</h2>
      <div style={{ marginBottom: 20 }}>
        <label>Selecione a Turma: </label>
        <select value={turmaId} onChange={e => { setTurmaId(e.target.value); setView("frequencia"); setAulaId(""); }} style={{ padding: "5px" }}>
          <option value="">-- Selecione --</option>
          {turmas.map(t => (
            <option key={t.id} value={t.id}>{t.nome}</option>
          ))}
        </select>
        {turmaId && view === "frequencia" && (
          <button className="btn small" style={{ marginLeft: 10 }} onClick={loadAulas}>Ver Aulas da Turma</button>
        )}
        {view === "aulas" && (
          <button className="btn ghost small" style={{ marginLeft: 10 }} onClick={() => setView("frequencia")}>Voltar para Frequência</button>
        )}
      </div>

      {loading && <p>Carregando...</p>}

      {!loading && turmaId && view === "frequencia" && (
        <table className="heat" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Presenças</th>
              <th>Faltas</th>
              <th>Faltas Just.</th>
              <th>Frequência (%)</th>
            </tr>
          </thead>
          <tbody>
            {frequencias.map(f => (
              <tr key={f.aluno_id || f.id || Math.random()}>
                <td>{f.nome || f.usuario?.name || "Aluno"}</td>
                <td>{f.presencas}</td>
                <td>{f.faltas}</td>
                <td>{f.faltas_justificadas}</td>
                <td>{f.percentual}%</td>
              </tr>
            ))}
            {frequencias.length === 0 && (
              <tr><td colSpan={5}>Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {!loading && turmaId && view === "aulas" && !aulaId && (
        <table className="heat" style={{ width: "100%", textAlign: "left" }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {aulas.map(a => (
              <tr key={a.id}>
                <td>{a.data ? new Date(a.data + "T12:00:00").toLocaleDateString() : "-"}</td>
                <td>{a.situacao}</td>
                <td>
                  <button className="btn ghost small" onClick={() => loadChamada(a.id)}>Ver Chamada</button>
                </td>
              </tr>
            ))}
            {aulas.length === 0 && (
              <tr><td colSpan={3}>Nenhuma aula encontrada neste período.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {!loading && view === "aulas" && aulaId && (
        <div>
          <button className="btn ghost small" style={{ marginBottom: 15 }} onClick={() => setAulaId("")}>&larr; Voltar para Aulas</button>
          <h3>Chamada da Aula</h3>
          {canCorrigir && <p className="muted" style={{ fontSize: 12 }}>Como você possui <b>frequencia.corrigir</b>, a edição manual poderá ser habilitada aqui no futuro.</p>}
          <table className="heat" style={{ width: "100%", textAlign: "left" }}>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Situação</th>
                <th>Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {chamada.map((c: any) => (
                <tr key={c.user_id}>
                  <td>{c.nome || c.user_id}</td>
                  <td>{c.situacao}</td>
                  <td>{c.justificativa || "-"}</td>
                </tr>
              ))}
              {chamada.length === 0 && (
                <tr><td colSpan={3}>Nenhuma chamada registrada.</td></tr>
              )}
            </tbody>
          </table>

          <h4 style={{ marginTop: 20 }}>Histórico de Alterações</h4>
          <table className="heat" style={{ width: "100%", textAlign: "left", fontSize: "0.9em" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Usuário</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((h: any, idx) => (
                <tr key={idx}>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                  <td>{h.ator?.name || h.ator_id || "Sistema"}</td>
                  <td>{h.descricao || JSON.stringify(h.dados)}</td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr><td colSpan={3}>Nenhum histórico disponível.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
