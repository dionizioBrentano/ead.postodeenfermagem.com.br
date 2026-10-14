import { useState, useEffect, useCallback } from "react";
import {
  adminGetMembros,
  adminAprovarMembro,
  adminRevogarMembro,
  adminReativarMembro,
  type MembroOrganizacao,
} from "../api/organizacao";
import { mensagemDoErro } from "../lib/organizacao";
import { TEXTOS_ORGANIZACAO } from "../data/textosOrganizacao";

export interface MensagensSucessoVinculo {
  aprovado?: string;
  revogado?: string;
  reativado?: string;
}

export function useVinculos(
  token: string,
  papel: "docente" | "administrador" | "aluno",
  mensagensSucesso?: MensagensSucessoVinculo
) {
  const [membros, setMembros] = useState<MembroOrganizacao[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setMensagemErro(null);
    try {
      const lista = await adminGetMembros(token, `papel=${papel}`);
      setMembros(lista);
    } catch (err: unknown) {
      setMensagemErro(mensagemDoErro(err, TEXTOS_ORGANIZACAO.erroCarregarLista));
    } finally {
      setCarregando(false);
    }
  }, [token, papel]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const aprovar = useCallback(
    async (id: string): Promise<boolean> => {
      setMensagemErro(null);
      setMensagemSucesso(null);
      try {
        await adminAprovarMembro(token, id);
        if (mensagensSucesso?.aprovado) {
          setMensagemSucesso(mensagensSucesso.aprovado);
        }
        await recarregar();
        return true;
      } catch (err: unknown) {
        setMensagemErro(mensagemDoErro(err, TEXTOS_ORGANIZACAO.erroAprovar));
        throw err;
      }
    },
    [token, mensagensSucesso?.aprovado, recarregar]
  );

  const revogar = useCallback(
    async (id: string, motivo?: string): Promise<boolean> => {
      setMensagemErro(null);
      setMensagemSucesso(null);
      try {
        await adminRevogarMembro(token, id, motivo ?? "");
        if (mensagensSucesso?.revogado) {
          setMensagemSucesso(mensagensSucesso.revogado);
        }
        await recarregar();
        return true;
      } catch (err: unknown) {
        setMensagemErro(mensagemDoErro(err, TEXTOS_ORGANIZACAO.erroRevogar));
        return false;
      }
    },
    [token, mensagensSucesso?.revogado, recarregar]
  );

  const reativar = useCallback(
    async (id: string): Promise<boolean> => {
      setMensagemErro(null);
      setMensagemSucesso(null);
      try {
        await adminReativarMembro(token, id);
        if (mensagensSucesso?.reativado) {
          setMensagemSucesso(mensagensSucesso.reativado);
        }
        await recarregar();
        return true;
      } catch (err: unknown) {
        setMensagemErro(mensagemDoErro(err, TEXTOS_ORGANIZACAO.erroReativar));
        return false;
      }
    },
    [token, mensagensSucesso?.reativado, recarregar]
  );

  return {
    membros,
    carregando,
    mensagemSucesso,
    mensagemErro,
    setMensagemSucesso,
    setMensagemErro,
    recarregar,
    aprovar,
    revogar,
    reativar,
  };
}
