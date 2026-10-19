// Estado inicial da confirmação de acesso.
// Com token, perfil e vínculos já guardados no navegador, a Sala abre na hora
// e confirma o acesso em segundo plano; sem algum deles, mostra "Confirmando seu acesso".
import type { Membership, Profile } from "../api/client";

export type Guarda =
  | { estado: "verificando" }
  | { estado: "ok"; perfil: Profile; memberships: Membership[] }
  | { estado: "erro"; mensagem: string };

export function guardaInicial(
  token: string | null,
  perfil: Profile | null,
  vinculos: Membership[] | null,
): Guarda {
  if (!token || !perfil || !vinculos) return { estado: "verificando" };
  return { estado: "ok", perfil, memberships: vinculos };
}
