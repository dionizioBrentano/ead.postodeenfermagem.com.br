export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
export const ENDERECO_TROCA = `${API_URL}/entrada/trocar`;
export const ENDERECO_SAIR = `${API_URL}/entrada/sair`;
export const ENDERECO_AUTORIZAR = `${API_URL}/entrada/autorizar`;
