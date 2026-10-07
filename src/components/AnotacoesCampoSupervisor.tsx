import { useState, useEffect } from "react";
import { ATIVIDADES } from "../data/itens";
import { getUserToken } from "../api/client";
import { getAnotacoesCampo, getDiasAnotacoesCampo } from "../api/ead";

export default function AnotacoesCampoSupervisor({
  alunoId,
  alunoNome,
}: {
  alunoId: string;
  alunoNome: string;
}) {
  const [diasRegistrados, setDiasRegistrados] = useState<{ data: string; total_procedimentos: number }[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>("");
  const [anotacoes, setAnotacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoDias, setCarregandoDias] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "preenchidos">("preenchidos");
  const [busca, setBusca] = useState("");

  const token = getUserToken();

  useEffect(() => {
    if (!alunoId || !token) return;
    setCarregandoDias(true);
    getDiasAnotacoesCampo(alunoId, token)
      .then((dias) => {
        setDiasRegistrados(dias || []);
        if (dias && dias.length > 0) {
          setDataSelecionada(dias[0].data);
        } else {
          setDataSelecionada("");
          setAnotacoes([]);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar dias do aluno", err);
      })
      .finally(() => {
        setCarregandoDias(false);
      });
  }, [alunoId, token]);

  useEffect(() => {
    if (!alunoId || !dataSelecionada || !token) {
      setAnotacoes([]);
      return;
    }
    setCarregando(true);
    getAnotacoesCampo(alunoId, dataSelecionada, token)
      .then((res) => {
        setAnotacoes(res || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar anotações do aluno", err);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, [alunoId, dataSelecionada, token]);

  const corDificuldade = (dif?: string | null) => {
    if (!dif) return { bg: "#f5f5f5", fg: "#666" };
    switch (dif.toLowerCase()) {
      case "nenhuma":
        return { bg: "#e8f5e9", fg: "#2e7d32" };
      case "baixa":
        return { bg: "#e1f5fe", fg: "#0277bd" };
      case "média":
      case "media":
        return { bg: "#fff3e0", fg: "#e65100" };
      case "alta":
        return { bg: "#ffebee", fg: "#c62828" };
      default:
        return { bg: "#ede7f6", fg: "#512da8" };
    }
  };

  const procedimentos = ATIVIDADES.map((ativ, idx) => {
    const chave = `atividades.${idx}`;
    const salvo = anotacoes.find((a) => a.item_chave === chave);
    const preenchido =
      salvo &&
      (Boolean(salvo.o_que_fez?.trim()) ||
        Boolean(salvo.dificuldade?.trim()) ||
        Boolean(salvo.expectativa?.trim()) ||
        Boolean(salvo.descricao_do_feito?.trim()));

    return { ativ, idx, chave, salvo, preenchido };
  }).filter((item) => {
    if (filtro === "preenchidos" && !item.preenchido) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return (
        item.ativ.texto.toLowerCase().includes(termo) ||
        item.ativ.curto.toLowerCase().includes(termo) ||
        (item.salvo?.descricao_do_feito || "").toLowerCase().includes(termo)
      );
    }
    return true;
  });

  return (
    <div className="box sec" style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Diário de Campo do Aluno</h2>
          <p className="muted" style={{ margin: "4px 0 0 0", fontSize: "0.9em" }}>
            Acompanhamento das vivências práticas de <strong>{alunoNome}</strong> nos procedimentos de estágio. Leitura exclusiva para supervisão.
          </p>
        </div>
      </div>

      {carregandoDias ? (
        <p>Carregando histórico do diário...</p>
      ) : diasRegistrados.length === 0 ? (
        <div className="box" style={{ textAlign: "center", padding: "30px", background: "#f9f9f9" }}>
          <p className="muted" style={{ margin: 0 }}>
            O aluno <strong>{alunoNome}</strong> ainda não possui anotações de campo registradas.
          </p>
        </div>
      ) : (
        <>
          {/* Seletor de Datas Registradas */}
          <div
            className="box"
            style={{
              background: "#f8f9fa",
              padding: "16px",
              marginBottom: "20px",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
              <span style={{ fontWeight: "bold", fontSize: "0.9em" }}>Selecione o Dia de Prática:</span>
              <select
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "200px" }}
              >
                {diasRegistrados.map((d) => (
                  <option key={d.data} value={d.data}>
                    {new Date(d.data + "T12:00:00").toLocaleDateString()} ({d.total_procedimentos} procedimento(s) anotado(s))
                  </option>
                ))}
              </select>
            </div>

            {/* Chips de navegação rápida */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {diasRegistrados.map((d) => (
                <button
                  key={d.data}
                  type="button"
                  className={`btn ${d.data === dataSelecionada ? "solid" : "outline"} small`}
                  style={{ fontSize: "0.8em", padding: "3px 10px" }}
                  onClick={() => setDataSelecionada(d.data)}
                >
                  📅 {new Date(d.data + "T12:00:00").toLocaleDateString()} ({d.total_procedimentos})
                </button>
              ))}
            </div>
          </div>

          {/* Filtros e Busca */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className={`btn ${filtro === "preenchidos" ? "solid" : "ghost"} small`}
                onClick={() => setFiltro("preenchidos")}
              >
                Anotados nesta data ({anotacoes.length})
              </button>
              <button
                type="button"
                className={`btn ${filtro === "todos" ? "solid" : "ghost"} small`}
                onClick={() => setFiltro("todos")}
              >
                Todos os Procedimentos ({ATIVIDADES.length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Filtrar por texto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "220px" }}
            />
          </div>

          {carregando ? (
            <div style={{ textAlign: "center", padding: "30px" }}>
              <p>Carregando registros do dia...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {procedimentos.map(({ ativ, idx, chave, salvo, preenchido }) => {
                const corDif = corDificuldade(salvo?.dificuldade);

                return (
                  <div
                    key={chave}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      background: preenchido ? "#ffffff" : "#fafafa",
                      borderLeft: preenchido ? "4px solid #0288d1" : "4px solid #e0e0e0",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
                      <div>
                        <span
                          style={{
                            fontSize: "0.8em",
                            backgroundColor: "#e1f5fe",
                            color: "#0277bd",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: "bold",
                            marginRight: "8px",
                          }}
                        >
                          Procedimento {idx + 1}
                        </span>
                        <strong style={{ fontSize: "1.05em" }}>{ativ.texto}</strong>
                      </div>

                      {preenchido ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {salvo.o_que_fez && (
                            <span
                              style={{
                                fontSize: "0.8em",
                                backgroundColor: "#f5f5f5",
                                color: "#333",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontWeight: 600,
                              }}
                            >
                              {salvo.o_que_fez}
                            </span>
                          )}
                          {salvo.dificuldade && (
                            <span
                              style={{
                                fontSize: "0.8em",
                                backgroundColor: corDif.bg,
                                color: corDif.fg,
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontWeight: "bold",
                              }}
                            >
                              Dificuldade: {salvo.dificuldade}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="muted" style={{ fontSize: "0.8em" }}>Não registrado nesta data</span>
                      )}
                    </div>

                    {preenchido ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px", backgroundColor: "#fbfbfb", padding: "12px 16px", borderRadius: "6px" }}>
                        {salvo.expectativa && (
                          <div>
                            <span style={{ fontSize: "0.85em", fontWeight: "bold", color: "#555", display: "block" }}>
                              Expectativa / Aprendizado Esperado:
                            </span>
                            <p style={{ margin: "4px 0", fontSize: "0.95em", color: "#222" }}>
                              {salvo.expectativa}
                            </p>
                          </div>
                        )}

                        {salvo.descricao_do_feito && (
                          <div>
                            <span style={{ fontSize: "0.85em", fontWeight: "bold", color: "#555", display: "block" }}>
                              Descrição do Feito pelo Aluno:
                            </span>
                            <p style={{ margin: "4px 0", fontSize: "0.95em", color: "#222", whiteSpace: "pre-wrap" }}>
                              {salvo.descricao_do_feito}
                            </p>
                          </div>
                        )}

                        {!salvo.expectativa && !salvo.descricao_do_feito && (
                          <span className="muted" style={{ fontSize: "0.85em" }}>
                            Aluno registrou apenas status/dificuldade sem texto descritivo.
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {procedimentos.length === 0 && (
                <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                  Nenhum procedimento encontrado para o filtro selecionado.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
