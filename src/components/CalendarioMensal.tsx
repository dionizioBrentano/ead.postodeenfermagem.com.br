import { useMemo } from "react";

export type EventoCalendario = {
  data: string; // YYYY-MM-DD
  tipo: 'feriado' | 'recesso' | 'avaliacao' | 'letivo_extra' | string;
  descricao?: string;
};

export type AulaCalendario = {
  data: string; // YYYY-MM-DD
  situacao?: string;
};

interface CalendarioMensalProps {
  ano: number;
  mes: number; // 0-11
  eventos: EventoCalendario[];
  aulas: AulaCalendario[];
  onMudarMes: (offset: number) => void;
}

const mesesNomes = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const coresEventos: Record<string, string> = {
  feriado: "#ef4444",      // red
  recesso: "#f97316",      // orange
  avaliacao: "#3b82f6",    // blue
  letivo_extra: "#10b981", // green
};

function formatYMD(y: number, m: number, d: number) {
  const mStr = String(m + 1).padStart(2, '0');
  const dStr = String(d).padStart(2, '0');
  return `${y}-${mStr}-${dStr}`;
}

export default function CalendarioMensal({ ano, mes, eventos, aulas, onMudarMes }: CalendarioMensalProps) {
  const dias = useMemo(() => {
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);
    const diasArray = [];
    
    const diaSemanaPrimeiro = primeiroDiaMes.getDay();
    for (let i = 0; i < diaSemanaPrimeiro; i++) {
      diasArray.push(null);
    }
    
    for (let i = 1; i <= ultimoDiaMes.getDate(); i++) {
      const dataStr = formatYMD(ano, mes, i);
      const evs = eventos?.filter(e => e.data.startsWith(dataStr)) || [];
      const aulasDia = aulas?.filter(a => a.data.startsWith(dataStr)) || [];
      diasArray.push({ dia: i, dataStr, eventos: evs, aulas: aulasDia });
    }
    return diasArray;
  }, [ano, mes, eventos, aulas]);

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button type="button" className="btn ghost small" onClick={() => onMudarMes(-1)}>Anterior</button>
        <h3 style={{ margin: 0 }}>{mesesNomes[mes]} {ano}</h3>
        <button type="button" className="btn ghost small" onClick={() => onMudarMes(1)}>Próximo</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center", fontWeight: "bold", marginBottom: "4px" }}>
        {diasSemana.map(d => <div key={d} style={{ padding: "8px 0", background: "#f3f4f6", borderRadius: "4px", fontSize: "14px", color: "#4b5563" }}>{d}</div>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {dias.map((d, i) => {
          if (!d) return <div key={i} style={{ minHeight: "80px", background: "#f9fafb", borderRadius: "4px" }} />;
          
          return (
            <div key={i} style={{ minHeight: "80px", padding: "4px", border: "1px solid #e5e7eb", borderRadius: "4px", display: "flex", flexDirection: "column", background: "#fff" }}>
              <div style={{ fontWeight: "bold", textAlign: "right", color: "#374151", fontSize: "14px" }}>{d.dia}</div>
              <div style={{ flex: 1, fontSize: "12px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                {d.aulas.length > 0 && (
                  <div style={{ background: "#e0e7ff", color: "#3730a3", padding: "2px 4px", borderRadius: "2px", textAlign: "center", fontWeight: "bold" }}>
                    {d.aulas.length} {d.aulas.length === 1 ? 'aula' : 'aulas'}
                  </div>
                )}
                {d.eventos.map((ev, idx) => (
                  <div key={idx} style={{ background: coresEventos[ev.tipo] || "#9ca3af", color: "#fff", padding: "2px 4px", borderRadius: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={ev.descricao}>
                    {ev.tipo.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "12px", background: "#e0e7ff", borderRadius: "2px" }}></div>
          <span style={{ color: "#374151" }}>Dias letivos (aulas)</span>
        </div>
        {Object.entries(coresEventos).map(([tipo, cor]) => (
          <div key={tipo} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", background: cor, borderRadius: "2px" }}></div>
            <span style={{ textTransform: "capitalize", color: "#374151" }}>{tipo.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
