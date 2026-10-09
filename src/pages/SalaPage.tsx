import { useMemo, useState, useEffect } from "react";
import type { Profile, Membership } from "../api/client";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import Paralelo from "../components/Paralelo";
import GraficoEvolucao from "../components/GraficoEvolucao";
import MinhaFrequencia from "../components/MinhaFrequencia";
import TurmaCalendarioWrapper from "../components/TurmaCalendarioWrapper";
import PlanejamentoAluno from "../components/PlanejamentoAluno";
import AnotacoesCampoAluno from "../components/AnotacoesCampoAluno";
import TarefasTeoricas from "../components/TarefasTeoricas";
import MenuEad from "../components/MenuEad";
import type { Avaliacao } from "../lib/historico";
import guiaHtml from "../content/guia.html?raw";
import { getMinhasTurmas } from "../api/ead";
import { getUserToken } from "../api/client";

type Aba =
  | "dashboard"
  | "inicio"
  | "autoavaliacao"
  | "evolucao"
  | "grafico"
  | "avaliacoes_recebidas"
  | "calendario"
  | "planejamento"
  | "presenca"
  | "guia"
  | "tarefas_teoricas"
  | "anotacoes_campo";

const FOTO_ESTRUTURA = "https://etcr.com.br/site/wp-content/uploads/2020/01/blog-banner.jpg";

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function chaveDoAluno(p: Profile): string {
  return texto(p, "id") || texto(p, "uuid") || texto(p, "email") || "anonimo";
}

function primeiroNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes[0] || "Aluno";
}

export default function SalaPage({
  perfil,
  memberships = [],
  onSair,
}: {
  perfil: Profile;
  memberships?: Membership[];
  onSair: () => void;
}) {
  const [aba, setAba] = useState<Aba>("dashboard");
  const [ciclo, setCiclo] = useState<number>(() => {
    const salvo = localStorage.getItem(`ciclo:${chaveDoAluno(perfil)}`);
    const n = Number(salvo);
    return n >= 1 && n <= 4 ? n : 1;
  });
  function escolherCiclo(n: number) {
    setCiclo(n);
    localStorage.setItem(`ciclo:${userKey}`, String(n));
  }
  const orientacaoCiclo = useMemo(() => {
    const m = guiaHtml.match(new RegExp(`<article class="cycle k${ciclo}" id="c${ciclo}">[\\s\\S]*?</article>`));
    return m ? m[0] : "";
  }, [ciclo]);
  const userKey = useMemo(() => chaveDoAluno(perfil), [perfil]);
  const nome = texto(perfil, "name") || "Aluno";
  const primeiro = primeiroNome(nome);

  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [turma, setTurma] = useState<any>(null);

  useEffect(() => {
    const token = getUserToken();
    if (token) {
      getMinhasTurmas(token)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setTurma(res[0]);
          }
        })
        .catch((err) => {
          console.error("Erro ao carregar turma do aluno", err);
        });
    }
  }, []);

  useEffect(() => {
    const runMigrationAndLoad = async () => {
      try {
        const { carregarLocal, carregarDaAPI } = await import("../lib/historico");
        const { saveAvaliacao } = await import("../api/ead");
        const { getUserToken: getToken } = await import("../api/client");
        const localList = carregarLocal(userKey);
        const token = getToken();

        if (localList.length > 0 && token) {
          const apiList = await carregarDaAPI(userKey, "auto");
          for (const av of localList) {
            const exists = apiList.find((a) => a.etapa === av.etapa && a.momento === av.momento);
            if (!exists) {
              const { GERAIS, ATIVIDADES } = await import("../data/itens");
              const promises: Promise<unknown>[] = [];
              av.gerais.forEach((nota, i) => {
                if (nota !== null) {
                  promises.push(
                    saveAvaliacao(
                      {
                        aluno_user_id: userKey,
                        item_chave: `gerais.${i}`,
                        item_texto: GERAIS[i].texto,
                        grupo: "gerais",
                        papel: "auto",
                        nota: typeof nota === "number" ? nota : null,
                        nao_praticou: nota === "na",
                        etapa: String(av.etapa),
                        momento: av.momento,
                        comentario: av.obs,
                      },
                      token,
                    ),
                  );
                }
              });
              av.atividades.forEach((nota, i) => {
                if (nota !== null) {
                  promises.push(
                    saveAvaliacao(
                      {
                        aluno_user_id: userKey,
                        item_chave: `atividades.${i}`,
                        item_texto: ATIVIDADES[i].texto,
                        grupo: "atividades",
                        papel: "auto",
                        nota: typeof nota === "number" ? nota : null,
                        nao_praticou: nota === "na",
                        etapa: String(av.etapa),
                        momento: av.momento,
                        comentario: av.obs,
                      },
                      token,
                    ),
                  );
                }
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const turmaInfo = turma
    ? {
        nome: turma.nome,
        codigo: turma.codigo || undefined,
        turno: turma.turno || undefined,
      }
    : undefined;

  return (
    <div className="sala-etcr-root">
      {/* Menu EAD compartilhado com padrão Enfaci */}
      <MenuEad
        perfil={perfil}
        memberships={memberships}
        papelAtivo="aluno"
        abaAtiva={aba}
        onSelecionarAba={(a) => ir(a as Aba)}
        onSair={onSair}
        turmaInfo={turmaInfo}
      />

      {/* Conteúdo Principal */}
      <main className="page sala-etcr-page">
        {(aba === "dashboard" || aba === "inicio") && (
          <div className="wrap sala-dashboard">
            {/* Saudação com o nome do aluno */}
            <section className="sala-hero">
              <h1 className="sala-hero-titulo">Olá, {primeiro}!</h1>
              <p className="sala-hero-sub">
                Bem-vindo à sua sala de aprendizagem e acompanhamento prático do estágio de enfermagem da ETCR.
              </p>

              {/* Indicador de Etapa Corrente no Verde #00AD57 */}
              <div className="etapa-corrente-box">
                <span className="etapa-corrente-rotulo">Ciclo em andamento:</span>
                <div className="etapa-tags">
                  {[1, 2, 3, 4].map((et) => (
                    <button
                      type="button"
                      key={et}
                      className={et === ciclo ? "etapa-pill ativa" : "etapa-pill"}
                      onClick={() => escolherCiclo(et)}
                    >
                      Ciclo {et}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="guia" aria-label="Orientações do ciclo">
              <div dangerouslySetInnerHTML={{ __html: orientacaoCiclo }} />
            </section>

            {/* Cards no padrão da página /estrutura/ */}
            <section className="estrutura-grid">
              {/* Card 1: Autoavaliação */}
              <div className="estrutura-card" onClick={() => ir("autoavaliacao")}>
                <div
                  className="estrutura-card-img"
                  style={{ backgroundImage: `url(${FOTO_ESTRUTURA})` }}
                />
                <div className="estrutura-card-overlay" />
                <div className="estrutura-card-conteudo">
                  <span className="estrutura-card-badge">Ciclo {ciclo}</span>
                  <h3 className="estrutura-card-titulo">Autoavaliação</h3>
                  <p className="estrutura-card-desc">
                    Avalie seu domínio nos itens de comportamento e técnicas práticas.
                  </p>
                  <span className="estrutura-card-link">Acessar autoavaliação →</span>
                </div>
              </div>

              {/* Card 2: Gráfico de Evolução */}
              <div className="estrutura-card" onClick={() => ir("grafico")}>
                <div
                  className="estrutura-card-img"
                  style={{ backgroundImage: `url(${FOTO_ESTRUTURA})` }}
                />
                <div className="estrutura-card-overlay" />
                <div className="estrutura-card-conteudo">
                  <span className="estrutura-card-badge">Evolução</span>
                  <h3 className="estrutura-card-titulo">Gráfico de Evolução</h3>
                  <p className="estrutura-card-desc">
                    Acompanhe a curva de progresso das suas notas em cada momento do ciclo.
                  </p>
                  <span className="estrutura-card-link">Ver gráficos →</span>
                </div>
              </div>

              {/* Card 3: Guia do Estágio */}
              <div className="estrutura-card" onClick={() => ir("guia")}>
                <div
                  className="estrutura-card-img"
                  style={{ backgroundImage: `url(${FOTO_ESTRUTURA})` }}
                />
                <div className="estrutura-card-overlay" />
                <div className="estrutura-card-conteudo">
                  <span className="estrutura-card-badge">Biblioteca</span>
                  <h3 className="estrutura-card-titulo">Guia do Estágio</h3>
                  <p className="estrutura-card-desc">
                    Consulte procedimentos, normas de conduta e orientações práticas da escola.
                  </p>
                  <span className="estrutura-card-link">Ler guia →</span>
                </div>
              </div>

              {/* Card 4: Minha Evolução */}
              <div className="estrutura-card" onClick={() => ir("evolucao")}>
                <div
                  className="estrutura-card-img"
                  style={{ backgroundImage: `url(${FOTO_ESTRUTURA})` }}
                />
                <div className="estrutura-card-overlay" />
                <div className="estrutura-card-conteudo">
                  <span className="estrutura-card-badge">{lista.length} salvas</span>
                  <h3 className="estrutura-card-titulo">Minha Evolução</h3>
                  <p className="estrutura-card-desc">
                    Mapa de calor completo e histórico de avaliações geradas.
                  </p>
                  <span className="estrutura-card-link">Ver histórico →</span>
                </div>
              </div>
            </section>

          </div>
        )}

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

        {aba === "grafico" && (
          <GraficoEvolucao alunoId={userKey} />
        )}

        {aba === "avaliacoes_recebidas" && (
          <>
            <Paralelo alunoId={userKey} />
            <GraficoEvolucao alunoId={userKey} />
          </>
        )}

        {aba === "calendario" && (
          <div className="wrap sec">
            <div className="box" style={{ padding: "30px 20px" }}>
              <h2>Calendário da Turma</h2>
              {turma ? (
                <TurmaCalendarioWrapper
                  turmaId={turma.id}
                  inicioTurma={turma.inicio || "2000-01-01"}
                  fimTurma={turma.fim || "2099-12-31"}
                />
              ) : (
                <p className="muted" style={{ marginTop: 12 }}>Nenhum calendário de turma ativo no momento.</p>
              )}
            </div>
          </div>
        )}

        {aba === "planejamento" && (
          <div className="wrap sec">
            <div className="box" style={{ padding: "30px 20px" }}>
              <h2>Planejamento da Turma</h2>
              {turma ? (
                <PlanejamentoAluno turmaId={turma.id} />
              ) : (
                <p className="muted" style={{ marginTop: 12 }}>Nenhum planejamento de turma disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {aba === "presenca" && (
          <div className="wrap sec">
            <MinhaFrequencia turmaId={turma?.id || ""} />
          </div>
        )}

        {aba === "tarefas_teoricas" && <TarefasTeoricas />}

        {aba === "anotacoes_campo" && (
          <div className="wrap sec">
            <AnotacoesCampoAluno userKey={userKey} />
          </div>
        )}
      </main>
    </div>
  );
}
