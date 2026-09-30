import { useState } from "react";
import { createRegistroProfissional, getUserToken } from "../api/client";

export default function RegistroProfissionalForm({ onSalvo, onPular, hidePular = false }: { onSalvo: () => void; onPular?: () => void; hidePular?: boolean }) {
  const [conselho, setConselho] = useState("");
  const [uf, setUf] = useState("");
  const [numero, setNumero] = useState("");
  const [categoria, setCategoria] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conselho || !uf || !numero.trim() || !categoria) {
      setErro("Preencha todos os campos.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const token = getUserToken();
      if (!token) throw new Error("Não autenticado.");
      await createRegistroProfissional(token, { conselho, uf, numero: numero.trim(), categoria });
      onSalvo();
    } catch (err: any) {
      if (err.status === 403 && err.body?.code === "confirmation_required") {
        const { navegar } = await import("../lib/rota");
        navegar("/confirmar");
      } else if (err.status === 422 && err.body?.code === "registro_em_uso") {
        setErro("Este registro profissional já está em uso.");
      } else {
        setErro(err.message || "Erro ao salvar registro.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} style={{ textAlign: "left" }}>
      {erro && <div className="alert err">{erro}</div>}
      <div className="field">
        <label className="l">Conselho</label>
        <select value={conselho} onChange={e => setConselho(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="COREN">COREN</option>
          <option value="CRM">CRM</option>
          <option value="CRF">CRF</option>
          <option value="CREFITO">CREFITO</option>
          <option value="CRP">CRP</option>
          <option value="CRN">CRN</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div className="two">
        <div className="field">
          <label className="l">UF</label>
          <select value={uf} onChange={e => setUf(e.target.value)}>
            <option value="">Estado</option>
            {UFS.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="l">Número do Registro</label>
          <input type="text" value={numero} onChange={e => setNumero(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="l">Categoria</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">Selecione...</option>
          <option value="enfermeiro">Enfermeiro(a)</option>
          <option value="tecnico_enfermagem">Técnico(a) em Enfermagem</option>
          <option value="auxiliar_enfermagem">Auxiliar de Enfermagem</option>
          <option value="obstetriz">Obstetriz</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <button type="submit" className="btn" disabled={enviando}>
          {enviando ? "Salvando..." : "Salvar Registro"}
        </button>
        {!hidePular && onPular && (
          <button type="button" className="btn ghost" onClick={onPular} disabled={enviando}>
            Informar depois
          </button>
        )}
      </div>
    </form>
  );
}
