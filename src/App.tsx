import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  clearSession,
  configMissing,
  currentUser,
  getSavedProfile,
  getUserToken,
  fetchMembershipsAndSave,
  apiErrorListeners,
  type Profile,
  type Membership,
  logout,
} from "./api/client";
import { navegar, useRota } from "./lib/rota";

import ParticiparPage from "./pages/ParticiparPage";
import AguardandoPage from "./pages/AguardandoPage";
import ConvitePage from "./pages/ConvitePage";
import SalaPage from "./pages/SalaPage";
import SupervisaoPage from "./pages/SupervisaoPage";
import AdministracaoPage from "./pages/AdministracaoPage";
import EntrarRetornoPage from "./pages/EntrarRetornoPage";
import { iniciarLogin, sairNoLoginCentral } from "./lib/loginCentral";


type Guard =
  | { estado: "verificando" }
  | { estado: "ok"; perfil: Profile; memberships: Membership[] }
  | { estado: "erro"; mensagem: string };

export default function App() {
  const rotaRaw = useRota();
  const urlParams = new URLSearchParams(window.location.search);
  const tokenConvite = urlParams.get("token");
  const rota = rotaRaw.startsWith("/convite") ? "/convite" : rotaRaw;
  
  const faltando = configMissing();
  const [aviso, setAviso] = useState<string | null>(null);
  const [guard, setGuard] = useState<Guard>({ estado: "verificando" });

  const token = getUserToken();

  const verificar = useCallback(() => {
    if (!token) return;
    setGuard({ estado: "verificando" });
    
    Promise.all([
      currentUser(token),
      fetchMembershipsAndSave(token)
    ])
      .then(([u, mems]) => {
        setGuard({ estado: "ok", perfil: { ...(getSavedProfile() ?? {}), ...u }, memberships: mems });
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          setAviso("Sua sessão terminou. Entre novamente.");
          navegar("/", true);
        } else {
          setGuard({
            estado: "erro",
            mensagem: e instanceof Error ? e.message : "Não foi possível confirmar seu acesso.",
          });
        }
      });
  }, [token]);

  useEffect(() => {
    if (token && !faltando.length && guard.estado === "verificando" && rota !== "/" && rota !== "/convite" && rota !== "/entrar/retorno") {
      verificar();
    }
  }, [token, faltando.length, verificar, rota, guard.estado]);

  useEffect(() => {
    if (rota === "/" && token && guard.estado === "verificando" && !faltando.length) {
       verificar();
    } else if (rota === "/" && token && guard.estado === "ok") {
       navegar("/participar", true);
    }
  }, [rota, token, guard.estado, faltando.length, verificar]);

  useEffect(() => {
    const cb = (err: ApiError) => {
      if (err.status === 403 && typeof err.body === 'object' && (err.body as any)?.code === 'confirmation_required') {
        void iniciarLogin({ destino: "/sala" });
      }
    };
    apiErrorListeners.add(cb);
    return () => {
      apiErrorListeners.delete(cb);
    };
  }, []);

  const sair = async () => {
    if (token) await logout(token);
    else clearSession();
    sairNoLoginCentral();
  };

  if (faltando.length) {
    return (
      <main className="page auth">
        <div className="auth-card box">
          <h1 style={{ fontSize: 24 }}>Configuração incompleta</h1>
          <p>
            Faltam as variáveis de ambiente: <b>{faltando.join(", ")}</b>. Preencha o arquivo <code>.env</code> e gere
            o build de novo (veja o README).
          </p>
        </div>
      </main>
    );
  }

  if (rota === "/convite") {
    return <ConvitePage token={tokenConvite || ""} onEntrou={() => navegar("/sala")} onSair={sair} tokenAuth={token} />;
  }

  if (rota === "/entrar/retorno") {
    return (
      <EntrarRetornoPage
        onEntrou={(destino) => {
          setAviso(null);
          setGuard({ estado: "verificando" });
          navegar(destino === "/" ? "/participar" : destino, true);
        }}
      />
    );
  }

  if (!token) {
    return (
      <main className="page auth">
        <div className="auth-card">
          <div className="brand">
            <span className="eyebrow">Posto de Enfermagem · Curso Técnico em Enfermagem</span>
            <h1>Sala EAD</h1>
            <p className="muted" style={{ margin: 0 }}>
              Guia do estágio hospitalar e autoavaliação. Entre com a mesma conta da rede Posto de Enfermagem.
            </p>
          </div>
          {aviso && <div className="alert info" role="status">{aviso}</div>}
          <div className="box" style={{ display: "grid", gap: 12 }}>
            <button className="btn" onClick={() => void iniciarLogin({ destino: rota === "/" ? "/participar" : rota })}>
              Entrar
            </button>
            <button className="btn ghost" onClick={() => void iniciarLogin({ destino: "/participar", cadastro: true })}>
              Criar cadastro
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (guard.estado === "erro") {
    return (
      <main className="page auth">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="box" style={{ display: "grid", gap: 12 }}>
            <p style={{ margin: 0 }}>{guard.mensagem}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={verificar}>Tentar de novo</button>
              <button className="btn ghost" onClick={sair}>Sair</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (guard.estado === "verificando") {
    return (
      <main className="page auth">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="muted">Confirmando seu acesso…</p>
        </div>
      </main>
    );
  }

  if (guard.perfil.confirmacao_obrigatoria) {
    // O login central pede a confirmação de e-mail e celular e devolve para cá.
    void iniciarLogin({ destino: rota });
    return null;
  }

  const mfaEnabled = guard.perfil.mfa_enabled === true;
  const memberships = guard.memberships;
  
  const hasRole = (role: string) => memberships.some(m => m.papel === role && m.situacao === "ativo");
  const isPendingDocente = memberships.some(m => m.papel === "docente" && m.situacao === "pendente");
  
  const isAluno = hasRole("aluno");
  const isDocente = hasRole("docente");
  const isAdmin = hasRole("administrador");
  const podeVerAvaliacoes = memberships.some(
    (m) => m.papel === "administrador" && m.situacao === "ativo" && (m.atribuicoes || []).includes("avaliacoes.ler"),
  );

  if (rota === "/verificacao") {
    // Verificação em duas etapas acontece no login central.
    void iniciarLogin({ destino: isAdmin ? "/administracao" : "/supervisao", exigirMfa: true });
    return null;
  }

  if (rota === "/participar") {
    if (isAluno || isDocente || isAdmin) {
      navegar("/sala", true);
      return null;
    }
    if (isPendingDocente) {
      navegar("/aguardando", true);
      return null;
    }
    return <ParticiparPage token={token} onParticipou={() => {
      setGuard({ estado: "verificando" });
      verificar();
    }} onSair={sair} />;
  }

  if (rota === "/aguardando") {
    if (isDocente || isAdmin || isAluno) {
      navegar("/sala", true);
      return null;
    }
    return <AguardandoPage onVerificar={verificar} onSair={sair} />;
  }

  if (rota === "/sala") {
    if (!isAluno) {
      if (isDocente) navegar("/supervisao", true);
      else if (isAdmin) navegar("/administracao", true);
      else navegar("/participar", true);
      return null;
    }
    return <SalaPage perfil={guard.perfil} memberships={memberships} onSair={sair} />;
  }

  if (rota === "/supervisao") {
    if (!isDocente && !(isAdmin && podeVerAvaliacoes)) {
      navegar("/sala", true);
      return null;
    }
    if (!mfaEnabled) {
      navegar("/verificacao", true);
      return null;
    }
    return <SupervisaoPage perfil={guard.perfil} memberships={memberships} onSair={sair} />;
  }

  if (rota === "/administracao") {
    if (!isAdmin) {
      navegar("/sala", true);
      return null;
    }
    if (!mfaEnabled) {
      navegar("/verificacao", true);
      return null;
    }
    return <AdministracaoPage perfil={guard.perfil} memberships={memberships} onSair={sair} />;
  }

  // Rota inválida
  navegar("/sala", true);
  return null;
}
