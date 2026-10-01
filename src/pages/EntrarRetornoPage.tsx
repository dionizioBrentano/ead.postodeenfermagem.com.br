import { useEffect, useRef, useState } from "react";
import { saveSession } from "../api/client";
import { concluirLogin, iniciarLogin } from "../lib/loginCentral";

/** Volta do login central: troca o código pelo acesso e segue para a página de origem. */
export default function EntrarRetornoPage({ onEntrou }: { onEntrou: (destino: string) => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    concluirLogin("/sso/trocar")
      .then(({ resposta, destino }) => {
        saveSession(resposta.access_token, resposta.user ?? null);
        onEntrou(destino);
      })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : "Não foi possível entrar."));
  }, [onEntrou]);

  return (
    <main className="page auth">
      <div className="auth-card" style={{ textAlign: "center" }}>
        {erro ? (
          <div className="box" style={{ display: "grid", gap: 12 }}>
            <div className="alert err" role="alert">{erro}</div>
            <button className="btn" onClick={() => void iniciarLogin({ destino: "/participar" })}>Tentar de novo</button>
          </div>
        ) : (
          <p className="muted">Entrando…</p>
        )}
      </div>
    </main>
  );
}
