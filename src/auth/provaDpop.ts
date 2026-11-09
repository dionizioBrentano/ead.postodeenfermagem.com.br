import { base64url } from "./base64url";

type JwkPublico = {
  kty: string;
  crv: string;
  x: string;
  y: string;
};

let chavePrivada: CryptoKey | null = null;
let jwkPublico: JwkPublico | null = null;
let promessaChave: Promise<{ chavePrivada: CryptoKey; jwk: JwkPublico }> | null = null;

async function obterChave(): Promise<{ chavePrivada: CryptoKey; jwk: JwkPublico }> {
  if (chavePrivada && jwkPublico) {
    return { chavePrivada, jwk: jwkPublico };
  }
  if (!promessaChave) {
    promessaChave = (async () => {
      const par = await crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        false, // Chave privada NÃO exportável
        ["sign"]
      );
      const exportado = await crypto.subtle.exportKey("jwk", par.publicKey);
      if (!exportado.kty || !exportado.crv || !exportado.x || !exportado.y) {
        throw new Error("Este navegador não criou a chave de segurança. Atualize o navegador e tente de novo.");
      }
      chavePrivada = par.privateKey;
      jwkPublico = {
        kty: exportado.kty,
        crv: exportado.crv,
        x: exportado.x,
        y: exportado.y,
      };
      return { chavePrivada, jwk: jwkPublico };
    })();
  }
  return promessaChave;
}

function aleatorio(bytesQtd: number): string {
  const b = new Uint8Array(bytesQtd);
  crypto.getRandomValues(b);
  return base64url(b);
}

export function limparEndereco(endereco: string): string {
  return endereco.split(/[?#]/)[0];
}

function codificarJsonBase64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  return base64url(bytes);
}

async function calcularAth(token: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return base64url(new Uint8Array(hash));
}

/**
 * Cria a prova DPoP (JWT assinado com ES256) para o par método/endereço e token opcional.
 */
export async function prova(metodo: string, endereco: string, token?: string): Promise<string> {
  const { chavePrivada, jwk } = await obterChave();

  const cabecalho = {
    typ: "dpop+jwt",
    alg: "ES256",
    jwk: {
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
    },
  };

  const corpo: Record<string, unknown> = {
    jti: aleatorio(24),
    htm: metodo.toUpperCase(),
    htu: limparEndereco(endereco),
    iat: Math.floor(Date.now() / 1000),
  };

  if (token) {
    corpo.ath = await calcularAth(token);
  }

  const cabecalhoB64 = codificarJsonBase64url(cabecalho);
  const corpoB64 = codificarJsonBase64url(corpo);
  const mensagemParaAssinar = `${cabecalhoB64}.${corpoB64}`;

  const assinaturaBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    chavePrivada,
    new TextEncoder().encode(mensagemParaAssinar)
  );

  const assinaturaB64 = base64url(new Uint8Array(assinaturaBuffer));
  return `${mensagemParaAssinar}.${assinaturaB64}`;
}

/**
 * Envia uma requisição POST com a prova DPoP correspondente no cabeçalho.
 */
export async function postarComProva(
  endereco: string,
  corpo?: unknown,
  token?: string
): Promise<Response> {
  const provaPost = await prova("POST", endereco, token);
  const headers: Record<string, string> = {
    Accept: "application/json",
    DPoP: provaPost,
  };
  if (corpo !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `DPoP ${token}`;
  }
  return fetch(endereco, {
    method: "POST",
    headers,
    ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
  });
}
