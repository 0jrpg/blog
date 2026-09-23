import type { NextConfig } from "next";
import WebpackObfuscator from "webpack-obfuscator";

// -----------------------------------------------------------------------------
// Ofusca apenas o JavaScript que é enviado ao navegador (bundle de cliente),
// só em build de produção. O código que roda no servidor/funções da Vercel
// (isServer === true) fica de fora — não há motivo para ofuscá-lo, e nunca é
// enviado ao visitante de qualquer forma.
//
// IMPORTANTE (mesmo aviso de sempre): isso dificulta a leitura do bundle
// final, mas não é sigilo real — o navegador do visitante sempre executa (e
// pode inspecionar em runtime) esse código. Por isso NÃO habilitei
// `selfDefending`/`debugProtection`: em produção real, essas duas opções
// costumam causar mais problema do que proteção (loops de debugger,
// travamentos com o DevTools aberto), então preferi trocar essa parte da
// "proteção" por estabilidade.
// -----------------------------------------------------------------------------
const nextConfig: NextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.plugins.push(
        new WebpackObfuscator(
          {
            compact: true,
            simplify: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.5,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.3,
            numbersToExpressions: true,
            stringArray: true,
            stringArrayEncoding: ["base64"],
            stringArrayThreshold: 0.75,
            rotateStringArray: true,
            shuffleStringArray: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            identifierNamesGenerator: "hexadecimal",
            transformObjectKeys: true,
            renameGlobals: false,
            selfDefending: false,
            debugProtection: false,
            disableConsoleOutput: false,
          },
          ["**/node_modules/**/*"]
        )
      );
    }
    return config;
  },
};

export default nextConfig;
