import { useMemo, useState, useEffect } from "react";
import type { Profile, Membership } from "../api/client";
import { navegar } from "../lib/rota";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import TurmaCalendarioWrapper from "../components/TurmaCalendarioWrapper";
import MinhaFrequencia from "../components/MinhaFrequencia";
import type { Avaliacao } from "../lib/historico";

type Aba = "guia" | "autoavaliacao" | "evolucao" | "avaliacoes_recebidas" | "minha_turma" | "minha_frequencia";

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function chaveDoAluno(p: Profile): string {
  return texto(p, "id") || texto(p, "uuid") || texto(p, "email") || "anonimo";
}

function formatDDMMYYYY(ymd: string) {
  if (!ymd) return '-';
  const parts = ymd.split('T')[0].split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function SalaPage({ perfil, onSair }: { perfil: Profile; memberships?: Membership[]; onSair: () => void }) {
  const [aba, setAba] = useState<Aba>("guia");
  const userKey = useMemo(() => chaveDoAluno(perfil), [perfil]);
  const nome = texto(perfil, "name");
  
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const [turma, setTurma] = useState<any>(null);
  const [carregandoTurma, setCarregandoTurma] = useState(false);

  useEffect(() => {
    if ((aba === "minha_turma" || aba === "minha_frequencia") && !turma && !carregandoTurma) {
      const loadTurma = async () => {
        try {
          setCarregandoTurma(true);
          const { getMinhasTurmas } = await import("../api/ead");
          const { getUserToken } = await import("../api/client");
          const token = getUserToken();
          if (!token) return;
          const turmas = await getMinhasTurmas(token);
          if (turmas && turmas.length > 0) {
            setTurma(turmas[0]);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCarregandoTurma(false);
        }
      };
      loadTurma();
    }
  }, [aba, turma, carregandoTurma]);

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
          <button role="tab" aria-selected={aba === "minha_turma"} onClick={() => ir("minha_turma")}>
            Minha turma
          </button>
          <button role="tab" aria-selected={aba === "minha_frequencia"} onClick={() => ir("minha_frequencia")}>
            Minha frequência
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
        {(!perfil.email_verified_at || !perfil.phone_verified_at) && (
          <div className="alert info" style={{ marginBottom: 20, display: "flex", gap: "10px", alignItems: "center" }}>
            Confirme seu e-mail e telefone. No próximo acesso isso será obrigatório.
            <button type="button" className="btn small" onClick={() => navegar("/confirmar")}>Confirmar agora</button>
          </div>
        )}
        {aba === "guia" && <Guia onAutoavaliar={() => ir("autoavaliacao")} />}
        {aba === "minha_turma" && (
          <div className="box sec" style={{ padding: "20px" }}>
            <h2 style={{ marginTop: 0 }}>Minha Turma</h2>
            {carregandoTurma ? (
              <p>Carregando...</p>
            ) : !turma ? (
              <p>Você não está em nenhuma turma no momento.</p>
            ) : (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <p><strong>Nome:</strong> {turma.nome}</p>
                  <p><strong>Início:</strong> {formatDDMMYYYY(turma.data_inicio)}</p>
                  <p><strong>Fim:</strong> {formatDDMMYYYY(turma.data_fim)}</p>
                </div>
                <TurmaCalendarioWrapper turmaId={turma.id} inicioTurma={turma.data_inicio} fimTurma={turma.data_fim} />
              </>
            )}
          </div>
        )}
        {aba === "minha_frequencia" && (
          carregandoTurma ? (
            <div className="box sec" style={{ padding: "20px" }}><p>Carregando turma...</p></div>
          ) : !turma ? (
            <div className="box sec" style={{ padding: "20px" }}><p>Você não está em nenhuma turma no momento.</p></div>
          ) : (
            <MinhaFrequencia turmaId={turma.id} />
          )
        )}
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
          <div className="box sec" style={{ textAlign: "center", padding: "40px 20px" }}>
            <h2 style={{ fontSize: 21 }}>Avaliações Recebidas</h2>
            <p className="muted">As avaliações feitas pelos seus supervisores aparecerão aqui.</p>
          </div>
        )}
      </main>
    </>
  );
}
