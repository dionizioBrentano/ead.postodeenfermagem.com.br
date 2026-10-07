import { useState, useEffect } from "react";
import { ATIVIDADES } from "../data/itens";
import { getUserToken } from "../api/client";
import {
  getAnotacoesCampo,
  getDiasAnotacoesCampo,
  salvarAnotacoesCampo,
  type AnotacaoCampoItem,
} from "../api/ead";

const OPCOES_O_QUE_FEZ = [
  "Realizou de forma autônoma",
  "Realizou com auxílio",
  "Observou",
  "Não praticou hoje",
];

const OPCOES_DIFICULDADE = ["Nenhuma", "Baixa", "Média", "Alta"];

export default function AnotacoesCampoAluno({ userKey }: { userKey: string }) {
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date();
    return hoje.toISOString().split("T")[0];
  });

  const [diasRegistrados, setDiasRegistrados] = useState<{ data: string; total_procedimentos: number }[]>([]);
  const [itens, setItens] = useState<Record<string, AnotacaoCampoItem>>({});
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const [filtro, setFiltro] = useState<"todos" | "preenchidos" | "pendentes">("todos");
  const [busca, setBusca] = useState("");

  const token = getUserToken();

  // Carrega histórico de dias já registrados
  const carregarDias = async () => {
    if (!token || !userKey) return;
    try {
      const listaDias = await getDiasAnotacoesCampo(userKey, token);
      setDiasRegistrados(listaDias || []);
    } catch (e) {
      console.error("Erro ao carregar dias registrados", e);
    }
  };

  // Carrega anotações do dia selecionado
  const carregarAnotacoesDoDia = async (data: string) => {
    if (!token || !userKey) return;
    setCarregando(true);
    setMsg(null);
    try {
      const res = await getAnotacoesCampo(userKey, data, token);
      const mapa: Record<string, AnotacaoCampoItem> = {};

      ATIVIDADES.forEach((ativ, idx) => {
        const chave = `atividades.${idx}`;
        const salvo = (res || []).find((r: any) => r.item_chave === chave);
        mapa[chave] = {
          item_chave: chave,
          item_texto: ativ.texto,
          o_que_fez: salvo?.o_que_fez || "",
          dificuldade: salvo?.dificuldade || "",
          expectativa: salvo?.expectativa || "",
          descricao_do_feito: salvo?.descricao_do_feito || "",
        };
      });

      setItens(mapa);
    } catch (e: any) {
      console.error(e);
      setMsg({ tipo: "err", texto: "Erro ao carregar anotações do dia." });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDias();
  }, [userKey, token]);

  useEffect(() => {
    if (dataSelecionada) {
      carregarAnotacoesDoDia(dataSelecionada);
    }
  }, [dataSelecionada, userKey]);

  const handleCampoChange = (
    chave: string,
    campo: keyof AnotacaoCampoItem,
    valor: string
  ) => {
    setItens((prev) => ({
      ...prev,
      [chave]: {
        ...prev[chave],
        [campo]: valor,
      },
    }));
  };

  const handleSalvar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !userKey) return;

    setSalvando(true);
    setMsg(null);
    try {
      const listaSalvar = Object.values(itens);
      await salvarAnotacoesCampo(
        {
          aluno_user_id: userKey,
          data: dataSelecionada,
          itens: listaSalvar,
        },
        token
      );
      setMsg({ tipo: "ok", texto: "Anotações do dia salvas com sucesso no seu diário de campo!" });
      await carregarDias();
      await carregarAnotacoesDoDia(dataSelecionada);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao salvar anotações de campo." });
    } finally {
      setSalvando(false);
    }
  };

  // Contagem de itens preenchidos
  const totalPreenchidosHoje = Object.values(itens).filter(
    (it) =>
      Boolean(it.o_que_fez?.trim()) ||
      Boolean(it.dificuldade?.trim()) ||
      Boolean(it.expectativa?.trim()) ||
      Boolean(it.descricao_do_feito?.trim())
  ).length;

  const procedimentosFiltrados = ATIVIDADES.map((ativ, idx) => {
    const chave = `atividades.${idx}`;
    const dados = itens[chave] || {
      item_chave: chave,
      item_texto: ativ.texto,
      o_que_fez: "",
      dificuldade: "",
      expectativa: "",
      descricao_do_feito: "",
    };
    const preenchido =
      Boolean(dados.o_que_fez?.trim()) ||
      Boolean(dados.dificuldade?.trim()) ||
      Boolean(dados.expectativa?.trim()) ||
      Boolean(dados.descricao_do_feito?.trim());
    return { ativ, idx, chave, dados, preenchido };
  }).filter((item) => {
    if (filtro === "preenchidos" && !item.preenchido) return false;
    if (filtro === "pendentes" && item.preenchido) return false;
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      return (
        item.ativ.texto.toLowerCase().includes(termo) ||
        item.ativ.curto.toLowerCase().includes(termo) ||
        (item.dados.descricao_do_feito || "").toLowerCase().includes(termo)
      );
    }
    return true;
  });

  return (
    <div className="box sec" style={{ padding: "24px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0 }}>Diário de Campo: Anotações Práticas</h2>
          <p className="muted" style={{ margin: "4px 0 0 0", fontSize: "0.9em" }}>
            Registre diariamente suas experiências nos procedimentos práticos de estágio. O diário pode ser complementado ao longo do mesmo dia.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="btn solid"
            onClick={() => handleSalvar()}
            disabled={salvando || carregando}
          >
            {salvando ? "Salvando..." : "💾 Salvar Anotações do Dia"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`alert ${msg.tipo === "ok" ? "info" : "err"}`}
          style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "6px" }}
        >
          {msg.texto}
        </div>
      )}

      {/* Barra de Data e Dias Registrados */}
      <div
        className="box"
        style={{
          background: "#f8f9fa",
          padding: "16px",
          marginBottom: "20px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontWeight: "bold" }}>Data da Prática:</label>
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setDataSelecionada(new Date().toISOString().split("T")[0])}
          >
            Hoje
          </button>

          <div style={{ marginLeft: "auto", fontSize: "0.9em" }}>
            Progresso do dia: <strong>{totalPreenchidosHoje}</strong> de <strong>{ATIVIDADES.length}</strong> procedimentos anotados
          </div>
        </div>

        {/* Linha do tempo de dias anteriores com anotações */}
        {diasRegistrados.length > 0 && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", paddingTop: "8px", borderTop: "1px solid #eee" }}>
            <span style={{ fontSize: "0.85em", color: "#666", fontWeight: "bold" }}>Dias no diário:</span>
            {diasRegistrados.map((d) => (
              <button
                key={d.data}
                type="button"
                className={`btn ${d.data === dataSelecionada ? "solid" : "outline"} small`}
                style={{ fontSize: "0.8em", padding: "2px 8px" }}
                onClick={() => setDataSelecionada(d.data)}
              >
                📅 {new Date(d.data + "T12:00:00").toLocaleDateString()} ({d.total_procedimentos})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className={`btn ${filtro === "todos" ? "solid" : "ghost"} small`}
            onClick={() => setFiltro("todos")}
          >
            Todos ({ATIVIDADES.length})
          </button>
          <button
            type="button"
            className={`btn ${filtro === "preenchidos" ? "solid" : "ghost"} small`}
            onClick={() => setFiltro("preenchidos")}
          >
            Anotados Hoje ({totalPreenchidosHoje})
          </button>
          <button
            type="button"
            className={`btn ${filtro === "pendentes" ? "solid" : "ghost"} small`}
            onClick={() => setFiltro("pendentes")}
          >
            Não Anotados ({ATIVIDADES.length - totalPreenchidosHoje})
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar procedimento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "220px" }}
        />
      </div>

      {carregando ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Carregando anotações do dia...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {procedimentosFiltrados.map(({ ativ, idx, chave, dados, preenchido }) => (
            <div
              key={chave}
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "16px 20px",
                background: preenchido ? "#ffffff" : "#fdfdfd",
                borderLeft: preenchido ? "4px solid #00AD57" : "4px solid #bdbdbd",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <div>
                  <span
                    style={{
                      fontSize: "0.8em",
                      backgroundColor: "#e8f5e9",
                      color: "#2e7d32",
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
                {preenchido && (
                  <span style={{ fontSize: "0.8em", color: "#00AD57", fontWeight: "bold" }}>
                    ✓ Registrado para este dia
                  </span>
                )}
              </div>

              {/* Grid com os 4 campos requeridos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
                {/* Campo 1: O que fez */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85em", fontWeight: "bold", marginBottom: "6px" }}>
                    1. O que fez:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                    {OPCOES_O_QUE_FEZ.map((op) => (
                      <button
                        key={op}
                        type="button"
                        className={`btn ${dados.o_que_fez === op ? "solid" : "ghost"} small`}
                        style={{ fontSize: "0.8em", padding: "3px 8px" }}
                        onClick={() => handleCampoChange(chave, "o_que_fez", op)}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="input"
                    style={{ width: "100%", padding: "6px 8px", fontSize: "0.9em" }}
                    placeholder="Ou especifique o que realizou..."
                    value={dados.o_que_fez || ""}
                    onChange={(e) => handleCampoChange(chave, "o_que_fez", e.target.value)}
                  />
                </div>

                {/* Campo 2: Dificuldade */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85em", fontWeight: "bold", marginBottom: "6px" }}>
                    2. Dificuldade encontrada:
                  </label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
                    {OPCOES_DIFICULDADE.map((dif) => {
                      const ativo = dados.dificuldade === dif;
                      let corBg = "#f5f5f5";
                      if (ativo) {
                        if (dif === "Nenhuma") corBg = "#2e7d32";
                        else if (dif === "Baixa") corBg = "#0277bd";
                        else if (dif === "Média") corBg = "#f57c00";
                        else if (dif === "Alta") corBg = "#c62828";
                      }
                      return (
                        <button
                          key={dif}
                          type="button"
                          className={`btn ${ativo ? "solid" : "ghost"} small`}
                          style={{
                            fontSize: "0.8em",
                            padding: "3px 12px",
                            backgroundColor: ativo ? corBg : undefined,
                            borderColor: ativo ? corBg : undefined,
                          }}
                          onClick={() => handleCampoChange(chave, "dificuldade", dif)}
                        >
                          {dif}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    className="input"
                    style={{ width: "100%", padding: "6px 8px", fontSize: "0.9em" }}
                    placeholder="Observações sobre dificuldade técnica/teórica..."
                    value={dados.dificuldade || ""}
                    onChange={(e) => handleCampoChange(chave, "dificuldade", e.target.value)}
                  />
                </div>

                {/* Campo 3: Expectativa */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.85em", fontWeight: "bold", marginBottom: "4px" }}>
                    3. Expectativa / Aprendizado Esperado:
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    style={{ width: "100%", padding: "8px", fontSize: "0.9em" }}
                    placeholder="Qual era sua expectativa antes ou durante o procedimento? O que você esperava aprender ou aperfeiçoar?"
                    value={dados.expectativa || ""}
                    onChange={(e) => handleCampoChange(chave, "expectativa", e.target.value)}
                  />
                </div>

                {/* Campo 4: Descrição do feito */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.85em", fontWeight: "bold", marginBottom: "4px" }}>
                    4. Descrição detalhada do feito:
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    style={{ width: "100%", padding: "8px", fontSize: "0.9em" }}
                    placeholder="Relate detalhadamente como o procedimento foi realizado, setor, materiais empregados, orientação recebida e reações do paciente..."
                    value={dados.descricao_do_feito || ""}
                    onChange={(e) => handleCampoChange(chave, "descricao_do_feito", e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          {procedimentosFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "#666" }}>
              Nenhum procedimento encontrado com os filtros atuais.
            </div>
          )}

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn solid"
              onClick={() => handleSalvar()}
              disabled={salvando || carregando}
              style={{ minWidth: "220px", padding: "10px 24px" }}
            >
              {salvando ? "Salvando..." : "💾 Salvar Anotações do Dia"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
