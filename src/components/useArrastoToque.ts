import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { TarefaArrastavel } from "../data/prescricaoFicticia";
import {
  TEMPO_TOQUE_LONGO_MS,
  deveIniciarArrasto,
  horarioDaJanela,
  type PontoToque,
} from "../lib/arrastoToque";

const DURACAO_VIBRACAO_ARRASTO_MS = 15;
const TEMPO_LIMPAR_BLOQUEIO_CLIQUE_MS = 100;

export interface FantasmaArrastoToque {
  tarefaId: string;
  rotulo: string;
  detalhes?: string;
  x: number;
  y: number;
}

interface SessaoToque {
  pointerId: number;
  tarefa: TarefaArrastavel;
  inicio: PontoToque;
  atual: { x: number; y: number };
  arrastando: boolean;
  horarioAlvo: string | null;
}

export function useArrastoToque(
  colarNaJanela: (tarefaId: string, horario: string) => void
) {
  const [fantasma, setFantasma] = useState<FantasmaArrastoToque | null>(null);
  const [horarioAlvo, setHorarioAlvo] = useState<string | null>(null);
  const [tarefaArrastandoId, setTarefaArrastandoId] = useState<string | null>(
    null
  );

  const sessaoRef = useRef<SessaoToque | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bloquearCliqueRef = useRef<boolean>(false);
  const colarRef = useRef(colarNaJanela);
  colarRef.current = colarNaJanela;

  const limparTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const encerrarSessao = useCallback(() => {
    limparTimer();
    sessaoRef.current = null;
    setFantasma(null);
    setHorarioAlvo(null);
    setTarefaArrastandoId(null);
  }, [limparTimer]);

  const ativarArrasto = useCallback((sessao: SessaoToque) => {
    if (sessao.arrastando) {
      return;
    }
    sessao.arrastando = true;
    bloquearCliqueRef.current = true;
    setTarefaArrastandoId(sessao.tarefa.id);

    const el =
      typeof document !== "undefined" &&
      typeof document.elementFromPoint === "function"
        ? document.elementFromPoint(sessao.atual.x, sessao.atual.y)
        : null;
    const horario = horarioDaJanela(el);
    sessao.horarioAlvo = horario;
    setHorarioAlvo(horario);

    setFantasma({
      tarefaId: sessao.tarefa.id,
      rotulo: sessao.tarefa.rotulo,
      detalhes: sessao.tarefa.detalhes,
      x: sessao.atual.x,
      y: sessao.atual.y,
    });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      try {
        navigator.vibrate(DURACAO_VIBRACAO_ARRASTO_MS);
      } catch {
        // Ignora caso o aparelho bloqueie vibração
      }
    }
  }, []);

  const processarMovimento = useCallback(
    (clientX: number, clientY: number) => {
      const sessao = sessaoRef.current;
      if (!sessao) {
        return;
      }

      sessao.atual = { x: clientX, y: clientY };

      if (!sessao.arrastando) {
        const decisao = deveIniciarArrasto(sessao.inicio, {
          x: clientX,
          y: clientY,
          t: Date.now(),
        });
        if (decisao === "cancelar") {
          encerrarSessao();
        } else if (decisao === "iniciar") {
          limparTimer();
          ativarArrasto(sessao);
        }
        return;
      }

      const el =
        typeof document !== "undefined" &&
        typeof document.elementFromPoint === "function"
          ? document.elementFromPoint(clientX, clientY)
          : null;
      const horario = horarioDaJanela(el);
      sessao.horarioAlvo = horario;
      setHorarioAlvo(horario);
      setFantasma({
        tarefaId: sessao.tarefa.id,
        rotulo: sessao.tarefa.rotulo,
        detalhes: sessao.tarefa.detalhes,
        x: clientX,
        y: clientY,
      });
    },
    [ativarArrasto, encerrarSessao, limparTimer]
  );

  const finalizarToque = useCallback(
    (clientX: number, clientY: number) => {
      const sessao = sessaoRef.current;
      if (!sessao) {
        return;
      }

      if (sessao.arrastando) {
        const el =
          typeof document !== "undefined" &&
          typeof document.elementFromPoint === "function"
            ? document.elementFromPoint(clientX, clientY)
            : null;
        const horarioFinal = horarioDaJanela(el) ?? sessao.horarioAlvo;
        if (horarioFinal) {
          colarRef.current(sessao.tarefa.id, horarioFinal);
        }
        setTimeout(() => {
          bloquearCliqueRef.current = false;
        }, TEMPO_LIMPAR_BLOQUEIO_CLIQUE_MS);
      }

      encerrarSessao();
    },
    [encerrarSessao]
  );

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !sessaoRef.current) {
        return;
      }
      processarMovimento(e.clientX, e.clientY);
    };

    const onWindowPointerUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !sessaoRef.current) {
        return;
      }
      finalizarToque(e.clientX, e.clientY);
    };

    const onWindowPointerCancel = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !sessaoRef.current) {
        return;
      }
      encerrarSessao();
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (sessaoRef.current?.arrastando) {
        e.preventDefault();
      }
    };

    const onWindowContextMenu = (e: Event) => {
      if (sessaoRef.current) {
        e.preventDefault();
      }
    };

    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
    window.addEventListener("pointercancel", onWindowPointerCancel);
    window.addEventListener("touchmove", onWindowTouchMove, { passive: false });
    window.addEventListener("contextmenu", onWindowContextMenu);

    return () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
      window.removeEventListener("pointercancel", onWindowPointerCancel);
      window.removeEventListener("touchmove", onWindowTouchMove);
      window.removeEventListener("contextmenu", onWindowContextMenu);
    };
  }, [encerrarSessao, finalizarToque, processarMovimento]);

  useEffect(() => {
    return () => {
      limparTimer();
    };
  }, [limparTimer]);

  const criarEventosToque = useCallback(
    (tarefa: TarefaArrastavel) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== "touch") {
          return;
        }
        limparTimer();
        bloquearCliqueRef.current = false;

        const agora = Date.now();
        const novaSessao: SessaoToque = {
          pointerId: e.pointerId,
          tarefa,
          inicio: { x: e.clientX, y: e.clientY, t: agora },
          atual: { x: e.clientX, y: e.clientY },
          arrastando: false,
          horarioAlvo: null,
        };
        sessaoRef.current = novaSessao;

        timerRef.current = setTimeout(() => {
          const ativa = sessaoRef.current;
          if (!ativa || ativa.arrastando) {
            return;
          }
          const decisao = deveIniciarArrasto(ativa.inicio, {
            x: ativa.atual.x,
            y: ativa.atual.y,
            t: Date.now(),
          });
          if (decisao === "iniciar") {
            ativarArrasto(ativa);
          } else if (decisao === "cancelar") {
            encerrarSessao();
          }
        }, TEMPO_TOQUE_LONGO_MS);
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== "touch") {
          return;
        }
        processarMovimento(e.clientX, e.clientY);
      },
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== "touch") {
          return;
        }
        finalizarToque(e.clientX, e.clientY);
      },
      onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => {
        if (e.pointerType !== "touch") {
          return;
        }
        encerrarSessao();
      },
      onContextMenu: (e: ReactMouseEvent<HTMLElement>) => {
        if (sessaoRef.current) {
          e.preventDefault();
        }
      },
    }),
    [ativarArrasto, encerrarSessao, finalizarToque, limparTimer, processarMovimento]
  );

  const consumirBloqueioClique = useCallback((): boolean => {
    if (bloquearCliqueRef.current) {
      bloquearCliqueRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    fantasma,
    horarioAlvo,
    tarefaArrastandoId,
    criarEventosToque,
    consumirBloqueioClique,
  };
}
