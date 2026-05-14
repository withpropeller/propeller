import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import { createHighlighter, type Highlighter } from "shiki";
import { getDoc, listDocs } from "@/lib/docs";
import { DocsPage } from "@/components/docs/page";
import { mdxComponents } from "@/components/docs/mdx";
import { propellerDark } from "@/lib/shiki-theme";

// Shiki's bundle-aware loader can't look up custom themes by name. We
// pre-create a highlighter with the theme + every language we use across
// the docs and hand it to rehype-pretty-code via getHighlighter.
let _highlighter: Highlighter | undefined;
async function getHighlighter() {
  if (!_highlighter) {
    _highlighter = await createHighlighter({
      themes: [propellerDark],
      langs: [
        "bash", "shell", "sh", "console",
        "json", "yaml", "toml", "diff",
        "python", "javascript", "typescript", "tsx", "jsx",
        "go", "rust", "zig", "c", "cpp", "java", "ruby", "php", "sql",
        "html", "css", "markdown", "mdx", "plaintext",
      ],
    });
  }
  return _highlighter;
}

const prettyCodeOptions = {
  theme: "propeller-dark",
  keepBackground: false,
  defaultLang: "plaintext",
  bypassInlineCode: true,
  getHighlighter,
} as const;

export function generateStaticParams(): { slug?: string[] }[] {
  return listDocs().map((d) => ({ slug: d.slug.length ? d.slug : undefined }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return {};
  return {
    title: doc.fm.title,
    description: typeof doc.fm.lede === "string" ? doc.fm.lede : undefined,
  };
}

export default async function DocsCatchAll({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const doc = getDoc(slug);
  if (!doc) return notFound();
  const crumbs = doc.fm.crumbs ?? deriveCrumbs(doc.slug, doc.fm.title);

  return (
    <DocsPage
      crumbs={crumbs}
      title={doc.fm.title}
      lede={doc.fm.lede}
      toc={doc.fm.toc ?? []}
      lastUpdated={doc.fm.last_updated}
    >
      <MDXRemote
        source={doc.body}
        components={mdxComponents}
        options={{
          mdxOptions: {
            format: "mdx",
            remarkPlugins: [remarkGfm],
            rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
          },
          blockJS: false,
        }}
      />
    </DocsPage>
  );
}

function deriveCrumbs(slug: string[], title: string) {
  if (slug.length === 0) return [{ label: "Docs" }, { label: title }];
  const sectionLabels: Record<string, string> = {
    concepts: "Concepts",
    api: "API reference",
    guides: "Guides",
    ops: "Operations",
  };
  const out: { label: string; href?: string }[] = [{ label: "Docs", href: "/" }];
  if (slug.length > 1 && sectionLabels[slug[0]]) {
    out.push({ label: sectionLabels[slug[0]] });
  } else {
    out.push({ label: "Get started" });
  }
  out.push({ label: title });
  return out;
}
