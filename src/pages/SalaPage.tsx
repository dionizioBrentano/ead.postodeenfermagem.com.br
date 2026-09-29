import { useMemo, useState } from "react";
import type { Profile } from "../api/client";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import { carregar, type Avaliacao } from "../lib/historico";

type Aba = "guia" | "autoavaliacao" | "evolucao";

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

/** Chave do histórico local: um aluno não vê o histórico de outro no mesmo aparelho. */
function chaveDoAluno(p: Profile): string {
  return texto(p, "id") || texto(p, "uuid") || texto(p, "email") || "anonimo";
}

export default function SalaPage({ perfil, onSair }: { perfil: Profile; onSair: () => void }) {
  const [aba, setAba] = useState<Aba>("guia");
  const userKey = useMemo(() => chaveDoAluno(perfil), [perfil]);
  const nome = texto(perfil, "name");
  const [lista, setLista] = useState<Avaliacao[]>(() => carregar(userKey));

  const ir = (a: Aba) => {
    setAba(a);
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="topbar">
        <div className="in">
          <div className="who">
            <b>Sala EAD</b>
            <span>{nome || texto(perfil, "email")}</span>
          </div>
          <button className="btn ghost small" onClick={onSair}>
            Sair
          </button>
        </div>
        <nav className="nav" role="tablist" aria-label="Seções da sala">
          <button role="tab" aria-selected={aba === "guia"} onClick={() => ir("guia")}>
            Guia do estágio
          </button>
          <button role="tab" aria-selected={aba === "autoavaliacao"} onClick={() => ir("autoavaliacao")}>
            Autoavaliação
          </button>
          <button role="tab" aria-selected={aba === "evolucao"} onClick={() => ir("evolucao")}>
            Minha evolução{lista.length ? ` (${lista.length})` : ""}
          </button>
        </nav>
      </div>
      <main className="page">
        {aba === "guia" && <Guia onAutoavaliar={() => ir("autoavaliacao")} />}
        {aba === "autoavaliacao" && (
          <Autoavaliacao
            userKey={userKey}
            nomePerfil={nome}
            lista={lista}
            onSalvou={setLista}
            onVerEvolucao={() => ir("evolucao")}
          />
        )}
        {aba === "evolucao" && (
          <Evolucao userKey={userKey} lista={lista} onMudou={setLista} onAutoavaliar={() => ir("autoavaliacao")} />
        )}
      </main>
    </>
  );
}
