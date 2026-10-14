import React, { useState } from "react";
import {
  cadastrarAluno,
  corrigirAluno,
  type DadosAluno,
  type MembroOrganizacao,
} from "../api/organizacao";
import { fieldErrors } from "../api/client";
import { TEXTOS_ORGANIZACAO } from "../data/textosOrganizacao";
import { validarDadosAluno } from "../lib/organizacao";
import { Janela } from "./Janela";
import "./Organizacao.css";

export interface FormularioAlunoProps {
  token: string;
  alunoParaEditar?: MembroOrganizacao | null;
  onSalvo: (mensagem: string) => void;
  onFechar: () => void;
}

export const FormularioAluno: React.FC<FormularioAlunoProps> = ({
  token,
  alunoParaEditar,
  onSalvo,
  onFechar,
}) => {
  const ehEdicao = Boolean(alunoParaEditar);
  const jaAcessou = Boolean(alunoParaEditar?.primeiro_acesso_feito);

  const [nome, setNome] = useState(alunoParaEditar?.usuario?.name || "");
  const [celular, setCelular] = useState("");
  const [matricula, setMatricula] = useState(alunoParaEditar?.matricula || "");

  const [errosLocais, setErrosLocais] = useState<
    Record<"nome" | "celular" | "matricula", string | null>
  >({ nome: null, celular: null, matricula: null });
  const [errosApi, setErrosApi] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);
    setErrosApi({});

    // Validação no cliente
    const erros = validarDadosAluno(
      { nome, celular, matricula },
      ehEdicao // celular é opcional na edição
    );
    setErrosLocais(erros);

    // Se aluno já acessou, ignora erros de nome/celular locais pois esses campos estão desabilitados
    if (jaAcessou) {
      if (erros.matricula) return;
    } else {
      if (erros.nome || erros.celular || erros.matricula) return;
    }

    setSalvando(true);
    try {
      if (ehEdicao && alunoParaEditar) {
        const dados: DadosAluno = {
          matricula: matricula.trim() ? matricula.trim() : null,
        };

        const nomeAtual = alunoParaEditar.usuario?.name?.trim() || "";
        const nomeNovo = nome.trim();
        if (nomeNovo !== nomeAtual) {
          dados.name = nomeNovo;
        }

        if (celular.trim()) {
          dados.phone = celular.trim();
        }

        await corrigirAluno(token, alunoParaEditar.id, dados);
        onSalvo(TEXTOS_ORGANIZACAO.sucessoCorrigirAluno);
      } else {
        await cadastrarAluno(token, {
          name: nome.trim(),
          phone: celular.trim(),
          matricula: matricula.trim() ? matricula.trim() : null,
        });
        onSalvo(TEXTOS_ORGANIZACAO.sucessoCadastrarAluno);
      }
    } catch (err: unknown) {
      const fErrs = fieldErrors(err);
      setErrosApi(fErrs);

      if (Object.keys(fErrs).length === 0) {
        const msg = err instanceof Error ? err.message : TEXTOS_ORGANIZACAO.erroGenerico;
        setErroGeral(msg);
      }
    } finally {
      setSalvando(false);
    }
  };

  const erroNome = errosLocais.nome || errosApi.name;
  const erroCelular = errosLocais.celular || errosApi.phone;
  const erroMatricula = errosLocais.matricula || errosApi.matricula;

  const tituloModal = ehEdicao
    ? TEXTOS_ORGANIZACAO.formularioCorrigirTitulo
    : TEXTOS_ORGANIZACAO.formularioCadastrarTitulo;

  return (
    <Janela
      titulo={tituloModal}
      aoFechar={onFechar}
      idTitulo="titulo-formulario-aluno"
    >
      <form onSubmit={handleSubmeter} className="form">
        {erroGeral && <p className="alert err">{erroGeral}</p>}

        {ehEdicao && jaAcessou && (
          <p className="alert info">{TEXTOS_ORGANIZACAO.bloqueioAlunoJaAcessou}</p>
        )}

        <div className="field">
          <label htmlFor="campo-aluno-nome" className="l">
            {TEXTOS_ORGANIZACAO.nomeCampo}
          </label>
          <input
            id="campo-aluno-nome"
            type="text"
            value={nome}
            disabled={salvando || jaAcessou}
            onChange={(e) => setNome(e.target.value)}
            aria-describedby={erroNome ? "campo-aluno-nome-erro" : undefined}
            required={!jaAcessou}
          />
          {erroNome && (
            <span id="campo-aluno-nome-erro" className="e">
              {erroNome}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="campo-aluno-celular" className="l">
            {TEXTOS_ORGANIZACAO.celularCampo}
          </label>
          <input
            id="campo-aluno-celular"
            type="tel"
            autoComplete="off"
            value={celular}
            disabled={salvando || jaAcessou}
            onChange={(e) => setCelular(e.target.value)}
            aria-describedby={
              erroCelular
                ? "campo-aluno-celular-erro"
                : ehEdicao
                ? "campo-aluno-celular-dica"
                : undefined
            }
            required={!ehEdicao}
          />
          {ehEdicao && !erroCelular && (
            <span id="campo-aluno-celular-dica" className="d">
              {TEXTOS_ORGANIZACAO.celularDicaTroca}
            </span>
          )}
          {erroCelular && (
            <span id="campo-aluno-celular-erro" className="e">
              {erroCelular}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="campo-aluno-matricula" className="l">
            {TEXTOS_ORGANIZACAO.matriculaCampo}
          </label>
          <input
            id="campo-aluno-matricula"
            type="text"
            value={matricula}
            disabled={salvando}
            onChange={(e) => setMatricula(e.target.value)}
            aria-describedby={
              erroMatricula ? "campo-aluno-matricula-erro" : "campo-aluno-matricula-dica"
            }
          />
          {!erroMatricula && (
            <span id="campo-aluno-matricula-dica" className="d">
              {TEXTOS_ORGANIZACAO.matriculaDica}
            </span>
          )}
          {erroMatricula && (
            <span id="campo-aluno-matricula-erro" className="e">
              {erroMatricula}
            </span>
          )}
        </div>

        <div className="organizacao-rodape-modal">
          <button
            type="button"
            className="btn ghost small"
            disabled={salvando}
            onClick={onFechar}
          >
            {TEXTOS_ORGANIZACAO.cancelar}
          </button>
          <button
            type="submit"
            className="btn small"
            disabled={salvando}
          >
            {salvando ? TEXTOS_ORGANIZACAO.carregando : TEXTOS_ORGANIZACAO.salvarAluno}
          </button>
        </div>
      </form>
    </Janela>
  );
};
