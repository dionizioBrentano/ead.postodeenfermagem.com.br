import { useState, useEffect, useMemo, type DragEvent } from "react";
import {
  PRESCRICAO_FICTICIA,
  OPCOES_TURNO,
  type TipoTurno,
  type TarefaArrastavel,
  type MarcaPrimeiraVia,
  extrairTarefasDaPrescricao,
  gerarHorariosTurno,
} from "../data/prescricaoFicticia";
import {
  salvarRespostaTarefa,
  getTarefasTeoricas,
} from "../api/ead";
import { getUserToken } from "../api/client";

interface Props {
  turmaId?: string;
  isDocente?: boolean;
  onVoltar?: () => void;
}

export default function OrganizacaoPlantaoExercicio({
  turmaId,
  isDocente = false,
  onVoltar,
}: Props) {
  // 1. Configuração do turno (Requisito 3)
  const [tipoTurno, setTipoTurno] = useState<TipoTurno>("4h");
  const [inicioHora, setInicioHora] = useState<string>("07:00");

  // 2. Tarefas e Grade da organização (Requisitos 4 e 5)
  const todasTarefas = useMemo(() => extrairTarefasDaPrescricao(PRESCRICAO_FICTICIA), []);
  const [grade, setGrade] = useState<Record<string, TarefaArrastavel[]>>({});
  const [tarefaSelecionadaId, setTarefaSelecionadaId] = useState<string | null>(null);

  // 3. Marcas da 1ª via (Requisito 3)
  const [marcasPrimeiraVia, setMarcasPrimeiraVia] = useState<Record<string, MarcaPrimeiraVia>>({});

  // 4. Conduta de enfermagem (Requisito 4)
  const [conduta, setConduta] = useState<string>("");

  // 5. Estado de entrega
  const [enviando, setEnviando] = useState(false);
  const [statusEntrega, setStatusEntrega] = useState<"rascunho" | "entregue" | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [tarefaApiId, setTarefaApiId] = useState<string>("organizacao-plantao");

  const opcaoSelecionada = useMemo(
    () => OPCOES_TURNO.find((o) => o.chave === tipoTurno) || OPCOES_TURNO[0],
    [tipoTurno]
  );

  const horariosSlots = useMemo(
    () => gerarHorariosTurno(inicioHora, opcaoSelecionada.duracaoHoras),
    [inicioHora, opcaoSelecionada.duracaoHoras]
  );

  const handleTrocarTurno = (novoTipo: TipoTurno) => {
    setTipoTurno(novoTipo);
    const op = OPCOES_TURNO.find((o) => o.chave === novoTipo);
    if (op) {
      setInicioHora(op.inicioPadrao);
    }
  };

  // Carrega resposta salva do aluno/teste caso exista
  useEffect(() => {
    const token = getUserToken();
    if (!token) return;

    getTarefasTeoricas(turmaId, token)
      .then((tarefas: any) => {
        if (Array.isArray(tarefas) && tarefas.length > 0) {
          const t = tarefas.find((x: any) => x.tipo === "organizacao_plantao") || tarefas[0];
          if (t?.id) {
            setTarefaApiId(t.id);
            if (t.minha_resposta?.status) {
              setStatusEntrega(t.minha_resposta.status);
              const payload = t.minha_resposta.payload;
              if (payload?.grade) {
                setGrade(payload.grade);
              }
              if (payload?.turno) {
                setTipoTurno(payload.turno.tipo || "4h");
                setInicioHora(payload.turno.inicio || "07:00");
              }
              if (payload?.marcasPrimeiraVia) {
                setMarcasPrimeiraVia(payload.marcasPrimeiraVia);
              }
              if (payload?.conduta) {
                setConduta(payload.conduta);
              }
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Não foi possível carregar resposta da API, usando armazenamento local.", err);
      });
  }, [turmaId]);

  const tarefasColadasIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(grade).forEach((lista) => {
      lista.forEach((item) => ids.add(item.id));
    });
    return ids;
  }, [grade]);

  const tarefasDisponiveis = useMemo(() => {
    return todasTarefas.filter((t) => !tarefasColadasIds.has(t.id));
  }, [todasTarefas, tarefasColadasIds]);

  const handleToqueTarefaDisponivel = (tarefa: TarefaArrastavel) => {
    if (tarefaSelecionadaId === tarefa.id) {
      setTarefaSelecionadaId(null);
    } else {
      setTarefaSelecionadaId(tarefa.id);
    }
  };

  const handleToqueSlot = (horario: string) => {
    if (!tarefaSelecionadaId) return;

    const tarefa = todasTarefas.find((t) => t.id === tarefaSelecionadaId);
    if (!tarefa) return;

    setGrade((prev) => {
      const nova = { ...prev };
      Object.keys(nova).forEach((h) => {
        nova[h] = (nova[h] || []).filter((item) => item.id !== tarefa.id);
      });
      nova[horario] = [...(nova[horario] || []), tarefa];
      return nova;
    });

    setTarefaSelecionadaId(null);
  };

  const handleSoltarTarefaSlot = (horario: string, tarefaId: string) => {
    setGrade((prev) => {
      const nova = { ...prev };
      nova[horario] = (nova[horario] || []).filter((t) => t.id !== tarefaId);
      return nova;
    });
    if (tarefaSelecionadaId === tarefaId) {
      setTarefaSelecionadaId(null);
    }
  };

  const handleDragStart = (e: DragEvent, tarefaId: string) => {
    e.dataTransfer.setData("text/plain", tarefaId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDropSlot = (e: DragEvent, horario: string) => {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData("text/plain");
    if (!tarefaId) return;

    const tarefa = todasTarefas.find((t) => t.id === tarefaId);
    if (!tarefa) return;

    setGrade((prev) => {
      const nova = { ...prev };
      Object.keys(nova).forEach((h) => {
        nova[h] = (nova[h] || []).filter((item) => item.id !== tarefa.id);
      });
      nova[horario] = [...(nova[horario] || []), tarefa];
      return nova;
    });
  };

  // Grava resposta (Rascunho ou Entregue)
  const handleSalvar = async (status: "rascunho" | "entregue") => {
    setEnviando(true);
    setMensagemStatus(null);

    const payload = {
      turno: {
        tipo: tipoTurno,
        duracaoHoras: opcaoSelecionada.duracaoHoras,
        inicio: inicioHora,
      },
      grade,
      marcasPrimeiraVia,
      conduta,
      data_gravacao: new Date().toISOString(),
    };

    const token = getUserToken();
    // Ver como aluno sempre salva com origem teste (Requisito 5)
    const origem = isDocente ? "teste" : "aluno";

    try {
      if (token) {
        await salvarRespostaTarefa(tarefaApiId, payload, status, origem, token);
      }
      setStatusEntrega(status);
      setMensagemStatus(
        status === "entregue"
          ? "Organização do plantão entregue com sucesso! A presença é decidida pelo professor."
          : "Rascunho salvo com sucesso."
      );
    } catch (err: any) {
      console.error("Erro ao gravar resposta da tarefa", err);
      localStorage.setItem(`cola_exercicio:${tarefaApiId}`, JSON.stringify(payload));
      setStatusEntrega(status);
      setMensagemStatus(
        status === "entregue"
          ? "Organização gravada localmente. A presença é decidida pelo professor."
          : "Rascunho gravado localmente."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        background: "#f8f6f1",
        color: "#3a3a3a",
        minHeight: "100%",
        padding: "8px 0 40px",
      }}
    >
      <div className="wrap">
        {onVoltar && (
          <button
            type="button"
            className="guia-btn-voltar"
            onClick={onVoltar}
            style={{ marginBottom: "16px" }}
          >
            ← Voltar às Tarefas Teóricas
          </button>
        )}

        {/* Cabeçalho */}
        <header
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1a3a35",
                  background: "#f0ede6",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                09/10/2026 · Tarefa Teórica Interativa
              </span>
              <h1 style={{ fontSize: "24px", margin: "4px 0 8px", color: "#222222" }}>
                Organização do plantão ("Cola do plantão")
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#666666" }}>
                Transcreva e organize as rotinas da prescrição do paciente distribuindo os horários no seu turno de estágio.
              </p>
            </div>

            {isDocente && (
              <span
                style={{
                  background: "#fff3cd",
                  color: "#856404",
                  border: "1px solid #ffeeba",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Visão de Teste (origem: teste)
              </span>
            )}
          </div>
        </header>

        {/* 1. Definição do Turno de Atuação */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "18px 24px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "16px", margin: "0 0 12px", color: "#222222" }}>
            1. Definição do Turno de Atuação
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {OPCOES_TURNO.map((op) => (
                <button
                  key={op.chave}
                  type="button"
                  onClick={() => handleTrocarTurno(op.chave)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: `1.5px solid ${tipoTurno === op.chave ? "#1a3a35" : "#e6e4e1"}`,
                    background: tipoTurno === op.chave ? "#1a3a35" : "#ffffff",
                    color: tipoTurno === op.chave ? "#ffffff" : "#3a3a3a",
                    fontWeight: tipoTurno === op.chave ? 600 : 500,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {op.rotulo}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="inicio-hora" style={{ fontSize: "14px", fontWeight: 500 }}>
                Início:
              </label>
              <input
                id="inicio-hora"
                type="time"
                value={inicioHora}
                onChange={(e) => setInicioHora(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #e6e4e1",
                  fontSize: "14px",
                  color: "#3a3a3a",
                  background: "#ffffff",
                }}
              />
              <span style={{ fontSize: "13px", color: "#777777" }}>
                ({opcaoSelecionada.duracaoHoras} horas de plantão)
              </span>
            </div>
          </div>
        </section>

        {/* 2. Prescrição Fictícia e 1ª Via (Requisitos 2 e 3) */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "16px", margin: "0 0 4px", color: "#222222" }}>
                2. Prescrição Médica e de Enfermagem (1ª Via)
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
                Cheque o que foi realizado (barra /) ou circule (círculo ○) se não foi feito ou foi reaprazado.
              </p>
            </div>
            <span style={{ fontSize: "12px", color: "#666666" }}>
              {PRESCRICAO_FICTICIA.hospital} · {PRESCRICAO_FICTICIA.unidade}
            </span>
          </div>

          <div
            style={{
              background: "#faf9f6",
              border: "1px solid #eae7e1",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "8px",
            }}
          >
            <div><strong>Paciente:</strong> {PRESCRICAO_FICTICIA.paciente}</div>
            <div><strong>Leito:</strong> {PRESCRICAO_FICTICIA.leito}</div>
            <div><strong>Diagnóstico:</strong> {PRESCRICAO_FICTICIA.diagnostico}</div>
            <div><strong>Alergias:</strong> {PRESCRICAO_FICTICIA.alergias}</div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f0ede6", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                    Apresentação do fármaco
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                    Dose
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                    Via
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                    Frequência
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                    S/N ou horários aprazados
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a", minWidth: "220px" }}>
                    Marcas da 1ª via
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRESCRICAO_FICTICIA.itens.map((it) => {
                  const marca = marcasPrimeiraVia[it.id] || { status: "nenhum" };
                  const isCirculado = marca.status === "circulado";
                  const isChecado = marca.status === "checado";

                  return (
                    <tr
                      key={it.id}
                      style={{
                        borderBottom: "1px solid #f2f0ec",
                        background: isCirculado ? "#fffdf5" : isChecado ? "#f7fdf9" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                        <span
                          style={{
                            display: isCirculado ? "inline-block" : "inline",
                            border: isCirculado ? "1.5px solid #d97706" : "none",
                            borderRadius: isCirculado ? "16px" : "0",
                            padding: isCirculado ? "2px 8px" : "0",
                          }}
                        >
                          {it.apresentacao}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#444444" }}>
                        {it.dose}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#555555", fontWeight: 600 }}>
                        {it.via}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#666666" }}>
                        {it.frequencia}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#666666" }}>
                        {it.horariosAprazados}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {/* Botão Checar (/) */}
                            <button
                              type="button"
                              onClick={() => {
                                setMarcasPrimeiraVia((prev) => ({
                                  ...prev,
                                  [it.id]: isChecado
                                    ? { status: "nenhum" }
                                    : { status: "checado" },
                                }));
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: `1px solid ${isChecado ? "#00AD57" : "#e6e4e1"}`,
                                background: isChecado ? "#00AD57" : "#ffffff",
                                color: isChecado ? "#ffffff" : "#3a3a3a",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                              title="Marcar como realizado (/)"
                            >
                              / Checar
                            </button>

                            {/* Botão Circular (○) */}
                            <button
                              type="button"
                              onClick={() => {
                                setMarcasPrimeiraVia((prev) => ({
                                  ...prev,
                                  [it.id]: isCirculado
                                    ? { status: "nenhum" }
                                    : { status: "circulado", motivo: "nao_feito" },
                                }));
                              }}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: `1px solid ${isCirculado ? "#d97706" : "#e6e4e1"}`,
                                background: isCirculado ? "#fef3c7" : "#ffffff",
                                color: isCirculado ? "#92400e" : "#3a3a3a",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                              title="Circular não feito ou reaprazado (○)"
                            >
                              ○ Circular
                            </button>
                          </div>

                          {/* Se circular, opções de motivo e novo horário se reaprazado */}
                          {isCirculado && (
                            <div
                              style={{
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: "6px",
                                padding: "6px 8px",
                                fontSize: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "3px", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name={`motivo-${it.id}`}
                                    checked={marca.motivo !== "reaprazado"}
                                    onChange={() =>
                                      setMarcasPrimeiraVia((prev) => ({
                                        ...prev,
                                        [it.id]: { ...marca, motivo: "nao_feito", horarioNovo: undefined },
                                      }))
                                    }
                                  />
                                  Não feito
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "3px", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name={`motivo-${it.id}`}
                                    checked={marca.motivo === "reaprazado"}
                                    onChange={() =>
                                      setMarcasPrimeiraVia((prev) => ({
                                        ...prev,
                                        [it.id]: { ...marca, motivo: "reaprazado" },
                                      }))
                                    }
                                  />
                                  Reaprazado
                                </label>
                              </div>

                              {marca.motivo === "reaprazado" && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "11px", color: "#78350f" }}>Novo horário:</span>
                                  <input
                                    type="text"
                                    placeholder="ex: 10:00"
                                    value={marca.horarioNovo || ""}
                                    onChange={(e) =>
                                      setMarcasPrimeiraVia((prev) => ({
                                        ...prev,
                                        [it.id]: { ...marca, horarioNovo: e.target.value },
                                      }))
                                    }
                                    style={{
                                      padding: "3px 6px",
                                      borderRadius: "4px",
                                      border: "1px solid #d97706",
                                      fontSize: "12px",
                                      width: "90px",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Tarefas Extraídas da Prescrição */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 4px", color: "#222222" }}>
              3. Tarefas Extraídas da Prescrição ({tarefasDisponiveis.length} disponíveis)
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
              Toque na tarefa e depois toque no horário da organização para colar. Ou arraste a tarefa até o horário.
            </p>
          </div>

          {tarefasDisponiveis.length === 0 ? (
            <div
              style={{
                background: "#f0ede6",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                fontSize: "14px",
                color: "#666666",
              }}
            >
              ✓ Todas as tarefas foram distribuídas na sua organização do plantão!
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {tarefasDisponiveis.map((tar) => {
                const selecionada = tarefaSelecionadaId === tar.id;
                return (
                  <button
                    key={tar.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, tar.id)}
                    onClick={() => handleToqueTarefaDisponivel(tar)}
                    style={{
                      background: selecionada ? "#1a3a35" : "#faf9f6",
                      color: selecionada ? "#ffffff" : "#3a3a3a",
                      border: `1.5px solid ${selecionada ? "#1a3a35" : "#e6e4e1"}`,
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      boxShadow: selecionada ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{tar.rotulo}</span>
                    {tar.detalhes && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: selecionada ? "#dddddd" : "#777777",
                        }}
                      >
                        {tar.detalhes}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {tarefaSelecionadaId && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                background: "#f0ede6",
                borderRadius: "6px",
                fontSize: "13px",
                color: "#1a3a35",
                fontWeight: 500,
              }}
            >
              👉 Tarefa selecionada! Toque agora em um horário da tabela abaixo para colar.
            </div>
          )}
        </section>

        {/* 4. Grade da Organização do Plantão (Linha do Tempo) */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 4px", color: "#222222" }}>
              4. Sua Organização do Plantão (Linha do Tempo)
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
              Toque em uma tarefa colada para soltá-la de volta à lista de disponíveis.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {horariosSlots.map((horario) => {
              const tarefasNoSlot = grade[horario] || [];
              return (
                <div
                  key={horario}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropSlot(e, horario)}
                  onClick={() => handleToqueSlot(horario)}
                  style={{
                    border: `1.5px dashed ${tarefaSelecionadaId ? "#00AD57" : "#e6e4e1"}`,
                    borderRadius: "10px",
                    padding: "12px",
                    background: tarefaSelecionadaId ? "#fafffa" : "#ffffff",
                    minHeight: "110px",
                    cursor: tarefaSelecionadaId ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #f0ede6",
                      paddingBottom: "6px",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a3a35" }}>
                      ⏰ {horario}
                    </span>
                    <span style={{ fontSize: "11px", color: "#888888" }}>
                      {tarefasNoSlot.length} item(ns)
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    {tarefasNoSlot.length === 0 ? (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#999999",
                          fontStyle: "italic",
                          margin: "auto 0",
                          textAlign: "center",
                        }}
                      >
                        {tarefaSelecionadaId ? "Toque para colar aqui" : "Sem tarefas coladas"}
                      </span>
                    ) : (
                      tarefasNoSlot.map((t) => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSoltarTarefaSlot(horario, t.id);
                          }}
                          title="Toque para remover do horário"
                          style={{
                            background: "#faf9f6",
                            border: "1px solid #e6e4e1",
                            borderRadius: "6px",
                            padding: "6px 8px",
                            fontSize: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{t.rotulo}</span>
                          <span
                            style={{
                              marginLeft: "6px",
                              color: "#c0392b",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Campo de Conduta da Enfermagem (Requisito 4) */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "16px", margin: "0 0 8px", color: "#222222" }}>
            5. Conduta da Enfermagem
          </h2>
          <label
            htmlFor="conduta-enfermagem"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#3a3a3a",
              marginBottom: "8px",
            }}
          >
            Descreva o que checou, o que circulou e o motivo, e o horário antigo e o novo quando reaprazar.
          </label>
          <textarea
            id="conduta-enfermagem"
            rows={4}
            value={conduta}
            onChange={(e) => setConduta(e.target.value)}
            placeholder="Registre aqui as checagens realizadas, itens circulados com seus motivos, e horários reaprazados (horário antigo e novo horário de administração)..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #e6e4e1",
              fontSize: "14px",
              color: "#3a3a3a",
              background: "#ffffff",
              resize: "vertical",
              fontFamily: "inherit",
              lineHeight: 1.5,
            }}
          />
        </section>

        {/* 6. Ações de Gravação e Entrega (Requisito 4 e 5) */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#222222" }}>
                A presença é decidida pelo professor.
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
                A entrega grava sua organização (grade), as marcas da 1ª via e a conduta descrita.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                disabled={enviando}
                onClick={() => handleSalvar("rascunho")}
                style={{
                  background: "#f0ede6",
                  color: "#3a3a3a",
                  border: "1px solid #e6e4e1",
                  borderRadius: "8px",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: enviando ? "not-allowed" : "pointer",
                }}
              >
                Salvar Rascunho
              </button>

              <button
                type="button"
                disabled={enviando}
                onClick={() => handleSalvar("entregue")}
                style={{
                  background: "#00AD57",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: enviando ? "not-allowed" : "pointer",
                }}
              >
                {enviando ? "Entregando..." : "Entregar Organização"}
              </button>
            </div>
          </div>

          {mensagemStatus && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                background: statusEntrega === "entregue" ? "#e8f8f0" : "#fdf8e2",
                color: statusEntrega === "entregue" ? "#1a7040" : "#856404",
                border: `1px solid ${statusEntrega === "entregue" ? "#b7ebd0" : "#faebcc"}`,
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {mensagemStatus}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
