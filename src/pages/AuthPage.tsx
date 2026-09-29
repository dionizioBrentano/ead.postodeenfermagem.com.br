import { useState, type FormEvent } from "react";
import { ApiError, fieldErrors, isOrganizationMismatch, login, register } from "../api/client";

type Props = { aviso: string | null; appErro: string | null; onEntrou: () => void };

const soDigitos = (s: string) => s.replace(/\D+/g, "");

export default function AuthPage({ aviso, appErro, onEntrou }: Props) {
  const [aba, setAba] = useState<"entrar" | "cadastrar">("entrar");
  const [loginValor, setLoginValor] = useState("");

  return (
    <main className="page auth">
      <div className="auth-card">
        <div className="brand">
          <span className="eyebrow">Posto de Enfermagem · Curso Técnico em Enfermagem</span>
          <h1>Sala EAD</h1>
          <p className="muted" style={{ margin: 0 }}>
            Guia do estágio hospitalar e autoavaliação. Entre com o mesmo cadastro do Posto de Enfermagem.
          </p>
        </div>
        {aviso && <div className="alert info" role="status">{aviso}</div>}
        {appErro && <div className="alert err" role="alert">{appErro}</div>}
        <div className="box" style={{ display: "grid", gap: 18 }}>
          <div className="tabs" role="tablist">
            <button role="tab" id="tab-entrar" aria-selected={aba === "entrar"} onClick={() => setAba("entrar")}>
              Entrar
            </button>
            <button role="tab" id="tab-cadastrar" aria-selected={aba === "cadastrar"} onClick={() => setAba("cadastrar")}>
              Criar cadastro
            </button>
          </div>
          {aba === "entrar" ? (
            <Entrar inicial={loginValor} onEntrou={onEntrou} />
          ) : (
            <Cadastrar
              onEntrou={onEntrou}
              irParaLogin={(email) => {
                setLoginValor(email);
                setAba("entrar");
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function Entrar({ inicial, onEntrou }: { inicial: string; onEntrou: () => void }) {
  const [valor, setValor] = useState(inicial);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!valor.trim() || !senha) {
      setErro("Preencha o login e a senha.");
      return;
    }
    setEnviando(true);
    try {
      await login(valor.trim(), senha);
      onEntrou();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setErro("Credenciais inválidas.");
      else if (isOrganizationMismatch(err)) setErro("Esta conta não pertence a esta organização.");
      else setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="field">
        <label className="l" htmlFor="login">E-mail, CPF ou telefone</label>
        <input id="login" type="text" autoComplete="username" value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
      <div className="field">
        <label className="l" htmlFor="senha">Senha</label>
        <input id="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </div>
      {erro && <div className="alert err" role="alert">{erro}</div>}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

type Campos = { name: string; email: string; phone: string; cpf: string; password: string; password_confirmation: string };

function Cadastrar({ onEntrou, irParaLogin }: { onEntrou: () => void; irParaLogin: (email: string) => void }) {
  const [c, setC] = useState<Campos>({ name: "", email: "", phone: "", cpf: "", password: "", password_confirmation: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [emailDuplicado, setEmailDuplicado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const set = (k: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEmailDuplicado(false);
    const loc: Record<string, string> = {};
    if (!c.name.trim()) loc.name = "Informe seu nome completo.";
    if (!c.email.trim()) loc.email = "Informe seu e-mail.";
    if (!soDigitos(c.phone)) loc.phone = "Informe seu telefone com DDD.";
    if (!soDigitos(c.cpf)) loc.cpf = "Informe seu CPF.";
    if (!c.password) loc.password = "Crie uma senha.";
    if (c.password !== c.password_confirmation) loc.password_confirmation = "As senhas não são iguais.";
    setErros(loc);
    if (Object.keys(loc).length) return;

    setEnviando(true);
    try {
      await register({
        name: c.name.trim(),
        email: c.email.trim(),
        phone: soDigitos(c.phone),
        cpf: soDigitos(c.cpf),
        password: c.password,
        password_confirmation: c.password_confirmation,
      });
      onEntrou();
    } catch (err) {
      const fe = fieldErrors(err);
      setErros(fe);
      if (fe.email && /já|taken|exist|cadastrad|utilizad|em uso/i.test(fe.email)) setEmailDuplicado(true);
      setErro(isOrganizationMismatch(err) ? "Esta conta não pertence a esta organização." : err instanceof Error ? err.message : "Não foi possível cadastrar.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = (k: keyof Campos, rotulo: string, tipo: string, auto: string, dica?: string) => (
    <div className="field">
      <label className="l" htmlFor={`cad-${k}`}>{rotulo}</label>
      <input
        id={`cad-${k}`}
        type={tipo}
        autoComplete={auto}
        inputMode={k === "phone" || k === "cpf" ? "numeric" : undefined}
        value={c[k]}
        onChange={set(k)}
        aria-invalid={!!erros[k]}
      />
      {dica && !erros[k] && <span className="h">{dica}</span>}
      {erros[k] && <span className="e">{erros[k]}</span>}
    </div>
  );

  return (
    <form className="form" onSubmit={enviar} noValidate>
      {campo("name", "Nome completo", "text", "name")}
      {campo("email", "E-mail", "email", "email")}
      <div className="two">
        {campo("phone", "Telefone com DDD", "tel", "tel", "Só números")}
        {campo("cpf", "CPF", "text", "off", "Só números")}
      </div>
      <div className="two">
        {campo("password", "Senha", "password", "new-password")}
        {campo("password_confirmation", "Repita a senha", "password", "new-password")}
      </div>
      {erro && (
        <div className="alert err" role="alert">
          {erro}
          {emailDuplicado && (
            <>
              {" "}
              <button type="button" className="link" onClick={() => irParaLogin(c.email.trim())}>
                Entrar com este e-mail
              </button>
            </>
          )}
        </div>
      )}
      <button className="btn" type="submit" disabled={enviando}>
        {enviando ? "Cadastrando…" : "Criar cadastro"}
      </button>
    </form>
  );
}
