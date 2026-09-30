const fs = require('fs');
let code = fs.readFileSync('src/pages/AuthPage.tsx', 'utf8');

const targetImports = `import { ApiError, fieldErrors, isOrganizationMismatch, login, register } from "../api/client";`;
const replacementImports = `import { ApiError, fieldErrors, isOrganizationMismatch, login, register, verifyMfa } from "../api/client";`;

const targetEntrar = `function Entrar({ inicial, onEntrou }: { inicial: string; onEntrou: () => void }) {
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
}`;

const replacementEntrar = `function Entrar({ inicial, onEntrou }: { inicial: string; onEntrou: () => void }) {
  const [valor, setValor] = useState(inicial);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  
  // MFA
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    
    if (mfaToken) {
      if (!totpCode.trim()) {
        setErro("Preencha o código de autenticação de 6 dígitos.");
        return;
      }
      setEnviando(true);
      try {
        await verifyMfa(mfaToken, totpCode.trim());
        onEntrou();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setErro("Código inválido.");
        else setErro(err instanceof Error ? err.message : "Não foi possível validar o código.");
      } finally {
        setEnviando(false);
      }
      return;
    }
    
    if (!valor.trim() || !senha) {
      setErro("Preencha o login e a senha.");
      return;
    }
    setEnviando(true);
    try {
      const res = await login(valor.trim(), senha);
      if (res.mfa_required) {
        setMfaToken(res.token);
        setErro(null);
      } else {
        onEntrou();
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setErro("Credenciais inválidas.");
      else if (isOrganizationMismatch(err)) setErro("Esta conta não pertence a esta organização.");
      else setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setEnviando(false);
    }
  }

  if (mfaToken) {
    return (
      <form className="form" onSubmit={enviar} noValidate>
        <p className="muted" style={{ marginBottom: "15px" }}>
          Sua conta possui verificação em duas etapas ativada.
          Abra seu aplicativo autenticador e digite o código de 6 dígitos.
        </p>
        <div className="field">
          <label className="l" htmlFor="totpCode">Código de 6 dígitos</label>
          <input id="totpCode" type="text" value={totpCode} onChange={(e) => setTotpCode(e.target.value.replace(/\\D/g, "").slice(0, 6))} />
        </div>
        {erro && <div className="alert err" role="alert">{erro}</div>}
        <button className="btn" type="submit" disabled={enviando}>
          {enviando ? "Verificando…" : "Confirmar Código"}
        </button>
        <button className="btn ghost small" type="button" onClick={() => setMfaToken(null)} disabled={enviando} style={{ marginTop: "10px" }}>
          Voltar
        </button>
      </form>
    );
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
}`;

if (code.includes(targetImports)) {
  code = code.replace(targetImports, replacementImports);
}
if (code.includes(targetEntrar)) {
  code = code.replace(targetEntrar, replacementEntrar);
  fs.writeFileSync('src/pages/AuthPage.tsx', code);
  console.log("Patched auth successfully");
} else {
  console.log("Target Entrar not found!");
}
