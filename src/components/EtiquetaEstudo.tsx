import type { ReactNode } from "react";
import { rotasDosAssuntos } from "../lib/assuntosEstudo";
import { navegar } from "../lib/rota";
import "./PlanoEstudo.css";

export interface EtiquetaEstudoProps {
  slug: string | null;
  children: ReactNode;
}

export function EtiquetaEstudo({ slug, children }: EtiquetaEstudoProps) {
  if (!slug) {
    return <>{children}</>;
  }

  const href = `/${rotasDosAssuntos([slug])[0]}`;

  return (
    <a
      href={href}
      className="etiqueta-link"
      onClick={(e) => {
        e.preventDefault();
        navegar(href);
      }}
    >
      {children}
    </a>
  );
}

export default EtiquetaEstudo;
