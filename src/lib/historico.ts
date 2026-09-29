// Histórico de autoavaliações guardado SÓ neste navegador, separado por aluno.
// Por regra do projeto, nada de progresso é enviado para a API.

import { MOMENTOS, type Momento, type Nota } from "../data/itens";

export type Avaliacao = {
  etapa: number;
  momento: Momento;
  data: string; // AAAA-MM-DD
  nome: string;
  turma: string;
  unidade: string;
  gerais: Nota[];
  atividades: Nota[];
  obs: string;
  criadoEm: string;
};

const PREFIX = "ead.historico.";
const DRAFT = "ead.rascunho.";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function ordenar(lista: Avaliacao[]): Avaliacao[] {
  return lista
    .slice()
    .sort((a, b) => a.etapa - b.etapa || MOMENTOS.indexOf(a.momento) - MOMENTOS.indexOf(b.momento));
}

export function carregar(userKey: string): Avaliacao[] {
  const v = read<Avaliacao[]>(PREFIX + userKey);
  return Array.isArray(v) ? ordenar(v) : [];
}

/** Grava a avaliação; se já existe uma para a mesma etapa e momento, substitui. */
export function salvar(userKey: string, av: Avaliacao): { lista: Avaliacao[]; ok: boolean } {
  const lista = carregar(userKey).filter((x) => !(x.etapa === av.etapa && x.momento === av.momento));
  lista.push(av);
  const ordenada = ordenar(lista);
  return { lista: ordenada, ok: write(PREFIX + userKey, ordenada) };
}

export function remover(userKey: string, etapa: number, momento: Momento): Avaliacao[] {
  const lista = carregar(userKey).filter((x) => !(x.etapa === etapa && x.momento === momento));
  write(PREFIX + userKey, lista);
  return lista;
}

export function carregarRascunho<T>(userKey: string): T | null {
  return read<T>(DRAFT + userKey);
}
export function salvarRascunho(userKey: string, v: unknown) {
  write(DRAFT + userKey, v);
}
export function apagarRascunho(userKey: string) {
  try {
    localStorage.removeItem(DRAFT + userKey);
  } catch {
    /* nada */
  }
}

export function media(notas: Nota[]): number | null {
  const v = notas.filter((n): n is number => typeof n === "number");
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function fmt1(n: number | null): string {
  return n == null ? "–" : n.toFixed(1).replace(".", ",");
}

export function fmtData(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

export function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
