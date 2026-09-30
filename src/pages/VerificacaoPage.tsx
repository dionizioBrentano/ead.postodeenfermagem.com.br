import { useState, useEffect } from "react";
import { setupMfa, verifyMfa } from "../api/client";

export default function VerificacaoPage({ token, mfaEnabled, onConcluido, onSair }: { token: string; mfaEnabled: boolean; onConcluido: () => void; onSair: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qr_code_svg: string } | null>(null);

  useEffect(() => {
    if (!mfaEnabled) {
      setupMfa(token).then(setSetupData).catch(err => setErro(err.message || "Erro ao gerar QR Code."));
    }
  }, [mfaEnabled, token]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await verifyMfa(token, codigo.trim());
      onConcluido();
    } catch (err: any) {
      setErro(err.status === 401 ? "Código inválido." : (err.message || "Erro ao verificar código."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Verificação em duas etapas</h2>
        {!mfaEnabled ? (
          <>
            <p className="muted">Configure a verificação em duas etapas usando seu aplicativo autenticador.</p>
            {setupData ? (
              <div style={{ margin: "20px 0" }}>
                <img src={`data:image/svg+xml;base64,${setupData.qr_code_svg}`} alt="QR Code" style={{ maxWidth: 200 }} />
                <p style={{ marginTop: 10, fontSize: "0.9em" }}>Chave: <code>{setupData.secret}</code></p>
              </div>
            ) : (
              <p>Carregando QR Code...</p>
            )}
          </>
        ) : (
          <p className="muted">Digite o código do seu aplicativo autenticador para continuar.</p>
        )}

        <form onSubmit={enviar}>
          <div className="field">
            <input 
              type="text" 
              placeholder="Código de 6 dígitos" 
              value={codigo} 
              onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {erro && <div className="alert err">{erro}</div>}
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <button className="btn" type="submit" disabled={enviando || (!mfaEnabled && !setupData)}>
              {enviando ? "Verificando..." : "Confirmar"}
            </button>
            <button type="button" className="btn ghost" onClick={onSair}>Sair</button>
          </div>
        </form>
      </div>
    </main>
  );
}
