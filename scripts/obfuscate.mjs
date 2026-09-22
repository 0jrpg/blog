// -----------------------------------------------------------------------------
// Ofusca todos os arquivos .js gerados em dist/ após o build do Vite.
// Isso NÃO torna o código "secreto" (ele continua rodando no navegador de
// quem visita o site, então pode sempre ser inspecionado em runtime), mas
// dificulta bastante a leitura estática do bundle: nomes de variáveis
// virariam hexadecimais, strings ficam criptografadas e decodificadas em
// runtime, o fluxo de controle é embaralhado, e há proteções anti-debug.
// -----------------------------------------------------------------------------
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fg from "fast-glob";
import JavaScriptObfuscator from "javascript-obfuscator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");

const obfuscatorOptions = {
  compact: true,
  simplify: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  numbersToExpressions: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayEncoding: ["rc4"],
  stringArrayThreshold: 0.85,
  rotateStringArray: true,
  shuffleStringArray: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  selfDefending: true,
  disableConsoleOutput: true,
  debugProtection: true,
  debugProtectionInterval: 2000,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

async function main() {
  const files = await fg("assets/**/*.js", { cwd: distDir, absolute: true });

  if (files.length === 0) {
    console.warn("Nenhum arquivo .js encontrado em dist/assets. Rode `npm run build` antes.");
    return;
  }

  for (const file of files) {
    const code = await readFile(file, "utf8");
    const result = JavaScriptObfuscator.obfuscate(code, obfuscatorOptions);
    await writeFile(file, result.getObfuscatedCode(), "utf8");
    console.log(`Ofuscado: ${path.relative(distDir, file)}`);
  }

  console.log(`\n${files.length} arquivo(s) ofuscado(s) com sucesso.`);
}

main().catch((err) => {
  console.error("Falha ao ofuscar:", err);
  process.exit(1);
});
