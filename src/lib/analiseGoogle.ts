import { tenantAtual } from "../api/client";
import { enderecoParaAnalise, medicaoAtiva } from "./analise";

export const ENDERECO_SCRIPT_GTAG = "https://www.googletagmanager.com/gtag/js";

let inicializado = false;

function obterIdMedicao(): string {
  return (import.meta.env.VITE_GA_MEASUREMENT_ID ?? "").trim();
}

export function iniciarAnalise(): void {
  if (inicializado) {
    return;
  }
  const id = obterIdMedicao();
  if (!medicaoAtiva(id, import.meta.env.DEV)) {
    return;
  }
  inicializado = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer?.push(arguments);
  }
  window.gtag = gtag;

  const script = document.createElement("script");
  script.async = true;
  script.src = `${ENDERECO_SCRIPT_GTAG}?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    organizacao_id: tenantAtual(),
  });
}

export function definirOrganizacao(dados: { organizacao_id: string; organizacao_nome?: string }): void {
  const id = obterIdMedicao();
  if (!medicaoAtiva(id, import.meta.env.DEV) || typeof window === "undefined" || !window.gtag) {
    return;
  }
  window.gtag("set", dados);
}

export function registrarPagina(caminho: string): void {
  const id = obterIdMedicao();
  if (!medicaoAtiva(id, import.meta.env.DEV) || typeof window === "undefined" || !window.gtag) {
    return;
  }
  window.gtag("event", "page_view", {
    page_location: enderecoParaAnalise(window.location.origin, caminho),
    page_path: caminho,
    page_title: document.title,
  });
}
