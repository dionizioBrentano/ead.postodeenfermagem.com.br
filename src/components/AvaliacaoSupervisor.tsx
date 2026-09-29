import { useEffect, useState } from "react";
import { GERAIS, ATIVIDADES } from "../data/itens";
import { getAvaliacoes, saveAvaliacao } from "../api/ead";

export default function AvaliacaoSupervisor({ alunoId, isStudent }: { alunoId: string, isStudent: boolean }) {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alunoId) return;
    setLoading(true);
    getAvaliacoes(alunoId, "supervisor")
      .then((res: any) => setAvaliacoes(res?.data || res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [alunoId]);

  const renderList = (items: { texto: string }[], prefix: string) => (
    <div className="items">
      {items.map((item, idx) => {
        const chave = `${prefix}.${idx}`;
        const aval = avaliacoes.find(a => a.item_chave === chave);

        return (
          <div key={chave} className="item" style={{ flexDirection: "column", alignItems: "flex-start", padding: "12px", border: "1px solid #ccc", marginBottom: "8px", borderRadius: "6px" }}>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              <span className="n" style={{ marginRight: 8, display: "inline-block", background: "#eee", padding: "2px 6px", borderRadius: 4 }}>{String(idx + 1).padStart(2, "0")}</span>
              {item.texto}
            </div>
            
            <div style={{ marginTop: "4px", fontSize: "0.95em", color: aval ? "#0066cc" : "#666" }}>
              {aval ? (
                <span>
                  <strong>Nota:</strong> {aval.nota ?? "-"} {aval.nao_praticou && "(Não praticou)"}
                  {aval.comentario && <span> | <strong>Obs:</strong> {aval.comentario}</span>}
                </span>
              ) : (
                <span>ainda sem avaliação</span>
              )}
            </div>

            {!isStudent && selectedItem !== chave && (
              <button className="btn small ghost" onClick={() => setSelectedItem(chave)} style={{ marginTop: "10px" }}>
                Avaliar item
              </button>
            )}

            {selectedItem === chave && !isStudent && (
               <SupervisorForm 
                 alunoId={alunoId} 
                 itemChave={chave} 
                 initial={aval} 
                 onSaved={(newAval: any) => {
                   setAvaliacoes(prev => [...prev.filter(p => p.item_chave !== chave), newAval]);
                   setSelectedItem(null);
                 }} 
                 onCancel={() => setSelectedItem(null)}
               />
            )}
          </div>
        );
      })}
    </div>
  );

  if (loading) return <p>Carregando avaliações...</p>;

  return (
    <div className="box sec narrow" style={{ margin: "20px auto" }}>
      <h2 style={{ fontSize: 21 }}>Aspectos Gerais</h2>
      {renderList(GERAIS, "gerais")}
      <h2 style={{ fontSize: 21, marginTop: 24 }}>Atividades</h2>
      {renderList(ATIVIDADES, "atividades")}
    </div>
  );
}

function SupervisorForm({ alunoId, itemChave, initial, onSaved, onCancel }: any) {
  const [nota, setNota] = useState(initial?.nota ?? "");
  const [naoPraticou, setNaoPraticou] = useState(initial?.nao_praticou ?? false);
  const [comentario, setComentario] = useState(initial?.comentario ?? "");
  const [etapa, setEtapa] = useState(initial?.etapa ?? "");
  const [momento, setMomento] = useState(initial?.momento ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        aluno_user_id: alunoId,
        item_chave: itemChave,
        papel: "supervisor" as const,
        nota: nota === "" ? null : Number(nota),
        nao_praticou: naoPraticou,
        comentario,
        etapa,
        momento
      };
      await saveAvaliacao(payload);
      onSaved(payload);
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação. Não foi possível salvar a avaliação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f5f5f5", padding: "16px", marginTop: "12px", borderRadius: "8px", width: "100%", boxSizing: "border-box" }}>
      <div className="fields">
        <div className="field">
          <label className="l">Nota (0-10):</label>
          <input type="number" min="0" max="10" value={nota} onChange={e => setNota(e.target.value)} disabled={naoPraticou} />
        </div>
        <div className="field" style={{ display: "flex", alignItems: "center" }}>
          <label style={{ cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={naoPraticou} onChange={e => setNaoPraticou(e.target.checked)} /> 
            <span>Não praticou</span>
          </label>
        </div>
        <div className="field full">
          <label className="l">Comentário / Nome do avaliador (se aplicável):</label>
          <input value={comentario} onChange={e => setComentario(e.target.value)} />
        </div>
        <div className="field">
          <label className="l">Etapa:</label>
          <input value={etapa} onChange={e => setEtapa(e.target.value)} />
        </div>
        <div className="field">
          <label className="l">Momento:</label>
          <input value={momento} onChange={e => setMomento(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
        <button className="btn" onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        <button className="btn ghost" onClick={onCancel} disabled={saving}>Cancelar</button>
      </div>
    </div>
  );
}

