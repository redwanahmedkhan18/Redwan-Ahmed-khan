import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmptyState, PageHeader, Tag } from "@/components/ui";
import { getBlogPosts } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({ path: "/blog" });

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <>
      <PageHeader
        kicker="Writing"
        title="Technical writing"
        description="Notes on AI, machine learning, NLP, LLMs, RAG, software engineering and research — written to demonstrate engineering and research thinking."
      />
      <Container className="py-12 sm:py-16">
        {posts.length === 0 ? (
          <EmptyState
            title="No articles published yet."
            hint="Technical articles will appear here once published from the admin CMS."
          />
        ) : (
          <div className="space-y-10">
            {categories.length > 1 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Categories">
                {categories.map((c) => <li key={c}><Tag>{c}</Tag></li>)}
              </ul>
            )}
            <ul className="grid gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <article className="group flex h-full flex-col rounded-xl border border-line bg-panel p-5 transition-colors hover:border-line-strong sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                      {post.category && <span className="text-accent-fg">{post.category}</span>}
                      {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
                      {post.reading_time_minutes && <span>{post.reading_time_minutes} min read</span>}
                    </div>
                    <h2 className="mt-2 text-lg font-bold leading-snug tracking-tight">
                      <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-accent-fg">{post.title}</Link>
                    </h2>
                    {post.excerpt && <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>}
                    {post.tags.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                        {post.tags.slice(0, 5).map((t) => <li key={t}><Tag>{t}</Tag></li>)}
                      </ul>
                    )}
                  </article>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </>
  );
}
