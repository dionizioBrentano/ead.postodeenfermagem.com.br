import { useState, useEffect } from "react";
import { getRegistrosProfissionais, getUserToken, type RegistroProfissional } from "../api/client";
import RegistroProfissionalForm from "../components/RegistroProfissionalForm";

export default function AguardandoPage({ onVerificar, onSair }: { onVerificar: () => void; onSair: () => void }) {
  const [registros, setRegistros] = useState<RegistroProfissional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    const fetchRegs = async () => {
      const token = getUserToken();
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        const regs = await getRegistrosProfissionais(token);
        setRegistros(regs);
      } catch (err) {
        console.error("Erro ao buscar registros:", err);
      } finally {
        setCarregando(false);
      }
    };
    fetchRegs();
  }, []);

  return (
    <main className="page auth">
      <div className="auth-card box" style={{ textAlign: "center" }}>
        <h2>Aguardando Aprovação</h2>
        <p className="muted">
          Seu cadastro de docente está aguardando aprovação da escola.
        </p>

        {!carregando && registros.length === 0 && !mostrarForm && (
          <div className="alert info" style={{ marginTop: 20 }}>
            Informe seu registro no conselho para agilizar a aprovação.
            <div style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => setMostrarForm(true)}>Adicionar Registro</button>
            </div>
          </div>
        )}

        {mostrarForm && (
          <div style={{ marginTop: 20 }}>
            <RegistroProfissionalForm 
              onSalvo={() => { 
                setMostrarForm(false);
                const fetchRegs = async () => {
                  const token = getUserToken();
                  if (token) setRegistros(await getRegistrosProfissionais(token));
                };
                fetchRegs();
              }} 
              onPular={() => setMostrarForm(false)} 
            />
          </div>
        )}

        {!mostrarForm && (
          <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <button className="btn" onClick={onVerificar}>Verificar de novo</button>
            <button className="btn ghost" onClick={onSair}>Sair</button>
          </div>
        )}
      </div>
    </main>
  );
}
