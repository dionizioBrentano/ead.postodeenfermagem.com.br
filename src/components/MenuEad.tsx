import { useState, useEffect, useRef } from "react";
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
    case "tarefas_teoricas":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
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
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [modalRegistroOpen, setModalRegistroOpen] = useState(false);
  const [meusRegistros, setMeusRegistros] = useState<RegistroProfissional[]>([]);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const nome = texto(perfil, "name") || texto(perfil, "email") || "Usuário";
  const primeiro = primeiroNome(nome);
  const email = texto(perfil, "email");
  const avatarUrl = (typeof perfil.avatar_url === "string" && perfil.avatar_url) || (typeof perfil.foto === "string" && perfil.foto) || "";
  const iniciais = extrairIniciais(nome);

  const activeMemberships = memberships.filter((m) => m.situacao === "ativo");
  const temAluno = activeMemberships.some((m) => m.papel === "aluno");
  const temDocente = activeMemberships.some((m) => m.papel === "docente");
  const temAdmin = activeMemberships.some((m) => m.papel === "administrador");

  // Fechar dropdowns com clique fora ou Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuAberto(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuAberto(null);
        setDrawerAberto(false);
        setUserDropdownOpen(false);
        setModalRegistroOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
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
    setMenuAberto(null);
    setDrawerAberto(false);
    if (destinoRota) {
      navegar(destinoRota);
    } else {
      onSelecionarAba(chaveAba);
    }
  };

  const handleMouseEnterGroup = (groupId: string) => {
    if (window.innerWidth < 992) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMenuAberto(groupId);
  };

  const handleMouseLeaveGroup = () => {
    if (window.innerWidth < 992) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setMenuAberto(null);
    }, 150);
  };

  const handleGroupButtonClick = (groupId: string) => {
    if (window.innerWidth < 992) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setMenuAberto((prev) => (prev === groupId ? null : groupId));
  };

  const isAluno = papelAtivo === "aluno";
  const isDocente = papelAtivo === "docente";
  const isAdmin = papelAtivo === "administrador";

  // Grupos por papel
  // Aluno: 3 botões (Sala, Turma, Diário)
  // Docente: 2 botões (Alunos, Turmas)
  // Administrador: 4 botões (Alunos, Turmas, Organização, Administração)
  const grupos: {
    id: string;
    rotulo: string;
    badge?: string;
    itens: { chave: string; rotulo: string; rota?: string; icone: string }[];
  }[] = isAluno
    ? [
        {
          id: "sala",
          rotulo: "Sala",
          itens: [
            { chave: "dashboard", rotulo: "Início", icone: "dashboard" },
            { chave: "autoavaliacao", rotulo: "Autoavaliação", icone: "autoavaliacao" },
            { chave: "evolucao", rotulo: "Minha evolução", icone: "evolucao" },
            { chave: "avaliacoes_recebidas", rotulo: "Avaliações recebidas", icone: "avaliacoes_recebidas" },
            { chave: "grafico", rotulo: "Gráfico", icone: "grafico" },
          ],
        },
        {
          id: "turma",
          rotulo: "Turma",
          badge: turmaInfo?.nome
            ? `${turmaInfo.nome}${turmaInfo.codigo || turmaInfo.turno ? ` · ${[turmaInfo.codigo, turmaInfo.turno].filter(Boolean).join(" ")}` : ""}`
            : undefined,
          itens: [
            { chave: "calendario", rotulo: "Calendário", icone: "calendario" },
            { chave: "planejamento", rotulo: "Planejamento", icone: "planejamento" },
            { chave: "presenca", rotulo: "Presença", icone: "presenca" },
          ],
        },
        {
          id: "diario",
          rotulo: "Diário",
          itens: [
            { chave: "guia", rotulo: "Guia", icone: "guia" },
            { chave: "tarefas_teoricas", rotulo: "Tarefas Teóricas", icone: "tarefas_teoricas" },
            { chave: "anotacoes_campo", rotulo: "Anotações de campo", icone: "anotacoes_campo" },
          ],
        },
      ]
    : isDocente
    ? [
        {
          id: "alunos",
          rotulo: "Alunos",
          itens: [
            { chave: "avaliacao_sup", rotulo: "Avaliação", icone: "avaliacao_sup" },
            { chave: "autoavaliacoes_aluno", rotulo: "Autoavaliações", icone: "autoavaliacoes_aluno" },
            { chave: "paralelo", rotulo: "Paralelo", icone: "paralelo" },
            { chave: "grafico", rotulo: "Gráfico", icone: "grafico" },
            { chave: "anotacoes_campo", rotulo: "Anotações de campo", icone: "anotacoes_campo" },
          ],
        },
        {
          id: "turmas",
          rotulo: "Turmas",
          itens: [
            { chave: "selecionar_alunos", rotulo: "Selecionar alunos", icone: "selecionar_alunos" },
            { chave: "calendario", rotulo: "Calendário", icone: "calendario" },
            { chave: "aulas", rotulo: "Aulas", icone: "aulas" },
            { chave: "chamada", rotulo: "Chamada", icone: "chamada" },
          ],
        },
      ]
    : [
        {
          id: "alunos",
          rotulo: "Alunos",
          itens: [
            { chave: "avaliacao_sup", rotulo: "Avaliação", rota: "/supervisao", icone: "avaliacao_sup" },
            { chave: "autoavaliacoes_aluno", rotulo: "Autoavaliações", rota: "/supervisao", icone: "autoavaliacoes_aluno" },
            { chave: "paralelo", rotulo: "Paralelo", rota: "/supervisao", icone: "paralelo" },
            { chave: "grafico", rotulo: "Gráfico", rota: "/supervisao", icone: "grafico" },
            { chave: "anotacoes_campo", rotulo: "Anotações de campo", rota: "/supervisao", icone: "anotacoes_campo" },
          ],
        },
        {
          id: "turmas",
          rotulo: "Turmas",
          itens: [
            { chave: "selecionar_alunos", rotulo: "Selecionar alunos", rota: "/supervisao", icone: "selecionar_alunos" },
            { chave: "calendario", rotulo: "Calendário", rota: "/supervisao", icone: "calendario" },
            { chave: "aulas", rotulo: "Aulas", rota: "/supervisao", icone: "aulas" },
            { chave: "chamada", rotulo: "Chamada", rota: "/supervisao", icone: "chamada" },
          ],
        },
        {
          id: "organizacao",
          rotulo: "Organização",
          itens: [
            { chave: "docentes", rotulo: "Docentes", rota: "/administracao", icone: "docentes" },
            { chave: "convites", rotulo: "Convites", rota: "/administracao", icone: "convites" },
            { chave: "administradores", rotulo: "Administradores", rota: "/administracao", icone: "administradores" },
            { chave: "alunos", rotulo: "Alunos", rota: "/administracao", icone: "alunos" },
          ],
        },
        {
          id: "administracao",
          rotulo: "Administração",
          itens: [
            { chave: "turmas", rotulo: "Turmas", rota: "/administracao", icone: "turmas" },
            { chave: "frequencia", rotulo: "Frequência", rota: "/administracao", icone: "frequencia" },
            { chave: "calendario", rotulo: "Calendário da escola", rota: "/administracao", icone: "calendario_escola" },
          ],
        },
      ];

  const isItemAtivo = (itemChave: string) => {
    if (itemChave === "dashboard" || itemChave === "inicio") {
      return abaAtiva === "dashboard" || abaAtiva === "inicio";
    }
    return itemChave === abaAtiva;
  };

  return (
    <>
      <header className="topbar-ead">
        <div className="topbar-ead-in">
          {/* Lado esquerdo: Hamburger (mobile < 992px) + Marca ETCR */}
          <div className="topbar-ead-brand-wrap">
            <button
              type="button"
              className="topbar-hamburger-btn"
              onClick={() => setDrawerAberto(true)}
              aria-label="Abrir menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

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
          </div>

          {/* Centro: Menu Desktop (>= 992px) fechado por padrão; abre no hover ou clique */}
          <nav className="topbar-ead-nav" ref={navRef} aria-label="Navegação principal">
            {grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="topbar-menu-group"
                onMouseEnter={() => handleMouseEnterGroup(grupo.id)}
                onMouseLeave={handleMouseLeaveGroup}
              >
                <button
                  type="button"
                  className={`topbar-menu-btn ${menuAberto === grupo.id ? "aberto" : ""}`}
                  onClick={() => handleGroupButtonClick(grupo.id)}
                  aria-expanded={menuAberto === grupo.id}
                  aria-haspopup="true"
                >
                  <span>{grupo.rotulo}</span>
                  <svg
                    className="topbar-menu-chevron"
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

                {menuAberto === grupo.id && (
                  <div
                    className="topbar-submenu"
                    role="menu"
                    onMouseEnter={() => {
                      if (closeTimerRef.current) {
                        window.clearTimeout(closeTimerRef.current);
                        closeTimerRef.current = null;
                      }
                    }}
                    onMouseLeave={handleMouseLeaveGroup}
                  >
                    {grupo.itens.map((item) => {
                      const ativo = isItemAtivo(item.chave);
                      return (
                        <button
                          key={item.chave}
                          type="button"
                          role="menuitem"
                          className={`topbar-submenu-item ${ativo ? "ativo" : ""}`}
                          onClick={() => handleItemClick(item.chave, item.rota)}
                        >
                          <span className="topbar-submenu-icon">{renderIcone(item.icone)}</span>
                          <span className="topbar-submenu-label">{item.rotulo}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Lado direito: Bloco do aluno com iniciais e nome + dropdown */}
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
      </header>

      {/* Painel lateral Mobile (< 992px) com fundo branco e grupos verticais */}
      {drawerAberto && (
        <>
          <div
            className="topbar-drawer-backdrop"
            onClick={() => setDrawerAberto(false)}
            aria-hidden="true"
          />
          <aside
            className="topbar-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
          >
            <div className="topbar-drawer-header">
              <div className="topbar-drawer-brand">
                <img src={LOGO_ETCR} alt="ETCR Escola Técnica" className="topbar-drawer-logo" />
                <span className="topbar-drawer-school">ETCR · EAD</span>
              </div>
              <button
                type="button"
                className="topbar-drawer-close"
                onClick={() => setDrawerAberto(false)}
                aria-label="Fechar menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="topbar-drawer-body">
              {grupos.map((grupo) => (
                <div key={grupo.id} className="topbar-drawer-group">
                  <div className="topbar-drawer-group-title">
                    <span>{grupo.rotulo}</span>
                    {grupo.badge && <span className="topbar-drawer-turma-badge">{grupo.badge}</span>}
                  </div>
                  <div className="topbar-drawer-group-items">
                    {grupo.itens.map((item) => {
                      const ativo = isItemAtivo(item.chave);
                      return (
                        <button
                          key={item.chave}
                          type="button"
                          className={`topbar-drawer-item ${ativo ? "ativo" : ""}`}
                          onClick={() => handleItemClick(item.chave, item.rota)}
                        >
                          <span className="topbar-drawer-item-icon">{renderIcone(item.icone)}</span>
                          <span className="topbar-drawer-item-label">{item.rotulo}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}

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
