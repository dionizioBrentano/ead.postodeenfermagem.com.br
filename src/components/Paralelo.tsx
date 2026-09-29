import { useEffect, useState } from "react";
import { GERAIS, ATIVIDADES } from "../data/itens";
import { getComparacao } from "../api/ead";

export default function Paralelo({ alunoId }: { alunoId: string }) {
  const [comparacao, setComparacao] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) return;
    setLoading(true);
    getComparacao(alunoId)
      .then((res: any) => setComparacao(res?.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [alunoId]);

  const renderList = (items: { texto: string }[], prefix: string) => (
    <div className="items">
      {items.map((item, idx) => {
        const chave = `${prefix}.${idx}`;
        const comp = comparacao.find(c => c.item_chave === chave);

        return (
          <div key={chave} className="item" style={{ flexDirection: "column", alignItems: "flex-start", padding: "12px", border: "1px solid #ccc", marginBottom: "8px", borderRadius: "6px" }}>
            <div style={{ fontWeight: 600, marginBottom: "8px" }}>
              <span className="n" style={{ marginRight: 8, display: "inline-block", background: "#eee", padding: "2px 6px", borderRadius: 4 }}>{String(idx + 1).padStart(2, "0")}</span>
              {item.texto}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%", fontSize: "0.95em" }}>
              <div style={{ background: "#f8f9fa", padding: "10px", borderRadius: "4px" }}>
                <div style={{ fontSize: "0.85em", textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Nota Aluno</div>
                <div style={{ fontWeight: "bold", color: comp?.nota_aluno != null ? "#333" : "#999" }}>
                  {comp?.nota_aluno ?? "Sem nota"}
                </div>
              </div>
              <div style={{ background: "#f0f7ff", padding: "10px", borderRadius: "4px" }}>
                <div style={{ fontSize: "0.85em", textTransform: "uppercase", color: "#666", marginBottom: "4px" }}>Nota Supervisor</div>
                <div style={{ fontWeight: "bold", color: comp?.nota_supervisor != null ? "#0066cc" : "#999" }}>
                  {comp?.nota_supervisor ?? "aguardando o supervisor"}
                </div>
                {comp?.comentario_supervisor && <div style={{ marginTop: "4px", fontSize: "0.9em", color: "#555" }}>{comp.comentario_supervisor}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) return <p>Carregando comparação...</p>;

  return (
    <div className="box sec narrow" style={{ margin: "20px auto" }}>
      <h2 style={{ fontSize: 21 }}>Comparação: Aluno x Supervisor</h2>
      <h3 style={{ fontSize: 18, marginTop: 24 }}>Aspectos Gerais</h3>
      {renderList(GERAIS, "gerais")}
      <h3 style={{ fontSize: 18, marginTop: 24 }}>Atividades</h3>
      {renderList(ATIVIDADES, "atividades")}
    </div>
  );
}

