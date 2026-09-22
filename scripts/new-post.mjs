// Uso: npm run new-post -- "Título do post" "Um resumo curto" tag1,tag2
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "..", "posts");
const indexPath = path.join(postsDir, "index.json");

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function main() {
  const [title, excerpt = "", tagsArg = ""] = process.argv.slice(2);

  if (!title) {
    console.error('Uso: npm run new-post -- "Título do post" "Resumo curto" tag1,tag2');
    process.exit(1);
  }

  const slug = slugify(title);
  const date = new Date().toISOString().slice(0, 10);
  const tags = tagsArg ? tagsArg.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const postPath = path.join(postsDir, `${slug}.json`);
  const post = {
    slug,
    title,
    date,
    excerpt: excerpt || "Escreva um resumo curto aqui.",
    tags,
    content: ["Escreva o conteúdo deste post aqui. Cada string do array vira um parágrafo."],
  };

  await writeFile(postPath, JSON.stringify(post, null, 2) + "\n", "utf8");

  const indexRaw = await readFile(indexPath, "utf8");
  const index = JSON.parse(indexRaw);
  index.posts.unshift({ slug, title, date, excerpt: post.excerpt, tags });
  await writeFile(indexPath, JSON.stringify(index, null, 2) + "\n", "utf8");

  console.log(`Post criado em posts/${slug}.json e adicionado ao índice.`);
  console.log(`Edite o conteúdo e depois: git add posts/ && git commit -m "novo post: ${title}" && git push`);
}

main();
