import { useState, useEffect } from "react";
import { request, getUserToken } from "../api/client";

type SupervisorInfo = {
  id: string;
  name: string;
  email: string;
  council_type?: string;
  council_number?: string;
  status_council: "pending" | "approved" | "rejected";
  created_at?: string;
};

export default function PainelAdmin() {
  const [supervisores, setSupervisores] = useState<SupervisorInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega ao montar a tela
  useEffect(() => {
    carregarSupervisores();
  }, []);

  async function carregarSupervisores() {
    setLoading(true);
    setError(null);
    try {
      const data = await request("GET", "/admin/supervisors", { bearer: getUserToken() });
      setSupervisores(data as SupervisorInfo[]);
    } catch (err) {
      setError("Erro ao carregar supervisores.");
    } finally {
      setLoading(false);
    }
  }

  async function aprovar(id: string) {
    if (!confirm("Confirmar a aprovação deste supervisor? Ele terá acesso para avaliar alunos.")) return;
    
    // Atualiza otimisticamente a interface
    setSupervisores(prev => prev.map(s => s.id === id ? { ...s, status_council: "approved" } : s));
    
    try {
      await request("POST", `/admin/supervisors/${id}/approve`, { bearer: getUserToken() });
    } catch (err) {
      alert("Erro ao aprovar no servidor.");
      // Reverter estado
      carregarSupervisores();
    }
  }

  async function revogar(id: string) {
    if (!confirm("Revogar o acesso deste supervisor?")) return;
    setSupervisores(prev => prev.map(s => s.id === id ? { ...s, status_council: "rejected" } : s));
    
    try {
      await request("POST", `/admin/supervisors/${id}/revoke`, { bearer: getUserToken() });
    } catch (err) {
      alert("Erro ao revogar.");
      carregarSupervisores();
    }
  }

  return (
    <div className="box">
      <h2>Painel de Administração</h2>
      <p className="muted" style={{ marginBottom: "20px" }}>
        Gerenciamento e liberação de Supervisores de Estágio no EAD.
      </p>

      {error && <div className="alert err">{error}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0 }}>Supervisores Cadastrados</h3>
        <button className="btn small ghost" onClick={carregarSupervisores} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar Lista"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "10px 5px" }}>Nome / E-mail</th>
              <th style={{ padding: "10px 5px" }}>Conselho</th>
              <th style={{ padding: "10px 5px" }}>Status</th>
              <th style={{ padding: "10px 5px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {supervisores.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  {loading ? "Carregando..." : "Nenhum supervisor encontrado."}
                </td>
              </tr>
            ) : (
              supervisores.map(sup => (
                <tr key={sup.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "10px 5px" }}>
                    <div style={{ fontWeight: "bold" }}>{sup.name}</div>
                    <div className="muted" style={{ fontSize: "0.85em" }}>{sup.email}</div>
                  </td>
                  <td style={{ padding: "10px 5px" }}>
                    {sup.council_type ? `${sup.council_type} ${sup.council_number || ""}` : <span className="muted">Não informado</span>}
                  </td>
                  <td style={{ padding: "10px 5px" }}>
                    {sup.status_council === "pending" && <span style={{ color: "#f57c00", fontWeight: "bold" }}>Pendente</span>}
                    {sup.status_council === "approved" && <span style={{ color: "#388e3c", fontWeight: "bold" }}>Aprovado</span>}
                    {sup.status_council === "rejected" && <span style={{ color: "#d32f2f", fontWeight: "bold" }}>Revogado</span>}
                  </td>
                  <td style={{ padding: "10px 5px", textAlign: "right" }}>
                    {sup.status_council !== "approved" && (
                      <button className="btn small" style={{ marginRight: "5px" }} onClick={() => aprovar(sup.id)}>
                        Aprovar
                      </button>
                    )}
                    {sup.status_council === "approved" && (
                      <button className="btn small ghost" onClick={() => revogar(sup.id)}>
                        Revogar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
