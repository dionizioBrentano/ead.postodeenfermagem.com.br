const fs = require('fs');
let code = fs.readFileSync('src/api/client.ts', 'utf8');

const target = `export async function login(loginValue: string, password: string) {
  const app = await getAppToken();
  const data = await request("POST", "/auth/login", {
    bearer: app,
    body: { login: loginValue, password },
  });
  const token = pickToken(data);
  if (!token) throw new ApiError(0, "A API não devolveu o token de acesso.", data);
  const profile = pickProfile(data);
  saveSession(token, profile);
  return { token, profile };
}`;

const replacement = `export async function login(loginValue: string, password: string) {
  const app = await getAppToken();
  const data = await request("POST", "/auth/login", {
    bearer: app,
    body: { login: loginValue, password },
  });
  
  const token = pickToken(data);
  if (!token) throw new ApiError(0, "A API não devolveu o token de acesso.", data);
  
  if (obj(data)?.mfa_required === true) {
    return { mfa_required: true, token, profile: null };
  }
  
  const profile = pickProfile(data);
  saveSession(token, profile);
  return { mfa_required: false, token, profile };
}

export async function verifyMfa(token: string, totp_code: string) {
  const data = await request("POST", "/auth/mfa/verify", {
    bearer: token,
    body: { totp_code }
  });
  const newToken = pickToken(data) || token;
  const profile = pickProfile(data);
  saveSession(newToken, profile);
  return { token: newToken, profile };
}`;

if (code.includes(target)) {
  fs.writeFileSync('src/api/client.ts', code.replace(target, replacement));
  console.log("Patched successfully");
} else {
  console.log("Target not found!");
}
