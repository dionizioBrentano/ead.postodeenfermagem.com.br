import "./ConteudoEad.css";

export interface ListaMarcadaEadProps {
  itens: readonly string[];
}

export function ListaMarcadaEad({ itens }: ListaMarcadaEadProps) {
  return (
    <div className="ead-card-objetivos">
      <ul className="ead-lista-objetivos">
        {itens.map((item, idx) => (
          <li key={idx} className="ead-item-objetivo">
            <span className="ead-bullet-objetivo" aria-hidden="true">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListaMarcadaEad;
