import { useState, useEffect } from "react";
import { confirmEmail, confirmPhone, sendEmailConfirmation, sendPhoneConfirmation, type Profile } from "../api/client";

export default function ConfirmarPage({ perfil, onConcluido, onSair, token }: { perfil: Profile; onConcluido: () => void; onSair: () => void; token: string }) {
  const emailVerificado = !!perfil.email_verified_at;
  const telefoneVerificado = !!perfil.phone_verified_at;
  const telefoneCadastrado = !!perfil.phone;

  const [aba, setAba] = useState<"email" | "telefone">(emailVerificado ? "telefone" : "email");

  const ambas = emailVerificado && telefoneVerificado;
  
  if (ambas) {
    onConcluido();
    return null;
  }

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Confirmação de Contato</h2>
        <p className="muted" style={{ fontSize: "0.9em" }}>
          Para sua segurança e acesso ao EAD, confirme seus dados.
        </p>

        <div className="tabs" role="tablist" style={{ marginTop: 20 }}>
          <button role="tab" aria-selected={aba === "email"} onClick={() => setAba("email")}>
            E-mail {emailVerificado && "✓"}
          </button>
          <button role="tab" aria-selected={aba === "telefone"} onClick={() => setAba("telefone")}>
            Telefone {telefoneVerificado && "✓"}
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          {aba === "email" && <ConfirmarEmail token={token} verificado={emailVerificado} email={String(perfil.email || "")} onSucesso={onConcluido} />}
          {aba === "telefone" && <ConfirmarTelefone token={token} verificado={telefoneVerificado} cadastrado={telefoneCadastrado} onSucesso={onConcluido} />}
        </div>

        <div style={{ marginTop: 24 }}>
          <button className="btn ghost small" onClick={onSair}>Sair</button>
        </div>
      </div>
    </main>
  );
}

function ConfirmarEmail({ token, verificado, email, onSucesso }: { token: string; verificado: boolean; email: string; onSucesso: () => void }) {
  const [etapa, setEtapa] = useState<"inicial" | "enviado">("inicial");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aguardeTempo, setAguardeTempo] = useState(0);

  useEffect(() => {
    if (aguardeTempo > 0) {
      const t = setTimeout(() => setAguardeTempo(a => a - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [aguardeTempo]);

  if (verificado) {
    return <div className="alert info">Seu e-mail já está confirmado.</div>;
  }

  const enviar = async () => {
    setEnviando(true);
    setErro(null);
    try {
      const res = await sendEmailConfirmation(token) as any;
      setMensagem(`Enviamos para ${res?.enviado_para || email}`);
      setEtapa("enviado");
    } catch (err: any) {
      if (err.status === 429) {
         setAguardeTempo(err.body?.tentar_em_segundos || 60);
         setErro(`Aguarde ${err.body?.tentar_em_segundos || 60} segundos para pedir outro código.`);
      } else {
         setErro(err.message || "Erro ao enviar código.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await confirmEmail(token, codigo.trim());
      onSucesso(); // let App re-verify
    } catch (err: any) {
      const c = err.body?.code;
      if (c === "codigo_invalido") setErro("Código incorreto.");
      else if (c === "codigo_expirado") setErro("Código vencido. Peça outro.");
      else if (c === "codigo_bloqueado") setErro("Muitas tentativas. Peça outro código.");
      else setErro(err.message || "Erro ao confirmar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      {etapa === "inicial" ? (
        <>
          <p>Confirme o e-mail: <b>{email}</b></p>
          {erro && <div className="alert err">{aguardeTempo > 0 ? `Aguarde ${aguardeTempo} segundos para pedir outro código.` : erro}</div>}
          <button className="btn" onClick={enviar} disabled={enviando || aguardeTempo > 0}>
            {enviando ? "Enviando..." : "Enviar código"}
          </button>
        </>
      ) : (
        <form onSubmit={confirmar}>
          {mensagem && <div className="alert info">{mensagem}</div>}
          {erro && <div className="alert err">{erro}</div>}
          <div className="field">
            <input type="text" placeholder="Código de 6 dígitos" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0,6))} />
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 15 }}>
            <button className="btn" type="submit" disabled={enviando || !codigo}>Confirmar</button>
            <button className="btn ghost" type="button" onClick={enviar} disabled={enviando || aguardeTempo > 0}>Reenviar código</button>
          </div>
        </form>
      )}
    </div>
  );
}

function ConfirmarTelefone({ token, verificado, cadastrado, onSucesso }: { token: string; verificado: boolean; cadastrado: boolean; onSucesso: () => void }) {
  const [etapa, setEtapa] = useState<"inicial" | "enviado">("inicial");
  const [phone, setPhone] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aguardeTempo, setAguardeTempo] = useState(0);

  useEffect(() => {
    if (aguardeTempo > 0) {
      const t = setTimeout(() => setAguardeTempo(a => a - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [aguardeTempo]);

  if (verificado) {
    return <div className="alert info">Seu telefone já está confirmado.</div>;
  }

  const enviar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cadastrado && phone.replace(/\D/g, "").length !== 11) {
      setErro("Informe o celular com DDD (11 dígitos).");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const res = await sendPhoneConfirmation(token, !cadastrado ? phone.replace(/\D/g, "") : undefined) as any;
      setMensagem(`Enviamos para ${res?.enviado_para || "seu celular"}`);
      setEtapa("enviado");
    } catch (err: any) {
      if (err.status === 429) {
         setAguardeTempo(err.body?.tentar_em_segundos || 60);
         setErro(`Aguarde ${err.body?.tentar_em_segundos || 60} segundos para pedir outro código.`);
      } else {
         setErro(err.message || "Erro ao enviar código SMS.");
      }
    } finally {
      setEnviando(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await confirmPhone(token, codigo.trim());
      onSucesso();
    } catch (err: any) {
      const c = err.body?.code;
      if (c === "codigo_invalido") setErro("Código incorreto.");
      else if (c === "codigo_expirado") setErro("Código vencido. Peça outro.");
      else if (c === "codigo_bloqueado") setErro("Muitas tentativas. Peça outro código.");
      else setErro(err.message || "Erro ao confirmar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      {etapa === "inicial" ? (
        <form onSubmit={enviar}>
          {!cadastrado && (
            <>
              <p>Você não possui um celular cadastrado. Informe um para receber o SMS:</p>
              <div className="field">
                <input type="tel" placeholder="Celular com DDD" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </>
          )}
          {cadastrado && <p>Enviaremos um código SMS para o seu celular cadastrado.</p>}
          {erro && <div className="alert err">{aguardeTempo > 0 ? `Aguarde ${aguardeTempo} segundos para pedir outro código.` : erro}</div>}
          <button className="btn" type="submit" disabled={enviando || aguardeTempo > 0}>
            {enviando ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmar}>
          {mensagem && <div className="alert info">{mensagem}</div>}
          {erro && <div className="alert err">{erro}</div>}
          <div className="field">
            <input type="text" placeholder="Código de 6 dígitos" value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0,6))} />
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 15 }}>
            <button className="btn" type="submit" disabled={enviando || !codigo}>Confirmar</button>
            <button className="btn ghost" type="button" onClick={() => enviar()} disabled={enviando || aguardeTempo > 0}>Reenviar código</button>
          </div>
        </form>
      )}
    </div>
  );
}
