import { useState } from "react";
import { ATIVIDADES, GERAIS, MOMENTOS, type Item, type Momento, type Nota } from "../data/itens";
import { ESCALA, corDaNota } from "../lib/cores";
import { fmt1, fmtData, media, remover, type Avaliacao } from "../lib/historico";

type Props = {
  userKey: string;
  lista: Avaliacao[];
  onMudou: (l: Avaliacao[]) => void;
  onAutoavaliar: () => void;
};

type Linha = { bloco: "gerais" | "atividades"; i: number; item: Item; ultima: number | null };

function ultimaNota(lista: Avaliacao[], bloco: "gerais" | "atividades", i: number): number | null {
  for (let k = lista.length - 1; k >= 0; k--) {
    const v = lista[k][bloco][i];
    if (typeof v === "number") return v;
  }
  return null;
}
function primeiraNota(lista: Avaliacao[], bloco: "gerais" | "atividades", i: number): number | null {
  for (const a of lista) {
    const v = a[bloco][i];
    if (typeof v === "number") return v;
  }
  return null;
}

export default function Evolucao({ userKey, lista, onMudou, onAutoavaliar }: Props) {
  const [ordem, setOrdem] = useState<"ficha" | "menores">("ficha");
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);

  if (!lista.length) {
    return (
      <div className="narrow">
        <section className="box sec" style={{ marginTop: 28 }}>
          <h1 style={{ fontSize: 28 }}>Minha evolução</h1>
          <p style={{ margin: 0 }}>
            Aqui aparece um quadro colorido com as suas notas em cada autoavaliação, do vermelho (não conhece) ao verde
            escuro (domina). Você ainda não fez nenhuma autoavaliação neste aparelho.
          </p>
          <div>
            <button className="btn" onClick={onAutoavaliar}>Fazer a primeira autoavaliação</button>
          </div>
        </section>
      </div>
    );
  }

  const linhas = (bloco: "gerais" | "atividades", itens: Item[]): Linha[] => {
    const l = itens.map((item, i) => ({ bloco, i, item, ultima: ultimaNota(lista, bloco, i) }));
    if (ordem === "menores") l.sort((a, b) => (a.ultima ?? 99) - (b.ultima ?? 99));
    return l;
  };

  const atencao = [...linhas("gerais", GERAIS), ...linhas("atividades", ATIVIDADES)]
    .filter((l) => l.ultima != null && l.ultima <= 5)
    .sort((a, b) => (a.ultima ?? 0) - (b.ultima ?? 0));

  async function baixar(av: Avaliacao) {
    const id = `${av.etapa}-${av.momento}`;
    setBaixando(id);
    try {
      const { gerarPDF, nomeArquivo } = await import("../lib/pdf");
      const ate = lista.filter(
        (x) => x.etapa < av.etapa || (x.etapa === av.etapa && MOMENTOS.indexOf(x.momento) <= MOMENTOS.indexOf(av.momento)),
      );
      gerarPDF(av, ate).save(nomeArquivo(av));
    } finally {
      setBaixando(null);
    }
  }

  const apagar = (etapa: number, momento: Momento) => {
    onMudou(remover(userKey, etapa, momento));
    setConfirmar(null);
  };

  const celula = (v: Nota, key: string) =>
    typeof v === "number" ? (
      <td key={key} className="cell" style={{ background: corDaNota(v).fundo, color: corDaNota(v).texto }}>{v}</td>
    ) : (
      <td key={key} className="cell na" title="Ainda não praticado">–</td>
    );

  const variacao = (bloco: "gerais" | "atividades", i: number) => {
    const a = primeiraNota(lista, bloco, i);
    const b = ultimaNota(lista, bloco, i);
    if (a == null || b == null || lista.length < 2) return <td className="label mono muted">–</td>;
    const d = b - a;
    return (
      <td className="label mono" style={{ color: d > 0 ? "var(--ok)" : d < 0 ? "var(--no)" : "var(--muted)", fontWeight: 700 }}>
        {d > 0 ? `+${d}` : d === 0 ? "=" : `${d}`}
      </td>
    );
  };

  const grupo = (titulo: string, bloco: "gerais" | "atividades", itens: Item[]) => (
    <>
      <tr className="group"><td colSpan={lista.length + 2}><span>{titulo}</span></td></tr>
      {linhas(bloco, itens).map((l) => (
        <tr key={`${bloco}-${l.i}`}>
          <td className="label"><span className="num">{l.i + 1}</span>{l.item.curto}</td>
          {lista.map((a, k) => celula(a[bloco][l.i], `${k}`))}
          {variacao(bloco, l.i)}
        </tr>
      ))}
      <tr className="avg">
        <td className="label">Média</td>
        {lista.map((a, k) => {
          const m = media(a[bloco]);
          return m == null ? (
            <td key={k} className="cell na">–</td>
          ) : (
            <td key={k} className="cell" style={{ background: corDaNota(m).fundo, color: corDaNota(m).texto }}>{fmt1(m)}</td>
          );
        })}
        <td />
      </tr>
    </>
  );

  return (
    <div className="wrap">
      <header className="sec" style={{ marginTop: 28 }}>
        <h1 style={{ fontSize: "clamp(30px,6vw,44px)", fontWeight: 800, letterSpacing: "-.02em" }}>Minha evolução</h1>
        <p className="muted" style={{ margin: 0, maxWidth: "70ch" }}>
          Cada coluna é uma autoavaliação. Vermelho mostra o que você ainda não domina; verde escuro, o que já domina. A
          última coluna mostra quanto a nota mudou desde a primeira vez.
        </p>
        <div style={{ maxWidth: 520, display: "grid", gap: 4 }}>
          <div className="legend-scale" aria-hidden="true">
            {ESCALA.map((c, i) => (
              <span key={i} style={{ background: c.fundo, color: c.texto }}>{i}</span>
            ))}
          </div>
          <div className="legend-cap"><span>Não conhece</span><span>Domina</span></div>
        </div>
      </header>

      {atencao.length > 0 && (
        <section className="box sec">
          <h2 style={{ fontSize: 20 }}>Precisa de atenção</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>Itens com nota até 5 na sua avaliação mais recente.</p>
          <div className="chips">
            {atencao.map((l) => {
              const c = corDaNota(l.ultima!);
              return (
                <span key={`${l.bloco}-${l.i}`} className="chip" style={{ background: c.fundo, color: c.texto }}>
                  {l.item.curto} · {l.ultima}
                </span>
              );
            })}
          </div>
        </section>
      )}

      <section className="sec">
        <div className="toggle">
          <span className="muted">Ordenar:</span>
          <div className="seg">
            <label>
              <input type="radio" name="ordem" checked={ordem === "ficha"} onChange={() => setOrdem("ficha")} />
              <span>Ordem da ficha</span>
            </label>
            <label>
              <input type="radio" name="ordem" checked={ordem === "menores"} onChange={() => setOrdem("menores")} />
              <span>Menores notas primeiro</span>
            </label>
          </div>
        </div>
        <div className="heat-wrap">
          <table className="heat">
            <thead>
              <tr>
                <th className="item">Item</th>
                {lista.map((a) => (
                  <th key={`${a.etapa}-${a.momento}`}>Etapa {a.etapa}<br />{a.momento}</th>
                ))}
                <th>Mudança</th>
              </tr>
            </thead>
            <tbody>
              {grupo("Aspectos gerais", "gerais", GERAIS)}
              {grupo("Atividades desenvolvidas", "atividades", ATIVIDADES)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="box sec">
        <h2 style={{ fontSize: 20 }}>Autoavaliações salvas neste aparelho</h2>
        <p className="muted" style={{ margin: 0, fontSize: 14.5 }}>
          Elas ficam só neste navegador. Se trocar de celular ou limpar os dados do navegador, o quadro recomeça. Por isso,
          guarde sempre os PDFs.
        </p>
        <ul className="saved">
          {lista.map((a) => {
            const id = `${a.etapa}-${a.momento}`;
            return (
              <li key={id}>
                <span>
                  <b>Etapa {a.etapa} · {a.momento}</b> <span className="muted">· {fmtData(a.data)}</span>
                </span>
                {confirmar === id ? (
                  <span className="acts">
                    <span>Apagar esta autoavaliação?</span>
                    <button className="btn small" onClick={() => apagar(a.etapa, a.momento)}>Sim, apagar</button>
                    <button className="btn ghost small" onClick={() => setConfirmar(null)}>Cancelar</button>
                  </span>
                ) : (
                  <span className="acts">
                    <button className="btn ghost small" onClick={() => baixar(a)} disabled={baixando === id}>
                      {baixando === id ? "Gerando…" : "Baixar PDF"}
                    </button>
                    <button className="btn ghost small" onClick={() => setConfirmar(id)}>Apagar</button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
