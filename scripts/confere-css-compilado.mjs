// Trava do CSS compilado, rodada no fim do "npm run build".
// Reprova quando um :root aparece dentro de outro seletor (por exemplo ".classe :root"),
// o que acontece quando uma regra fica sem "}" e os tokens deixam de valer na página.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PASTA_COMPILADA = join("dist", "assets");

const erros = [];
const arquivos = readdirSync(PASTA_COMPILADA).filter((nome) => nome.endsWith(".css"));

for (const nome of arquivos) {
  const texto = readFileSync(join(PASTA_COMPILADA, nome), "utf8");
  for (const ocorrencia of texto.matchAll(/([^{};]*):root\b/g)) {
    const seletorAntes = ocorrencia[1].trim();
    if (seletorAntes !== "" && !seletorAntes.endsWith(",")) {
      erros.push(`${nome}: "${seletorAntes} :root" — :root dentro de outro seletor`);
    }
  }
}

if (arquivos.length === 0) {
  erros.push(`nenhum .css em ${PASTA_COMPILADA}`);
}

if (erros.length > 0) {
  console.error(`Trava do CSS compilado reprovou (${erros.length}):`);
  for (const erro of erros) {
    console.error(`- ${erro}`);
  }
  process.exit(1);
}

console.log(`Trava do CSS compilado: ${arquivos.length} arquivo(s) conferido(s), sem erro.`);
