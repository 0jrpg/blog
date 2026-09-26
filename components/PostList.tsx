"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicPostList } from "../lib/posts";
import { formatDate, formatDateShort } from "../lib/format";
import type { PostIndexEntry } from "../types";
import StatusPanel from "./StatusPanel";

export default function PostList() {
  const [posts, setPosts] = useState<PostIndexEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicPostList()
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
          Um blog com posts públicos, só-com-link e privados — escritos pela
          interface e guardados criptografados no GitHub.
        </p>
      </section>

      {error && (
        <StatusPanel kind="error" title="Não foi possível carregar os posts" detail={error} />
      )}

      {!error && posts === null && (
        <StatusPanel kind="loading" title="Carregando posts…" />
      )}

      {!error && posts && posts.length === 0 && (
        <StatusPanel
          kind="empty"
          title="Ainda não há posts públicos"
          detail="Entre e use 'Novo post' para publicar o primeiro."
        />
      )}

      {!error && posts && posts.length > 0 && (
        <>
          <Link
            href={`/post/${posts[0].slug}`}
            className={`glass glass--interactive featured theme-${posts[0].theme}`}
          >
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
                  {post.tags.length > 0 && (
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
