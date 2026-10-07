import React, { useState, useEffect, useRef } from "react";
import type { Profile, Membership } from "../api/client";
import {
  getUserToken,
  getRegistrosProfissionais,
  deleteRegistroProfissional,
  type RegistroProfissional,
} from "../api/client";
import RegistroProfissionalForm from "./RegistroProfissionalForm";
import { navegar } from "../lib/rota";

const LOGIN_CENTRAL = (import.meta.env.VITE_LOGIN_CENTRAL_URL ?? "https://entrar.postodeenfermagem.com.br").replace(/\/+$/, "");
const LOGO_ETCR = "https://etcr.com.br/site/wp-content/uploads/2025/09/LogoAtualizado.svg";

export interface MenuEadProps {
  perfil: Profile;
  memberships: Membership[];
  papelAtivo: "aluno" | "docente" | "administrador";
  abaAtiva: string;
  onSelecionarAba: (aba: string) => void;
  onSair: () => void;
  turmaInfo?: { nome?: string; codigo?: string; turno?: string };
}

function texto(p: Profile, k: string): string {
  const v = p[k];
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
}

function primeiroNome(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  return partes[0] || "Usuário";
}

function extrairIniciais(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Ícones SVG vetorizados clínicos e acadêmicos com traço uniforme de 2px
 */
function renderIcone(chave: string) {
  switch (chave) {
    case "dashboard":
    case "inicio":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "autoavaliacao":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "evolucao":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "avaliacoes_recebidas":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      );
    case "grafico":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "calendario":
    case "calendario_escola":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "planejamento":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="13" y2="11" />
        </svg>
      );
    case "presenca":
    case "frequencia":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "guia":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "anotacoes_campo":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "avaliacao_sup":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "autoavaliacoes_aluno":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "paralelo":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case "selecionar_alunos":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "aulas":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "chamada":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "docentes":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "convites":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "administradores":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "alunos":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case "turmas":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function MenuEad({
  perfil,
  memberships,
  papelAtivo,
  abaAtiva,
  onSelecionarAba,
  onSair,
  turmaInfo,
}: MenuEadProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [meusRegistros, setMeusRegistros] = useState<RegistroProfissional[]>([]);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nome = texto(perfil, "name") || texto(perfil, "email") || "Usuário";
  const primeiro = primeiroNome(nome);
  const email = texto(perfil, "email");
  const avatarUrl = (typeof perfil.avatar_url === "string" && perfil.avatar_url) || (typeof perfil.foto === "string" && perfil.foto) || "";
  const iniciais = extrairIniciais(nome);

  const activeMemberships = memberships.filter((m) => m.situacao === "ativo");
  const temAluno = activeMemberships.some((m) => m.papel === "aluno");
  const temDocente = activeMemberships.some((m) => m.papel === "docente");
  const temAdmin = activeMemberships.some((m) => m.papel === "administrador");

  // Fechar dropdown com clique fora ou Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setUserDropdownOpen(false);
        setModalRegistroOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const carregarRegistros = async () => {
    setCarregandoRegistros(true);
    try {
      const token = getUserToken();
      if (token) {
        const regs = await getRegistrosProfissionais(token);
        setMeusRegistros(regs);
      }
    } catch (e) {
      console.error("Erro ao carregar registros profissionais", e);
    } finally {
      setCarregandoRegistros(false);
    }
  };

  useEffect(() => {
    if (modalRegistroOpen) {
      carregarRegistros();
    }
  }, [modalRegistroOpen]);

  const handleExcluirRegistro = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    try {
      const token = getUserToken();
      if (token) {
        await deleteRegistroProfissional(token, id);
        carregarRegistros();
      }
    } catch (err: any) {
      if (err.status === 422 && err.body?.code === "registro_em_uso_por_vinculo") {
        alert("Este registro está em uso pelo seu vínculo ativo com a organização e não pode ser excluído.");
      } else {
        alert(err.message || "Erro ao excluir registro.");
      }
    }
  };

  const handleIrParaDados = () => {
    setUserDropdownOpen(false);
    const returnTo = window.location.href;
    window.location.assign(`${LOGIN_CENTRAL}/meus-dados?return_to=${encodeURIComponent(returnTo)}`);
  };

  const handleAbrirRegistro = () => {
    setUserDropdownOpen(false);
    setModalRegistroOpen(true);
  };

  const handleTrocarPapel = (papel: "aluno" | "docente" | "administrador") => {
    setUserDropdownOpen(false);
    if (papel === "aluno") navegar("/sala");
    else if (papel === "docente") navegar("/supervisao");
    else if (papel === "administrador") navegar("/administracao");
  };

  const handleItemClick = (chaveAba: string, destinoRota?: string) => {
    if (destinoRota) {
      navegar(destinoRota);
    } else {
      onSelecionarAba(chaveAba);
    }
  };

  // Definição das colunas por papel
  // Aluno: 3 colunas (Sala, Turma, Diário)
  // Supervisor: 2 colunas (Alunos, Turmas)
  // Administrador: 4 colunas (Alunos, Turmas, Organização, Administração)
  const isAluno = papelAtivo === "aluno";
  const isDocente = papelAtivo === "docente";
  const isAdmin = papelAtivo === "administrador";

  return (
    <>
      <header className="topbar-ead">
        <div className="topbar-ead-in">
          {/* Marca à esquerda */}
          <div
            className="topbar-ead-brand"
            onClick={() => {
              if (isAluno) onSelecionarAba("dashboard");
              else if (isDocente) onSelecionarAba("avaliacao_sup");
              else if (isAdmin) onSelecionarAba("docentes");
            }}
          >
            <img src={LOGO_ETCR} alt="ETCR Escola Técnica" className="topbar-ead-logo" />
            <div className="topbar-ead-titles">
              <span className="topbar-ead-school">Escola Técnica Cristo Redentor</span>
              <span className="topbar-ead-sub">
                {isAluno ? "Sala do Aluno · EAD" : isDocente ? "Supervisão de Estágio · EAD" : "Administração · EAD"}
              </span>
            </div>
          </div>

          {/* Foto/Avatar + Nome à direita com dropdown */}
          <div className="topbar-user-wrap" ref={dropdownRef}>
            <button
              type="button"
              className="topbar-user-btn"
              aria-expanded={userDropdownOpen}
              aria-label="Menu do usuário"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              <div className="topbar-user-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome} />
                ) : (
                  <span>{iniciais}</span>
                )}
              </div>
              <span className="topbar-user-name">{primeiro}</span>
              <svg
                className="topbar-user-chevron"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {userDropdownOpen && (
              <div className="topbar-user-dropdown" role="menu">
                <div className="dropdown-header">
                  <div className="dropdown-user-name">{nome}</div>
                  {email && <div className="dropdown-user-email">{email}</div>}
                </div>

                <div className="dropdown-section-title">Minha Conta</div>
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  onClick={handleIrParaDados}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Dados
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item"
                  onClick={handleAbrirRegistro}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="13" y2="16" />
                  </svg>
                  Registro profissional
                </button>

                <div className="dropdown-divider" />
                <div className="dropdown-section-title">Papel no EAD</div>

                {temAluno && (
                  <button
                    type="button"
                    role="menuitem"
                    className={`dropdown-item ${papelAtivo === "aluno" ? "dropdown-item-active" : ""}`}
                    onClick={() => handleTrocarPapel("aluno")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    Aluno {papelAtivo === "aluno" ? "✓" : ""}
                  </button>
                )}

                {temDocente && (
                  <button
                    type="button"
                    role="menuitem"
                    className={`dropdown-item ${papelAtivo === "docente" ? "dropdown-item-active" : ""}`}
                    onClick={() => handleTrocarPapel("docente")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Supervisor {papelAtivo === "docente" ? "✓" : ""}
                  </button>
                )}

                {temAdmin && (
                  <button
                    type="button"
                    role="menuitem"
                    className={`dropdown-item ${papelAtivo === "administrador" ? "dropdown-item-active" : ""}`}
                    onClick={() => handleTrocarPapel("administrador")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Administrador {papelAtivo === "administrador" ? "✓" : ""}
                  </button>
                )}

                {/* Administrador não cai na sala. Opção "Ver como aluno" permite abrir a sala com o mesmo login */}
                {temAdmin && (
                  papelAtivo === "aluno" ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleTrocarPapel("administrador")}
                      style={{ color: "var(--accent)", fontWeight: 600 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      Voltar para Administração
                    </button>
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      className="dropdown-item"
                      onClick={() => handleTrocarPapel("aluno")}
                      style={{ color: "var(--c2)", fontWeight: 600 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      Ver como aluno
                    </button>
                  )
                )}

                <div className="dropdown-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="dropdown-item danger"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onSair();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MENU por baixo, no jeito da Enfaci, no máximo quatro colunas. Não é faixa de abas. */}
        <div className="menu-ead-wrapper">
          <div
            className="menu-ead-grid"
            style={{ "--menu-cols": isAluno ? 3 : isDocente ? 2 : 4 } as React.CSSProperties}
          >
            {/* 1. MODO ALUNO */}
            {isAluno && (
              <>
                {/* Coluna 1: Sala */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Sala</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "dashboard" || abaAtiva === "inicio" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("dashboard")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("dashboard")}</span>
                    <span>Início</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "autoavaliacao" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("autoavaliacao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("autoavaliacao")}</span>
                    <span>Autoavaliação</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "evolucao" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("evolucao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("evolucao")}</span>
                    <span>Minha evolução</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "avaliacoes_recebidas" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("avaliacoes_recebidas")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("avaliacoes_recebidas")}</span>
                    <span>Avaliações recebidas</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "grafico" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("grafico")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("grafico")}</span>
                    <span>Gráfico</span>
                  </button>
                </div>

                {/* Coluna 2: Turma */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">
                    <span>Turma</span>
                    {turmaInfo?.nome && (
                      <span className="menu-ead-turma-badge" title={turmaInfo.nome}>
                        {turmaInfo.nome}
                        {turmaInfo.codigo || turmaInfo.turno ? ` · ${[turmaInfo.codigo, turmaInfo.turno].filter(Boolean).join(" ")}` : ""}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "calendario" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("calendario")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("calendario")}</span>
                    <span>Calendário</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "planejamento" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("planejamento")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("planejamento")}</span>
                    <span>Planejamento</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "presenca" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("presenca")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("presenca")}</span>
                    <span>Presença</span>
                  </button>
                </div>

                {/* Coluna 3: Diário */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Diário</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "guia" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("guia")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("guia")}</span>
                    <span>Guia</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "anotacoes_campo" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("anotacoes_campo")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("anotacoes_campo")}</span>
                    <span>Anotações de campo</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. MODO SUPERVISOR */}
            {isDocente && (
              <>
                {/* Coluna 1: Alunos */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Alunos</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "avaliacao_sup" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("avaliacao_sup")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("avaliacao_sup")}</span>
                    <span>Avaliação</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "autoavaliacoes_aluno" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("autoavaliacoes_aluno")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("autoavaliacoes_aluno")}</span>
                    <span>Autoavaliações</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "paralelo" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("paralelo")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("paralelo")}</span>
                    <span>Paralelo</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "grafico" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("grafico")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("grafico")}</span>
                    <span>Gráfico</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "anotacoes_campo" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("anotacoes_campo")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("anotacoes_campo")}</span>
                    <span>Anotações de campo</span>
                  </button>
                </div>

                {/* Coluna 2: Turmas */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Turmas</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "selecionar_alunos" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("selecionar_alunos")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("selecionar_alunos")}</span>
                    <span>Selecionar alunos</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "calendario" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("calendario")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("calendario")}</span>
                    <span>Calendário</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "aulas" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("aulas")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("aulas")}</span>
                    <span>Aulas</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "chamada" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("chamada")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("chamada")}</span>
                    <span>Chamada</span>
                  </button>
                </div>
              </>
            )}

            {/* 3. MODO ADMINISTRADOR */}
            {isAdmin && (
              <>
                {/* Coluna 1: Alunos */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Alunos</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "avaliacao_sup" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("avaliacao_sup", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("avaliacao_sup")}</span>
                    <span>Avaliação</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "autoavaliacoes_aluno" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("autoavaliacoes_aluno", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("autoavaliacoes_aluno")}</span>
                    <span>Autoavaliações</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "paralelo" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("paralelo", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("paralelo")}</span>
                    <span>Paralelo</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "grafico" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("grafico", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("grafico")}</span>
                    <span>Gráfico</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "anotacoes_campo" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("anotacoes_campo", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("anotacoes_campo")}</span>
                    <span>Anotações de campo</span>
                  </button>
                </div>

                {/* Coluna 2: Turmas */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Turmas</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "selecionar_alunos" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("selecionar_alunos", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("selecionar_alunos")}</span>
                    <span>Selecionar alunos</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "calendario_turma" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("calendario", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("calendario")}</span>
                    <span>Calendário</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "aulas" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("aulas", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("aulas")}</span>
                    <span>Aulas</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "chamada" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("chamada", "/supervisao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("chamada")}</span>
                    <span>Chamada</span>
                  </button>
                </div>

                {/* Coluna 3: Organização */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Organização</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "docentes" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("docentes", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("docentes")}</span>
                    <span>Docentes</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "convites" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("convites", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("convites")}</span>
                    <span>Convites</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "administradores" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("administradores", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("administradores")}</span>
                    <span>Administradores</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "alunos" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("alunos", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("alunos")}</span>
                    <span>Alunos</span>
                  </button>
                </div>

                {/* Coluna 4: Administração */}
                <div className="menu-ead-col">
                  <span className="menu-ead-col-header">Administração</span>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "turmas" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("turmas", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("turmas")}</span>
                    <span>Turmas</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "frequencia" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("frequencia", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("frequencia")}</span>
                    <span>Frequência</span>
                  </button>
                  <button
                    type="button"
                    className={`menu-ead-item ${abaAtiva === "calendario" ? "ativo" : ""}`}
                    onClick={() => handleItemClick("calendario", "/administracao")}
                  >
                    <span className="menu-ead-item-icon">{renderIcone("calendario_escola")}</span>
                    <span>Calendário da escola</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Registro Profissional acessível a todos pelo menu */}
      {modalRegistroOpen && (
        <div className="modal-backdrop" onClick={() => setModalRegistroOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Meu Registro Profissional</h2>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Fechar modal"
                onClick={() => setModalRegistroOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {carregandoRegistros ? (
              <p className="muted">Carregando registros...</p>
            ) : (
              <>
                {meusRegistros.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <table className="heat" style={{ width: "100%", textAlign: "left" }}>
                      <thead>
                        <tr>
                          <th>Conselho</th>
                          <th>UF</th>
                          <th>Número</th>
                          <th>Categoria</th>
                          <th>Situação</th>
                          <th>Ação</th>
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
                              <button
                                type="button"
                                className="btn ghost small"
                                onClick={() => handleExcluirRegistro(r.id)}
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="muted" style={{ margin: "4px 0 16px" }}>
                    Nenhum registro profissional cadastrado no momento.
                  </p>
                )}

                <h3 style={{ fontSize: 16, margin: "10px 0 6px" }}>Adicionar Registro</h3>
                <div style={{ maxWidth: 500 }}>
                  <RegistroProfissionalForm onSalvo={carregarRegistros} hidePular />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
