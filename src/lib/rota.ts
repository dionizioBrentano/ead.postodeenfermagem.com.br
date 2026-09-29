// Roteamento mínimo: só existem "/" e "/sala".
import { useEffect, useState } from "react";

function atual(): string {
  const p = window.location.pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

const ouvintes = new Set<() => void>();

export function navegar(para: string, substituir = false) {
  if (atual() === para) return;
  if (substituir) window.history.replaceState(null, "", para);
  else window.history.pushState(null, "", para);
  ouvintes.forEach((f) => f());
}

export function useRota(): string {
  const [rota, setRota] = useState(atual);
  useEffect(() => {
    const f = () => setRota(atual());
    ouvintes.add(f);
    window.addEventListener("popstate", f);
    return () => {
      ouvintes.delete(f);
      window.removeEventListener("popstate", f);
    };
  }, []);
  return rota;
}
