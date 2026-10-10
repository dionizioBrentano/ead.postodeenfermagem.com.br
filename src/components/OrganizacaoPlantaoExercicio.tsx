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

    interface TarefaOrganizacaoApi {
      id?: string;
      tipo?: string;
      minha_resposta?: {
        status?: "rascunho" | "entregue";
        payload?: {
          grade?: Record<string, TarefaArrastavel[]>;
          janelasHorarios?: string[];
          turno?: { tipo?: TipoTurno; inicio?: string };
          marcasPrimeiraVia?: Record<string, MarcaPrimeiraVia>;
          conduta?: string;
          prescricaoTeste?: PrescricaoFicticia;
        };
      };
    }

    const carregar = async () => {
      let salva: PrescricaoFicticia | null = null;
      let montada: PrescricaoFicticia | null = null;

      try {
        const tarefas = (await getTarefasTeoricas(turmaId, token)) as TarefaOrganizacaoApi[];
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
    setEnviando(true);
    setMensagemStatus(null);

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

    const token = getUserToken();
    // Ver como aluno sempre salva com origem teste (não cria presença)
    const origem = isDocente ? "teste" : "aluno";

    try {
      if (token) {
        await salvarRespostaTarefa(tarefaApiId, payload, status, origem, token);
      }
      setStatusEntrega(status);
      setMensagemStatus(
        status === "entregue"
          ? isDocente
            ? "Organização do plantão enviada com sucesso em modo de teste (origem: teste)."
            : "Organização do plantão entregue com sucesso! A presença é decidida pelo professor."
          : "Rascunho da organização salvo com sucesso!"
      );
    } catch (err: any) {
      console.warn("Erro ao salvar na API:", err);
      setStatusEntrega(status);
      setMensagemStatus(
        `Salvo localmente com sucesso (${status === "entregue" ? "Entregue" : "Rascunho"}). ${
          status === "entregue" ? "A presença é decidida pelo professor." : ""
        }`
      );
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
    <div style={{ background: "#f8f6f1", minHeight: "100vh", color: "#3a3a3a", padding: "20px 16px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Barra superior de navegação */}
        {onVoltar && (
          <button
            type="button"
            onClick={onVoltar}
            style={{
              background: "transparent",
              border: "none",
              color: "#3a3a3a",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              padding: "6px 0",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Voltar às Tarefas Teóricas
          </button>
        )}

        {/* Cabeçalho Geral da Atividade */}
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
                  color: "#3a3a3a",
                  background: "#f0ede6",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  marginBottom: "8px",
                }}
              >
                09/10/2026 · Tarefa Teórica Interativa
              </span>
              <h1 style={{ fontSize: "24px", margin: "4px 0 8px", color: "#3a3a3a" }}>
                Organização do plantão
              </h1>
              <p style={{ margin: 0, fontSize: "14px", color: "#555555" }}>
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

        {/* ============================================================= */}
        {/* BLOCO 1: PRESCRIÇÃO DE ESTUDO                                 */}
        {/* ============================================================= */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "#3a3a3a" }}>
                Prescrição de estudo
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
                Prescrição médica e de enfermagem fixa para leitura e interpretação clínica. O aluno não organiza esta prescrição.
              </p>
            </div>
            <span
              style={{
                fontSize: "12px",
                color: "#666666",
                background: "#f8f6f1",
                padding: "4px 10px",
                borderRadius: "6px",
                border: "1px solid #e6e4e1",
              }}
            >
              Apenas leitura · Imutável
            </span>
          </div>

          {/* Dados do paciente de estudo */}
          <div
            style={{
              background: "#f8f6f1",
              border: "1px solid #e6e4e1",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "8px",
            }}
          >
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f0ede6", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "#3a3a3a" }}>Apresentação</div>
                    <div style={{ fontSize: "11px", fontWeight: 400, color: "#666666", marginTop: "2px" }}>
                      nome e forma
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "#3a3a3a" }}>Dose</div>
                    <div style={{ fontSize: "11px", fontWeight: 400, color: "#666666", marginTop: "2px" }}>
                      quanto foi prescrito
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "#3a3a3a" }}>Via</div>
                    <div style={{ fontSize: "11px", fontWeight: 400, color: "#666666", marginTop: "2px" }}>
                      por onde
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "#3a3a3a" }}>Frequência</div>
                    <div style={{ fontSize: "11px", fontWeight: 400, color: "#666666", marginTop: "2px" }}>
                      de quanto em quanto
                    </div>
                  </th>
                  <th style={{ padding: "10px 12px", borderBottom: "1px solid #e6e4e1", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 600, color: "#3a3a3a" }}>S/N ou horários aprazados</div>
                    <div style={{ fontSize: "11px", fontWeight: 400, color: "#666666", marginTop: "2px" }}>
                      S/N ou o horário já escrito
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PRESCRICAO_ESTUDO.itens.map((it) => (
                  <tr key={it.id} style={{ borderBottom: "1px solid #f2f0ec" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 500, color: "#3a3a3a" }}>
                      {it.apresentacao}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#555555" }}>
                      {it.dose}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#3a3a3a", fontWeight: 600 }}>
                      {it.via}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#555555" }}>
                      {it.frequencia}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#555555" }}>
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
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
          }}
        >
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "#3a3a3a" }}>
              Como organizar
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
              Siga as etapas clínicas abaixo para montar seu rascunho de trabalho e checagem do plantão:
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "#f8f6f1",
              border: "1px solid #e6e4e1",
              borderRadius: "8px",
              padding: "16px 20px",
            }}
          >
            {PASSOS_COMO_ORGANIZAR.map((passo, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "14px",
                  color: "#3a3a3a",
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6e4e1",
                    borderRadius: "50%",
                    minWidth: "22px",
                    height: "22px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#3a3a3a",
                  }}
                >
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
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e4e1",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "24px",
          }}
        >
          {carregandoPrescricao ? (
            <div className="guia-status-msg">{TEXTO_PREPARANDO_PRESCRICAO}</div>
          ) : (
            <>
              <div style={{ marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", margin: "0 0 4px", color: "#3a3a3a" }}>
                  Prescrição de teste
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#666666" }}>
                  É outra prescrição para você organizar.
                </p>
              </div>

              {/* Dados do paciente de teste */}
              <div
                style={{
                  background: "#faf9f6",
                  border: "1px solid #eae7e1",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "8px",
                }}
              >
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
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 8px", color: "#3a3a3a" }}>
              1ª Via da Prescrição de Teste (Checagem e Aprazamento)
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#666666" }}>
              Cheque o que foi realizado (/) ou circule (○) o não feito ou reaprazado. Se circular por reaprazamento, informe o novo horário.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f0ede6", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                      Medicamento / Cuidado
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                      Dose
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                      Via
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                      Frequência
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a" }}>
                      Horários aprazados
                    </th>
                    <th style={{ padding: "8px 10px", borderBottom: "1px solid #e6e4e1", color: "#3a3a3a", minWidth: "220px" }}>
                      Marcas da 1ª via
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prescricaoTeste.itens.map((it) => {
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
                        <td style={{ padding: "8px 10px", fontWeight: 500 }}>
                          <div>{it.apresentacao}</div>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#555555" }}>
                          {it.dose}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#3a3a3a", fontWeight: 600 }}>
                          {it.via}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#555555" }}>
                          {it.frequencia}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#555555" }}>
                          {it.horariosAprazados}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              {/* Checar (/) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setMarcasPrimeiraVia((prev) => ({
                                    ...prev,
                                    [it.id]: isChecado ? { status: "nenhum" } : { status: "checado" },
                                  }));
                                }}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: `1px solid ${isChecado ? "#00AD57" : "#e6e4e1"}`,
                                  background: isChecado ? "#00AD57" : "#ffffff",
                                  color: isChecado ? "#ffffff" : "#3a3a3a",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                                title="Marcar como checado (/)"
                              >
                                / Checar
                              </button>

                              {/* Circular (○) */}
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
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: `1px solid ${isCirculado ? "#d97706" : "#e6e4e1"}`,
                                  background: isCirculado ? "#fef3c7" : "#ffffff",
                                  color: isCirculado ? "#92400e" : "#3a3a3a",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                                title="Circular como não feito ou reaprazado (○)"
                              >
                                ○ Circular
                              </button>
                            </div>

                            {/* Detalhes do Circular */}
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
          </div>

          {/* Configuração do Turno e Janelas */}
          <div
            style={{
              background: "#faf9f6",
              border: "1px solid #e6e4e1",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ fontSize: "15px", margin: "0 0 10px", color: "#3a3a3a" }}>
              Definição do Turno e Criação das Janelas
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {OPCOES_TURNO.map((op) => (
                  <button
                    key={op.chave}
                    type="button"
                    onClick={() => handleTrocarTurno(op.chave)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: `1.5px solid ${tipoTurno === op.chave ? "#3a3a3a" : "#e6e4e1"}`,
                      background: tipoTurno === op.chave ? "#3a3a3a" : "#ffffff",
                      color: tipoTurno === op.chave ? "#ffffff" : "#3a3a3a",
                      fontWeight: tipoTurno === op.chave ? 600 : 500,
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                  >
                    {op.rotulo}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label htmlFor="inicio-hora-teste" style={{ fontSize: "13px", fontWeight: 500 }}>
                  Início:
                </label>
                <input
                  id="inicio-hora-teste"
                  type="time"
                  value={inicioHora}
                  onChange={(e) => setInicioHora(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #e6e4e1",
                    fontSize: "13px",
                    color: "#3a3a3a",
                    background: "#ffffff",
                  }}
                />
                <button
                  type="button"
                  onClick={handleRecriarJanelas}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e6e4e1",
                    background: "#ffffff",
                    color: "#3a3a3a",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Recriar janelas
                </button>
                <button
                  type="button"
                  onClick={handleAdicionarJanela}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px dashed #e6e4e1",
                    background: "#ffffff",
                    color: "#3a3a3a",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  + Adicionar janela
                </button>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#666666" }}>
              Janelas ativas para este turno: <strong>{janelasHorarios.join(" · ")}</strong> ({janelasHorarios.length} janelas de 1 hora)
            </div>
          </div>

          {/* Cuidados da Prescrição de Teste (Tarefas Copiáveis) */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 6px", color: "#3a3a3a" }}>
              Cuidados da Prescrição de Teste (Toque ou Arraste para a Janela)
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#666666" }}>
              Toque no cuidado e depois toque no horário da organização para colar. Toque de novo no cuidado para soltar. Arrastar até o horário também cola.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {cuidadosHoraFixa.map((tar) => {
                const selecionada = tarefaSelecionadaId === tar.id;
                return (
                  <button
                    key={tar.id}
                    type="button"
                    draggable
                    onDragStart={(e) => handleDragStart(e, tar.id)}
                    onClick={() => handleToqueTarefa(tar)}
                    style={{
                      background: selecionada ? "#3a3a3a" : "#faf9f6",
                      color: selecionada ? "#ffffff" : "#3a3a3a",
                      border: `1.5px solid ${selecionada ? "#3a3a3a" : "#e6e4e1"}`,
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
                    }}
                  >
                    <span>{tar.rotulo}</span>
                    {tar.detalhes && (
                      <span style={{ fontSize: "11px", color: selecionada ? "#dddddd" : "#777777" }}>
                        {tar.detalhes}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {tarefaSelecionadaId && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 12px",
                  background: "#f0ede6",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: "#3a3a3a",
                  fontWeight: 500,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>👉 Cuidado selecionado! Toque em uma das janelas abaixo para colar, ou toque novamente nele para soltar.</span>
                <button
                  type="button"
                  onClick={() => setTarefaSelecionadaId(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#3a3a3a",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                  title="Soltar seleção"
                >
                  ✕ Soltar
                </button>
              </div>
            )}
          </div>

          {/* Janelas Horárias do Turno (Grade de Organização do Plantão) */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 6px", color: "#3a3a3a" }}>
              Janelas de Horário do Turno ({janelasHorarios.length} horas)
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: "13px", color: "#666666" }}>
              Cole os cuidados correspondentes ao horário aprazado. No mesmo horário e mesmo acesso, antecipe a infusão mais curta e atrase a mais demorada em até 30 minutos.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
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
                    style={{
                      background: "#faf9f6",
                      border: `1.5px ${tarefaSelecionadaId ? "dashed #3a3a3a" : "solid #e6e4e1"}`,
                      borderRadius: "8px",
                      padding: "12px",
                      cursor: tarefaSelecionadaId ? "pointer" : "default",
                      transition: "border 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #eae7e1", paddingBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#3a3a3a" }}>
                        Janela das {horario}
                      </span>
                      {tarefaSelecionadaId && (
                        <span style={{ fontSize: "11px", color: "#00AD57", fontWeight: 600 }}>
                          + Toque para colar aqui
                        </span>
                      )}
                    </div>

                    {temMultiplasInfusoes && (
                      <div
                        style={{
                          background: "#fff9e6",
                          border: "1px solid #faebcc",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "11px",
                          color: "#856404",
                          marginBottom: "8px",
                          lineHeight: 1.4,
                        }}
                      >
                        ⚠️ No mesmo horário e acesso: antecipe a infusão mais curta e atrase a mais demorada (até 30 min).
                      </div>
                    )}

                    {itensJanela.length === 0 ? (
                      <div style={{ fontSize: "12px", color: "#888888", fontStyle: "italic", padding: "8px 0" }}>
                        Nenhum cuidado copiado para este horário.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {itensJanela.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e6e4e1",
                              borderRadius: "6px",
                              padding: "6px 8px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "6px",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#3a3a3a" }}>
                                {item.rotulo}
                              </div>
                              {item.detalhes && (
                                <div style={{ fontSize: "11px", color: "#666666" }}>
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
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#b91c1c",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: "2px 4px",
                              }}
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
          <div
            style={{
              background: "#faf9f6",
              border: "1px solid #e6e4e1",
              borderRadius: "8px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ fontSize: "15px", margin: "0 0 4px", color: "#3a3a3a" }}>
              Lista de Se Necessário (S/N)
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#666666" }}>
              S/N não entra em hora fixa, fica na lista de se necessário.
            </p>

            {cuidadosSN.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#777777", fontStyle: "italic" }}>
                Nenhum item prescrito como Se Necessário nesta simulação.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {cuidadosSN.map((sn) => (
                  <div
                    key={sn.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e6e4e1",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontWeight: 600, color: "#3a3a3a" }}>{sn.rotulo}</span>
                    <span style={{ fontSize: "11px", color: "#666666" }}>{sn.detalhes}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conduta de Enfermagem */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 6px", color: "#3a3a3a" }}>
              Conduta de Enfermagem
            </h3>
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
              placeholder="Descreva aqui o que você checou, o que circulou e o respectivo motivo, e caso tenha reaprazado, registre o horário antigo e o novo horário..."
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
          </div>

          {/* Ações de Gravação e Entrega */}
          <div
            style={{
              borderTop: "1px solid #e6e4e1",
              paddingTop: "16px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#3a3a3a" }}>
                A presença é decidida pelo professor.
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#666666" }}>
                A entrega grava suas janelas, as cópias de cuidados, as marcas da 1ª via e a conduta.
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
            </>
          )}
        </section>
      </div>
    </div>
  );
}
