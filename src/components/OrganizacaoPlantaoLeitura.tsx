import type {
  ItemPrimeiraViaLeitura,
  LeituraOrganizacao,
} from "../lib/leituraOrganizacaoPlantao";
import {
  ROTULOS_LEITURA_ORGANIZACAO,
  TEXTO_CONDUTA_NAO_REGISTRADA,
  TEXTO_JANELA_SEM_CUIDADO_LEITURA,
  TEXTO_MARCA_CHECADO,
  TEXTO_MARCA_CIRCULADO_NAO_FEITO,
  TEXTO_MARCA_CIRCULADO_REAPRAZADO,
  TEXTO_MARCA_CIRCULADO_REAPRAZADO_PARA,
  TEXTO_MARCA_SEM_MARCA,
  TEXTO_PRESCRICAO_NAO_GRAVADA,
} from "../data/prescricaoFicticia";
import "./OrganizacaoPlantaoExercicio.css";

interface Props {
  leitura: LeituraOrganizacao;
}

function textoMarcaPrimeiraVia(item: ItemPrimeiraViaLeitura): string {
  if (item.situacao === "checado") {
    return TEXTO_MARCA_CHECADO;
  }
  if (item.situacao === "nao_feito") {
    return TEXTO_MARCA_CIRCULADO_NAO_FEITO;
  }
  if (item.situacao === "reaprazado") {
    return item.horarioNovo
      ? `${TEXTO_MARCA_CIRCULADO_REAPRAZADO_PARA} ${item.horarioNovo}`
      : TEXTO_MARCA_CIRCULADO_REAPRAZADO;
  }
  return TEXTO_MARCA_SEM_MARCA;
}

export default function OrganizacaoPlantaoLeitura({ leitura }: Props) {
  const { prescricao } = leitura;

  return (
    <div className="supervisao-leitura">
      {/* 1. Dados do paciente */}
      <div className="plantao-subsecao supervisao-leitura-secao">
        <h3 className="plantao-subsecao-titulo">
          {ROTULOS_LEITURA_ORGANIZACAO.dadosPacienteTitulo}
        </h3>
        {prescricao ? (
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
        ) : (
          <p className="muted supervisao-aviso">{TEXTO_PRESCRICAO_NAO_GRAVADA}</p>
        )}
      </div>

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
                        {textoMarcaPrimeiraVia(item)}
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
    </div>
  );
}
