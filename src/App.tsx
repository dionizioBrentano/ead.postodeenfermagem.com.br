import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  clearSession,
  configMissing,
  currentUser,
  getAppToken,
  getSavedProfile,
  getUserToken,
  type Profile,
} from "./api/client";
import { navegar, useRota } from "./lib/rota";
import AuthPage from "./pages/AuthPage";
import SalaPage from "./pages/SalaPage";

type Guard =
  | { estado: "verificando" }
  | { estado: "ok"; perfil: Profile }
  | { estado: "erro"; mensagem: string };

export default function App() {
  const rota = useRota();
  const faltando = configMissing();
  const [aviso, setAviso] = useState<string | null>(null);
  const [appErro, setAppErro] = useState<string | null>(null);
  const [guard, setGuard] = useState<Guard>({ estado: "verificando" });

  // 1. Ao subir: token do aplicativo (fica só em memória).
  useEffect(() => {
    if (faltando.length) return;
    getAppToken().catch((e: unknown) => {
      setAppErro(
        e instanceof ApiError && e.status !== 0
          ? "O aplicativo não foi autorizado pela API. Avise a coordenação do curso."
          : e instanceof Error
            ? e.message
            : "Falha ao iniciar o aplicativo.",
      );
    });
  }, []);

  // Redirecionamentos entre "/" e "/sala".
  useEffect(() => {
    const token = getUserToken();
    if (rota === "/sala" && !token) navegar("/", true);
    else if (rota === "/" && token) navegar("/sala", true);
    else if (rota !== "/" && rota !== "/sala") navegar(token ? "/sala" : "/", true);
  }, [rota]);

  // Guarda da sala: GET /user com o token do usuário.
  const verificar = useCallback(() => {
    const token = getUserToken();
    if (!token) return;
    setGuard({ estado: "verificando" });
    currentUser(token)
      .then((u) => setGuard({ estado: "ok", perfil: { ...(getSavedProfile() ?? {}), ...u } }))
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
  }, []);

  useEffect(() => {
    if (rota === "/sala" && getUserToken() && !faltando.length) verificar();
  }, [rota, verificar]);

  const sair = () => {
    clearSession();
    setGuard({ estado: "verificando" });
    navegar("/", true);
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

  if (rota === "/sala" && getUserToken()) {
    if (guard.estado === "ok") return <SalaPage perfil={guard.perfil} onSair={sair} />;
    return (
      <main className="page auth">
        <div className="auth-card" style={{ textAlign: "center" }}>
          {guard.estado === "verificando" ? (
            <p className="muted">Confirmando seu acesso…</p>
          ) : (
            <div className="box" style={{ display: "grid", gap: 12 }}>
              <p style={{ margin: 0 }}>{guard.mensagem}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn" onClick={verificar}>
                  Tentar de novo
                </button>
                <button className="btn ghost" onClick={sair}>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <AuthPage
      aviso={aviso}
      appErro={appErro}
      onEntrou={() => {
        setAviso(null);
        navegar("/sala");
      }}
    />
  );
}
