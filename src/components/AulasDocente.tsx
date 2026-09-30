import { useState, useEffect } from "react";
import { getUserToken } from "../api/client";
import { getAulasTurma, updatePlanoAula, getChamada, updateChamada, getChamadaHistorico } from "../api/ead";

export default function AulasDocente({ turmaId }: { turmaId: string }) {
  const [aulas, setAulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAula, setSelectedAula] = useState<any>(null);
  const [abaDetalhe, setAbaDetalhe] = useState<"plano" | "chamada">("plano");

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
      const ate = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];
      
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
          <button className="btn ghost small" onClick={() => setSelectedAula(null)}>← Voltar para lista</button>
          <div style={{ marginTop: 20, textAlign: "center", color: "#666" }}>
            <p>Aula cancelada no calendário</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <button className="btn ghost small" onClick={() => {
          setSelectedAula(null);
          loadAulas();
        }}>← Voltar para lista</button>
        <h3 style={{ marginTop: 15 }}>{selectedAula.data} {selectedAula.conteudo ? `- ${selectedAula.conteudo}` : ""}</h3>
        
        <nav className="nav" role="tablist" style={{ marginTop: 20 }}>
          <button role="tab" aria-selected={abaDetalhe === "plano"} onClick={() => setAbaDetalhe("plano")}>
            Plano de Aula
          </button>
          <button role="tab" aria-selected={abaDetalhe === "chamada"} onClick={() => setAbaDetalhe("chamada")}>
            Chamada
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
        <button className="btn outline small" onClick={() => irParaMes(-1)}>Mês Anterior</button>
        <span style={{ fontWeight: "bold" }}>{mesAtual}</span>
        <button className="btn outline small" onClick={() => irParaMes(1)}>Próximo Mês</button>
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
              <th>Plano</th>
              <th>Chamada</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {aulas.map(a => (
              <tr key={a.id}>
                <td>{a.data}</td>
                <td>{a.situacao}</td>
                <td>{a.has_plano ? "Sim" : "Não"}</td>
                <td>{a.has_chamada ? "Sim" : "Não"}</td>
                <td>
                  <button className="btn ghost small" onClick={() => setSelectedAula(a)}>Abrir</button>
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
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
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

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const token = getUserToken();
        if (!token) return;
        const cham = (await getChamada(token, aula.id)) as any;
        const hist = await getChamadaHistorico(token, aula.id);
        if (!active) return;
        setRegistros(cham?.registros || []);
        setChamadaRealizada(cham?.chamada_realizada || false);
        setHistorico(hist || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [aula.id]);

  const handleStatusChange = (index: number, status: string) => {
    const newRegs = [...registros];
    newRegs[index].status = status;
    if (status !== "falta_justificada") {
      newRegs[index].justificativa = "";
    }
    setRegistros(newRegs);
  };

  const handleJustificativaChange = (index: number, val: string) => {
    const newRegs = [...registros];
    newRegs[index].justificativa = val;
    setRegistros(newRegs);
  };

  const todosPresentes = () => {
    setRegistros(registros.map(r => ({ ...r, status: "presente", justificativa: "" })));
  };

  const handleSave = async () => {
    let motivo = undefined;
    if (chamadaRealizada) {
      motivo = prompt("A chamada já havia sido realizada. Qual o motivo da alteração?");
      if (motivo === null) return; // Cancelado
    }

    setSaving(true);
    try {
      const token = getUserToken();
      if (!token) return;
      await updateChamada(token, aula.id, { registros, motivo });
      alert("Chamada salva com sucesso!");
      onSaved();
      
      const cham = (await getChamada(token, aula.id)) as any;
      const hist = await getChamadaHistorico(token, aula.id);
      setRegistros(cham?.registros || []);
      setChamadaRealizada(cham?.chamada_realizada || false);
      setHistorico(hist || []);
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
      <div style={{ marginBottom: 15 }}>
        <button type="button" className="btn outline" onClick={todosPresentes}>
          Todos Presentes
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: 20 }}>
        {registros.map((reg, i) => (
          <div key={reg.aluno_user_id} style={{ padding: 15, border: "1px solid #ddd", borderRadius: 8 }}>
            <div style={{ fontWeight: "bold", marginBottom: 10 }}>{reg.aluno_nome}</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn ${reg.status === "presente" ? "solid" : "ghost"}`}
                style={{ minHeight: "44px", flex: 1 }}
                onClick={() => handleStatusChange(i, "presente")}
              >
                Presente
              </button>
              <button
                type="button"
                className={`btn ${reg.status === "falta" ? "solid" : "ghost"}`}
                style={{ minHeight: "44px", flex: 1 }}
                onClick={() => handleStatusChange(i, "falta")}
              >
                Falta
              </button>
              <button
                type="button"
                className={`btn ${reg.status === "falta_justificada" ? "solid" : "ghost"}`}
                style={{ minHeight: "44px", flex: 1 }}
                onClick={() => handleStatusChange(i, "falta_justificada")}
              >
                Falta justif.
              </button>
            </div>
            {reg.status === "falta_justificada" && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Justificativa..."
                  className="input"
                  style={{ width: "100%" }}
                  value={reg.justificativa || ""}
                  onChange={(e) => handleJustificativaChange(i, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn solid" onClick={handleSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar Chamada"}
      </button>

      {historico.length > 0 && (
        <div style={{ marginTop: 30, borderTop: "1px solid #ccc", paddingTop: 20 }}>
          <h4>Histórico de Alterações</h4>
          <ul style={{ paddingLeft: 20 }}>
            {historico.map((h, i) => (
              <li key={i} style={{ marginBottom: 5, fontSize: "0.9em", color: "#555" }}>
                <strong>{new Date(h.created_at || h.data).toLocaleString()}</strong> - {h.motivo || "Sem motivo"}<br/>
                <small>Por: {h.autor_nome}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
