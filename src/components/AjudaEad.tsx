import { useMemo, useState } from "react";

// Assistente de ajuda do EAD: botão fixo "Precisa de ajuda?" em todas as telas.
// A pessoa escreve a dúvida ou escolhe um assunto e recebe o passo a passo.
// Sem servidor e sem biblioteca: o conteúdo fica neste arquivo.

const WHATSAPP_AJUDA =
  "https://wa.me/5551992946225?text=" + encodeURIComponent("Olá, professor. Preciso de ajuda com o EAD (ead.postodeenfermagem.com.br).");

type Topico = {
  id: string;
  titulo: string;
  palavras: string[];
  passos: string[];
  dica?: string;
};

const TOPICOS: Topico[] = [
  {
    id: "cadastro",
    titulo: "Criar meu cadastro",
    palavras: ["cadastro", "cadastrar", "criar", "conta", "inscrever", "registrar", "primeira vez", "novo"],
    passos: [
      "Abra ead.postodeenfermagem.com.br no navegador do celular ou do computador.",
      "Toque em \"Criar cadastro\".",
      "Preencha: nome completo, e-mail, celular com DDD (só números) e uma senha com pelo menos 8 caracteres. O CPF é opcional.",
      "Em \"Quero entrar como\", escolha \"Aluno\".",
      "Confirme seu e-mail e seu celular com os códigos de 6 números que chegam por e-mail e por SMS.",
      "Pronto: você volta para a Sala EAD.",
    ],
    dica: "Use sempre o mesmo e-mail. O cadastro vale para todos os meses e turmas: não faça outro.",
  },
  {
    id: "entrar",
    titulo: "Entrar (já tenho cadastro)",
    palavras: ["entrar", "login", "logar", "acessar", "acesso", "senha", "não consigo entrar"],
    passos: [
      "Abra ead.postodeenfermagem.com.br e toque em \"Entrar\".",
      "Em \"E-mail, CPF ou celular\", digite um deles (o mesmo do cadastro).",
      "Digite a sua senha e toque em \"Entrar\".",
    ],
    dica: "Se aparecer \"Sua sessão terminou\", é normal: entre de novo.",
  },
  {
    id: "senha",
    titulo: "Esqueci a minha senha",
    palavras: ["esqueci", "senha", "trocar senha", "recuperar", "redefinir"],
    passos: [
      "Na tela de entrar, toque em \"Esqueci minha senha\".",
      "Informe o seu e-mail, CPF ou celular do cadastro.",
      "Chega um código de 6 números. Digite o código.",
      "Crie a senha nova (pelo menos 8 caracteres) e repita igual.",
      "Depois, entre de novo com a senha nova.",
    ],
  },
  {
    id: "codigo",
    titulo: "Não recebi o código de confirmação",
    palavras: ["código", "codigo", "sms", "whatsapp", "não chegou", "nao chegou", "confirmar", "confirmação", "e-mail", "email"],
    passos: [
      "Espere 1 minuto: às vezes o SMS demora.",
      "Para o e-mail, olhe também a caixa de Spam ou Lixo eletrônico.",
      "Confira se o celular foi digitado com DDD e só números (exemplo: 51999998888).",
      "Toque em \"Reenviar código\".",
      "O código vale 15 minutos. Se passou disso, peça outro.",
    ],
  },
  {
    id: "autoavaliacao",
    titulo: "Fazer a autoavaliação",
    palavras: ["autoavaliação", "autoavaliacao", "avaliação", "avaliacao", "nota", "preencher", "formulário", "ficha"],
    passos: [
      "Entre na Sala EAD e abra a aba \"Autoavaliação\".",
      "Escreva seu nome completo, a turma e a unidade hospitalar.",
      "Escolha a etapa que você está cursando (1 a 4) e o momento: Início, Meio ou Final da etapa.",
      "Em cada item, dê uma nota de 0 a 10 para o quanto você domina. Se ainda não fez aquilo no estágio, marque \"Ainda não pratiquei\".",
      "Toque em \"Gerar PDF\".",
      "A mensagem certa é \"PDF gerado e autoavaliação salva com sucesso\". O PDF fica salvo no seu aparelho.",
    ],
    dica: "Seja sincero: a autoavaliação serve para você enxergar a sua evolução e não entra na sua nota.",
  },
  {
    id: "momento",
    titulo: "Qual etapa e qual momento escolher?",
    palavras: ["etapa", "momento", "início", "inicio", "meio", "final", "qual escolher"],
    passos: [
      "Etapa: o módulo do estágio que você está cursando agora (1, 2, 3 ou 4).",
      "Início da etapa: na primeira semana, antes de praticar os conteúdos novos.",
      "Meio da etapa: na metade do período, para corrigir o rumo a tempo.",
      "Final da etapa: na última semana, antes da avaliação do supervisor.",
    ],
    dica: "Na dúvida, pergunte ao professor qual etapa e momento usar hoje.",
  },
  {
    id: "erro-salvar",
    titulo: "Apareceu \"Erro ao salvar\" ou \"falha de conexão\"",
    palavras: ["erro", "falha", "não salvou", "nao salvou", "conexão", "conexao", "internet", "api"],
    passos: [
      "Confira se o celular está com internet (abra outro site para testar).",
      "Toque em \"Gerar PDF\" de novo. Fazer de novo substitui a anterior; não duplica.",
      "Se o erro continuar, guarde o PDF e avise o professor pelo botão de WhatsApp abaixo.",
    ],
  },
  {
    id: "pdf",
    titulo: "Onde está o meu PDF?",
    palavras: ["pdf", "arquivo", "download", "baixar", "onde está", "salvou onde"],
    passos: [
      "No celular Android: abra o app \"Arquivos\" (ou \"Meus arquivos\") e entre em \"Downloads\".",
      "No iPhone: abra o app \"Arquivos\" e procure em \"Transferências\" ou \"No meu iPhone\".",
      "No computador: abra a pasta \"Downloads\".",
      "O nome do arquivo começa com \"autoavaliacao_etapa\", seguido da etapa, do momento e do seu nome.",
    ],
    dica: "Guarde todos os PDFs numa mesma pasta.",
  },
  {
    id: "resultado",
    titulo: "Ver a avaliação do professor e o gráfico",
    palavras: ["resultado", "avaliação do professor", "supervisor", "gráfico", "grafico", "evolução", "evolucao", "comparação", "paralelo"],
    passos: [
      "Na Sala EAD, abra a aba \"Avaliações recebidas\".",
      "Em cima: a sua nota e a do professor, lado a lado, em cada item.",
      "Embaixo: o gráfico de cada item ao longo das etapas 1 a 4 (verde é você, laranja é o professor).",
    ],
    dica: "A nota do professor aparece depois que ele lançar a avaliação dele.",
  },
  {
    id: "celular",
    titulo: "Usar no celular",
    palavras: ["celular", "app", "aplicativo", "atalho", "tela inicial", "instalar"],
    passos: [
      "Não precisa instalar nada: o EAD funciona no navegador (Chrome ou Safari).",
      "Para criar um atalho: no Chrome, toque nos três pontos e em \"Adicionar à tela inicial\"; no Safari, toque em Compartilhar e em \"Adicionar à Tela de Início\".",
    ],
  },
];

function normalizar(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function buscar(texto: string): Topico[] {
  const q = normalizar(texto.trim());
  if (!q) return [];
  const termos = q.split(/\s+/).filter((p) => p.length > 2);
  return TOPICOS
    .map((t) => {
      const base = normalizar([t.titulo, ...t.palavras].join(" "));
      let pontos = base.includes(q) ? 5 : 0;
      for (const termo of termos) if (base.includes(termo)) pontos += 1;
      return { t, pontos };
    })
    .filter((r) => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 4)
    .map((r) => r.t);
}

export default function AjudaEad() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [buscou, setBuscou] = useState(false);
  const [topico, setTopico] = useState<Topico | null>(null);

  const resultados = useMemo(() => (buscou ? buscar(texto) : []), [buscou, texto]);

  const fechar = () => {
    setAberto(false);
    setTopico(null);
    setTexto("");
    setBuscou(false);
  };

  if (!aberto) {
    return (
      <button
        type="button"
        className="btn btn-ajuda-flutuante"
        onClick={() => setAberto(true)}
        aria-label="Abrir a ajuda"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 900,
          borderRadius: 999,
          boxShadow: "0 4px 14px rgba(0,0,0,.15)",
          background: "#00ad57",
          color: "#ffffff",
          fontWeight: 700,
        }}
      >
        Precisa de ajuda?
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Ajuda do EAD"
      className="box"
      style={{
        position: "fixed", right: 12, bottom: 12, zIndex: 900,
        width: "min(380px, calc(100vw - 24px))", maxHeight: "78vh", overflowY: "auto",
        display: "grid", gap: 12, boxShadow: "0 8px 30px rgba(0,0,0,.25)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <b style={{ fontSize: 17 }}>{topico ? topico.titulo : "Como posso ajudar?"}</b>
        <button type="button" className="btn ghost small" onClick={fechar} aria-label="Fechar a ajuda">Fechar</button>
      </div>

      {topico ? (
        <>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
            {topico.passos.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
          {topico.dica && <div className="alert info" style={{ fontSize: 14 }}>{topico.dica}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn ghost small" onClick={() => setTopico(null)}>Voltar aos assuntos</button>
          </div>
        </>
      ) : (
        <>
          <form
            onSubmit={(e) => { e.preventDefault(); setBuscou(true); }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => { setTexto(e.target.value); setBuscou(false); }}
              placeholder="Escreva sua dúvida. Ex.: não chegou o código"
              aria-label="Sua dúvida"
              style={{ flex: 1, minWidth: 0 }}
            />
            <button type="submit" className="btn small">Buscar</button>
          </form>

          {buscou && resultados.length === 0 && (
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Não encontrei esse assunto. Escolha um da lista ou fale com o professor.</p>
          )}

          <div style={{ display: "grid", gap: 6 }}>
            {(buscou && resultados.length ? resultados : TOPICOS).map((t) => (
              <button
                key={t.id}
                type="button"
                className="btn ghost small"
                style={{ textAlign: "left" }}
                onClick={() => setTopico(t)}
              >
                {t.titulo}
              </button>
            ))}
          </div>
        </>
      )}

      <a className="btn small" href={WHATSAPP_AJUDA} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center", textDecoration: "none" }}>
        Ainda com dúvida? Falar com o professor no WhatsApp
      </a>
    </div>
  );
}
