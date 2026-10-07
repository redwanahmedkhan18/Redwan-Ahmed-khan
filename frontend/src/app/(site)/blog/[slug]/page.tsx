import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "@/components/Markdown";
import { ActionLink, Container, Tag } from "@/components/ui";
import { ApiError, getBlogPost, getBlogPosts, getSeoOverrides } from "@/lib/api";
import { formatDate, readingTime } from "@/lib/format";
import { articleJsonLd, buildMetadata, findSeoOverride } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getBlogPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getBlogPost(slug);
    const overrides = await getSeoOverrides();
    return buildMetadata({
      path: `/blog/${slug}`,
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      override: findSeoOverride(overrides, `/blog/${slug}`),
      type: "article",
      publishedTime: post.published_at,
    });
  } catch {
    return buildMetadata({ path: `/blog/${slug}`, title: "Article" });
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post;
  try {
    post = await getBlogPost(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const minutes = post.reading_time_minutes ?? readingTime(post.content_markdown);

  return (
    <>
      <JsonLd data={articleJsonLd(post)} />
      <article>
        <div className="border-b border-line bg-panel">
          <Container className="py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-wider text-faint">
              <Link href="/blog" className="hover:text-accent-fg">Writing</Link> <span aria-hidden="true">/</span> {post.slug}
            </nav>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-faint">
              <span>{post.author_name}</span>
              {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
              <span>{minutes} min read</span>
              {post.category && <span className="text-accent-fg">{post.category}</span>}
            </div>
            {post.excerpt && <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-muted">{post.excerpt}</p>}
          </Container>
        </div>

        <Container className="py-12 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
            <div className="min-w-0">
              {post.content_markdown ? (
                <Markdown content={post.content_markdown} />
              ) : (
                <p className="text-sm text-faint">Article content is not available.</p>
              )}
            </div>
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {post.tags.length > 0 && (
                <div className="rounded-xl border border-line bg-panel p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">Tags</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((t) => <li key={t}><Tag>{t}</Tag></li>)}
                  </ul>
                </div>
              )}
              {post.references.length > 0 && (
                <div className="rounded-xl border border-line bg-panel p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">References</p>
                  <ul className="mt-3 space-y-2">
                    {post.references.map((r, i) => (
                      <li key={i} className="text-[13px] break-all">
                        {/^https?:\/\//.test(r) ? (
                          <a href={r} target="_blank" rel="noopener noreferrer" className="text-accent-fg underline-offset-4 hover:underline">{r}</a>
                        ) : r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {post.github_url && (
                <div className="rounded-xl border border-line bg-panel p-5">
                  <ActionLink href={post.github_url}>Code on GitHub</ActionLink>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </article>
    </>
  );
}
