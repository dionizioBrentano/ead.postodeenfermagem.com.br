import { useEffect, useRef, useState } from "react";
import { ATIVIDADES, ETAPAS, GERAIS, MOMENTOS, TOTAL_ITENS, type Item, type Momento, type Nota } from "../data/itens";
import { corDaNota } from "../lib/cores";
import { hoje } from "../lib/historico";
import { saveAvaliacao } from "../api/ead";

import { getUserToken, getSavedProfile } from "../api/client";

type Props = {
  alunoId: string;
  isStudent?: boolean;
};

type Estado = {
  nomeAvaliador: string;
  data: string;
  etapa: number | null;
  momento: Momento | null;
  gerais: Nota[];
  atividades: Nota[];
  obs: string;
};

const vazio = (nome: string): Estado => ({
  nomeAvaliador: nome,
  data: hoje(),
  etapa: null,
  momento: null,
  gerais: GERAIS.map(() => null),
  atividades: ATIVIDADES.map(() => null),
  obs: "",
});

export default function AvaliacaoSupervisor({ alunoId }: Props) {
  const token = getUserToken();
  const perfil = getSavedProfile();
  const nomeAvaliador = String(perfil?.name || "");
  const [s, setS] = useState<Estado>(() => vazio(nomeAvaliador));
  const [faltando, setFaltando] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const primeiro = useRef<string | null>(null);

  // Resetar quando mudar o aluno
  useEffect(() => {
    setS(vazio(nomeAvaliador));
    setMsg(null);
    setFaltando(new Set());
  }, [alunoId, nomeAvaliador]);

  useEffect(() => {
    if (!primeiro.current) return;
    const el = document.getElementById(primeiro.current);
    primeiro.current = null;
    if (el) {
      el.scrollIntoView({ block: "center" });
      (el.querySelector("input") ?? el).focus({ preventScroll: true });
    }
  }, [faltando]);

  const respondidos = s.gerais.filter((v) => v != null).length + s.atividades.filter((v) => v != null).length;

  const setNota = (bloco: "gerais" | "atividades", i: number, v: Nota) => {
    setS((prev) => {
      const arr = prev[bloco].slice();
      arr[i] = v;
      return { ...prev, [bloco]: arr };
    });
    setFaltando((prev) => {
      const id = `it-${bloco}-${i}`;
      if (!prev.has(id)) return prev;
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  async function salvar() {
    setMsg(null);
    const miss: string[] = [];
    if (!s.nomeAvaliador.trim()) miss.push("f-nome");
    if (!s.etapa) miss.push("f-etapa");
    if (!s.momento) miss.push("f-momento");
    s.gerais.forEach((v, i) => v == null && miss.push(`it-gerais-${i}`));
    s.atividades.forEach((v, i) => v == null && miss.push(`it-atividades-${i}`));
    if (miss.length) {
      const partes: string[] = [];
      if (miss.includes("f-nome")) partes.push("nome do avaliador");
      if (miss.includes("f-etapa")) partes.push("a etapa");
      if (miss.includes("f-momento")) partes.push("o momento");
      const n = miss.filter((m) => m.startsWith("it-")).length;
      if (n) partes.push(`${n} ${n > 1 ? "itens sem nota" : "item sem nota"}`);
      setMsg({ tipo: "err", texto: `Falta preencher: ${partes.join(", ")}.` });
      primeiro.current = miss[0];
      setFaltando(new Set(miss));
      return;
    }

    setSalvando(true);
    try {
      const promises: Promise<unknown>[] = [];
      s.gerais.forEach((nota, i) => {
        if (nota !== null) {
          promises.push(saveAvaliacao({ aluno_user_id: alunoId, item_chave: `gerais.${i}`, item_texto: GERAIS[i].texto, grupo: "gerais", papel: "supervisor", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(s.etapa), momento: s.momento, comentario: s.obs }, token ?? undefined));
        }
      });
      s.atividades.forEach((nota, i) => {
        if (nota !== null) {
          promises.push(saveAvaliacao({ aluno_user_id: alunoId, item_chave: `atividades.${i}`, item_texto: ATIVIDADES[i].texto, grupo: "atividades", papel: "supervisor", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(s.etapa), momento: s.momento, comentario: s.obs }, token ?? undefined));
        }
      });
      
      const results = await Promise.allSettled(promises);
      if (results.some(r => r.status === "rejected")) {
        throw new Error("Alguns itens falharam ao salvar");
      }
      
      setMsg({ tipo: "ok", texto: "Avaliação salva com sucesso!" });
      setS(vazio(nomeAvaliador));
    } catch (e) {
      console.error(e);
      setMsg({ tipo: "err", texto: "Erro ao salvar avaliação no servidor. Tente novamente." });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="narrow">
      <header className="sec" style={{ marginTop: 28 }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,44px)", fontWeight: 800, letterSpacing: "-.02em" }}>Avaliação do Supervisor</h1>
        <p className="muted" style={{ margin: 0 }}>
          Dê uma nota de 0 a 10 para o quanto o aluno domina cada item.
        </p>
      </header>

      <section className="box sec">
        <h2 style={{ fontSize: 21 }}>Dados da Avaliação</h2>
        <div className="fields">
          <div className="field full" id="f-nome">
            <label className="l" htmlFor="nome">Nome do Avaliador *</label>
            <input id="nome" type="text" value={s.nomeAvaliador} aria-invalid={faltando.has("f-nome")} onChange={(e) => setS({ ...s, nomeAvaliador: e.target.value })} />
          </div>
          <div className="field">
            <label className="l" htmlFor="data">Data</label>
            <input id="data" type="date" value={s.data} onChange={(e) => setS({ ...s, data: e.target.value })} />
          </div>
          <div className={`field full${faltando.has("f-etapa") ? " missing" : ""}`} id="f-etapa">
            <span className="l">Etapa avaliada *</span>
            <div className="seg" role="radiogroup" aria-label="Etapa">
              {ETAPAS.map((e) => (
                <label key={e} className={`k${e}`}>
                  <input type="radio" name="etapa" checked={s.etapa === e} onChange={() => setS({ ...s, etapa: e })} />
                  <span>Etapa {e}</span>
                </label>
              ))}
            </div>
            {faltando.has("f-etapa") && <span className="e">Escolha a etapa.</span>}
          </div>
          <div className="field full" id="f-momento">
            <span className="l">Momento da etapa *</span>
            <div className="seg" role="radiogroup" aria-label="Momento">
              {MOMENTOS.map((m) => (
                <label key={m}>
                  <input type="radio" name="momento" checked={s.momento === m} onChange={() => setS({ ...s, momento: m })} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
            {faltando.has("f-momento") && <span className="e">Escolha o momento.</span>}
          </div>
        </div>
      </section>

      <Bloco
        titulo="Aspectos gerais"
        sub="Comportamento e postura profissional."
        itens={GERAIS}
        bloco="gerais"
        notas={s.gerais}
        faltando={faltando}
        setNota={setNota}
      />
      <Bloco
        titulo="Atividades desenvolvidas"
        sub="Conhecimento técnico. A etiqueta mostra a partir de qual etapa o item passa a ser cobrado."
        itens={ATIVIDADES}
        bloco="atividades"
        notas={s.atividades}
        faltando={faltando}
        setNota={setNota}
      />

      <section className="box sec">
        <div className="field">
          <label className="l" htmlFor="obs">Observações do Supervisor (Comentário Geral)</label>
          <textarea id="obs" value={s.obs} onChange={(e) => setS({ ...s, obs: e.target.value })} />
        </div>
      </section>

      <div className="bar">
        <div className="in">
          <div className="prog">
            <span>{respondidos} de {TOTAL_ITENS} itens respondidos</span>
            <div className="track"><div className="fill" style={{ width: `${(respondidos / TOTAL_ITENS) * 100}%` }} /></div>
          </div>
          <button className="btn" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar Avaliação no Banco"}
          </button>
        </div>
        {msg && (
          <div className={`msg${msg.tipo === "err" ? " err" : ""}`} role="status" aria-live="polite">
            {msg.texto}
          </div>
        )}
      </div>
    </div>
  );
}

function Bloco(props: {
  titulo: string;
  sub: string;
  itens: Item[];
  bloco: "gerais" | "atividades";
  notas: Nota[];
  faltando: Set<string>;
  setNota: (b: "gerais" | "atividades", i: number, v: Nota) => void;
}) {
  const { titulo, sub, itens, bloco, notas, faltando, setNota } = props;
  return (
    <section className="sec" style={{ marginTop: 34 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <h2>{titulo}</h2>
        <p className="muted" style={{ margin: 0 }}>{sub}</p>
      </div>
      <div className="items">
        {itens.map((it, i) => {
          const id = `it-${bloco}-${i}`;
          const nome = `${bloco}-${i}`;
          return (
            <div key={id} id={id} className={`item${faltando.has(id) ? " missing" : ""}`}>
              <div className="q">
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  {it.texto}
                  {it.desde && <span className={`since k${it.desde}`}>a partir da Etapa {it.desde}</span>}
                </span>
              </div>
              <div className="rate" role="radiogroup" aria-label={`Nota do item ${i + 1}`}>
                <label className="na">
                  <input type="radio" name={nome} checked={notas[i] === "na"} onChange={() => setNota(bloco, i, "na")} />
                  <span>Ainda não pratiquei</span>
                </label>
                {Array.from({ length: 11 }, (_, v) => {
                  const c = corDaNota(v);
                  return (
                    <label key={v} style={{ ["--sel" as string]: c.fundo, ["--selt" as string]: c.texto }}>
                      <input type="radio" name={nome} checked={notas[i] === v} onChange={() => setNota(bloco, i, v)} aria-label={`Nota ${v}`} />
                      <span>{v}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
