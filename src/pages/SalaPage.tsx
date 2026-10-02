import { useMemo, useState, useEffect } from "react";
import type { Profile, Membership } from "../api/client";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import Paralelo from "../components/Paralelo";
import GraficoEvolucao from "../components/GraficoEvolucao";
import type { Avaliacao } from "../lib/historico";

type Aba = "guia" | "autoavaliacao" | "evolucao" | "avaliacoes_recebidas";

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function chaveDoAluno(p: Profile): string {
  return texto(p, "id") || texto(p, "uuid") || texto(p, "email") || "anonimo";
}

export default function SalaPage({ perfil, onSair }: { perfil: Profile; memberships?: Membership[]; onSair: () => void }) {
  const [aba, setAba] = useState<Aba>("guia");
  const userKey = useMemo(() => chaveDoAluno(perfil), [perfil]);
  const nome = texto(perfil, "name");
  
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  useEffect(() => {
    const runMigrationAndLoad = async () => {
      try {
        const { carregarLocal, carregarDaAPI } = await import("../lib/historico");
        const { saveAvaliacao } = await import("../api/ead");
        const { getUserToken } = await import("../api/client");
        const localList = carregarLocal(userKey);
        const token = getUserToken();
        
        if (localList.length > 0 && token) {
          const apiList = await carregarDaAPI(userKey, "auto");
          for (const av of localList) {
            const exists = apiList.find((a) => a.etapa === av.etapa && a.momento === av.momento);
            if (!exists) {
              const { GERAIS, ATIVIDADES } = await import("../data/itens");
              const promises: Promise<unknown>[] = [];
              av.gerais.forEach((nota, i) => {
                if (nota !== null) promises.push(saveAvaliacao({ aluno_user_id: userKey, item_chave: `gerais.${i}`, item_texto: GERAIS[i].texto, grupo: "gerais", papel: "auto", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(av.etapa), momento: av.momento, comentario: av.obs }, token));
              });
              av.atividades.forEach((nota, i) => {
                if (nota !== null) promises.push(saveAvaliacao({ aluno_user_id: userKey, item_chave: `atividades.${i}`, item_texto: ATIVIDADES[i].texto, grupo: "atividades", papel: "auto", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(av.etapa), momento: av.momento, comentario: av.obs }, token));
              });
              await Promise.allSettled(promises);
            }
          }
          localStorage.removeItem("ead.historico." + userKey);
        }
        
        const finalApiList = await carregarDaAPI(userKey, "auto");
        setLista(finalApiList);
      } catch (err) {
        console.error("Erro ao carregar avaliações", err);
      } finally {
        setCarregandoLista(false);
      }
    };
    runMigrationAndLoad();
  }, [userKey]);

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

        <nav className="nav" role="tablist" aria-label="Seções da sala" style={{ overflowX: "auto" }}>
          <button role="tab" aria-selected={aba === "guia"} onClick={() => ir("guia")}>
            Guia do estágio
          </button>
          <button role="tab" aria-selected={aba === "autoavaliacao"} onClick={() => ir("autoavaliacao")}>
            Autoavaliação
          </button>
          <button role="tab" aria-selected={aba === "evolucao"} onClick={() => ir("evolucao")}>
            Minha evolução{lista.length ? ` (${lista.length})` : ""}
          </button>
          <button role="tab" aria-selected={aba === "avaliacoes_recebidas"} onClick={() => ir("avaliacoes_recebidas")}>
            Avaliações recebidas
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
          carregandoLista ? (
            <div className="box sec" style={{ textAlign: "center", padding: "40px 20px" }}>
              Carregando sua evolução...
            </div>
          ) : (
            <Evolucao userKey={userKey} lista={lista} onMudou={setLista} onAutoavaliar={() => ir("autoavaliacao")} />
          )
        )}
        {aba === "avaliacoes_recebidas" && (
          <>
            <Paralelo alunoId={userKey} />
            <GraficoEvolucao alunoId={userKey} />
          </>
        )}
      </main>
    </>
  );
}
