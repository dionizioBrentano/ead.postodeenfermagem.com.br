// Conteúdo estático do guia (vem deste repositório, não da API).
import guiaHtml from "../content/guia.html?raw";

export default function Guia({ onAutoavaliar }: { onAutoavaliar: () => void }) {
  return (
    <div className="guia">
      <div className="wrap">
        <div className="box" style={{ marginTop: 20, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 2, flex: "1 1 260px", minWidth: 0 }}>
            <b style={{ fontFamily: "var(--f-display)", fontSize: 19 }}>Autoavaliação</b>
            <span className="muted" style={{ fontSize: 15 }}>
              Faça no início, no meio e no final de cada etapa. Você baixa o PDF e acompanha sua evolução.
            </span>
          </div>
          <button className="btn" onClick={onAutoavaliar}>
            Fazer minha autoavaliação
          </button>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: guiaHtml }} />
    </div>
  );
}
