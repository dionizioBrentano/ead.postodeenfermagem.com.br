import { useState, useEffect } from "react";
import { getInvitation, acceptInvitation, obj } from "../api/client";
import { navegar } from "../lib/rota";
import { iniciarLogin } from "../auth/loginCentral";

export default function ConvitePage({ token, tokenAuth, onEntrou, onSair }: { token: string; tokenAuth: string | null; onEntrou: () => void; onSair: () => void }) {
  const [convite, setConvite] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro("Token de convite ausente.");
      return;
    }
    getInvitation(token)
      .then(res => setConvite(obj(res)))
      .catch((err: any) => {
        setErro(err.status === 404 ? "Convite não encontrado." : err.status === 410 ? "Convite expirado." : err.message);
      });
  }, [token]);

  const aceitar = async () => {
    if (!tokenAuth) {
      void iniciarLogin({ destino: `/convite?token=${encodeURIComponent(token)}` });
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await acceptInvitation(tokenAuth, token);
      onEntrou();
    } catch (err: any) {
      if (err.status === 403 && obj(err.body)?.code === "convite_outro_email") {
        setErro(`Este convite foi enviado para o e-mail ${convite?.email_mascarado}. Entre com essa conta ou peça um novo convite.`);
      } else {
        setErro(err.message || "Erro ao aceitar convite.");
      }
    } finally {
      setEnviando(false);
    }
  };

  if (!convite && !erro) {
    return <main className="page auth"><div className="auth-card box" style={{ textAlign: "center" }}>Carregando...</div></main>;
  }

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Convite para {convite?.organizacao?.nome || "organização"}</h2>
        {erro ? (
          <div className="alert err">{erro}</div>
        ) : (
          <p className="muted">
            Você foi convidado(a) para participar como <b>{convite?.papel}</b>.
          </p>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          {!erro && (
            <button className="btn" onClick={aceitar} disabled={enviando}>
              {tokenAuth ? (enviando ? "Aceitando..." : "Aceitar convite") : "Entrar ou Criar Cadastro"}
            </button>
          )}
          {tokenAuth && <button className="btn ghost" onClick={onSair}>Sair</button>}
          {!tokenAuth && erro && <button className="btn ghost" onClick={() => navegar("/")}>Ir para início</button>}
        </div>
      </div>
    </main>
  );
}
