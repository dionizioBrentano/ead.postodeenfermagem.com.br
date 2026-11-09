export function base64url(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((x) => {
    s += String.fromCharCode(x);
  });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
