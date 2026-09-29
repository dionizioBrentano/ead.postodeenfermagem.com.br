// Copia dist/index.html para dist/sala/index.html.
// Assim o endereço /sala abre direto no servidor de arquivos estáticos,
// sem precisar de regra de reescrita (.htaccess).
import { mkdirSync, copyFileSync } from "node:fs";
mkdirSync("dist/sala", { recursive: true });
copyFileSync("dist/index.html", "dist/sala/index.html");
console.log("dist/sala/index.html criado");
