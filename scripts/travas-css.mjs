// Travas de CSS, rodadas pelo "npm test".
// Reprovam quando algum .css de src tem chaves "{" e "}" em número diferente,
// ou quando usa var(--nome) sem que --nome esteja definido em algum .css de src.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const PASTA_FONTES = "src";

function arquivosCss(pasta) {
  const encontrados = [];
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, item.name);
    if (item.isDirectory()) {
      encontrados.push(...arquivosCss(caminho));
    } else if (item.name.endsWith(".css")) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

function semComentarios(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, "");
}

function contar(texto, caractere) {
  return texto.split(caractere).length - 1;
}

const arquivos = arquivosCss(PASTA_FONTES);
const erros = [];
const definidas = new Set();
const usos = [];

for (const arquivo of arquivos) {
  const texto = semComentarios(readFileSync(arquivo, "utf8"));
  const abertas = contar(texto, "{");
  const fechadas = contar(texto, "}");
  if (abertas !== fechadas) {
    erros.push(`${arquivo}: ${abertas} chaves "{" e ${fechadas} chaves "}"`);
  }
  for (const definicao of texto.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) {
    definidas.add(definicao[1]);
  }
  for (const uso of texto.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
    usos.push({ arquivo, nome: uso[1] });
  }
}

for (const { arquivo, nome } of usos) {
  if (!definidas.has(nome)) {
    erros.push(`${arquivo}: usa ${nome}, que não está definido em nenhum .css de ${PASTA_FONTES}`);
  }
}

if (erros.length > 0) {
  console.error(`Travas de CSS reprovaram (${erros.length}):`);
  for (const erro of erros) {
    console.error(`- ${erro}`);
  }
  process.exit(1);
}

console.log(`Travas de CSS: ${arquivos.length} arquivos .css conferidos, sem erro.`);
