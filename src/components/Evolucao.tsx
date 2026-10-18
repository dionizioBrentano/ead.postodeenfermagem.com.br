import { useState } from "react";
import { ATIVIDADES, GERAIS, MOMENTOS, type Item, type Nota } from "../data/itens";
import { listarAssuntos } from "../data/ead/assuntos/indiceAssuntos";
import {
  descricaoProximoCiclo,
  TEXTOS_PLANO_ESTUDO,
} from "../data/textosPlanoEstudo";
import { ESCALA_DE_NOTAS, classeDaNota } from "../estilo/cores-nota";
import { fmt1, fmtData, media, type Avaliacao } from "../lib/historico";
import {
  avaliacaoMaisRecente,
  itensDeAtencao,
  itensDoProximoCiclo,
} from "../lib/planoEstudo";
import { slugPublicadoDoItem } from "../lib/assuntosEstudo";
import { EtiquetaEstudo } from "./EtiquetaEstudo";
import "./PlanoEstudo.css";
import "./Evolucao.css";

type Props = {
  userKey?: string;
  lista: Avaliacao[];
  onMudou?: (l: Avaliacao[]) => void;
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

export default function Evolucao({ lista, onAutoavaliar }: Props) {
  const [ordem, setOrdem] = useState<"ficha" | "menores">("ficha");
  const [baixando, setBaixando] = useState<string | null>(null);

  if (!lista.length) {
    return (
      <div className="narrow">
        <section className="box sec evolucao-topo">
          <h1 className="evolucao-vazio-titulo">Minha evolução</h1>
          <p className="evolucao-vazio-texto">
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

  const maisRecente = avaliacaoMaisRecente(lista);
  const atencao = maisRecente ? itensDeAtencao(maisRecente) : [];
  const proximoCiclo = maisRecente ? itensDoProximoCiclo(maisRecente) : null;
  const assuntos = listarAssuntos();

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

  const celula = (v: Nota, key: string) =>
    typeof v === "number" ? (
      <td key={key} className={`cell nota-pintada ${classeDaNota(v)}`}>{v}</td>
    ) : (
      <td key={key} className="cell na" title="Ainda não praticado">–</td>
    );

  const variacao = (bloco: "gerais" | "atividades", i: number) => {
    const a = primeiraNota(lista, bloco, i);
    const b = ultimaNota(lista, bloco, i);
    if (a == null || b == null || lista.length < 2) return <td className="label mono muted">–</td>;
    const d = b - a;
    const classe = d > 0 ? "variacao-sobe" : d < 0 ? "variacao-desce" : "variacao-igual";
    return (
      <td className={`label mono variacao ${classe}`}>
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
            <td key={k} className={`cell nota-pintada ${classeDaNota(m)}`}>{fmt1(m)}</td>
          );
        })}
        <td />
      </tr>
    </>
  );

  return (
    <div className="wrap">
      <header className="sec evolucao-topo">
        <h1 className="evolucao-titulo">Minha evolução</h1>
        <p className="muted evolucao-descricao">
          Cada coluna é uma autoavaliação. Vermelho mostra o que você ainda não domina; verde escuro, o que já domina. A
          última coluna mostra quanto a nota mudou desde a primeira vez.
        </p>
        <div className="evolucao-legenda">
          <div className="legend-scale" aria-hidden="true">
            {ESCALA_DE_NOTAS.map((i) => (
              <span key={i} className={`nota-pintada ${classeDaNota(i)}`}>{i}</span>
            ))}
          </div>
          <div className="legend-cap"><span>Não conhece</span><span>Domina</span></div>
        </div>
      </header>

      {atencao.length > 0 && (
        <section className="box sec">
          <h2 className="evolucao-secao-titulo">Precisa de atenção</h2>
          <p className="muted evolucao-secao-texto">
            {TEXTOS_PLANO_ESTUDO.descricaoAtencao}
          </p>
          <div className="chips">
            {atencao.map((it) => (
              <EtiquetaEstudo
                key={`${it.ref.block}-${it.ref.number}`}
                slug={slugPublicadoDoItem(it.ref, assuntos)}
              >
                <span
                  className={`chip nota-pintada ${classeDaNota(it.nota)}`}
                >
                  {it.item.curto} · {it.nota}
                </span>
              </EtiquetaEstudo>
            ))}
          </div>
        </section>
      )}

      {proximoCiclo !== null && (
        <section className="box sec">
          <h2>{TEXTOS_PLANO_ESTUDO.tituloProximoCiclo}</h2>
          <p className="muted">{descricaoProximoCiclo(proximoCiclo.ciclo)}</p>
          <div className="chips">
            {proximoCiclo.itens.map((it) => (
              <EtiquetaEstudo
                key={`${it.ref.block}-${it.ref.number}`}
                slug={slugPublicadoDoItem(it.ref, assuntos)}
              >
                <span className="chip etiqueta-proximo-ciclo">
                  {it.item.curto}
                </span>
              </EtiquetaEstudo>
            ))}
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
        <h2 className="evolucao-secao-titulo">Autoavaliações salvas</h2>
        <p className="muted evolucao-secao-texto">
          Guarde os PDFs com você. As avaliações estão sincronizadas com o servidor.
        </p>
        <ul className="saved">
          {lista.map((a) => {
            const id = `${a.etapa}-${a.momento}`;
            return (
              <li key={id}>
                <span>
                  <b>Etapa {a.etapa} · {a.momento}</b> <span className="muted">· {fmtData(a.data)}</span>
                </span>
                <span className="acts">
                  <button className="btn ghost small" onClick={() => baixar(a)} disabled={baixando === id}>
                    {baixando === id ? "Gerando…" : "Baixar PDF"}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
