import { useState } from "react";
import { createMembership } from "../api/client";
import RegistroProfissionalForm from "../components/RegistroProfissionalForm";

export default function ParticiparPage({ token, onParticipou, onSair }: { token: string; onParticipou: () => void; onSair: () => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"escolha" | "registro">("escolha");

  const participar = async (papel: "aluno" | "docente") => {
    setEnviando(true);
    setErro(null);
    try {
      await createMembership(token, papel);
      if (papel === "docente") {
        setEtapa("registro");
      } else {
        onParticipou();
      }
    } catch (err: any) {
      setErro(err.message || "Erro ao criar vínculo.");
    } finally {
      setEnviando(false);
    }
  };

  if (etapa === "registro") {
    return (
      <main className="page auth">
        <div className="auth-card box" style={{ textAlign: "center" }}>
          <h2>Registro Profissional</h2>
          <p className="muted" style={{ marginBottom: 15 }}>
            Como docente, informe seu registro no conselho para agilizar sua aprovação.
          </p>
          <RegistroProfissionalForm onSalvo={onParticipou} onPular={onParticipou} />
        </div>
      </main>
    );
  }

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Bem-vindo(a) ao EAD</h2>
        <p className="muted">Escolha como você deseja acessar a plataforma.</p>
        
        {erro && <div className="alert err">{erro}</div>}
        
        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <button className="btn" onClick={() => participar("aluno")} disabled={enviando}>
            Sou aluno
          </button>
          <button className="btn ghost" onClick={() => participar("docente")} disabled={enviando}>
            Sou docente
          </button>
        </div>
        
        <div style={{ marginTop: 24 }}>
          <button className="btn ghost small" onClick={onSair}>Sair</button>
        </div>
      </div>
    </main>
  );
}
