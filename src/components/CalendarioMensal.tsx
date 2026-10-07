import { useMemo } from "react";

export type EventoCalendario = {
  id?: string;
  data: string; // YYYY-MM-DD
  tipo: 'feriado' | 'recesso' | 'avaliacao' | 'letivo_extra' | string;
  descricao?: string;
  origem?: 'turma' | 'organizacao';
};

export type AulaCalendario = {
  id: string;
  data: string; // YYYY-MM-DD
  situacao?: string;
  horario_inicio?: string | null;
  duracao_minutos?: number;
  has_plano?: boolean;
};

interface CalendarioMensalProps {
  ano: number;
  mes: number; // 0-11
  eventos: EventoCalendario[];
  aulas: AulaCalendario[];
  dataSelecionada?: string | null;
  onMudarMes: (offset: number) => void;
  onSelecionarDia?: (dataStr: string) => void;
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

export default function CalendarioMensal({
  ano,
  mes,
  eventos,
  aulas,
  dataSelecionada,
  onMudarMes,
  onSelecionarDia,
}: CalendarioMensalProps) {
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
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Controles de Navegação de Mês */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <button type="button" className="btn ghost small" onClick={() => onMudarMes(-1)}>
          ← Mês Anterior
        </button>
        <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--ink)" }}>
          {mesesNomes[mes]} {ano}
        </h3>
        <button type="button" className="btn ghost small" onClick={() => onMudarMes(1)}>
          Próximo Mês →
        </button>
      </div>

      {/* Cabeçalho dos Dias da Semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center", fontWeight: 700, marginBottom: "6px" }}>
        {diasSemana.map(d => (
          <div key={d} style={{ padding: "8px 0", background: "var(--bg)", borderRadius: "6px", fontSize: "13.5px", color: "var(--muted)", border: "1px solid var(--line)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
        {dias.map((d, i) => {
          if (!d) {
            return <div key={i} style={{ minHeight: "88px", background: "var(--bg)", borderRadius: "8px", opacity: 0.35 }} />;
          }

          const isSelected = dataSelecionada === d.dataStr;
          const temAula = d.aulas.length > 0;
          const temFeriado = d.eventos.some(e => e.tipo === "feriado");
          const temRecesso = d.eventos.some(e => e.tipo === "recesso");

          let bgCard = "var(--paper)";
          if (isSelected) bgCard = "var(--c1s)";
          else if (temFeriado) bgCard = "rgba(239, 68, 68, 0.04)";
          else if (temRecesso) bgCard = "rgba(249, 115, 22, 0.04)";

          return (
            <div
              key={i}
              onClick={() => onSelecionarDia && onSelecionarDia(d.dataStr)}
              style={{
                minHeight: "88px",
                padding: "6px",
                border: isSelected ? "2px solid var(--accent)" : "1px solid var(--line)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                background: bgCard,
                cursor: onSelecionarDia ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontWeight: 700, textAlign: "right", color: isSelected ? "var(--accent)" : "var(--ink)", fontSize: "14px" }}>
                {d.dia}
              </div>

              <div style={{ flex: 1, fontSize: "11.5px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "3px" }}>
                {temAula && (
                  <div
                    style={{
                      background: "#e0e7ff",
                      color: "#3730a3",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                  >
                    {d.aulas.length} {d.aulas.length === 1 ? 'aula' : 'aulas'}
                  </div>
                )}
                {d.eventos.map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: coresEventos[ev.tipo] || "#9ca3af",
                      color: "#fff",
                      padding: "2px 5px",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontSize: "10.5px",
                      fontWeight: 600,
                    }}
                    title={`${ev.tipo.toUpperCase()}: ${ev.descricao || ""}`}
                  >
                    {ev.descricao || ev.tipo.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda de Cores */}
      <div style={{ marginTop: "1.25rem", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12.5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#e0e7ff", border: "1px solid #c7d2fe", borderRadius: "3px" }}></div>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>Aulas previstas</span>
        </div>
        {Object.entries(coresEventos).map(([tipo, cor]) => (
          <div key={tipo} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "12px", height: "12px", background: cor, borderRadius: "3px" }}></div>
            <span style={{ textTransform: "capitalize", color: "var(--ink)", fontWeight: 500 }}>
              {tipo === "feriado" ? "Feriados (Nacional/RS)" : tipo === "recesso" ? "Recesso / Não letivo" : tipo.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
