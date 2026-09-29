import { useMemo, useState, useEffect } from "react";
import type { Profile } from "../api/client";
import { getAlunos } from "../api/ead";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import AvaliacaoSupervisor from "../components/AvaliacaoSupervisor";
import Paralelo from "../components/Paralelo";
import { carregar, type Avaliacao } from "../lib/historico";
import PainelAdmin from "../components/PainelAdmin";

type Aba = "guia" | "autoavaliacao" | "evolucao" | "avaliacao_sup" | "paralelo";

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

/** Chave do histórico local: um aluno não vê o histórico de outro no mesmo aparelho. */
function chaveDoAluno(p: Profile): string {
  return texto(p, "id") || texto(p, "uuid") || texto(p, "email") || "anonimo";
}

export default function SalaPage({ perfil, onSair }: { perfil: Profile; onSair: () => void }) {
  const isStudent = perfil.user_type === "patient";
  const isAdmin = perfil.user_type === "admin";
  const isSupervisor = perfil.user_type === "professional" || isAdmin; // Admins can also be supervisors
  
  const [aba, setAba] = useState<Aba | "admin">(isStudent ? "guia" : (isAdmin ? "admin" : "avaliacao_sup"));
  const userKey = useMemo(() => chaveDoAluno(perfil), [perfil]);
  const nome = texto(perfil, "name");
  const [lista, setLista] = useState<Avaliacao[]>(() => carregar(userKey));

  // Supervisor state
  const [confirmedStudentId, setConfirmedStudentId] = useState(isStudent ? texto(perfil, "id") || texto(perfil, "uuid") : "");
  
  const [alunos, setAlunos] = useState<{id: string, name: string}[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  useEffect(() => {
    if (isSupervisor) {
      setCarregandoAlunos(true);
      getAlunos().then(res => {
        setAlunos(res as any);
      }).catch(err => {
        console.error("Erro ao carregar alunos", err);
      }).finally(() => {
        setCarregandoAlunos(false);
      });
    }
  }, [isSupervisor]);

  const ir = (a: Aba | "admin") => {
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
        
        {!isStudent && (
          <div className="in" style={{ background: "#f0f0f0", padding: "10px", marginTop: "10px", borderRadius: "6px" }}>
            <div style={{ display: "flex", gap: "10px", width: "100%", alignItems: "center" }}>
              <label style={{ whiteSpace: "nowrap", fontWeight: 600 }}>ID do Aluno:</label>
              <select 
                value={confirmedStudentId} 
                onChange={e => {
                  const id = e.target.value;
                  setConfirmedStudentId(id);
                  if (id && aba === "admin") {
                    setAba("avaliacao_sup");
                  }
                }} 
                style={{ flex: 1 }}
                disabled={carregandoAlunos}
              >
                <option value="">-- {carregandoAlunos ? "Carregando..." : "Selecione um aluno"} --</option>
                {alunos.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <nav className="nav" role="tablist" aria-label="Seções da sala" style={{ overflowX: "auto" }}>
          {isAdmin && (
            <button role="tab" aria-selected={aba === "admin"} onClick={() => ir("admin")} style={{ fontWeight: "bold", color: "#d32f2f" }}>
              Painel de Administração
            </button>
          )}
          {isStudent && (
            <>
              <button role="tab" aria-selected={aba === "guia"} onClick={() => ir("guia")}>
                Guia do estágio
              </button>
              <button role="tab" aria-selected={aba === "autoavaliacao"} onClick={() => ir("autoavaliacao")}>
                Autoavaliação
              </button>
              <button role="tab" aria-selected={aba === "evolucao"} onClick={() => ir("evolucao")}>
                Minha evolução{lista.length ? ` (${lista.length})` : ""}
              </button>
            </>
          )}
          {isSupervisor && (
            <>
              <button role="tab" aria-selected={aba === "avaliacao_sup"} onClick={() => ir("avaliacao_sup")}>
                Avaliação do supervisor
              </button>
              <button role="tab" aria-selected={aba === "paralelo"} onClick={() => ir("paralelo")}>
                Paralelo
              </button>
            </>
          )}
        </nav>
      </div>
      <main className="page">
        {aba === "admin" && isAdmin ? (
          <PainelAdmin />
        ) : (!confirmedStudentId && !isStudent) ? (
          <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            Por favor, informe o ID do aluno no campo acima e clique em Buscar.
          </div>
        ) : (
          <>
            {aba === "guia" && isStudent && <Guia onAutoavaliar={() => ir("autoavaliacao")} />}
            {aba === "autoavaliacao" && isStudent && (
              <Autoavaliacao
                userKey={userKey}
                nomePerfil={nome}
                lista={lista}
                onSalvou={setLista}
                onVerEvolucao={() => ir("evolucao")}
              />
            )}
            {aba === "evolucao" && isStudent && (
              <Evolucao userKey={userKey} lista={lista} onMudou={setLista} onAutoavaliar={() => ir("autoavaliacao")} />
            )}
            {aba === "avaliacao_sup" && isSupervisor && (
              <AvaliacaoSupervisor alunoId={confirmedStudentId} isStudent={isStudent} />
            )}
            {aba === "paralelo" && isSupervisor && (
              <Paralelo alunoId={confirmedStudentId} />
            )}
          </>
        )}
      </main>
    </>
  );
}

