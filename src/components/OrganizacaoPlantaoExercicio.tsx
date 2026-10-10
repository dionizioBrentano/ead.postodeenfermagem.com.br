import { useState, useEffect, useMemo, type DragEvent } from "react";
import {
  PRESCRICAO_ESTUDO,
  PRESCRICAO_TESTE,
  OPCOES_TURNO,
  type TipoTurno,
  type TarefaArrastavel,
  type MarcaPrimeiraVia,
  type PrescricaoFicticia,
  PASSOS_COMO_ORGANIZAR,
  MENSAGEM_ERRO_SALVAR_SEM_TOKEN,
  MENSAGEM_ERRO_SALVAR_API,
  MENSAGEM_SUCESSO_RASCUNHO,
  MENSAGEM_SUCESSO_ENTREGUE_ALUNO,
  MENSAGEM_SUCESSO_ENTREGUE_DOCENTE,
} from "../data/prescricaoFicticia";
import {
  CENARIOS_PRESCRICAO_TESTE,
  TEXTO_PREPARANDO_PRESCRICAO,
} from "../data/cenariosPrescricaoTeste";
import {
  extrairTarefasDaPrescricao,
  gerarHorariosTurno,
} from "../lib/organizacaoPlantao";
import {
  escolherPrescricaoTeste,
  montarPrescricaoTeste,
  sortearIndice,
} from "../lib/prescricaoTeste";
import { fmtData, hoje } from "../lib/historico";
import {
  salvarRespostaTarefa,
  getTarefasTeoricas,
  getSugestoesPreparo,
  type TarefaTeoricaComResposta,
} from "../api/ead";
import { getUserToken } from "../api/client";
import "./OrganizacaoPlantaoExercicio.css";

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
  // -------------------------------------------------------------
  // Bloco 3: Prescrição de Teste
  // -------------------------------------------------------------
  const [prescricaoTeste, setPrescricaoTeste] = useState<PrescricaoFicticia>(PRESCRICAO_TESTE);
  const [carregandoPrescricao, setCarregandoPrescricao] = useState<boolean>(() =>
    Boolean(getUserToken())
  );

  // Tarefas geradas a partir da prescrição de teste
  const tarefasTeste = useMemo(
    () => extrairTarefasDaPrescricao(prescricaoTeste),
    [prescricaoTeste]
  );

  // -------------------------------------------------------------
  // Bloco 3: Configuração do Turno e Criação de Janelas
  // -------------------------------------------------------------
  const [tipoTurno, setTipoTurno] = useState<TipoTurno>("4h");
  const [inicioHora, setInicioHora] = useState<string>("07:00");

  const opcaoSelecionada = useMemo(
    () => OPCOES_TURNO.find((o) => o.chave === tipoTurno) || OPCOES_TURNO[0],
    [tipoTurno]
  );

  // Janelas geradas para as horas do turno
  const [janelasHorarios, setJanelasHorarios] = useState<string[]>(() =>
    gerarHorariosTurno("07:00", 4)
  );

  // Atualiza janelas quando turno ou hora de início mudar
  const handleTrocarTurno = (novoTipo: TipoTurno) => {
    setTipoTurno(novoTipo);
    const op = OPCOES_TURNO.find((o) => o.chave === novoTipo);
    if (op) {
      setInicioHora(op.inicioPadrao);
      setJanelasHorarios(gerarHorariosTurno(op.inicioPadrao, op.duracaoHoras));
    }
  };

  const handleRecriarJanelas = () => {
    setJanelasHorarios(gerarHorariosTurno(inicioHora, opcaoSelecionada.duracaoHoras));
  };

  const handleAdicionarJanela = () => {
    const horaSugerida = prompt("Digite o horário da nova janela (ex: 11:00 ou 08:30):");
    if (horaSugerida && horaSugerida.trim()) {
      const formatada = horaSugerida.trim();
      if (!janelasHorarios.includes(formatada)) {
        setJanelasHorarios((prev) => [...prev, formatada].sort());
      }
    }
  };

  // -------------------------------------------------------------
  // Bloco 3: Cópias dos Cuidados para as Janelas (Grade do Plantão)
  // -------------------------------------------------------------
  // grade: { [horario: string]: TarefaArrastavel[] }
  const [grade, setGrade] = useState<Record<string, TarefaArrastavel[]>>({});
  const [tarefaSelecionadaId, setTarefaSelecionadaId] = useState<string | null>(null);

  // Interação por toque: toque na tarefa seleciona; toque de novo solta
  const handleToqueTarefa = (tarefa: TarefaArrastavel) => {
    if (tarefaSelecionadaId === tarefa.id) {
      setTarefaSelecionadaId(null); // Toque de novo solta
    } else {
      setTarefaSelecionadaId(tarefa.id);
    }
  };

  // Copia tarefa selecionada para a janela tocada
  const handleCopiarParaJanela = (horario: string) => {
    if (!tarefaSelecionadaId) return;

    const tarefa = tarefasTeste.find((t) => t.id === tarefaSelecionadaId);
    if (!tarefa) return;

    setGrade((prev) => {
      const listaAtual = prev[horario] || [];
      return {
        ...prev,
        [horario]: [...listaAtual, { ...tarefa, id: `${tarefa.id}-${Date.now()}` }],
      };
    });

    setTarefaSelecionadaId(null); // Solta após copiar
  };

  const handleRemoverDaJanela = (horario: string, tarefaInstanciaId: string) => {
    setGrade((prev) => ({
      ...prev,
      [horario]: (prev[horario] || []).filter((t) => t.id !== tarefaInstanciaId),
    }));
  };

  // Interação por arraste (drag & drop)
  const handleDragStart = (e: DragEvent, tarefaId: string) => {
    e.dataTransfer.setData("text/plain", tarefaId);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDropJanela = (e: DragEvent, horario: string) => {
    e.preventDefault();
    const tarefaId = e.dataTransfer.getData("text/plain");
    if (!tarefaId) return;

    const tarefa = tarefasTeste.find((t) => t.id === tarefaId);
    if (!tarefa) return;

    setGrade((prev) => {
      const listaAtual = prev[horario] || [];
      return {
        ...prev,
        [horario]: [...listaAtual, { ...tarefa, id: `${tarefa.id}-${Date.now()}` }],
      };
    });

    if (tarefaSelecionadaId === tarefaId) {
      setTarefaSelecionadaId(null);
    }
  };

  // -------------------------------------------------------------
  // Bloco 3: 1ª Via (Marcas de Checar e Circular)
  // -------------------------------------------------------------
  const [marcasPrimeiraVia, setMarcasPrimeiraVia] = useState<Record<string, MarcaPrimeiraVia>>({});

  // -------------------------------------------------------------
  // Bloco 3: Conduta de Enfermagem
  // -------------------------------------------------------------
  const [conduta, setConduta] = useState<string>("");

  // -------------------------------------------------------------
  // Estado de envio / persistência API
  // -------------------------------------------------------------
  const [enviando, setEnviando] = useState(false);
  const [statusEntrega, setStatusEntrega] = useState<"rascunho" | "entregue" | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [tarefaApiId, setTarefaApiId] = useState<string>("organizacao-plantao");

  // Carrega rascunho anterior da API ou sorteia cenário com sugestão de preparo do catálogo
  useEffect(() => {
    let cancelado = false;
    const token = getUserToken();

    if (!token) {
      setPrescricaoTeste(escolherPrescricaoTeste({ salva: null, montada: null }));
      setCarregandoPrescricao(false);
      return;
    }

    setCarregandoPrescricao(true);

    const carregar = async () => {
      let salva: PrescricaoFicticia | null = null;
      let montada: PrescricaoFicticia | null = null;

      try {
        const tarefas = (await getTarefasTeoricas(turmaId, token)) as TarefaTeoricaComResposta[];
        if (!cancelado && Array.isArray(tarefas) && tarefas.length > 0) {
          const t = tarefas.find((x) => x.tipo === "organizacao_plantao") || tarefas[0];
          if (t?.id) {
            setTarefaApiId(t.id);
            if (t.minha_resposta?.status) {
              setStatusEntrega(t.minha_resposta.status);
              const payload = t.minha_resposta.payload;
              if (payload?.grade) {
                setGrade(payload.grade);
              }
              if (payload?.janelasHorarios) {
                setJanelasHorarios(payload.janelasHorarios);
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
              if (payload?.prescricaoTeste) {
                salva = payload.prescricaoTeste;
              }
            }
          }
        }
      } catch {
        salva = null;
      }

      if (!salva && !cancelado) {
        try {
          const catalogo = await getSugestoesPreparo(token);
          const indice = sortearIndice(CENARIOS_PRESCRICAO_TESTE.length);
          const cenario = CENARIOS_PRESCRICAO_TESTE[indice];
          if (cenario) {
            montada = montarPrescricaoTeste(catalogo, cenario, fmtData(hoje()));
          }
        } catch {
          montada = null;
        }
      }

      if (!cancelado) {
        setPrescricaoTeste(escolherPrescricaoTeste({ salva, montada }));
        setCarregandoPrescricao(false);
      }
    };

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [turmaId]);

  // Grava resposta (Rascunho ou Entregue)
  const handleSalvar = async (status: "rascunho" | "entregue") => {
    setMensagemStatus(null);
    setErroSalvar(null);

    const token = getUserToken();
    if (!token) {
      setErroSalvar(MENSAGEM_ERRO_SALVAR_SEM_TOKEN);
      return;
    }

    setEnviando(true);

    const payload = {
      turno: {
        tipo: tipoTurno,
        duracaoHoras: opcaoSelecionada.duracaoHoras,
        inicio: inicioHora,
      },
      janelasHorarios,
      grade,
      marcasPrimeiraVia,
      conduta,
      prescricaoTeste,
      data_gravacao: new Date().toISOString(),
    };

    // Ver como aluno sempre salva com origem teste (não cria presença)
    const origem = isDocente ? "teste" : "aluno";

    try {
      await salvarRespostaTarefa(tarefaApiId, payload, status, origem, token);
      setStatusEntrega(status);
      setMensagemStatus(
        status === "entregue"
          ? isDocente
            ? MENSAGEM_SUCESSO_ENTREGUE_DOCENTE
            : MENSAGEM_SUCESSO_ENTREGUE_ALUNO
          : MENSAGEM_SUCESSO_RASCUNHO
      );
    } catch {
      setErroSalvar(MENSAGEM_ERRO_SALVAR_API);
    } finally {
      setEnviando(false);
    }
  };

  // Cuidados divididos em: Horário Fixo / Contínuos vs Se Necessário (S/N)
  const cuidadosHoraFixa = useMemo(
    () => tarefasTeste.filter((t) => !t.isSN),
    [tarefasTeste]
  );
  const cuidadosSN = useMemo(
    () => tarefasTeste.filter((t) => t.isSN),
    [tarefasTeste]
  );

  return (
    <div className="plantao-pagina">
      <div className="plantao-conteudo">
        {/* Barra superior de navegação */}
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            className="plantao-voltar"
          >
            ← Voltar às Tarefas Teóricas
          </button>
        )}

        {/* Cabeçalho Geral da Atividade */}
        <header className="plantao-cabecalho">
          <div className="plantao-cabecalho-topo">
            <div>
              <span className="plantao-etiqueta-data">
                09/10/2026 · Tarefa Teórica Interativa
              </span>
              <h1 className="plantao-titulo">
                Organização do plantão
              </h1>
              <p className="muted plantao-subtitulo">
                Transcreva e organize as rotinas da prescrição do paciente distribuindo os horários no seu turno de estágio.
              </p>
            </div>

            {isDocente && (
              <span className="plantao-selo-docente">
                Visão de Teste (origem: teste)
              </span>
            )}
          </div>
        </header>

        {/* ============================================================= */}
        {/* BLOCO 1: PRESCRIÇÃO DE ESTUDO                                 */}
        {/* ============================================================= */}
        <section className="plantao-bloco">
          <div className="plantao-bloco-topo">
            <div>
              <h2 className="plantao-bloco-titulo">
                Prescrição de estudo
              </h2>
              <p className="muted plantao-bloco-descricao">
                Prescrição médica e de enfermagem fixa para leitura e interpretação clínica. O aluno não organiza esta prescrição.
              </p>
            </div>
            <span className="plantao-selo-leitura">
              Apenas leitura · Imutável
            </span>
          </div>

          {/* Dados do paciente de estudo */}
          <div className="plantao-dados-paciente">
            <div><strong>Hospital:</strong> {PRESCRICAO_ESTUDO.hospital}</div>
            <div><strong>Unidade:</strong> {PRESCRICAO_ESTUDO.unidade}</div>
            <div><strong>Leito:</strong> {PRESCRICAO_ESTUDO.leito}</div>
            <div><strong>Paciente:</strong> {PRESCRICAO_ESTUDO.paciente}</div>
            <div><strong>Idade:</strong> {PRESCRICAO_ESTUDO.idade}</div>
            <div><strong>Peso:</strong> {PRESCRICAO_ESTUDO.peso}</div>
            <div><strong>Diagnóstico:</strong> {PRESCRICAO_ESTUDO.diagnostico}</div>
            <div><strong>Alergias:</strong> {PRESCRICAO_ESTUDO.alergias}</div>
          </div>

          {/* Tabela de 5 colunas com frase explicativa abaixo de cada coluna */}
          <div className="plantao-tabela-envoltorio">
            <table className="plantao-tabela">
              <thead>
                <tr className="plantao-tabela-linha-cabecalho">
                  <th className="plantao-estudo-th">
                    <div className="plantao-estudo-th-titulo">Apresentação</div>
                    <div className="plantao-estudo-th-ajuda">
                      nome e forma
                    </div>
                  </th>
                  <th className="plantao-estudo-th">
                    <div className="plantao-estudo-th-titulo">Dose</div>
                    <div className="plantao-estudo-th-ajuda">
                      quanto foi prescrito
                    </div>
                  </th>
                  <th className="plantao-estudo-th">
                    <div className="plantao-estudo-th-titulo">Via</div>
                    <div className="plantao-estudo-th-ajuda">
                      por onde
                    </div>
                  </th>
                  <th className="plantao-estudo-th">
                    <div className="plantao-estudo-th-titulo">Frequência</div>
                    <div className="plantao-estudo-th-ajuda">
                      de quanto em quanto
                    </div>
                  </th>
                  <th className="plantao-estudo-th">
                    <div className="plantao-estudo-th-titulo">S/N ou horários aprazados</div>
                    <div className="plantao-estudo-th-ajuda">
                      S/N ou o horário já escrito
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRESCRICAO_ESTUDO.itens.map((it) => (
                  <tr key={it.id} className="plantao-tabela-linha">
                    <td className="plantao-estudo-td-apresentacao">
                      {it.apresentacao}
                    </td>
                    <td className="plantao-estudo-td-secundaria">
                      {it.dose}
                    </td>
                    <td className="plantao-estudo-td-via">
                      {it.via}
                    </td>
                    <td className="plantao-estudo-td-secundaria">
                      {it.frequencia}
                    </td>
                    <td className="plantao-estudo-td-secundaria">
                      {it.horariosAprazados}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============================================================= */}
        {/* BLOCO 2: COMO ORGANIZAR                                       */}
        {/* ============================================================= */}
        <section className="plantao-bloco">
          <div className="plantao-bloco-topo">
            <div>
              <h2 className="plantao-bloco-titulo">
                Como organizar
              </h2>
              <p className="muted plantao-bloco-descricao">
                Siga as etapas clínicas abaixo para montar seu rascunho de trabalho e checagem do plantão:
              </p>
            </div>
          </div>

          <div className="plantao-passos">
            {PASSOS_COMO_ORGANIZAR.map((passo, idx) => (
              <div key={idx} className="plantao-passo">
                <span className="plantao-passo-numero">
                  {idx + 1}
                </span>
                <span>{passo}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================= */}
        {/* BLOCO 3: PRESCRIÇÃO DE TESTE                                  */}
        {/* ============================================================= */}
        <section className="plantao-bloco">
          {carregandoPrescricao ? (
            <div className="guia-status-msg">{TEXTO_PREPARANDO_PRESCRICAO}</div>
          ) : (
            <>
              <div className="plantao-bloco-cabecalho">
                <h2 className="plantao-bloco-titulo">
                  Prescrição de teste
                </h2>
                <p className="muted plantao-bloco-descricao">
                  É outra prescrição para você organizar.
                </p>
              </div>

              {/* Dados do paciente de teste */}
              <div className="plantao-dados-paciente">
                <div><strong>Hospital:</strong> {prescricaoTeste.hospital}</div>
                <div><strong>Unidade:</strong> {prescricaoTeste.unidade}</div>
                <div><strong>Leito:</strong> {prescricaoTeste.leito}</div>
                <div><strong>Paciente:</strong> {prescricaoTeste.paciente}</div>
                <div><strong>Idade:</strong> {prescricaoTeste.idade}</div>
                <div><strong>Peso:</strong> {prescricaoTeste.peso ?? ""}</div>
                <div><strong>Diagnóstico:</strong> {prescricaoTeste.diagnostico}</div>
                <div><strong>Alergias:</strong> {prescricaoTeste.alergias}</div>
              </div>

              {/* Tabela da 1ª Via da Prescrição de Teste (Checar / Circular) */}
              <div className="plantao-subsecao">
                <h3 className="plantao-subsecao-titulo">
                  1ª Via da Prescrição de Teste (Checagem e Aprazamento)
                </h3>
                <p className="muted plantao-subsecao-instrucao">
                  Cheque o que foi realizado (/) ou circule (○) o não feito ou reaprazado. Se circular por reaprazamento, informe o novo horário.
                </p>

                <div className="plantao-tabela-envoltorio">
                  <table className="plantao-tabela">
                    <thead>
                      <tr className="plantao-tabela-linha-cabecalho">
                        <th className="plantao-tabela-cabecalho">
                          Medicamento / Cuidado
                        </th>
                        <th className="plantao-tabela-cabecalho">
                          Dose
                        </th>
                        <th className="plantao-tabela-cabecalho">
                          Via
                        </th>
                        <th className="plantao-tabela-cabecalho">
                          Frequência
                        </th>
                        <th className="plantao-tabela-cabecalho">
                          Horários aprazados
                        </th>
                        <th className="plantao-tabela-cabecalho plantao-tabela-cabecalho-marcas">
                          Marcas da 1ª via
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescricaoTeste.itens.map((it) => {
                        const marca = marcasPrimeiraVia[it.id] || { status: "nenhum" };
                        const isCirculado = marca.status === "circulado";
                        const isChecado = marca.status === "checado";
                        const classeEstadoLinha = isCirculado
                          ? " plantao-linha-circulada"
                          : isChecado
                            ? " plantao-linha-checada"
                            : "";

                        return (
                          <tr
                            key={it.id}
                            className={`plantao-tabela-linha${classeEstadoLinha}`}
                          >
                            <td className="plantao-primeira-via-td-item">
                              <div>{it.apresentacao}</div>
                            </td>
                            <td className="plantao-primeira-via-td-secundaria">
                              {it.dose}
                            </td>
                            <td className="plantao-primeira-via-td-via">
                              {it.via}
                            </td>
                            <td className="plantao-primeira-via-td-secundaria">
                              {it.frequencia}
                            </td>
                            <td className="plantao-primeira-via-td-secundaria">
                              {it.horariosAprazados}
                            </td>
                            <td className="plantao-primeira-via-td-marcas">
                              <div className="plantao-marcas-coluna">
                                <div className="plantao-marcas-botoes">
                                  {/* Checar (/) */}
                                  <button
                                    type="button"
                                    aria-pressed={isChecado}
                                    onClick={() => {
                                      setMarcasPrimeiraVia((prev) => ({
                                        ...prev,
                                        [it.id]: isChecado ? { status: "nenhum" } : { status: "checado" },
                                      }));
                                    }}
                                    className="plantao-botao-checar"
                                    title="Marcar como checado (/)"
                                  >
                                    / Checar
                                  </button>

                                  {/* Circular (○) */}
                                  <button
                                    type="button"
                                    aria-pressed={isCirculado}
                                    onClick={() => {
                                      setMarcasPrimeiraVia((prev) => ({
                                        ...prev,
                                        [it.id]: isCirculado
                                          ? { status: "nenhum" }
                                          : { status: "circulado", motivo: "nao_feito" },
                                      }));
                                    }}
                                    className="plantao-botao-circular"
                                    title="Circular como não feito ou reaprazado (○)"
                                  >
                                    ○ Circular
                                  </button>
                                </div>

                                {/* Detalhes do Circular */}
                                {isCirculado && (
                                  <div className="plantao-circulado-detalhes">
                                    <div className="plantao-circulado-motivos">
                                      <label className="plantao-circulado-opcao">
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
                                      <label className="plantao-circulado-opcao">
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
                                      <div className="plantao-reaprazamento">
                                        <span className="plantao-reaprazamento-rotulo">Novo horário:</span>
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
                                          className="plantao-reaprazamento-horario"
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
              </div>

              {/* Configuração do Turno e Janelas */}
              <div className="plantao-subsecao-caixa">
                <h3 className="plantao-subsecao-titulo">
                  Definição do Turno e Criação das Janelas
                </h3>

                <div className="plantao-turno-linha">
                  <div className="plantao-turno-opcoes">
                    {OPCOES_TURNO.map((op) => (
                      <button
                        key={op.chave}
                        type="button"
                        aria-pressed={tipoTurno === op.chave}
                        onClick={() => handleTrocarTurno(op.chave)}
                        className="plantao-turno-opcao"
                      >
                        {op.rotulo}
                      </button>
                    ))}
                  </div>

                  <div className="plantao-turno-controles">
                    <label htmlFor="inicio-hora-teste" className="plantao-turno-inicio-rotulo">
                      Início:
                    </label>
                    <input
                      id="inicio-hora-teste"
                      type="time"
                      value={inicioHora}
                      onChange={(e) => setInicioHora(e.target.value)}
                      className="plantao-turno-inicio-campo"
                    />
                    <button
                      type="button"
                      onClick={handleRecriarJanelas}
                      className="plantao-botao-recriar-janelas"
                    >
                      Recriar janelas
                    </button>
                    <button
                      type="button"
                      onClick={handleAdicionarJanela}
                      className="plantao-botao-adicionar-janela"
                    >
                      + Adicionar janela
                    </button>
                  </div>
                </div>

                <div className="muted plantao-turno-resumo">
                  Janelas ativas para este turno: <strong>{janelasHorarios.join(" · ")}</strong> ({janelasHorarios.length} janelas de 1 hora)
                </div>
              </div>

              {/* Cuidados da Prescrição de Teste (Tarefas Copiáveis) */}
              <div className="plantao-subsecao">
                <h3 className="plantao-subsecao-titulo">
                  Cuidados da Prescrição de Teste (Toque ou Arraste para a Janela)
                </h3>
                <p className="muted plantao-subsecao-instrucao">
                  Toque no cuidado e depois toque no horário da organização para colar. Toque de novo no cuidado para soltar. Arrastar até o horário também cola.
                </p>

                <div className="plantao-tarefas-lista">
                  {cuidadosHoraFixa.map((tar) => {
                    const selecionada = tarefaSelecionadaId === tar.id;
                    return (
                      <button
                        key={tar.id}
                        type="button"
                        draggable
                        aria-pressed={selecionada}
                        onDragStart={(e) => handleDragStart(e, tar.id)}
                        onClick={() => handleToqueTarefa(tar)}
                        className="plantao-tarefa"
                      >
                        <span>{tar.rotulo}</span>
                        {tar.detalhes && (
                          <span className="plantao-tarefa-detalhes">
                            {tar.detalhes}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {tarefaSelecionadaId && (
                  <div className="plantao-selecao-aviso">
                    <span>👉 Cuidado selecionado! Toque em uma das janelas abaixo para colar, ou toque novamente nele para soltar.</span>
                    <button
                      type="button"
                      onClick={() => setTarefaSelecionadaId(null)}
                      className="plantao-botao-soltar"
                      title="Soltar seleção"
                    >
                      ✕ Soltar
                    </button>
                  </div>
                )}
              </div>

              {/* Janelas Horárias do Turno (Grade de Organização do Plantão) */}
              <div className="plantao-subsecao">
                <h3 className="plantao-subsecao-titulo">
                  Janelas de Horário do Turno ({janelasHorarios.length} horas)
                </h3>
                <p className="muted plantao-subsecao-instrucao">
                  Cole os cuidados correspondentes ao horário aprazado. No mesmo horário e mesmo acesso, antecipe a infusão mais curta e atrase a mais demorada em até 30 minutos.
                </p>

                <div className="plantao-janelas-grade">
                  {janelasHorarios.map((horario) => {
                    const itensJanela = grade[horario] || [];
                    const temMultiplasInfusoes =
                      itensJanela.filter((i) => i.categoria === "medicamento" && i.detalhes?.includes("EV")).length > 1;

                    return (
                      <div
                        key={horario}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropJanela(e, horario)}
                        onClick={() => handleCopiarParaJanela(horario)}
                        className={`plantao-janela${tarefaSelecionadaId ? " plantao-janela-aguardando" : ""}`}
                      >
                        <div className="plantao-janela-topo">
                          <span className="plantao-janela-horario">
                            Janela das {horario}
                          </span>
                          {tarefaSelecionadaId && (
                            <span className="plantao-janela-dica-colar">
                              + Toque para colar aqui
                            </span>
                          )}
                        </div>

                        {temMultiplasInfusoes && (
                          <div className="plantao-janela-alerta-ev">
                            ⚠️ No mesmo horário e acesso: antecipe a infusão mais curta e atrase a mais demorada (até 30 min).
                          </div>
                        )}

                        {itensJanela.length === 0 ? (
                          <div className="muted plantao-janela-vazia">
                            Nenhum cuidado copiado para este horário.
                          </div>
                        ) : (
                          <div className="plantao-janela-itens">
                            {itensJanela.map((item) => (
                              <div key={item.id} className="plantao-janela-item">
                                <div>
                                  <div className="plantao-janela-item-rotulo">
                                    {item.rotulo}
                                  </div>
                                  {item.detalhes && (
                                    <div className="muted plantao-janela-item-detalhes">
                                      {item.detalhes}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoverDaJanela(horario, item.id);
                                  }}
                                  className="plantao-botao-remover-item"
                                  title="Remover deste horário"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Se Necessário (S/N) - Não entra em hora fixa */}
              <div className="plantao-subsecao-caixa">
                <h3 className="plantao-subsecao-titulo">
                  Lista de Se Necessário (S/N)
                </h3>
                <p className="muted plantao-subsecao-instrucao">
                  S/N não entra em hora fixa, fica na lista de se necessário.
                </p>

                {cuidadosSN.length === 0 ? (
                  <div className="muted plantao-sn-vazio">
                    Nenhum item prescrito como Se Necessário nesta simulação.
                  </div>
                ) : (
                  <div className="plantao-sn-lista">
                    {cuidadosSN.map((sn) => (
                      <div key={sn.id} className="plantao-sn-item">
                        <span className="plantao-sn-rotulo">{sn.rotulo}</span>
                        <span className="muted plantao-sn-detalhes">{sn.detalhes}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conduta de Enfermagem */}
              <div className="plantao-subsecao">
                <h3 className="plantao-subsecao-titulo">
                  Conduta de Enfermagem
                </h3>
                <label
                  htmlFor="conduta-enfermagem"
                  className="plantao-conduta-rotulo"
                >
                  Descreva o que checou, o que circulou e o motivo, e o horário antigo e o novo quando reaprazar.
                </label>
                <textarea
                  id="conduta-enfermagem"
                  rows={4}
                  value={conduta}
                  onChange={(e) => setConduta(e.target.value)}
                  placeholder="Descreva aqui o que você checou, o que circulou e o respectivo motivo, e caso tenha reaprazado, registre o horário antigo e o novo horário..."
                  className="plantao-conduta-campo"
                />
              </div>

              {/* Ações de Gravação e Entrega */}
              <div className="plantao-rodape">
                <div>
                  <p className="plantao-rodape-aviso">
                    A presença é decidida pelo professor.
                  </p>
                  <p className="muted plantao-rodape-detalhe">
                    A entrega grava suas janelas, as cópias de cuidados, as marcas da 1ª via e a conduta.
                  </p>
                </div>

                <div className="plantao-rodape-acoes">
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => handleSalvar("rascunho")}
                    className="plantao-botao-rascunho"
                  >
                    Salvar Rascunho
                  </button>

                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => handleSalvar("entregue")}
                    className="plantao-botao-entregar"
                  >
                    {enviando ? "Entregando..." : "Entregar Organização"}
                  </button>
                </div>
              </div>

              {erroSalvar && (
                <div className="alert err plantao-alerta" role="alert">
                  {erroSalvar}
                </div>
              )}

              {mensagemStatus && (
                <div
                  className={`alert info plantao-alerta ${
                    statusEntrega === "entregue"
                      ? "plantao-alerta-entregue"
                      : "plantao-alerta-rascunho"
                  }`}
                >
                  {mensagemStatus}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
