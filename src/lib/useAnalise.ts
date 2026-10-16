import { useEffect } from "react";
import type { Membership } from "../api/client";
import { tenantAtual } from "../api/client";
import { dadosDaOrganizacao } from "./analise";
import { definirOrganizacao, registrarPagina } from "./analiseGoogle";

export function useAnalise(rota: string, memberships: Membership[] | null): void {
  useEffect(() => {
    if (memberships !== null) {
      definirOrganizacao(dadosDaOrganizacao(tenantAtual(), memberships));
    }
  }, [memberships]);

  useEffect(() => {
    registrarPagina(rota);
  }, [rota]);
}
