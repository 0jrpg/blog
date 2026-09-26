import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "./env";

// -----------------------------------------------------------------------------
// Cada post é criptografado com AES-256-GCM antes de ser gravado no GitHub.
// O arquivo que fica no repositório é só texto "em código" — sem estrutura de
// JSON visível, sem título, sem nada legível.
//
// Isso é criptografia "em repouso": protege o conteúdo de quem olhar o
// repositório diretamente (inclusive você, sem a chave). A chave
// (POSTS_ENCRYPTION_KEY) mora só numa variável de ambiente no servidor —
// é o servidor quem decide, com base em quem está logado e na visibilidade
// do post, se descriptografa e mostra o conteúdo ou não.
// -----------------------------------------------------------------------------

function getKey(): Buffer {
  const key = Buffer.from(env.POSTS_ENCRYPTION_KEY, "base64");
  if (key.length !== 32) {
    throw new Error(
      "POSTS_ENCRYPTION_KEY precisa decodificar para exatamente 32 bytes (base64 de 32 bytes aleatórios)."
    );
  }
  return key;
}

const ALGO = "aes-256-gcm";

/** Criptografa um texto (normalmente um JSON.stringify) e devolve bytes prontos para gravar. */
function encryptBuffer(plaintext: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // layout: [12 bytes IV][16 bytes auth tag][ciphertext]
  return Buffer.concat([iv, authTag, ciphertext]);
}

function decryptBuffer(payload: Buffer): string {
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // Base32 (RFC 4648, sem padding)

function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += CODE_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += CODE_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text) {
    const idx = CODE_ALPHABET.indexOf(char);
    if (idx === -1) continue; // ignora espaços/quebras de linha
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Agrupa a string em blocos "A34532J AR354J32NF ..." só por legibilidade/estética. */
function formatAsCode(raw: string): string {
  const groups: string[] = [];
  let i = 0;
  let groupSize = 6;
  while (i < raw.length) {
    groups.push(raw.slice(i, i + groupSize));
    i += groupSize;
    groupSize = groupSize === 6 ? 8 : 6; // alterna tamanhos, só estética
  }
  return groups.join(" ");
}

/**
 * Criptografa um valor qualquer (será serializado em JSON) e devolve uma
 * string "em código" pronta para virar o conteúdo de um arquivo no GitHub.
 */
export function encryptToCode(value: unknown): string {
  const plaintext = JSON.stringify(value);
  const payload = encryptBuffer(plaintext);
  return formatAsCode(toBase32(payload));
}

/** Reverte encryptToCode: recebe o texto "em código" e devolve o valor original. */
export function decryptFromCode<T>(code: string): T {
  const payload = fromBase32(code);
  const plaintext = decryptBuffer(payload);
  return JSON.parse(plaintext) as T;
}
