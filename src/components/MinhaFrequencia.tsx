import { useState, useEffect } from "react";
import { getUserToken } from "../api/client";
import { getMinhaFrequencia, getAula } from "../api/ead";

export default function MinhaFrequencia({ turmaId }: { turmaId: string }) {
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [verPlanoAulaId, setVerPlanoAulaId] = useState<string | null>(null);
  const [plano, setPlano] = useState<any>(null);
  const [carregandoPlano, setCarregandoPlano] = useState(false);

  const handleVerPlano = async (id: string) => {
    setVerPlanoAulaId(id);
    setCarregandoPlano(true);
    const token = getUserToken();
    if (token) {
      try {
        const res = await getAula(token, id);
        setPlano(res);
      } catch (e) {
        console.error(e);
      }
    }
    setCarregandoPlano(false);
  };


  useEffect(() => {
    async function load() {
      try {
        setCarregando(true);
        const token = getUserToken();
        if (!token) return;
        const res = await getMinhaFrequencia(token, turmaId);
        setDados(res);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    load();
  }, [turmaId]);

  if (carregando) return <div className="box sec" style={{ padding: "20px" }}><p>Carregando frequência...</p></div>;
  if (!dados) return <div className="box sec" style={{ padding: "20px" }}><p>Erro ao carregar frequência.</p></div>;

  return (
    <div className="box sec" style={{ padding: "20px" }}>
      <h2 style={{ marginTop: 0 }}>Minha Frequência</h2>
      
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div className="box" style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{dados.resumo?.presencas || 0}</div>
          <div className="muted">Presenças</div>
        </div>
        <div className="box" style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{dados.resumo?.faltas || 0}</div>
          <div className="muted">Faltas</div>
        </div>
        <div className="box" style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{dados.resumo?.faltas_justificadas || 0}</div>
          <div className="muted">Faltas Justificadas</div>
        </div>
        <div className="box" style={{ flex: 1, minWidth: "120px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{dados.resumo?.percentual || 0}%</div>
          <div className="muted">Frequência</div>
        </div>
      </div>

      <h3>Aulas</h3>
      <table className="heat" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Situação</th>
            <th>Justificativa</th>
            <th>Plano</th>
          </tr>
        </thead>
        <tbody>
          {(dados.aulas || []).map((aula: any, i: number) => (
            <tr key={i}>
              <td>{aula.data ? new Date(aula.data + "T12:00:00").toLocaleDateString() : "-"}</td>
              <td>{aula.situacao || "-"}</td>
              <td>{aula.justificativa || "-"}</td>
              <td>
                {aula.aula_id ? <button className="btn ghost small" onClick={() => handleVerPlano(aula.aula_id)}>Ver plano</button> : "-"}
              </td>
            </tr>
          ))}
          {(!dados.aulas || dados.aulas.length === 0) && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>Nenhum registro encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>

      {verPlanoAulaId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="box" style={{ background: "white", width: "90%", maxWidth: 600, padding: 20, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h2>Plano de Aula</h2>
              <button className="btn ghost small" onClick={() => setVerPlanoAulaId(null)}>Fechar</button>
            </div>
            {carregandoPlano ? <p>Carregando plano...</p> : plano ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><strong>Tema:</strong> <p>{plano.tema || "Não informado"}</p></div>
                <div><strong>Objetivos:</strong> <p>{plano.objetivos || "Não informado"}</p></div>
                <div><strong>Conteúdo:</strong> <p>{plano.conteudo || "Não informado"}</p></div>
                <div><strong>Atividades:</strong> <p>{plano.atividades || "Não informado"}</p></div>
                <div><strong>Recursos:</strong> <p>{plano.recursos || "Não informado"}</p></div>
                <div><strong>Avaliação:</strong> <p>{plano.avaliacao || "Não informado"}</p></div>
              </div>
            ) : <p>Não foi possível carregar o plano desta aula.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
