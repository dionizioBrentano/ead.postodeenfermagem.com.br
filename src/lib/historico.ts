import { MOMENTOS, type Momento, type Nota, GERAIS, ATIVIDADES } from "../data/itens";
import { getAvaliacoes } from "../api/ead";

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

const DRAFT = "ead.rascunho.";

export function ordenar(lista: Avaliacao[]): Avaliacao[] {
  return lista
    .slice()
    .sort((a, b) => a.etapa - b.etapa || MOMENTOS.indexOf(a.momento) - MOMENTOS.indexOf(b.momento));
}

export async function carregarDaAPI(userKey: string, papel: "auto" | "supervisor"): Promise<Avaliacao[]> {
  const items = (await getAvaliacoes(userKey, papel)) as any[];
  const map = new Map<string, Avaliacao>();
  for (const item of items) {
    const key = `${item.etapa}-${item.momento}`;
    if (!map.has(key)) {
      map.set(key, {
        etapa: parseInt(item.etapa, 10),
        momento: item.momento as Momento,
        data: item.created_at ? item.created_at.split("T")[0] : "",
        nome: "",
        turma: "",
        unidade: "",
        gerais: Array(GERAIS.length).fill(null),
        atividades: Array(ATIVIDADES.length).fill(null),
        obs: item.comentario || "",
        criadoEm: item.created_at || new Date().toISOString(),
      });
    }
    const av = map.get(key)!;
    if (item.grupo === "gerais") {
      const idx = parseInt(item.item_chave.replace("gerais.", ""), 10);
      if (!isNaN(idx)) av.gerais[idx] = item.nao_praticou ? "na" : item.nota;
    } else if (item.grupo === "atividades") {
      const idx = parseInt(item.item_chave.replace("atividades.", ""), 10);
      if (!isNaN(idx)) av.atividades[idx] = item.nao_praticou ? "na" : item.nota;
    }
    if (item.comentario) av.obs = item.comentario;
  }
  return ordenar(Array.from(map.values()));
}

export function carregarRascunho<T>(userKey: string): T | null {
  try {
    const raw = localStorage.getItem(DRAFT + userKey);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function salvarRascunho(userKey: string, v: unknown) {
  try {
    localStorage.setItem(DRAFT + userKey, JSON.stringify(v));
  } catch {}
}

export function apagarRascunho(userKey: string) {
  try {
    localStorage.removeItem(DRAFT + userKey);
  } catch {}
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

export function carregarLocal(userKey: string): Avaliacao[] {
  try {
    const raw = localStorage.getItem("ead.historico." + userKey);
    return raw ? ordenar(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}
