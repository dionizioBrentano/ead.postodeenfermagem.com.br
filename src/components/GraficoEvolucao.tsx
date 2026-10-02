import { useEffect, useState } from "react";
import { ATIVIDADES, ETAPAS, GERAIS, MOMENTOS, type Item } from "../data/itens";
import { getAvaliacoes } from "../api/ead";

// Gráfico de evolução de cada quesito ao longo do ciclo (etapas 1 a 4, momentos Início, Meio e Final).
// Duas linhas por quesito: autoavaliação do aluno e avaliação do supervisor (média dos docentes no mesmo momento).

type Registro = {
  item_chave: string;
  etapa: number | string | null;
  momento: string | null;
  nota: number | null;
};

const PONTOS = ETAPAS.flatMap((etapa) => MOMENTOS.map((momento) => ({ etapa: Number(etapa), momento: String(momento) })));

const COR_ALUNO = "#0f7c74";
const COR_SUPERVISOR = "#b86e00";

const LARGURA = 300;
const ALTURA = 130;
const MARGEM_X = 24;
const TOPO = 12;
const BASE = 104;

function x(i: number): number {
  return MARGEM_X + (i * (LARGURA - MARGEM_X - 8)) / (PONTOS.length - 1);
}

function y(nota: number): number {
  return BASE - (nota * (BASE - TOPO)) / 10;
}

function comoLista(v: unknown): Registro[] {
  if (Array.isArray(v)) return v as Registro[];
  const d = (v as { data?: unknown } | null)?.data;
  return Array.isArray(d) ? (d as Registro[]) : [];
}

function indicePonto(r: Registro): number {
  const etapa = Number(r.etapa);
  const momento = r.momento === "Inicio" ? "Início" : r.momento ?? "";
  return PONTOS.findIndex((p) => p.etapa === etapa && p.momento === momento);
}

/** Nota de um quesito em cada ponto do ciclo; média quando há mais de um registro no mesmo ponto. */
function serie(lista: Registro[], chave: string): (number | null)[] {
  const acc = PONTOS.map(() => ({ soma: 0, n: 0 }));
  for (const r of lista) {
    if (r.item_chave !== chave || typeof r.nota !== "number") continue;
    const i = indicePonto(r);
    if (i < 0) continue;
    acc[i].soma += r.nota;
    acc[i].n += 1;
  }
  return acc.map((a) => (a.n ? Math.round((a.soma / a.n) * 10) / 10 : null));
}

function Linha({ valores, cor }: { valores: (number | null)[]; cor: string }) {
  const pontos = valores
    .map((v, i) => (v === null ? null : { i, v }))
    .filter((p): p is { i: number; v: number } => p !== null);
  return (
    <g>
      {pontos.length > 1 && (
        <polyline points={pontos.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")} fill="none" stroke={cor} strokeWidth={2} />
      )}
      {pontos.map((p) => (
        <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3.5} fill={cor}>
          <title>{`Etapa ${PONTOS[p.i].etapa}, ${PONTOS[p.i].momento}: ${String(p.v).replace(".", ",")}`}</title>
        </circle>
      ))}
    </g>
  );
}

function Quadro({ item, aluno, supervisor }: { item: Item; aluno: (number | null)[]; supervisor: (number | null)[] }) {
  const vazio = aluno.every((v) => v === null) && supervisor.every((v) => v === null);
  return (
    <div className="box" style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }} title={item.texto}>{item.curto}</div>
      {vazio ? (
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Sem notas ainda.</p>
      ) : (
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} width="100%" role="img" aria-label={`Evolução: ${item.curto}`}>
          {[0, 5, 10].map((n) => (
            <g key={n}>
              <line x1={MARGEM_X} x2={LARGURA - 8} y1={y(n)} y2={y(n)} stroke="currentColor" strokeOpacity={0.15} />
              <text x={MARGEM_X - 6} y={y(n) + 4} fontSize={10} textAnchor="end" fill="currentColor" fillOpacity={0.6}>{n}</text>
            </g>
          ))}
          {ETAPAS.map((etapa, k) => {
            const meio = x(k * MOMENTOS.length + 1);
            return (
              <g key={etapa}>
                {k > 0 && (
                  <line x1={x(k * MOMENTOS.length) - 6} x2={x(k * MOMENTOS.length) - 6} y1={TOPO} y2={BASE} stroke="currentColor" strokeOpacity={0.2} strokeDasharray="3 3" />
                )}
                <text x={meio} y={ALTURA - 8} fontSize={10.5} textAnchor="middle" fill="currentColor" fillOpacity={0.7}>{`Etapa ${etapa}`}</text>
              </g>
            );
          })}
          <Linha valores={aluno} cor={COR_ALUNO} />
          <Linha valores={supervisor} cor={COR_SUPERVISOR} />
        </svg>
      )}
    </div>
  );
}

export default function GraficoEvolucao({ alunoId }: { alunoId: string }) {
  const [auto, setAuto] = useState<Registro[]>([]);
  const [sup, setSup] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) return;
    let vivo = true;
    setCarregando(true);
    setErro(null);
    Promise.all([getAvaliacoes(alunoId, "auto"), getAvaliacoes(alunoId, "supervisor")])
      .then(([a, s]) => {
        if (!vivo) return;
        setAuto(comoLista(a));
        setSup(comoLista(s));
      })
      .catch(() => {
        if (vivo) setErro("Não foi possível carregar as avaliações.");
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [alunoId]);

  if (carregando) return <p className="muted" style={{ textAlign: "center", marginTop: 28 }}>Carregando gráfico…</p>;
  if (erro) return <div className="alert err" style={{ marginTop: 28 }}>{erro}</div>;

  const bloco = (titulo: string, itens: Item[], prefixo: "gerais" | "atividades") => (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>{titulo}</h3>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {itens.map((item, i) => (
          <Quadro
            key={`${prefixo}.${i}`}
            item={item}
            aluno={serie(auto, `${prefixo}.${i}`)}
            supervisor={serie(sup, `${prefixo}.${i}`)}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 0 40px" }}>
      <header className="sec" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 24 }}>Evolução por quesito</h2>
        <p className="muted" style={{ margin: 0 }}>
          Nota de 0 a 10 em cada momento do ciclo (início, meio e final de cada etapa).
        </p>
        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 14 }}>
          <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: COR_ALUNO, marginRight: 6 }} />Autoavaliação do aluno</span>
          <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: COR_SUPERVISOR, marginRight: 6 }} />Avaliação do supervisor</span>
        </div>
      </header>
      {bloco("Aspectos gerais", GERAIS, "gerais")}
      {bloco("Atividades", ATIVIDADES, "atividades")}
    </div>
  );
}
