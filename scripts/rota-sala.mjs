// Copia dist/index.html para as subpastas das rotas.
// Assim os endereços abrem direto no servidor de arquivos estáticos,
// sem precisar de regra de reescrita (.htaccess).
import { mkdirSync, copyFileSync, readFileSync } from "node:fs";

const rotasFixas = [
  "participar",
  "aguardando",
  "sala",
  "supervisao",
  "supervisao/lancamento",
  "administracao",
  "convite",
  "verificacao",
  "entrar/retorno",
];

// As rotas de módulos são geradas dinamicamente a partir de modules.json.
// Regra idêntica a rotasDosModulos em src/lib/modulosEad.ts (conferida em teste).
const modulesRaw = JSON.parse(
  readFileSync(new URL("../src/data/ead/modules.json", import.meta.url), "utf-8")
);
const modulosOrdenados = [...modulesRaw].sort((a, b) => a.number - b.number);
const rotasModulos = [];
for (const mod of modulosOrdenados) {
  rotasModulos.push(mod.slug);
  rotasModulos.push(`ead/${mod.slug}`);
}

// As rotas de assuntos de estudo são lidas dinamicamente a partir de indice.json.
// Regra idêntica a rotasDosAssuntos em src/lib/assuntosEstudo.ts (conferida em teste).
const assuntosRaw = JSON.parse(
  readFileSync(new URL("../src/data/ead/assuntos/indice.json", import.meta.url), "utf-8")
);
const rotasAssuntos = [];
for (const ass of assuntosRaw) {
  rotasAssuntos.push(`estudo/${ass.slug}`);
}

const rotas = [...rotasFixas, ...rotasModulos, ...rotasAssuntos];

for (const rota of rotas) {
  mkdirSync(`dist/${rota}`, { recursive: true });
  copyFileSync("dist/index.html", `dist/${rota}/index.html`);
  console.log(`dist/${rota}/index.html criado`);
}
