/**
 * Utilitário para cópia de texto para a área de transferência.
 * Regra F-12 / ERR-01: erro tratado sem catch vazio.
 */

export async function copiarTexto(texto: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (_erro: unknown) {
    // Falha de permissão ou área de transferência indisponível no navegador
    return false;
  }
}
