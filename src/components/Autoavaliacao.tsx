import { useEffect, useRef, useState } from "react";
import { ATIVIDADES, ETAPAS, GERAIS, MOMENTOS, TOTAL_ITENS, type Item, type Momento, type Nota } from "../data/itens";
import { ESCALA_DE_NOTAS, classeDaNota } from "../estilo/cores-nota";
import {
  apagarRascunho,
  carregarRascunho,
  historicoParaPdf,
  hoje,
  salvarRascunho,
  type Avaliacao,
} from "../lib/historico";
import {
  ENVIO_SIMULTANEOS,
  ENVIO_TENTATIVAS,
  ENVIO_ESPERA_BASE_MS,
  montarItensDaAvaliacao,
  enviarEmLotes,
  motivoDaFalha,
  esperar,
} from "../lib/envioAvaliacao";
import type { AvaliacaoPayload } from "../api/ead";
import { TEXTOS_ENVIO_AVALIACAO } from "../data/textosEnvioAvaliacao";
import AvisoEnvioAvaliacao, { type AvisoEnvio } from "./AvisoEnvioAvaliacao";
import { TEXTOS_ASSUNTOS_ESTUDO } from "../data/textosAssuntosEstudo";
import { TEXTOS_PLANO_ESTUDO } from "../data/textosPlanoEstudo";
import {
  acrescentarAoTexto,
  itensDeAtencao,
  itensDoProximoCiclo,
  podeSugerirPlano,
  promptsDoPlano,
  textoPlanoSugerido,
} from "../lib/planoEstudo";
import CartaoPromptEstudo from "./CartaoPromptEstudo";
import ListaMarcadaEad from "./ListaMarcadaEad";
import type { PromptEstudo } from "../types/ead";
import "./PlanoEstudo.css";
import "./ConteudoEad.css";

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
  const [msg, setMsg] = useState<AvisoEnvio | null>(null);
  const [gerando, setGerando] = useState(false);
  const [itensFalhos, setItensFalhos] = useState<AvaliacaoPayload[] | null>(null);
  const [totalItensOriginal, setTotalItensOriginal] = useState<number>(0);
  const [avEmGravacao, setAvEmGravacao] = useState<Avaliacao | null>(null);
  const [pdfFalhouMotivo, setPdfFalhouMotivo] = useState<string | null>(null);
  const [planoGerado, setPlanoGerado] = useState<{ cicloAluno: number; prompts: PromptEstudo[] } | null>(null);
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

  async function concluirGravacao(av: Avaliacao, erroPdf: string | null) {
    try {
      const { carregarDaAPI } = await import("../lib/historico");
      const nova = await carregarDaAPI(userKey, "auto");
      onSalvou(nova);
    } catch {
      onSalvou(historicoParaPdf(lista, av));
    }
    apagarRascunho(userKey);
    setS({ ...vazio(av.nome), turma: av.turma, unidade: av.unidade });
    setItensFalhos(null);
    setAvEmGravacao(null);
    setPdfFalhouMotivo(null);
    if (erroPdf) {
      setMsg({ tipo: "err", texto: TEXTOS_ENVIO_AVALIACAO.pdfFalhou(erroPdf) });
    } else {
      setMsg({ tipo: "ok", texto: TEXTOS_ENVIO_AVALIACAO.tudoCerto });
    }
  }

  async function tentarSalvarDeNovo() {
    if (!itensFalhos || itensFalhos.length === 0 || !avEmGravacao) return;
    setGerando(true);
    try {
      const { getUserToken } = await import("../api/client");
      const token = getUserToken();
      if (!token) {
        setMsg({ tipo: "err", texto: TEXTOS_ENVIO_AVALIACAO.semSessao });
        return;
      }
      const totalItens = totalItensOriginal || itensFalhos.length;
      setMsg({ tipo: "ok", texto: TEXTOS_ENVIO_AVALIACAO.enviando(0, itensFalhos.length) });

      const { saveAvaliacao } = await import("../api/ead");
      const { falhas } = await enviarEmLotes(
        itensFalhos,
        (item) => saveAvaliacao(item, token),
        {
          simultaneos: ENVIO_SIMULTANEOS,
          tentativas: ENVIO_TENTATIVAS,
          esperaBaseMs: ENVIO_ESPERA_BASE_MS,
          esperar,
          aoAvancar: (feitos, total) => {
            setMsg({ tipo: "ok", texto: TEXTOS_ENVIO_AVALIACAO.enviando(feitos, total) });
          },
        }
      );

      if (falhas.length === 0) {
        await concluirGravacao(avEmGravacao, pdfFalhouMotivo);
      } else {
        falhas.forEach(({ erro }) => {
          console.error(
            "Falha ao salvar item da avaliação:",
            erro,
            "status:",
            (erro as any)?.status,
            "corpo:",
            (erro as any)?.body
          );
        });
        const motivo = motivoDaFalha(falhas[0].erro);
        setItensFalhos(falhas.map((f) => f.item));
        setMsg({
          tipo: "err",
          texto: TEXTOS_ENVIO_AVALIACAO.gravacaoParcial(falhas.length, totalItens, motivo),
        });
      }
    } catch (e) {
      console.error("Erro inesperado ao salvar de novo:", e);
      setMsg({ tipo: "err", texto: TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido });
    } finally {
      setGerando(false);
    }
  }

  async function gerar() {
    setMsg(null);
    setItensFalhos(null);
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
    let erroPdf: string | null = null;

    // 1. PDF primeiro, com dados do aparelho
    try {
      const { gerarPDF, nomeArquivo } = await import("../lib/pdf");
      const doc = gerarPDF(av, historicoParaPdf(lista, av));
      const arquivo = nomeArquivo(av);
      doc.save(arquivo);
    } catch (e) {
      console.error("Falha ao gerar o PDF:", e);
      erroPdf = e instanceof Error ? e.message : TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido;
    }
    setPdfFalhouMotivo(erroPdf);

    const itensAtencao = itensDeAtencao(av);
    const prompts = promptsDoPlano(itensAtencao, av.etapa);
    setPlanoGerado({
      cicloAluno: av.etapa,
      prompts,
    });

    // 2. Sem token
    const { getUserToken } = await import("../api/client");
    const token = getUserToken();
    if (!token) {
      setGerando(false);
      setMsg({ tipo: "err", texto: TEXTOS_ENVIO_AVALIACAO.semSessao });
      return;
    }

    // 3. Gravação
    try {
      const itens = montarItensDaAvaliacao({
        alunoId: userKey,
        papel: "auto",
        etapa: av.etapa,
        momento: av.momento,
        gerais: av.gerais,
        atividades: av.atividades,
        comentario: av.obs,
      });
      setTotalItensOriginal(itens.length);
      setAvEmGravacao(av);
      setMsg({ tipo: "ok", texto: TEXTOS_ENVIO_AVALIACAO.enviando(0, itens.length) });

      const { saveAvaliacao } = await import("../api/ead");
      const { falhas } = await enviarEmLotes(
        itens,
        (item) => saveAvaliacao(item, token),
        {
          simultaneos: ENVIO_SIMULTANEOS,
          tentativas: ENVIO_TENTATIVAS,
          esperaBaseMs: ENVIO_ESPERA_BASE_MS,
          esperar,
          aoAvancar: (feitos, total) => {
            setMsg({ tipo: "ok", texto: TEXTOS_ENVIO_AVALIACAO.enviando(feitos, total) });
          },
        }
      );

      // 4. Tudo salvo ou 5. Alguma falha
      if (falhas.length === 0) {
        await concluirGravacao(av, erroPdf);
      } else {
        falhas.forEach(({ erro }) => {
          console.error(
            "Falha ao salvar item da avaliação:",
            erro,
            "status:",
            (erro as any)?.status,
            "corpo:",
            (erro as any)?.body
          );
        });
        const motivo = motivoDaFalha(falhas[0].erro);
        setItensFalhos(falhas.map((f) => f.item));
        setMsg({
          tipo: "err",
          texto: TEXTOS_ENVIO_AVALIACAO.gravacaoParcial(falhas.length, itens.length, motivo),
        });
      }
    } catch (e) {
      console.error("Erro inesperado ao salvar avaliação:", e);
      setMsg({ tipo: "err", texto: TEXTOS_ENVIO_AVALIACAO.motivoDesconhecido });
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="narrow">
      <header className="sec pagina-topo">
        <span className="sobretitulo">
          Estágio hospitalar
        </span>
        <h1 className="pagina-titulo">Autoavaliação</h1>
        <p className="muted texto-sem-margem">
          Dê uma nota de 0 a 10 para o quanto você domina cada item da ficha de avaliação. Esta autoavaliação é para você
          enxergar sua evolução; ela não entra na sua nota. O questionário é o mesmo em todas as etapas.
        </p>
      </header>

      <section className="box sec">
        <h2 className="titulo-secao">Quando fazer</h2>
        <p className="texto-sem-margem">
          Três vezes em cada etapa. Guarde todos os PDFs numa mesma pasta.
        </p>
        <div className="when">
          <div><b>Início da etapa</b>Na primeira semana, antes de praticar os conteúdos novos.</div>
          <div><b>Meio da etapa</b>Na metade do período, para corrigir o rumo a tempo.</div>
          <div><b>Final da etapa</b>Na última semana, antes da avaliação do supervisor.</div>
        </div>
        <h2 className="titulo-secao titulo-secao-espacado">Como dar a nota</h2>
        <div className="legend-scale" aria-hidden="true">
          {ESCALA_DE_NOTAS.map((i) => (
            <span key={i} className={`nota-pintada ${classeDaNota(i)}`}>{i}</span>
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
        <p className="muted texto-apoio">
          Se o item ainda não foi trabalhado na sua etapa, marque <b>Ainda não pratiquei</b>.
        </p>
      </section>

      <section className="box sec">
        <h2 className="titulo-secao">Seus dados</h2>
        <div className="fields">
          <div className="field full" id="f-nome">
            <label className="l" htmlFor="nome">Nome completo *</label>
            <input id="nome" type="text" value={s.nome} aria-invalid={faltando.has("f-nome")} onChange={(e) => setS({ ...s, nome: e.target.value })} />
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
                  <input
                    type="radio"
                    name="etapa"
                    id={`etapa${e}`}
                    checked={s.etapa === e}
                    onChange={() => {
                      setS({ ...s, etapa: e });
                      setPlanoGerado(null);
                    }}
                  />
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
                  <input
                    type="radio"
                    name="momento"
                    id={`m-${m}`}
                    checked={s.momento === m}
                    onChange={() => {
                      setS({ ...s, momento: m });
                      setPlanoGerado(null);
                    }}
                  />
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
          <div className="acoes-plano">
            <button
              type="button"
              className="btn ghost small"
              disabled={!podeSugerirPlano(s)}
              onClick={() => {
                if (s.etapa === null || s.momento === null) return;
                const av = {
                  etapa: s.etapa,
                  momento: s.momento,
                  gerais: s.gerais,
                  atividades: s.atividades,
                };
                const texto = textoPlanoSugerido(
                  itensDeAtencao(av),
                  itensDoProximoCiclo(av),
                );
                setS({ ...s, obs: acrescentarAoTexto(s.obs, texto) });
              }}
            >
              {TEXTOS_PLANO_ESTUDO.botaoSugerirPlano}
            </button>
            {!podeSugerirPlano(s) && (
              <span className="h">{TEXTOS_PLANO_ESTUDO.ajudaBotaoDesativado}</span>
            )}
          </div>
        </div>
      </section>

      <div className="bar">
        <div className="in">
          <div className="prog">
            <span>{respondidos} de {TOTAL_ITENS} itens respondidos</span>
            <progress className="progresso" value={respondidos} max={TOTAL_ITENS} aria-label="Itens respondidos" />
          </div>
          <button className="btn" onClick={gerar} disabled={gerando}>
            {gerando ? "Gerando…" : "Gerar PDF"}
          </button>
        </div>
        <AvisoEnvioAvaliacao
          aviso={msg}
          onTentarDeNovo={itensFalhos && itensFalhos.length > 0 ? tentarSalvarDeNovo : undefined}
          salvando={gerando}
          onVerEvolucao={onVerEvolucao}
        />
      </div>

      {planoGerado && (
        <section className="box sec">
          <h2>{TEXTOS_PLANO_ESTUDO.tituloSecao}</h2>
          <p className="muted">
            {TEXTOS_PLANO_ESTUDO.descricaoSecao}
          </p>
          <div className="box ead-box-regras-ia">
            <h3 className="ead-subtitulo-regras-ia">
              {TEXTOS_ASSUNTOS_ESTUDO.subtituloRegrasIA}
            </h3>
            <ListaMarcadaEad itens={TEXTOS_ASSUNTOS_ESTUDO.regrasUsoIA} />
          </div>
          {planoGerado.prompts.length === 0 ? (
            <p className="muted">
              {TEXTOS_PLANO_ESTUDO.semItens}
            </p>
          ) : (
            <div className="ead-prompts-grade">
              {planoGerado.prompts.map((prompt) => (
                <CartaoPromptEstudo key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </section>
      )}
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
    <section className="sec bloco-avaliacao">
      <div className="bloco-avaliacao-cabecalho">
        <h2>{titulo}</h2>
        <p className="muted texto-sem-margem">{sub}</p>
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
                {Array.from({ length: 11 }, (_, v) => (
                  <label key={v} className={classeDaNota(v)}>
                    <input type="radio" name={nome} checked={notas[i] === v} onChange={() => setNota(bloco, i, v)} aria-label={`Nota ${v}`} />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
