import type {
  ConferenciaOrganizacao,
  SituacaoEsperadaPrimeiraVia,
} from "../lib/gabaritoOrganizacaoPlantao";
import type {
  LeituraOrganizacao,
  SituacaoPrimeiraViaLeitura,
} from "../lib/leituraOrganizacaoPlantao";
import {
  ROTULO_NIVEL,
  TITULO_RELATO_PLANTAO,
  TOTAL_NIVEIS_DIFICULDADE,
} from "../data/cenariosPrescricaoTeste";
import {
  ROTULOS_CONFERENCIA_GABARITO,
  ROTULOS_LEITURA_ORGANIZACAO,
  TEXTO_AVISO_GABARITO_APOIO,
  TEXTO_CONDUTA_NAO_REGISTRADA,
  TEXTO_CONFERE_NAO,
  TEXTO_CONFERE_SIM,
  TEXTO_JANELA_SEM_CUIDADO_LEITURA,
  TEXTO_MARCA_CHECADO,
  TEXTO_MARCA_CIRCULADO_NAO_FEITO,
  TEXTO_MARCA_CIRCULADO_REAPRAZADO,
  TEXTO_MARCA_CIRCULADO_REAPRAZADO_PARA,
  TEXTO_MARCA_SEM_MARCA,
  TEXTO_NAO_CONFERIDO,
  TEXTO_PRESCRICAO_NAO_GRAVADA,
} from "../data/prescricaoFicticia";
import "./OrganizacaoPlantaoExercicio.css";

interface Props {
  leitura: LeituraOrganizacao;
  conferencia?: ConferenciaOrganizacao | null;
}

function textoSituacaoPrimeiraVia(
  situacao: SituacaoPrimeiraViaLeitura | SituacaoEsperadaPrimeiraVia,
  horarioNovo?: string
): string {
  if (situacao === "nao_conferido") {
    return TEXTO_NAO_CONFERIDO;
  }
  if (situacao === "checado") {
    return TEXTO_MARCA_CHECADO;
  }
  if (situacao === "nao_feito") {
    return TEXTO_MARCA_CIRCULADO_NAO_FEITO;
  }
  if (situacao === "reaprazado") {
    return horarioNovo
      ? `${TEXTO_MARCA_CIRCULADO_REAPRAZADO_PARA} ${horarioNovo}`
      : TEXTO_MARCA_CIRCULADO_REAPRAZADO;
  }
  return TEXTO_MARCA_SEM_MARCA;
}

function textoConfere(confere: boolean | null): string {
  if (confere === null) {
    return TEXTO_NAO_CONFERIDO;
  }
  return confere ? TEXTO_CONFERE_SIM : TEXTO_CONFERE_NAO;
}

export default function OrganizacaoPlantaoLeitura({
  leitura,
  conferencia = null,
}: Props) {
  const { prescricao } = leitura;

  return (
    <div className="supervisao-leitura">
      {/* 1. Dados do paciente */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.dadosPacienteTitulo}
        </h3>
        {prescricao ? (
          <>
            <div className="plantao-dados-paciente supervisao-leitura-dados-paciente">
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.hospital}</strong> {prescricao.hospital}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.unidade}</strong> {prescricao.unidade}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.leito}</strong> {prescricao.leito}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.paciente}</strong> {prescricao.paciente}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.idade}</strong> {prescricao.idade}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.peso}</strong> {prescricao.peso ?? ""}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.diagnostico}</strong> {prescricao.diagnostico}
              </div>
              <div>
                <strong>{ROTULOS_LEITURA_ORGANIZACAO.alergias}</strong> {prescricao.alergias}
              </div>
            </div>

            {typeof prescricao.nivel === "number" && (
              <div className="plantao-nivel supervisao-leitura-nivel">
                {ROTULO_NIVEL}: {prescricao.nivel} de {TOTAL_NIVEIS_DIFICULDADE}
              </div>
            )}
          </>
        ) : (
          <p className="muted supervisao-aviso">{TEXTO_PRESCRICAO_NAO_GRAVADA}</p>
        )}
      </div>

      {/* Relato do plantão (logo depois dos dados do paciente) */}
      {Array.isArray(prescricao?.eventos) && prescricao.eventos.length > 0 && (
        <div className="plantao-relato supervisao-leitura-relato">
          <h3 className="plantao-subsecao-titulo">
            {TITULO_RELATO_PLANTAO}
          </h3>
          <ul className="plantao-relato-lista">
            {[...prescricao.eventos]
              .sort((a, b) => a.horario.localeCompare(b.horario))
              .map((ev, idx) => (
                <li
                  key={`${ev.horario}-${ev.itemId}-${idx}`}
                  className="plantao-relato-item"
                >
                  <span className="plantao-relato-horario">{ev.horario}</span> —{" "}
                  {ev.relato}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* 2. Turno */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.turnoTitulo}
        </h3>
        <p className="supervisao-leitura-turno">{leitura.turnoTexto}</p>
      </div>

      {/* 3. Janelas de horário */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.janelasTitulo}
        </h3>
        <div className="plantao-janelas-grade">
          {leitura.janelas.map((janela) => (
            <div key={janela.horario} className="plantao-janela">
              <div className="plantao-janela-topo">
                <span className="plantao-janela-horario">
                  {ROTULOS_LEITURA_ORGANIZACAO.janelaPrefixo} {janela.horario}
                </span>
              </div>
              {janela.cuidados.length === 0 ? (
                <div className="muted plantao-janela-vazia">
                  {TEXTO_JANELA_SEM_CUIDADO_LEITURA}
                </div>
              ) : (
                <div className="plantao-janela-itens">
                  {janela.cuidados.map((cuidado, idx) => (
                    <div
                      key={`${janela.horario}-${idx}`}
                      className="plantao-janela-item"
                    >
                      <div>
                        <div className="plantao-janela-item-rotulo">
                          {cuidado.rotulo}
                        </div>
                        {cuidado.detalhes && (
                          <div className="muted plantao-janela-item-detalhes">
                            {cuidado.detalhes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Primeira via */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.primeiraViaTitulo}
        </h3>
        {leitura.primeiraVia.length === 0 ? (
          <p className="muted supervisao-aviso">{TEXTO_PRESCRICAO_NAO_GRAVADA}</p>
        ) : (
          <div className="plantao-tabela-envoltorio">
            <table className="plantao-tabela">
              <thead>
                <tr className="plantao-tabela-linha-cabecalho">
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_LEITURA_ORGANIZACAO.colunaItem}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_LEITURA_ORGANIZACAO.colunaDose}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_LEITURA_ORGANIZACAO.colunaVia}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_LEITURA_ORGANIZACAO.colunaHorarios}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_LEITURA_ORGANIZACAO.colunaMarca}
                  </th>
                </tr>
              </thead>
              <tbody>
                {leitura.primeiraVia.map((item) => {
                  const classeLinha =
                    item.situacao === "checado"
                      ? " plantao-linha-checada"
                      : item.situacao === "nao_feito" ||
                          item.situacao === "reaprazado"
                        ? " plantao-linha-circulada"
                        : "";
                  return (
                    <tr
                      key={item.itemId}
                      className={`plantao-tabela-linha${classeLinha}`}
                    >
                      <td className="plantao-primeira-via-td-item">
                        {item.apresentacao}
                      </td>
                      <td className="plantao-primeira-via-td-secundaria">
                        {item.dose}
                      </td>
                      <td className="plantao-primeira-via-td-via">
                        {item.via}
                      </td>
                      <td className="plantao-primeira-via-td-secundaria">
                        {item.horariosAprazados}
                      </td>
                      <td className="plantao-primeira-via-td-marcas">
                        {textoSituacaoPrimeiraVia(item.situacao, item.horarioNovo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Conduta */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.condutaTitulo}
        </h3>
        {leitura.conduta.trim() ? (
          <p className="supervisao-leitura-conduta">{leitura.conduta}</p>
        ) : (
          <p className="muted supervisao-aviso">{TEXTO_CONDUTA_NAO_REGISTRADA}</p>
        )}
      </div>

      {/* 6. Conferência com o gabarito (apoio ao docente) */}
      {conferencia && (
        <div className="plantao-subsecao supervisao-leitura-secao supervisao-conferencia">
          <h3 className="plantao-subsecao-titulo">
            {ROTULOS_CONFERENCIA_GABARITO.titulo}
          </h3>

          <div className="supervisao-conferencia-janelas">
            {conferencia.janelas.map((janela) => (
              <div
                key={janela.horario}
                className="supervisao-conferencia-janela"
              >
                <div className="supervisao-conferencia-janela-topo">
                  <span className="plantao-janela-horario">
                    {ROTULOS_CONFERENCIA_GABARITO.janelaPrefixo} {janela.horario}
                  </span>
                  <span className="supervisao-conferencia-contagem">
                    {janela.certos.length}{" "}
                    {ROTULOS_CONFERENCIA_GABARITO.cuidadosConferemSufixo}
                  </span>
                </div>

                {janela.faltando.length > 0 && (
                  <div className="supervisao-conferencia-bloco-lista">
                    <span className="supervisao-conferencia-rotulo-lista">
                      {ROTULOS_CONFERENCIA_GABARITO.faltouRotulo}
                    </span>
                    <ul className="supervisao-conferencia-lista">
                      {janela.faltando.map((rotulo, idx) => (
                        <li key={`${janela.horario}-faltando-${idx}`}>{rotulo}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {janela.sobrando.length > 0 && (
                  <div className="supervisao-conferencia-bloco-lista">
                    <span className="supervisao-conferencia-rotulo-lista">
                      {ROTULOS_CONFERENCIA_GABARITO.sobrandoRotulo}
                    </span>
                    <ul className="supervisao-conferencia-lista">
                      {janela.sobrando.map((rotulo, idx) => (
                        <li key={`${janela.horario}-sobrando-${idx}`}>{rotulo}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {conferencia.seNecessarioEmJanela.length > 0 && (
            <div className="supervisao-conferencia-bloco-lista">
              <span className="supervisao-conferencia-rotulo-lista">
                {ROTULOS_CONFERENCIA_GABARITO.seNecessarioEmJanelaRotulo}
              </span>
              <ul className="supervisao-conferencia-lista">
                {conferencia.seNecessarioEmJanela.map((rotulo, idx) => (
                  <li key={`sn-janela-${idx}`}>{rotulo}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="plantao-tabela-envoltorio">
            <table className="plantao-tabela">
              <thead>
                <tr className="plantao-tabela-linha-cabecalho">
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_CONFERENCIA_GABARITO.colunaItem}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_CONFERENCIA_GABARITO.colunaEsperado}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_CONFERENCIA_GABARITO.colunaMarcado}
                  </th>
                  <th scope="col" className="plantao-tabela-cabecalho">
                    {ROTULOS_CONFERENCIA_GABARITO.colunaConfere}
                  </th>
                </tr>
              </thead>
              <tbody>
                {conferencia.primeiraVia.map((item) => {
                  const classeConfere =
                    item.confere === true
                      ? "supervisao-conferencia-sim"
                      : item.confere === false
                        ? "supervisao-conferencia-nao"
                        : "supervisao-conferencia-neutro";

                  return (
                    <tr key={item.itemId} className="plantao-tabela-linha">
                      <td className="plantao-primeira-via-td-item">
                        <div>{item.apresentacao}</div>
                        {item.relato && (
                          <div className="supervisao-conferencia-relato-item">
                            {item.relato}
                          </div>
                        )}
                      </td>
                      <td className="plantao-primeira-via-td-secundaria">
                        {textoSituacaoPrimeiraVia(
                          item.esperado,
                          item.horarioNovoEsperado
                        )}
                      </td>
                      <td className="plantao-primeira-via-td-secundaria">
                        {textoSituacaoPrimeiraVia(
                          item.marcado,
                          item.horarioNovoMarcado
                        )}
                      </td>
                      <td
                        className={`plantao-primeira-via-td-marcas ${classeConfere}`}
                      >
                        {textoConfere(item.confere)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {conferencia.naoConferidos.length > 0 && (
            <div className="supervisao-conferencia-bloco-lista">
              <span className="supervisao-conferencia-rotulo-lista">
                {ROTULOS_CONFERENCIA_GABARITO.naoConferidosRotulo}
              </span>
              <ul className="supervisao-conferencia-lista">
                {conferencia.naoConferidos.map((apresentacao, idx) => (
                  <li key={`nao-conferido-${idx}`}>{apresentacao}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="supervisao-conferencia-aviso-apoio">
            {TEXTO_AVISO_GABARITO_APOIO}
          </p>
        </div>
      )}
    </div>
  );
}

