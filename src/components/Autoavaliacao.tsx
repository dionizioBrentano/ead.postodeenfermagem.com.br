import { useEffect, useRef, useState } from "react";
import { ATIVIDADES, ETAPAS, GERAIS, MOMENTOS, TOTAL_ITENS, type Item, type Momento, type Nota } from "../data/itens";
import { ESCALA, corDaNota } from "../lib/cores";
import {
  apagarRascunho,
  carregarRascunho,
  hoje,
  salvarRascunho,
  type Avaliacao,
} from "../lib/historico";

type Props = {
  userKey: string;
  nomePerfil: string;
  lista: Avaliacao[];
  onSalvou: (l: Avaliacao[]) => void;
  onVerEvolucao: () => void;
};

type Estado = {
  nome: string;
  turma: string;
  unidade: string;
  data: string;
  etapa: number | null;
  momento: Momento | null;
  gerais: Nota[];
  atividades: Nota[];
  obs: string;
};

const vazio = (nome: string): Estado => ({
  nome,
  turma: "",
  unidade: "",
  data: hoje(),
  etapa: null,
  momento: null,
  gerais: GERAIS.map(() => null),
  atividades: ATIVIDADES.map(() => null),
  obs: "",
});

export default function Autoavaliacao({ userKey, nomePerfil, lista, onSalvou, onVerEvolucao }: Props) {
  const [s, setS] = useState<Estado>(() => {
    const r = carregarRascunho<Estado>(userKey);
    return r && Array.isArray(r.gerais) && r.gerais.length === GERAIS.length && Array.isArray(r.atividades) && r.atividades.length === ATIVIDADES.length
      ? r
      : vazio(nomePerfil);
  });
  const [faltando, setFaltando] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ tipo: "ok" | "err"; texto: string; arquivo?: string } | null>(null);
  const [gerando, setGerando] = useState(false);
  const primeiro = useRef<string | null>(null);

  useEffect(() => {
    salvarRascunho(userKey, s);
  }, [s, userKey]);

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
  const jaExiste = s.etapa && s.momento ? lista.some((a) => a.etapa === s.etapa && a.momento === s.momento) : false;

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

  async function gerar() {
    setMsg(null);
    const miss: string[] = [];
    if (!s.nome.trim()) miss.push("f-nome");
    if (!s.etapa) miss.push("f-etapa");
    if (!s.momento) miss.push("f-momento");
    s.gerais.forEach((v, i) => v == null && miss.push(`it-gerais-${i}`));
    s.atividades.forEach((v, i) => v == null && miss.push(`it-atividades-${i}`));
    if (miss.length) {
      const partes: string[] = [];
      if (miss.includes("f-nome")) partes.push("seu nome");
      if (miss.includes("f-etapa")) partes.push("a etapa");
      if (miss.includes("f-momento")) partes.push("o momento da etapa");
      const n = miss.filter((m) => m.startsWith("it-")).length;
      if (n) partes.push(`${n} ${n > 1 ? "itens sem nota (marcados em vermelho)" : "item sem nota (marcado em vermelho)"}`);
      setMsg({ tipo: "err", texto: `Falta preencher: ${partes.join(", ")}.` });
      primeiro.current = miss[0];
      setFaltando(new Set(miss));
      return;
    }
    const av: Avaliacao = {
      etapa: s.etapa!,
      momento: s.momento!,
      data: s.data || hoje(),
      nome: s.nome.trim(),
      turma: s.turma.trim(),
      unidade: s.unidade.trim(),
      gerais: s.gerais,
      atividades: s.atividades,
      obs: s.obs.trim(),
      criadoEm: new Date().toISOString(),
    };
    setGerando(true);
    try {
      let apiWarning = "";
      try {
        const { getUserToken } = await import("../api/client");
        const { saveAvaliacao } = await import("../api/ead");
        const token = getUserToken();
        if (token) {
          const promises: Promise<unknown>[] = [];
          av.gerais.forEach((nota, i) => {
            if (nota !== null) {
              promises.push(saveAvaliacao({ aluno_user_id: userKey, item_chave: `gerais.${i}`, item_texto: GERAIS[i].texto, grupo: "gerais", papel: "auto", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(av.etapa), momento: av.momento }, token));
            }
          });
          av.atividades.forEach((nota, i) => {
            if (nota !== null) {
              promises.push(saveAvaliacao({ aluno_user_id: userKey, item_chave: `atividades.${i}`, item_texto: ATIVIDADES[i].texto, grupo: "atividades", papel: "auto", nota: typeof nota === "number" ? nota : null, nao_praticou: nota === "na", etapa: String(av.etapa), momento: av.momento }, token));
            }
          });
          await Promise.allSettled(promises).then(results => {
            if (results.some(r => r.status === "rejected")) throw new Error("Parcial/falha");
          });
        }
      } catch (err) {
        console.error("Falha ao salvar no servidor EAD:", err);
        apiWarning = " Aviso: Houve falha de conexão com a API.";
      }

      const { carregarDaAPI } = await import("../lib/historico");
      const nova = await carregarDaAPI(userKey, "auto");
      onSalvou(nova);

      const { gerarPDF, nomeArquivo } = await import("../lib/pdf");
      const doc = gerarPDF(av, nova.filter((x) => x.etapa < av.etapa || (x.etapa === av.etapa && MOMENTOS.indexOf(x.momento) <= MOMENTOS.indexOf(av.momento))));
      const arquivo = nomeArquivo(av);
      doc.save(arquivo);
      apagarRascunho(userKey);
      setS({ ...vazio(av.nome), turma: av.turma, unidade: av.unidade });
      setMsg({
        tipo: "ok",
        arquivo,
        texto: apiWarning ? "Erro ao salvar na API." + apiWarning : "PDF gerado e autoavaliação salva com sucesso.",
      });
    } catch (e) {
      console.error(e);
      setMsg({ tipo: "err", texto: "Não foi possível gerar o PDF ou salvar na API." });
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="narrow">
      <header className="sec" style={{ marginTop: 28 }}>
        <span className="mono muted" style={{ fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Estágio hospitalar
        </span>
        <h1 style={{ fontSize: "clamp(30px,6vw,44px)", fontWeight: 800, letterSpacing: "-.02em" }}>Autoavaliação</h1>
        <p className="muted" style={{ margin: 0 }}>
          Dê uma nota de 0 a 10 para o quanto você domina cada item da ficha de avaliação. Esta autoavaliação é para você
          enxergar sua evolução; ela não entra na sua nota. O questionário é o mesmo em todas as etapas.
        </p>
      </header>

      <section className="box sec">
        <h2 style={{ fontSize: 21 }}>Quando fazer</h2>
        <p style={{ margin: 0 }}>
          Três vezes em cada etapa. Guarde todos os PDFs numa mesma pasta.
        </p>
        <div className="when">
          <div><b>Início da etapa</b>Na primeira semana, antes de praticar os conteúdos novos.</div>
          <div><b>Meio da etapa</b>Na metade do período, para corrigir o rumo a tempo.</div>
          <div><b>Final da etapa</b>Na última semana, antes da avaliação do supervisor.</div>
        </div>
        <h2 style={{ fontSize: 21, marginTop: 6 }}>Como dar a nota</h2>
        <div className="legend-scale" aria-hidden="true">
          {ESCALA.map((c, i) => (
            <span key={i} style={{ background: c.fundo, color: c.texto }}>{i}</span>
          ))}
        </div>
        <div className="legend-cap">
          <span>0 a 3: não conheço ou nunca fiz</span>
          <span>4 a 6: conheço a teoria ou fiz com ajuda</span>
        </div>
        <div className="legend-cap">
          <span>7 a 8: faço com supervisão e segurança</span>
          <span>9 a 10: faço com segurança e sei explicar</span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
          Se o item ainda não foi trabalhado na sua etapa, marque <b>Ainda não pratiquei</b>.
        </p>
      </section>

      <section className="box sec">
        <h2 style={{ fontSize: 21 }}>Seus dados</h2>
        <div className="fields">
          <div className="field full" id="f-nome">
            <label className="l" htmlFor="nome">Nome completo *</label>
            <input id="nome" type="text" value={s.nome} aria-invalid={faltando.has("f-nome")} onChange={(e) => setS({ ...s, nome: e.target.value })} />
          </div>
          <div className="field">
            <label className="l" htmlFor="turma">Turma</label>
            <input id="turma" type="text" value={s.turma} onChange={(e) => setS({ ...s, turma: e.target.value })} />
          </div>
          <div className="field">
            <label className="l" htmlFor="unidade">Unidade hospitalar</label>
            <input id="unidade" type="text" value={s.unidade} onChange={(e) => setS({ ...s, unidade: e.target.value })} />
          </div>
          <div className="field">
            <label className="l" htmlFor="data">Data</label>
            <input id="data" type="date" value={s.data} onChange={(e) => setS({ ...s, data: e.target.value })} />
          </div>
          <div className={`field full${faltando.has("f-etapa") ? " missing" : ""}`} id="f-etapa">
            <span className="l">Etapa que você está cursando *</span>
            <div className="seg" role="radiogroup" aria-label="Etapa">
              {ETAPAS.map((e) => (
                <label key={e} className={`k${e}`}>
                  <input type="radio" name="etapa" id={`etapa${e}`} checked={s.etapa === e} onChange={() => setS({ ...s, etapa: e })} />
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
                  <input type="radio" name="momento" id={`m-${m}`} checked={s.momento === m} onChange={() => setS({ ...s, momento: m })} />
                  <span>{m}</span>
                </label>
              ))}
            </div>
            {faltando.has("f-momento") && <span className="e">Escolha o momento.</span>}
          </div>
          {jaExiste && (
            <div className="alert info full">
              Você já fez a autoavaliação da Etapa {s.etapa}, momento {s.momento?.toLowerCase()}. Gerar de novo substitui a anterior neste aparelho.
            </div>
          )}
        </div>
      </section>

      <Bloco
        titulo="Aspectos gerais"
        sub="Comportamento e postura profissional. Avaliados em todas as etapas."
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
          <label className="l" htmlFor="obs">O que eu preciso estudar ou praticar mais</label>
          <textarea id="obs" value={s.obs} placeholder="Escreva com suas palavras. Este texto vai no PDF." onChange={(e) => setS({ ...s, obs: e.target.value })} />
        </div>
      </section>

      <div className="bar">
        <div className="in">
          <div className="prog">
            <span>{respondidos} de {TOTAL_ITENS} itens respondidos</span>
            <div className="track"><div className="fill" style={{ width: `${(respondidos / TOTAL_ITENS) * 100}%` }} /></div>
          </div>
          <button className="btn" onClick={gerar} disabled={gerando}>
            {gerando ? "Gerando…" : "Gerar PDF"}
          </button>
        </div>
        {msg && (
          <div className={`msg${msg.tipo === "err" ? " err" : ""}`} role="status" aria-live="polite">
            {msg.texto}
            {msg.tipo === "ok" && (
              <>
                {" "}
                <button className="link" onClick={onVerEvolucao}>Ver minha evolução</button>
              </>
            )}
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
