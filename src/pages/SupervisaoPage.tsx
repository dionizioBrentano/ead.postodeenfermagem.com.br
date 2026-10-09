import { useState, useEffect } from "react";
import type { Profile, Membership } from "../api/client";
import { getAlunos, getMinhasTurmas } from "../api/ead";
import {
  getUserToken,
  getRegistrosProfissionais,
  deleteRegistroProfissional,
  type RegistroProfissional,
} from "../api/client";
import Evolucao from "../components/Evolucao";
import AvaliacaoSupervisor from "../components/AvaliacaoSupervisor";
import Paralelo from "../components/Paralelo";
import GraficoEvolucao from "../components/GraficoEvolucao";
import { carregarDaAPI, type Avaliacao } from "../lib/historico";
import RegistroProfissionalForm from "../components/RegistroProfissionalForm";
import AulasDocente from "../components/AulasDocente";
import TurmaCalendarioWrapper from "../components/TurmaCalendarioWrapper";
import FrequenciaAdmin from "../components/FrequenciaAdmin";
import AnotacoesCampoSupervisor from "../components/AnotacoesCampoSupervisor";
import TarefasTeoricasSupervisao from "../components/TarefasTeoricasSupervisao";
import MenuEad from "../components/MenuEad";

type Aba =
  | "avaliacao_sup"
  | "autoavaliacoes_aluno"
  | "paralelo"
  | "grafico"
  | "anotacoes_campo"
  | "selecionar_alunos"
  | "calendario"
  | "aulas"
  | "chamada"
  | "transcrever_auto"
  | "meu_registro";

export default function SupervisaoPage({
  perfil,
  memberships,
  onSair,
  modoLancamento = false,
}: {
  perfil: Profile;
  memberships: Membership[];
  onSair: () => void;
  modoLancamento?: boolean;
}) {
  const [aba, setAba] = useState<Aba>(modoLancamento ? "transcrever_auto" : "avaliacao_sup");
  const ehAdmin = memberships.some((m) => m.papel === "administrador" && m.situacao === "ativo");

  const [confirmedTurmaId, setConfirmedTurmaId] = useState("");
  const [turmas, setTurmas] = useState<any[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);

  const [confirmedStudentId, setConfirmedStudentId] = useState("");
  const [alunos, setAlunos] = useState<{ id: string; name: string }[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const [acessoBloqueado, setAcessoBloqueado] = useState<string | null>(null);

  const [alunoAvaliacoes, setAlunoAvaliacoes] = useState<Avaliacao[]>([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);

  // Registro State
  const [meusRegistros, setMeusRegistros] = useState<RegistroProfissional[]>([]);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);

  // Fetch Turmas on mount
  useEffect(() => {
    setCarregandoTurmas(true);
    const token = getUserToken();
    if (!token) return;
    getMinhasTurmas(token)
      .then((res) => {
        setTurmas(res as any);
      })
      .catch((err) => {
        if (
          err.status === 403 &&
          err.body &&
          typeof err.body === "object" &&
          err.body.code === "supervisor_not_approved"
        ) {
          setAcessoBloqueado("Seu cadastro de supervisor está aguardando aprovação da escola.");
        } else if (
          err.status === 403 &&
          err.body &&
          typeof err.body === "object" &&
          err.body.code === "mfa_required"
        ) {
          setAcessoBloqueado("Para acessar como supervisor, ative a verificação em duas etapas na sua conta.");
        } else if (
          err.status === 403 &&
          err.body &&
          typeof err.body === "object" &&
          err.body.code === "registro_irregular"
        ) {
          setAcessoBloqueado("Seu registro no conselho está com pendência. Procure a coordenação da escola.");
        } else {
          console.error("Erro ao carregar turmas", err);
        }
      })
      .finally(() => {
        setCarregandoTurmas(false);
      });
  }, []);

  useEffect(() => {
    if (!confirmedTurmaId || acessoBloqueado) {
      setAlunos([]);
      setConfirmedStudentId("");
      return;
    }
    setCarregandoAlunos(true);
    getAlunos(confirmedTurmaId === "todas" ? undefined : confirmedTurmaId)
      .then((res: any) => {
        setAlunos(res as any);
        // Reset selected student if they are no longer in the list
        if (confirmedStudentId && !res.find((a: any) => a.id === confirmedStudentId)) {
          setConfirmedStudentId("");
        }
      })
      .catch((err) => {
        if (err.status === 403 && err.body?.code === "aluno_fora_da_turma") {
          // Ignorar se já estamos trocando de turma
        } else {
          console.error("Erro ao carregar alunos da turma", err);
        }
      })
      .finally(() => {
        setCarregandoAlunos(false);
      });
  }, [confirmedTurmaId, acessoBloqueado]);

  const carregarMeusRegistros = async () => {
    setCarregandoRegistros(true);
    try {
      const token = getUserToken();
      if (token) setMeusRegistros(await getRegistrosProfissionais(token));
    } catch (err) {
      console.error(err);
    } finally {
      setCarregandoRegistros(false);
    }
  };

  useEffect(() => {
    if (aba === "meu_registro") carregarMeusRegistros();
  }, [aba]);

  useEffect(() => {
    if (confirmedStudentId && aba === "autoavaliacoes_aluno") {
      setCarregandoAvaliacoes(true);
      carregarDaAPI(confirmedStudentId, "auto")
        .then((res) => {
          setAlunoAvaliacoes(res);
        })
        .catch((err) => {
          if (err.status === 403 && err.body?.code === "aluno_fora_da_turma") {
            alert("Este aluno não pertence à sua turma selecionada.");
          }
          console.error("Erro ao carregar avaliações do aluno", err);
        })
        .finally(() => setCarregandoAvaliacoes(false));
    }
  }, [confirmedStudentId, aba]);

  const ir = (a: Aba) => {
    setAba(a);
    window.scrollTo({ top: 0 });
  };

  const handleExcluirRegistro = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    try {
      const token = getUserToken();
      if (token) await deleteRegistroProfissional(token, id);
      carregarMeusRegistros();
    } catch (err: any) {
      if (err.status === 422 && err.body?.code === "registro_em_uso_por_vinculo") {
        alert("Este registro está em uso pelo seu vínculo ativo com a organização e não pode ser excluído.");
      } else {
        alert(err.message || "Erro ao excluir.");
      }
    }
  };

  const precisaDeAluno = [
    "avaliacao_sup",
    "transcrever_auto",
    "paralelo",
    "grafico",
    "autoavaliacoes_aluno",
    "anotacoes_campo",
  ].includes(aba);

  return (
    <>
      {/* Menu EAD compartilhado */}
      <MenuEad
        perfil={perfil}
        memberships={memberships}
        papelAtivo={ehAdmin ? "administrador" : "docente"}
        abaAtiva={aba}
        onSelecionarAba={(a) => ir(a as Aba)}
        onSair={onSair}
      />

      <div className="wrap" style={{ marginTop: 20 }}>
        {/* Seletor de Turma e Aluno */}
        {!acessoBloqueado && aba !== "meu_registro" && (
          <div
            className="box"
            style={{
              background: "var(--paper)",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "12px", width: "100%", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ whiteSpace: "nowrap", fontWeight: 700, minWidth: "60px" }}>Turma:</label>
              <select
                value={confirmedTurmaId}
                onChange={(e) => setConfirmedTurmaId(e.target.value)}
                style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}
                disabled={carregandoTurmas}
              >
                <option value="">-- {carregandoTurmas ? "Carregando turmas..." : "Selecione uma turma"} --</option>
                <option value="todas">Todos os alunos (sem filtro de turma)</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({t.campo_estagio})
                  </option>
                ))}
              </select>
            </div>

            {confirmedTurmaId && (precisaDeAluno || aba === "selecionar_alunos") && (
              <div style={{ display: "flex", gap: "12px", width: "100%", alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ whiteSpace: "nowrap", fontWeight: 700, minWidth: "60px" }}>Aluno:</label>
                <select
                  value={confirmedStudentId}
                  onChange={(e) => setConfirmedStudentId(e.target.value)}
                  style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}
                  disabled={carregandoAlunos}
                >
                  <option value="">-- {carregandoAlunos ? "Carregando alunos..." : "Selecione um aluno"} --</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <main className="page">
        {aba === "meu_registro" ? (
          <div className="box">
            <h2 style={{ marginBottom: 15 }}>Meus Registros Profissionais</h2>
            {carregandoRegistros ? (
              <p>Carregando...</p>
            ) : (
              <>
                {meusRegistros.length > 0 ? (
                  <div style={{ marginBottom: 30 }}>
                    <table className="heat" style={{ width: "100%", textAlign: "left" }}>
                      <thead>
                        <tr>
                          <th>Conselho</th>
                          <th>UF</th>
                          <th>Número</th>
                          <th>Categoria</th>
                          <th>Situação</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meusRegistros.map((r) => (
                          <tr key={r.id}>
                            <td>{r.conselho}</td>
                            <td>{r.uf}</td>
                            <td>{r.numero}</td>
                            <td>{r.categoria}</td>
                            <td>{r.situacao === "nao_conferido" ? "Não conferido" : r.situacao}</td>
                            <td>
                              <button className="btn ghost small" onClick={() => handleExcluirRegistro(r.id)}>
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted" style={{ marginBottom: 30 }}>
                    Nenhum registro encontrado.
                  </p>
                )}

                <h3>Adicionar Novo Registro</h3>
                <div style={{ marginTop: 15, maxWidth: 500 }}>
                  <RegistroProfissionalForm onSalvo={carregarMeusRegistros} hidePular />
                </div>
              </>
            )}
          </div>
        ) : acessoBloqueado ? (
          <div
            className="box sec"
            style={{ textAlign: "center", padding: "40px 20px", color: "#d32f2f", fontWeight: "bold" }}
          >
            {acessoBloqueado}
          </div>
        ) : aba === "selecionar_alunos" ? (
          <div className="box sec" style={{ padding: "30px 20px" }}>
            <h2>Alunos da Turma</h2>
            {!confirmedTurmaId ? (
              <p className="muted">Por favor, selecione uma turma acima para listar os alunos.</p>
            ) : alunos.length === 0 ? (
              <p className="muted">Nenhum aluno encontrado nesta turma.</p>
            ) : (
              <table className="heat" style={{ width: "100%", textAlign: "left", marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => {
                            setConfirmedStudentId(a.id);
                            ir("avaliacao_sup");
                          }}
                        >
                          Avaliar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : aba === "calendario" ? (
          !confirmedTurmaId || confirmedTurmaId === "todas" ? (
            <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
              Por favor, selecione uma turma no campo acima.
            </div>
          ) : (
            <div className="box sec" style={{ padding: "30px 20px" }}>
              <h2>Calendário da Turma</h2>
              <p className="muted" style={{ marginBottom: "16px" }}>
                Ratifique o ciclo regional (1º ao penúltimo dia útil) ou lance dias não letivos específicos para esta turma.
              </p>
              <TurmaCalendarioWrapper
                turmaId={confirmedTurmaId}
                inicioTurma={turmas.find((t) => t.id === confirmedTurmaId)?.inicio || "2000-01-01"}
                fimTurma={turmas.find((t) => t.id === confirmedTurmaId)?.fim || "2099-12-31"}
                modoGestao={true}
              />
            </div>
          )
        ) : aba === "aulas" ? (
          !confirmedTurmaId || confirmedTurmaId === "todas" ? (
            <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
              Por favor, selecione uma turma no campo acima.
            </div>
          ) : (
            <div className="box sec" style={{ padding: "40px 20px" }}>
              <h2>Aulas</h2>
              <AulasDocente turmaId={confirmedTurmaId} />
            </div>
          )
        ) : aba === "chamada" ? (
          !confirmedTurmaId || confirmedTurmaId === "todas" ? (
            <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
              Por favor, selecione uma turma no campo acima para chamada.
            </div>
          ) : (
            <div className="box sec" style={{ padding: "40px 20px" }}>
              <h2>Chamada e Frequência</h2>
              <FrequenciaAdmin atribuicoes={memberships.find((m) => m.papel === "administrador" || m.papel === "docente")?.atribuicoes || []} />
              <div style={{ marginTop: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <TarefasTeoricasSupervisao turmaId={confirmedTurmaId} />
              </div>
            </div>
          )
        ) : !confirmedTurmaId ? (
          <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            Por favor, selecione uma turma no campo acima.
          </div>
        ) : !confirmedStudentId ? (
          <div className="box sec" style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
            Por favor, selecione um aluno no campo acima.
          </div>
        ) : (
          <>
            {aba === "avaliacao_sup" && (
              <AvaliacaoSupervisor alunoId={confirmedStudentId} isStudent={false} />
            )}
            {aba === "transcrever_auto" && (
              <AvaliacaoSupervisor
                key={`auto-${confirmedStudentId}`}
                alunoId={confirmedStudentId}
                isStudent={false}
                papel="auto"
              />
            )}
            {aba === "paralelo" && <Paralelo alunoId={confirmedStudentId} />}
            {aba === "grafico" && <GraficoEvolucao alunoId={confirmedStudentId} />}
            {aba === "anotacoes_campo" && (
              <AnotacoesCampoSupervisor
                alunoId={confirmedStudentId}
                alunoNome={alunos.find((a) => a.id === confirmedStudentId)?.name || "Aluno"}
              />
            )}
            {aba === "autoavaliacoes_aluno" &&
              (carregandoAvaliacoes ? (
                <div className="box sec" style={{ textAlign: "center", padding: "40px 20px" }}>
                  Carregando evolução do aluno...
                </div>
              ) : (
                <Evolucao
                  userKey={confirmedStudentId}
                  lista={alunoAvaliacoes}
                  onMudou={() => {}}
                  onAutoavaliar={() => {}}
                />
              ))}
          </>
        )}
      </main>
    </>
  );
}
