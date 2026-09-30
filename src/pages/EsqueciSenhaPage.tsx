import { useState } from "react";
import { forgotPassword, resetPassword } from "../api/client";

export default function EsqueciSenhaPage({ onSair }: { onSair: () => void }) {
  const [etapa, setEtapa] = useState<"identificar" | "redefinir" | "sucesso">("identificar");
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviarIdentificador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await forgotPassword(identificador) as any;
      setMensagem(res?.message || "Instruções enviadas com sucesso.");
      setEtapa("redefinir");
    } catch (err: any) {
      setErro(err.message || "Erro ao solicitar recuperação.");
    } finally {
      setEnviando(false);
    }
  };

  const redefinir = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await resetPassword({
        identificador,
        codigo,
        password: senha,
        password_confirmation: confirmacao
      });
      setEtapa("sucesso");
    } catch (err: any) {
      setErro(err.message || "Erro ao redefinir a senha.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Recuperação de Senha</h2>

        {etapa === "sucesso" && (
          <div>
            <div className="alert info">Senha alterada. Entre com a nova senha.</div>
            <div style={{ marginTop: 24 }}>
              <button className="btn" onClick={onSair}>Voltar para o início</button>
            </div>
          </div>
        )}

        {etapa === "identificar" && (
          <form onSubmit={enviarIdentificador}>
            <p className="muted">Informe seu e-mail, CPF ou celular.</p>
            {erro && <div className="alert err">{erro}</div>}
            <div className="field">
              <input type="text" placeholder="E-mail, CPF ou Celular" value={identificador} onChange={e => setIdentificador(e.target.value)} />
            </div>
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <button className="btn" type="submit" disabled={enviando || !identificador}>
                {enviando ? "Enviando..." : "Enviar instruções"}
              </button>
              <button className="btn ghost" type="button" onClick={onSair}>Voltar</button>
            </div>
          </form>
        )}

        {etapa === "redefinir" && (
          <form onSubmit={redefinir}>
            {mensagem && <div className="alert info">{mensagem}</div>}
            {erro && <div className="alert err">{erro}</div>}
            
            <div className="field">
              <label className="l">Código de recuperação</label>
              <input type="text" placeholder="Código de 6 dígitos" value={codigo} onChange={e => setCodigo(e.target.value)} />
            </div>
            <div className="field">
              <label className="l">Nova senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} />
            </div>
            <div className="field">
              <label className="l">Repita a nova senha</label>
              <input type="password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} />
            </div>
            
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <button className="btn" type="submit" disabled={enviando || !codigo || !senha || !confirmacao}>
                {enviando ? "Salvando..." : "Redefinir senha"}
              </button>
              <button className="btn ghost" type="button" onClick={onSair}>Cancelar</button>
            </div>
          </form>
        )}

      </div>
    </main>
  );
}
