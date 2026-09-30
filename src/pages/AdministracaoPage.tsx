import { useState, useEffect } from "react";
import { 
  type Profile, 
  type Membership, 
  getUserToken, 
  adminGetMembros, 
  adminAprovarMembro, 
  adminRevogarMembro, 
  adminReativarMembro, 
  adminGetConvites, 
  adminCriarConvite, 
  adminDeletarConvite, 
  adminSetAtribuicoes 
} from "../api/client";
import { 
  adminGetTurmas, adminCreateTurma, adminUpdateTurma, adminDeleteTurma, adminGetTurma, 
  adminAddMembroTurma, adminRemoveMembroTurma, 
  adminGetCalendarioPadrao, adminAddCalendarioPadrao, adminDeleteCalendarioPadrao,
  getCalendarioTurma, addCalendarioTurma, deleteCalendarioTurma, gerarAulasTurma
} from "../api/ead";
import FrequenciaAdmin from "../components/FrequenciaAdmin";


type Aba = "docentes" | "convites" | "administradores" | "alunos" | "turmas" | "calendario";

export default function AdministracaoPage({ memberships, onSair }: { perfil: Profile; memberships: Membership[]; onSair: () => void }) {
  const adminMembership = memberships.find(m => m.papel === "administrador" && m.situacao === "ativo");
  const atribuicoes = adminMembership?.atribuicoes || [];

  const canDocentes = atribuicoes.includes("docentes.gerenciar");
  const canAdmin = atribuicoes.includes("administradores.gerenciar");
  const canConvites = canDocentes || canAdmin;
  const canAlunos = atribuicoes.includes("alunos.ler");
  const canTurmas = atribuicoes.includes("turmas.gerenciar");
  const canCalendario = atribuicoes.includes("calendario.gerenciar");
  const canFrequencia = atribuicoes.includes("turmas.gerenciar") || atribuicoes.includes("frequencia.ler");

  const abasDisponiveis: Aba[] = [];
  if (canDocentes) abasDisponiveis.push("docentes");
  if (canConvites) abasDisponiveis.push("convites");
  if (canAdmin) abasDisponiveis.push("administradores");
  if (canAlunos) abasDisponiveis.push("alunos");
  if (canTurmas) abasDisponiveis.push("turmas");
  if (canCalendario) abasDisponiveis.push("calendario");
  if (canFrequencia) abasDisponiveis.push("frequencia" as Aba);

  const [aba, setAba] = useState<Aba | "frequencia" | "">(abasDisponiveis.length > 0 ? abasDisponiveis[0] : "");

  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [msg, setMsg] = useState<{tipo: "ok"|"err", texto: string} | null>(null);

  // Convite state
  const [novoConviteEmail, setNovoConviteEmail] = useState("");
  const [novoConvitePapel, setNovoConvitePapel] = useState<"docente" | "administrador">("docente");
  const [novoConviteAtribuicoes, setNovoConviteAtribuicoes] = useState<string[]>([]);

  // Permissoes state
  const [editandoMembroId, setEditandoMembroId] = useState<string | null>(null);
  const [membroAtribuicoes, setMembroAtribuicoes] = useState<string[]>([]);

  // Turmas state
  const [editandoTurmaId, setEditandoTurmaId] = useState<string | null>(null);
  const [turmaDetalhes, setTurmaDetalhes] = useState<any>(null);
  const [novaTurma, setNovaTurma] = useState<any>({nome: "", campo_estagio: false, inicio: "", fim: "", carga_horaria_horas: 0, etapas: 1, minutos_hora_aula: 60, aulas_por_dia: 1, dias_semana: [], horario_inicio: "", situacao: "ativa"});

  // Calendario Escola state
  const [novoCalDataInicio, setNovoCalDataInicio] = useState("");
  const [novoCalDataFim, setNovoCalDataFim] = useState("");
  const [novoCalTipo, setNovoCalTipo] = useState<"feriado" | "recesso">("feriado");
  const [novoCalDescricao, setNovoCalDescricao] = useState("");
  
  // Turma Membros & Calendario
  const [addMembroUserId, setAddMembroUserId] = useState("");
  const [addMembroPapel, setAddMembroPapel] = useState<"aluno" | "docente">("aluno");
  const [alunosAtivos, setAlunosAtivos] = useState<any[]>([]);
  const [docentesAtivos, setDocentesAtivos] = useState<any[]>([]);
  const [turmaCalendario, setTurmaCalendario] = useState<any[]>([]);
  const [novoTurmaCalDataInicio, setNovoTurmaCalDataInicio] = useState("");
  const [novoTurmaCalDataFim, setNovoTurmaCalDataFim] = useState("");
  const [novoTurmaCalTipo, setNovoTurmaCalTipo] = useState<"feriado" | "recesso">("feriado");
  const [novoTurmaCalDescricao, setNovoTurmaCalDescricao] = useState("");


  const token = getUserToken() || "";

  useEffect(() => {
    if (!aba) return;
    carregar();
  }, [aba]);

  async function carregar() {
    setCarregando(true);
    setMsg(null);
    try {
      if (aba === "docentes") {
        const res = await adminGetMembros(token, "papel=docente");
        setLista((res as any)?.data || []);
      } else if (aba === "administradores") {
        const res = await adminGetMembros(token, "papel=administrador");
        setLista((res as any)?.data || []);
      } else if (aba === "alunos") {
        const res = await adminGetMembros(token, "papel=aluno");
        setLista((res as any)?.data || []);
      
      } else if (aba === "turmas") {
        const res = await adminGetTurmas(token);
        setLista(res);
      } else if (aba === "calendario") {
        const res = await adminGetCalendarioPadrao(token);
        setLista(res);

      } else if (aba === "convites") {
        const res = await adminGetConvites(token);
        setLista((res as any)?.data || []);
      }
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao carregar dados" });
    } finally {
      setCarregando(false);
    }
  }

  

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (novaTurma.id) {
        await adminUpdateTurma(token, novaTurma.id, novaTurma);
        setMsg({ tipo: "ok", texto: "Turma atualizada." });
      } else {
        await adminCreateTurma(token, novaTurma);
        setMsg({ tipo: "ok", texto: "Turma criada." });
      }
      setEditandoTurmaId(null);
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao salvar turma." });
    }
  };

  const handleExcluirTurma = async (id: string) => {
    if (!window.confirm("Excluir esta turma?")) return;
    try {
      await adminDeleteTurma(token, id);
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const carregarTurmaDetalhes = async (id: string) => {
    setCarregando(true);
    try {
      const res = await adminGetTurma(token, id);
      setTurmaDetalhes(res);
      setEditandoTurmaId(id);
      
      const al = await adminGetMembros(token, "papel=aluno&situacao=ativo");
      setAlunosAtivos((al as any).data || []);
      const doc = await adminGetMembros(token, "papel=docente&situacao=ativo");
      setDocentesAtivos((doc as any).data || []);
      
      const cal = await getCalendarioTurma(token, id);
      setTurmaCalendario(cal);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    } finally {
      setCarregando(false);
    }
  };

  const handleAddMembroTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMembroUserId) return;
    try {
      await adminAddMembroTurma(token, editandoTurmaId!, { user_id: addMembroUserId, papel: addMembroPapel });
      carregarTurmaDetalhes(editandoTurmaId!);
      setAddMembroUserId("");
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleRemoveMembroTurma = async (membroId: string) => {
    if (!window.confirm("Remover membro da turma?")) return;
    try {
      await adminRemoveMembroTurma(token, editandoTurmaId!, membroId);
      carregarTurmaDetalhes(editandoTurmaId!);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleAddCalPadrao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAddCalendarioPadrao(token, {
        data_inicio: novoCalDataInicio,
        data_fim: novoCalDataFim || novoCalDataInicio,
        tipo: novoCalTipo,
        descricao: novoCalDescricao
      });
      setNovoCalDataInicio("");
      setNovoCalDataFim("");
      setNovoCalDescricao("");
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleRemoveCalPadrao = async (id: string) => {
    try {
      await adminDeleteCalendarioPadrao(token, id);
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleAddTurmaCal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCalendarioTurma(token, editandoTurmaId!, {
        data_inicio: novoTurmaCalDataInicio,
        data_fim: novoTurmaCalDataFim || novoTurmaCalDataInicio,
        tipo: novoTurmaCalTipo,
        descricao: novoTurmaCalDescricao
      });
      setNovoTurmaCalDataInicio("");
      setNovoTurmaCalDataFim("");
      setNovoTurmaCalDescricao("");
      carregarTurmaDetalhes(editandoTurmaId!);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleRemoveTurmaCal = async (eventoId: string) => {
    try {
      await deleteCalendarioTurma(token, editandoTurmaId!, eventoId);
      carregarTurmaDetalhes(editandoTurmaId!);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const handleGerarAulas = async () => {
    if (!window.confirm("Gerar aulas? Isso recriará aulas futuras não realizadas.")) return;

    try {
      const res: any = await gerarAulasTurma(token, editandoTurmaId!);
      if (!res) throw new Error("Sem resposta");

      let diffStr = "";
      if (res.diferenca_horas > 0) diffStr = `(${res.diferenca_horas} horas a mais)`;
      else if (res.diferenca_horas < 0) diffStr = `(${-res.diferenca_horas} horas a menos)`;
      else diffStr = "(Exatamente a carga do ciclo)";
      
      const txt = `${res.aulas_previstas} aulas previstas, ${res.aulas_canceladas} canceladas. Carga prevista: ${res.carga_prevista_horas} horas; carga do ciclo: ${res.carga_horaria_horas} horas ${diffStr}.`;
      alert(txt);
      carregarTurmaDetalhes(editandoTurmaId!);
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message });
    }
  };

  const toggleDiaSemana = (d: number) => {
    setNovaTurma((prev: any) => {
      const dias = prev.dias_semana || [];
      if (dias.includes(d)) return { ...prev, dias_semana: dias.filter((x: number) => x !== d) };
      return { ...prev, dias_semana: [...dias, d] };
    });
  };

const handleAprovar = async (id: string) => {
    try {
      await adminAprovarMembro(token, id);
      setMsg({ tipo: "ok", texto: "Membro aprovado com sucesso." });
      carregar();
    } catch (e: any) {
      if (e.status === 422 && e.body?.code === "membro_sem_confirmacao") {
        setLista(prev => prev.map(m => m.id === id ? { ...m, erroAprovacao: e.body?.message || "O docente não confirmou o e-mail/telefone." } : m));
      } else {
        setMsg({ tipo: "err", texto: e.message || "Erro ao aprovar membro." });
      }
    }
  };

  const handleRevogar = async (id: string) => {
    const motivo = window.prompt("Qual o motivo da revogação?");
    if (motivo === null) return;
    try {
      await adminRevogarMembro(token, id, motivo);
      setMsg({ tipo: "ok", texto: "Membro revogado com sucesso." });
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao revogar membro." });
    }
  };

  const handleReativar = async (id: string) => {
    try {
      await adminReativarMembro(token, id);
      setMsg({ tipo: "ok", texto: "Membro reativado com sucesso." });
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao reativar membro." });
    }
  };

  const handleCriarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCriarConvite(token, {
        email: novoConviteEmail,
        papel: novoConvitePapel,
        atribuicoes: novoConvitePapel === "administrador" ? novoConviteAtribuicoes : undefined
      });
      setMsg({ tipo: "ok", texto: "Convite enviado com sucesso." });
      setNovoConviteEmail("");
      setNovoConviteAtribuicoes([]);
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao enviar convite." });
    }
  };

  const handleCancelarConvite = async (id: string) => {
    if (!window.confirm("Cancelar este convite?")) return;
    try {
      await adminDeletarConvite(token, id);
      setMsg({ tipo: "ok", texto: "Convite cancelado." });
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao cancelar convite." });
    }
  };

  const handleSalvarPermissoes = async () => {
    if (!editandoMembroId) return;
    try {
      await adminSetAtribuicoes(token, editandoMembroId, membroAtribuicoes);
      setMsg({ tipo: "ok", texto: "Permissões atualizadas." });
      setEditandoMembroId(null);
      carregar();
    } catch (e: any) {
      setMsg({ tipo: "err", texto: e.message || "Erro ao atualizar permissões." });
    }
  };

  const toggleAtribuicao = (list: string[], setList: (l: string[]) => void, att: string) => {
    if (list.includes(att)) {
      setList(list.filter(x => x !== att));
    } else {
      setList([...list, att]);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="in">
          <div className="who">
            <b>Administração EAD</b>
          </div>
          <button className="btn ghost small" onClick={onSair}>Sair</button>
        </div>
        <nav className="nav" role="tablist">
          {canDocentes && <button role="tab" aria-selected={aba === "docentes"} onClick={() => setAba("docentes")}>Docentes</button>}
          {canConvites && <button role="tab" aria-selected={aba === "convites"} onClick={() => setAba("convites")}>Convites</button>}
          {canAdmin && <button role="tab" aria-selected={aba === "administradores"} onClick={() => setAba("administradores")}>Administradores</button>}
          {canAlunos && <button role="tab" aria-selected={aba === "alunos"} onClick={() => setAba("alunos")}>Alunos</button>}
        
          {canTurmas && <button role="tab" aria-selected={aba === "turmas"} onClick={() => { setAba("turmas"); setEditandoTurmaId(null); }}>Turmas</button>}
          {canFrequencia && <button role="tab" aria-selected={aba === "frequencia"} onClick={() => setAba("frequencia")}>Frequência</button>}
          {canCalendario && <button role="tab" aria-selected={aba === "calendario"} onClick={() => setAba("calendario")}>Calendário da escola</button>}
        </nav>
      </div>

      <main className="page" style={{ padding: 20 }}>
        {msg && (
          <div className={`alert ${msg.tipo === "ok" ? "info" : "err"}`} style={{ marginBottom: 20 }}>
            {msg.texto}
          </div>
        )}

        {carregando && <p>Carregando...</p>}

        {!carregando && aba === "docentes" && (
          <div className="box">
            <h2>Docentes</h2>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Situação</th>
                  <th>Registro Profissional</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(m => (
                  <tr key={m.id}>
                    <td>
                      {m.usuario?.name || "N/A"}
                      {m.erroAprovacao && <span className="e" style={{ display: "block", fontSize: "0.8em", color: "red", marginTop: 4 }}>{m.erroAprovacao}</span>}
                    </td>
                    <td>{m.usuario?.email || "N/A"}</td>
                    <td>{m.situacao}</td>
                    <td>
                      {m.registros_profissionais && m.registros_profissionais.length > 0 ? (
                        m.registros_profissionais.map((r: any) => {
                          const cor = r.situacao === "regular" ? "green" : (r.situacao === "nao_conferido" ? "gray" : "red");
                          const situacaoTxt = r.situacao === "nao_conferido" ? "Não conferido" : (r.situacao.charAt(0).toUpperCase() + r.situacao.slice(1));
                          return (
                            <div key={r.id} style={{ marginBottom: 4 }}>
                              <span>{r.conselho}/{r.uf} {r.numero} ({r.categoria})</span>
                              <span style={{ marginLeft: 8, fontSize: "0.8em", color: "white", backgroundColor: cor, padding: "2px 6px", borderRadius: 4 }}>
                                {situacaoTxt}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="muted">{m.situacao === "pendente" ? "Sem registro informado" : "Sem registro"}</span>
                      )}
                    </td>
                    <td>
                      {m.situacao === "pendente" && <button className="btn small" onClick={() => handleAprovar(m.id)}>Aprovar</button>}
                      {m.situacao === "ativo" && <button className="btn ghost small" onClick={() => handleRevogar(m.id)}>Revogar</button>}
                      {m.situacao === "revogado" && <button className="btn ghost small" onClick={() => handleReativar(m.id)}>Reativar</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && aba === "administradores" && (
          <div className="box">
            <h2>Administradores</h2>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Permissões</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(m => (
                  <tr key={m.id}>
                    <td>{m.usuario?.name || "N/A"}</td>
                    <td>{m.usuario?.email || "N/A"}</td>
                    <td>{(m.atribuicoes || []).join(", ")}</td>
                    <td>
                      <button className="btn ghost small" onClick={() => {
                        setEditandoMembroId(m.id);
                        setMembroAtribuicoes(m.atribuicoes || []);
                      }}>Permissões</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && aba === "alunos" && (
          <div className="box">
            <h2>Alunos</h2>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(m => (
                  <tr key={m.id}>
                    <td>{m.usuario?.name || "N/A"}</td>
                    <td>{m.usuario?.email || "N/A"}</td>
                    <td>{m.situacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && aba === "convites" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="box">
              <h2>Novo Convite</h2>
              <form onSubmit={handleCriarConvite} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 }}>
                <input type="email" value={novoConviteEmail} onChange={e => setNovoConviteEmail(e.target.value)} placeholder="E-mail" required />
                <select value={novoConvitePapel} onChange={e => setNovoConvitePapel(e.target.value as any)}>
                  <option value="docente">Docente</option>
                  {canAdmin && <option value="administrador">Administrador</option>}
                </select>
                {novoConvitePapel === "administrador" && (
                  <div>
                    <label style={{ display: "block", marginBottom: 5 }}>Atribuições:</label>
                    <label style={{ display: "block" }}>
                      <input type="checkbox" checked={novoConviteAtribuicoes.includes("docentes.gerenciar")} onChange={() => toggleAtribuicao(novoConviteAtribuicoes, setNovoConviteAtribuicoes, "docentes.gerenciar")} /> docentes.gerenciar
                    </label>
                    <label style={{ display: "block" }}>
                      <input type="checkbox" checked={novoConviteAtribuicoes.includes("administradores.gerenciar")} onChange={() => toggleAtribuicao(novoConviteAtribuicoes, setNovoConviteAtribuicoes, "administradores.gerenciar")} /> administradores.gerenciar
                    </label>
                    <label style={{ display: "block" }}>
                      <input type="checkbox" checked={novoConviteAtribuicoes.includes("alunos.ler")} onChange={() => toggleAtribuicao(novoConviteAtribuicoes, setNovoConviteAtribuicoes, "alunos.ler")} /> alunos.ler
                    </label>
                  </div>
                )}
                <button type="submit" className="btn">Enviar Convite</button>
              </form>
            </div>

            <div className="box">
              <h2>Convites Pendentes</h2>
              <table className="heat" style={{ width: "100%", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(c => (
                    <tr key={c.id}>
                      <td>{c.email}</td>
                      <td>{c.papel}</td>
                      <td>
                        <button className="btn ghost small" onClick={() => handleCancelarConvite(c.id)}>Cancelar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!carregando && aba === "calendario" && (
          <div className="box">
            <h2>Calendário da Escola (Padrão)</h2>
            <form onSubmit={handleAddCalPadrao} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
              <div><label>Data Início</label><input type="date" value={novoCalDataInicio} onChange={e=>setNovoCalDataInicio(e.target.value)} required /></div>
              <div><label>Data Fim (opcional)</label><input type="date" value={novoCalDataFim} onChange={e=>setNovoCalDataFim(e.target.value)} /></div>
              <div>
                <label>Tipo</label>
                <select value={novoCalTipo} onChange={e=>setNovoCalTipo(e.target.value as any)}>
                  <option value="feriado">Feriado</option>
                  <option value="recesso">Recesso</option>
                </select>
              </div>
              <div><label>Descrição</label><input type="text" value={novoCalDescricao} onChange={e=>setNovoCalDescricao(e.target.value)} required /></div>
              <button className="btn" type="submit">Adicionar</button>
            </form>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Ações</th></tr></thead>
              <tbody>
                {lista.map(ev => (
                  <tr key={ev.id}>
                    <td>{ev.data}</td><td>{ev.tipo}</td><td>{ev.descricao}</td>
                    <td><button className="btn ghost small" onClick={() => handleRemoveCalPadrao(ev.id)}>Excluir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && aba === "turmas" && editandoTurmaId === null && (
          <div className="box">
            <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
              <h2>Turmas</h2>
              <button className="btn" onClick={() => { setNovaTurma({nome: "", campo_estagio: "", inicio: "", fim: "", carga_horaria_horas: 0, etapas: 1, minutos_hora_aula: 60, aulas_por_dia: 1, dias_semana: [], horario_inicio: "", situacao: "planejada"}); setEditandoTurmaId("novo"); }}>Nova Turma</button>
            </div>
            <table className="heat" style={{ width: "100%", textAlign: "left" }}>
              <thead><tr><th>Nome</th><th>Início - Fim</th><th>Situação</th><th>Ações</th></tr></thead>
              <tbody>
                {lista.map(t => (
                  <tr key={t.id}>
                    <td>{t.nome} ({t.campo_estagio})</td>
                    <td>{t.inicio} a {t.fim}</td>
                    <td>{t.situacao}</td>
                    <td>
                      <button className="btn small" onClick={() => carregarTurmaDetalhes(t.id)}>Gerenciar</button>
                      <button className="btn ghost small" style={{marginLeft: 5}} onClick={() => {setNovaTurma(t); setEditandoTurmaId(t.id);}}>Editar</button>
                      <button className="btn ghost small" style={{marginLeft: 5}} onClick={() => handleExcluirTurma(t.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && aba === "turmas" && editandoTurmaId !== null && editandoTurmaId !== "novo" && turmaDetalhes && (
          <div>
            <button className="btn ghost" style={{marginBottom: 20}} onClick={() => { setEditandoTurmaId(null); carregar(); }}>&larr; Voltar para lista</button>
            
            <div className="box" style={{marginBottom: 20}}>
              <div style={{display:"flex", justifyContent:"space-between"}}>
                <h2>{turmaDetalhes.nome} ({turmaDetalhes.campo_estagio})</h2>
                <button className="btn" onClick={handleGerarAulas}>Gerar aulas</button>
              </div>
              <p>Ciclo: {turmaDetalhes.inicio} a {turmaDetalhes.fim} | Situação: {turmaDetalhes.situacao}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="box">
                <h3>Membros</h3>
                <form onSubmit={handleAddMembroTurma} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
                  <div>
                    <label>Papel</label>
                    <select value={addMembroPapel} onChange={e=>setAddMembroPapel(e.target.value as any)}>
                      <option value="aluno">Aluno</option>
                      <option value="docente">Docente</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Usuário</label>
                    <select value={addMembroUserId} onChange={e=>setAddMembroUserId(e.target.value)} required style={{width:"100%"}}>
                      <option value="">Selecione...</option>
                      {(addMembroPapel === "aluno" ? alunosAtivos : docentesAtivos).map(u => (
                        <option key={u.user_id} value={u.user_id}>{u.usuario?.name || u.usuario?.email}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn" type="submit">Adicionar</button>
                </form>
                <table className="heat" style={{ width: "100%", textAlign: "left" }}>
                  <thead><tr><th>Nome</th><th>Papel</th><th>Ações</th></tr></thead>
                  <tbody>
                    {(turmaDetalhes.membros || []).map((m: any) => (
                      <tr key={m.id}>
                        <td>{m.nome}</td><td>{m.papel}</td>
                        <td><button className="btn ghost small" onClick={() => handleRemoveMembroTurma(m.id)}>Remover</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="box">
                <h3>Calendário da Turma</h3>
                <form onSubmit={handleAddTurmaCal} style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "end" }}>
                  <div><label>Data Início</label><input type="date" value={novoTurmaCalDataInicio} onChange={e=>setNovoTurmaCalDataInicio(e.target.value)} required style={{width: 130}} /></div>
                  <div><label>Fim (opcional)</label><input type="date" value={novoTurmaCalDataFim} onChange={e=>setNovoTurmaCalDataFim(e.target.value)} style={{width: 130}} /></div>
                  <div>
                    <label>Tipo</label>
                    <select value={novoTurmaCalTipo} onChange={e=>setNovoTurmaCalTipo(e.target.value as any)}>
                      <option value="feriado">Feriado</option>
                      <option value="recesso">Recesso</option>
                      <option value="avaliacao">Avaliação</option>
                      <option value="letivo_extra">Letivo Extra</option>
                    </select>
                  </div>
                  <div style={{width: "100%"}}><label>Descrição</label><input type="text" value={novoTurmaCalDescricao} onChange={e=>setNovoTurmaCalDescricao(e.target.value)} required style={{width:"100%"}} /></div>
                  <button className="btn" type="submit">Adicionar</button>
                </form>
                <table className="heat" style={{ width: "100%", textAlign: "left" }}>
                  <thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Ações</th></tr></thead>
                  <tbody>
                    {turmaCalendario.map(ev => (
                      <tr key={ev.id}>
                        <td>{ev.data}</td><td>{ev.tipo}</td><td>{ev.descricao}</td>
                        <td><button className="btn ghost small" onClick={() => handleRemoveTurmaCal(ev.id)}>Excluir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {aba === "turmas" && (editandoTurmaId === "novo" || (editandoTurmaId && editandoTurmaId !== "novo" && !turmaDetalhes)) && (
          <div className="box" style={{maxWidth: 600}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom: 20}}>
              <h2>{editandoTurmaId === "novo" ? "Nova Turma" : "Editar Turma"}</h2>
              <button className="btn ghost small" onClick={() => { setEditandoTurmaId(null); carregar(); }}>Cancelar</button>
            </div>
            <form onSubmit={handleSalvarTurma} style={{display:"flex", flexDirection:"column", gap:15}}>
              <div><label>Nome</label><input type="text" value={novaTurma.nome} onChange={e=>setNovaTurma({...novaTurma, nome: e.target.value})} required style={{width:"100%"}} /></div>
              <div><label>Campo Estágio</label><input type="text" value={novaTurma.campo_estagio} onChange={e=>setNovaTurma({...novaTurma, campo_estagio: e.target.value})} required style={{width:"100%"}} /></div>
              <div style={{display:"flex", gap:10}}>
                <div style={{flex:1}}><label>Início</label><input type="date" value={novaTurma.inicio} onChange={e=>setNovaTurma({...novaTurma, inicio: e.target.value})} required style={{width:"100%"}} /></div>
                <div style={{flex:1}}><label>Fim</label><input type="date" value={novaTurma.fim} onChange={e=>setNovaTurma({...novaTurma, fim: e.target.value})} required style={{width:"100%"}} /></div>
              </div>
              <div style={{display:"flex", gap:10}}>
                <div style={{flex:1}}><label>Carga Horária (h)</label><input type="number" value={novaTurma.carga_horaria_horas} onChange={e=>setNovaTurma({...novaTurma, carga_horaria_horas: Number(e.target.value)})} required style={{width:"100%"}} /></div>
                <div style={{flex:1}}><label>Etapas</label><input type="number" value={novaTurma.etapas} onChange={e=>setNovaTurma({...novaTurma, etapas: Number(e.target.value)})} required style={{width:"100%"}} /></div>
              </div>
              <div style={{display:"flex", gap:10}}>
                <div style={{flex:1}}><label>Minutos por Aula</label><input type="number" value={novaTurma.minutos_hora_aula} onChange={e=>setNovaTurma({...novaTurma, minutos_hora_aula: Number(e.target.value)})} required style={{width:"100%"}} /></div>
                <div style={{flex:1}}><label>Aulas por Dia</label><input type="number" value={novaTurma.aulas_por_dia} onChange={e=>setNovaTurma({...novaTurma, aulas_por_dia: Number(e.target.value)})} required style={{width:"100%"}} /></div>
                <div style={{flex:1}}><label>Horário Início</label><input type="time" value={novaTurma.horario_inicio} onChange={e=>setNovaTurma({...novaTurma, horario_inicio: e.target.value})} required style={{width:"100%"}} /></div>
              </div>
              <div>
                <label>Dias da Semana (1=Segunda, 7=Domingo)</label>
                <div style={{display:"flex", gap:10, marginTop: 5}}>
                  {[1,2,3,4,5,6,7].map(d => (
                    <label key={d} style={{display:"flex", alignItems:"center", gap: 5}}>
                      <input type="checkbox" checked={(novaTurma.dias_semana || []).includes(d)} onChange={() => toggleDiaSemana(d)} /> {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][d-1]}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label>Situação</label>
                <select value={novaTurma.situacao} onChange={e=>setNovaTurma({...novaTurma, situacao: e.target.value})} style={{width:"100%"}}>
                  <option value="planejada">Planejada</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="encerrada">Encerrada</option>
                </select>
              </div>
              <button className="btn" type="submit">Salvar</button>
            </form>
          </div>
        )}

        {!carregando && aba === "frequencia" && (
          <FrequenciaAdmin atribuicoes={atribuicoes} />
        )}

      </main>

      {editandoMembroId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="box" style={{ background: "white", width: 400, padding: 20 }}>
            <h2>Editar Permissões</h2>
            <div style={{ margin: "20px 0" }}>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={membroAtribuicoes.includes("docentes.gerenciar")} onChange={() => toggleAtribuicao(membroAtribuicoes, setMembroAtribuicoes, "docentes.gerenciar")} /> docentes.gerenciar
              </label>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={membroAtribuicoes.includes("administradores.gerenciar")} onChange={() => toggleAtribuicao(membroAtribuicoes, setMembroAtribuicoes, "administradores.gerenciar")} /> administradores.gerenciar
              </label>
              <label style={{ display: "block" }}>
                <input type="checkbox" checked={membroAtribuicoes.includes("alunos.ler")} onChange={() => toggleAtribuicao(membroAtribuicoes, setMembroAtribuicoes, "alunos.ler")} /> alunos.ler
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" onClick={handleSalvarPermissoes}>Salvar</button>
              <button className="btn ghost" onClick={() => setEditandoMembroId(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
