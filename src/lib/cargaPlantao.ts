import { CARGA_COFEN, type TipoCuidado } from "../data/perfisEpidemiologicos";

export const HORAS_DO_DIA = 24;
export const TOLERANCIA_HORAS = 0.001;

const CEM_POR_CENTO = 100;
const PROPORCAO_TOTAL = 1;

// A carga é repartida igualmente nas 24 horas e não usa índice de segurança técnica. Simplificação didática (guia-pratico-cola.md, seção 4 do perfil epidemiológico).
export function horasTecnicoPorPaciente(
  tipo: TipoCuidado,
  horasTurno: number
): number {
  const { horasPor24h, percentualEnfermeiro } = CARGA_COFEN[tipo];
  const fracaoTecnico = PROPORCAO_TOTAL - percentualEnfermeiro / CEM_POR_CENTO;
  return (horasPor24h * fracaoTecnico * horasTurno) / HORAS_DO_DIA;
}

export function cabeNoPlantao(
  horasUsadas: number,
  horasPaciente: number,
  horasTurno: number
): boolean {
  return horasUsadas + horasPaciente <= horasTurno + TOLERANCIA_HORAS;
}
