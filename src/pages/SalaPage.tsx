import { useMemo, useState, useEffect } from "react";
import type { Profile, Membership } from "../api/client";
import Autoavaliacao from "../components/Autoavaliacao";
import Evolucao from "../components/Evolucao";
import Guia from "../components/Guia";
import Paralelo from "../components/Paralelo";
import GraficoEvolucao from "../components/GraficoEvolucao";
import type { Avaliacao } from "../lib/historico";
import guiaHtml from "../content/guia.html?raw";

type Aba = "dashboard" | "guia" | "autoavaliacao" | "evolucao" | "grafico" | "avaliacoes_recebidas";

const LOGO_ETCR = "https://etcr.com.br/site/wp-content/uploads/2025/09/LogoAtualizado.svg";
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
  onSair,
}: {
  perfil: Profile;
  memberships?: Membership[];
  onSair: () => void;
}) {
  const [aba, setAba] = useState<Aba>("guia");
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
  const emailVerificado = !!perfil.email_verified_at;

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

  return (
    <div className="sala-etcr-root">
      {/* Topo com Logo Oficial e Nome da Escola */}
      <header className="topbar-etcr">
        <div className="topbar-etcr-in">
          <div className="topbar-etcr-marca" onClick={() => ir("dashboard")} style={{ cursor: "pointer" }}>
            <img src={LOGO_ETCR} alt="ETCR Escola Técnica" className="topbar-etcr-logo" />
            <div className="topbar-etcr-titulos">
              <span className="topbar-etcr-escola">Escola Técnica Cristo Redentor</span>
              <span className="topbar-etcr-sub">Sala do Aluno · EAD</span>
            </div>
          </div>

          <div className="topbar-etcr-usuario">
            <div className="topbar-etcr-perfil">
              <span className="topbar-etcr-aluno">{nome}</span>
              {!emailVerificado && (
                <span className="badge-pendencia" title="E-mail não confirmado na conta">
                  E-mail pendente
                </span>
              )}
            </div>
            <button className="btn-etcr-ghost small" onClick={onSair}>
              Sair
            </button>
          </div>
        </div>

        {/* Navegação por Abas */}
        <nav className="nav-etcr" role="tablist" aria-label="Seções da sala">
          <button
            role="tab"
            aria-selected={aba === "dashboard"}
            className={aba === "dashboard" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("dashboard")}
          >
            Início
          </button>
          <button
            role="tab"
            aria-selected={aba === "autoavaliacao"}
            className={aba === "autoavaliacao" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("autoavaliacao")}
          >
            Autoavaliação
          </button>
          <button
            role="tab"
            aria-selected={aba === "evolucao"}
            className={aba === "evolucao" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("evolucao")}
          >
            Minha evolução{lista.length ? ` (${lista.length})` : ""}
          </button>
          <button
            role="tab"
            aria-selected={aba === "grafico"}
            className={aba === "grafico" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("grafico")}
          >
            Gráfico de evolução
          </button>
          <button
            role="tab"
            aria-selected={aba === "guia"}
            className={aba === "guia" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("guia")}
          >
            Guia do estágio
          </button>
          <button
            role="tab"
            aria-selected={aba === "avaliacoes_recebidas"}
            className={aba === "avaliacoes_recebidas" ? "nav-etcr-item ativo" : "nav-etcr-item"}
            onClick={() => ir("avaliacoes_recebidas")}
          >
            Avaliações recebidas
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="page sala-etcr-page">
        {aba === "dashboard" && (
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

            <section className="guia" aria-label="Orientações do ciclo">
              <div dangerouslySetInnerHTML={{ __html: orientacaoCiclo }} />
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
      </main>
    </div>
  );
}
