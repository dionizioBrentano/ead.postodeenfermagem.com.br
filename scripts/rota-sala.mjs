// Copia dist/index.html para as subpastas das rotas.
// Assim os endereços abrem direto no servidor de arquivos estáticos,
// sem precisar de regra de reescrita (.htaccess).
import { mkdirSync, copyFileSync } from "node:fs";

const rotas = ["participar", "aguardando", "sala", "supervisao", "administracao", "convite", "verificacao", "entrar/retorno"];

for (const rota of rotas) {
  mkdirSync(`dist/${rota}`, { recursive: true });
  copyFileSync("dist/index.html", `dist/${rota}/index.html`);
  console.log(`dist/${rota}/index.html criado`);
}
