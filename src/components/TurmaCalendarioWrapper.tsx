import { useState, useEffect } from "react";
import { getCalendarioTurma, getAulasTurma, getAula } from "../api/ead";
import { getUserToken } from "../api/client";
import CalendarioMensal from "./CalendarioMensal";

export default function TurmaCalendarioWrapper({ turmaId, inicioTurma, fimTurma }: { turmaId: string, inicioTurma: string, fimTurma: string }) {
  const [eventos, setEventos] = useState<any[]>([]);
  const [aulas, setAulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aulaSelecionadaId, setAulaSelecionadaId] = useState<string | null>(null);
  const [planoAula, setPlanoAula] = useState<string>("");
  const [loadingPlano, setLoadingPlano] = useState(false);
  
  // Current month being viewed
  const [currentDate, setCurrentDate] = useState(() => {
    // Start by showing the month of the current day, or the beginning of the turma if it's in the future
    const now = new Date();
    const tStart = new Date(inicioTurma + "T12:00:00");
    const tEnd = new Date(fimTurma + "T12:00:00");
    if (now < tStart) return new Date(tStart.getFullYear(), tStart.getMonth(), 1);
    if (now > tEnd) return new Date(tEnd.getFullYear(), tEnd.getMonth(), 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!turmaId) return;
    setLoading(true);
    const token = getUserToken();
    if (!token) return;

    // We fetch events for the whole cycle (getCalendarioTurma returns all events)
    // We fetch aulas for the current month
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const de = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const ate = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`;

    Promise.all([
      getCalendarioTurma(token, turmaId),
      getAulasTurma(token, turmaId, de, ate)
    ]).then(([ev, au]) => {
      setEventos(ev);
      setAulas(au);
    }).catch(err => {
      console.error(err);
      setError("Erro ao carregar o calendário.");
    }).finally(() => {
      setLoading(false);
    });
  }, [turmaId, currentDate]);

  const handleMudarMes = (offset: number) => {
    setCurrentDate(prev => {
      const nova = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      // Validate boundaries against inicioTurma and fimTurma
      const dStart = new Date(inicioTurma + "T12:00:00");
      const dEnd = new Date(fimTurma + "T12:00:00");
      const minDate = new Date(dStart.getFullYear(), dStart.getMonth(), 1);
      const maxDate = new Date(dEnd.getFullYear(), dEnd.getMonth(), 1);
      
      if (nova < minDate) return minDate;
      if (nova > maxDate) return maxDate;
      return nova;
    });
  };

  const handleVerPlano = async (aulaId: string) => {
    if (aulaSelecionadaId === aulaId) {
      setAulaSelecionadaId(null);
      return;
    }
    setAulaSelecionadaId(aulaId);
    setLoadingPlano(true);
    try {
      const token = getUserToken();
      if (!token) return;
      const data = (await getAula(token, aulaId)) as any;
      setPlanoAula(data?.plano_aula || "Nenhum plano registrado.");
    } catch (e) {
      setPlanoAula("Erro ao carregar o plano de aula.");
    } finally {
      setLoadingPlano(false);
    }
  };

  return (
    <div className="turma-calendario">
      {error && <div className="alert err">{error}</div>}
      {loading && <div style={{ textAlign: "center", margin: "10px 0" }}>Carregando mês...</div>}
      <CalendarioMensal 
        ano={currentDate.getFullYear()} 
        mes={currentDate.getMonth()}
        eventos={eventos} 
        aulas={aulas}
        onMudarMes={handleMudarMes}
      />

      <div style={{ marginTop: "30px" }}>
        <h3>Aulas do Mês</h3>
        {aulas.length === 0 ? (
          <p>Nenhuma aula agendada para este mês.</p>
        ) : (
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
                    <button className="btn small ghost" onClick={() => handleVerPlano(a.id)}>
                      {aulaSelecionadaId === a.id ? "Ocultar Plano" : "Ver Plano"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {aulaSelecionadaId && (
          <div className="box" style={{ marginTop: "20px", background: "#f9fafb" }}>
            <h4 style={{ marginTop: 0 }}>Plano de Aula</h4>
            {loadingPlano ? <p>Carregando...</p> : <div style={{ whiteSpace: "pre-wrap" }}>{planoAula}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
