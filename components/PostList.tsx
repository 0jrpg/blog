"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPostList } from "../lib/posts";
import { formatDate, formatDateShort } from "../lib/format";
import type { PostMeta } from "../types";
import StatusPanel from "./StatusPanel";

export default function PostList() {
  const [posts, setPosts] = useState<PostMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPostList()
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Erro desconhecido");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="glass hero">
        <h1>Ideias em constante refração.</h1>
        <p>
          Um blog sem banco de dados: cada texto é um arquivo na pasta{" "}
          <code>posts/</code> deste repositório. Publique um <code>.json</code>{" "}
          novo e ele aparece aqui — sem rebuild.
        </p>
      </section>

      {error && (
        <StatusPanel
          kind="error"
          title="Não foi possível carregar os posts"
          detail={error}
        />
      )}

      {!error && posts === null && (
        <StatusPanel kind="loading" title="Carregando posts do GitHub…" />
      )}

      {!error && posts && posts.length === 0 && (
        <StatusPanel
          kind="empty"
          title="Ainda não há posts"
          detail="Adicione um arquivo em posts/ e liste-o em posts/index.json."
        />
      )}

      {!error && posts && posts.length > 0 && (
        <>
          <Link href={`/post/${posts[0].slug}`} className="glass glass--interactive featured">
            <span className="eyebrow">post mais recente</span>
            <h2>{posts[0].title}</h2>
            <p className="excerpt">{posts[0].excerpt}</p>
            <p className="meta">{formatDate(posts[0].date)}</p>
          </Link>

          {posts.length > 1 && (
            <div className="glass post-list" style={{ padding: "8px 30px" }}>
              {posts.slice(1).map((post) => (
                <Link key={post.slug} href={`/post/${post.slug}`} className="post-row">
                  <div className="post-row-top">
                    <h3>{post.title}</h3>
                    <time dateTime={post.date}>{formatDateShort(post.date)}</time>
                  </div>
                  <p className="excerpt">{post.excerpt}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="tags">
                      {post.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
