export async function sha256(text: string) {
  const rawBuffer = new TextEncoder().encode(text);
  // 计算 SHA-256 哈希
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', rawBuffer);
  // 将 ArrayBuffer 转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
