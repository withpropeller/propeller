"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

const COLOR = {
  com: "#646A71",
  str: "#C7CBD1",
  key: "#8EA9FA",
  kw:  "#8EA9FA",
  fn:  "#73A9F4",
  text: "#D7DADF",
};

type Lang = string;

export type CodeSnippet = { lang: Lang; code: string };

export function CodeBlock({ snippets }: { snippets: CodeSnippet[] }) {
  const [active, setActive] = useState<Lang>(snippets[0].lang);
  const snippet = snippets.find((s) => s.lang === active) ?? snippets[0];

  return (
    <div className="rounded-3 overflow-hidden bg-ink border border-ink-2 shadow-elev-2 my-6">
      <div className="flex items-center justify-between bg-ink border-b border-ink-2 px-3">
        <div className="flex gap-0.5">
          {snippets.map((s) => (
            <button
              key={s.lang}
              onClick={() => setActive(s.lang)}
              className={`relative px-3.5 py-2.5 font-mono text-12 cursor-pointer bg-transparent border-0 transition-colors ${
                active === s.lang ? "text-[#F2F1EC]" : "text-[#908F86] hover:text-[#C9C8C0]"
              }`}
            >
              {s.lang}
              {active === s.lang && (
                <span aria-hidden className="absolute left-2 right-2 -bottom-px h-[3px] rounded-t-sm bg-brand" />
              )}
            </button>
          ))}
        </div>
        <CopyButton text={snippet.code} />
      </div>
      <pre className="bg-transparent border-0 m-0 p-5 text-13 leading-[1.7] overflow-x-auto font-mono"
           style={{ color: COLOR.text }}>
        {highlight(snippet.code, snippet.lang)}
      </pre>
    </div>
  );
}

function highlight(code: string, lang: Lang): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = code.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) out.push("\n");
    out.push(...highlightLine(line, lang, `${li}`));
  });
  return out;
}

const KEYWORDS: Record<string, RegExp | undefined> = {
  curl:   /\b(curl)\b/g,
  python: /\b(from|import|def|return|class|for|in|if|else|elif|with|as|None|True|False|print)\b/g,
  node:   /\b(import|from|const|let|var|await|async|new|return|function|export|console|process)\b/g,
  go:     /\b(package|import|func|var|const|return|if|else|for|range|struct|type|map|chan|nil|true|false)\b/g,
  zig:    /\b(const|var|try|defer|pub|fn|return|if|else|for|while|switch|void|@import)\b/g,
};

function highlightLine(line: string, lang: Lang, kBase: string): React.ReactNode[] {
  const trimmed = line.trimStart();
  const commentStart =
    (lang === "curl" || lang === "python") ? "#"
    : (lang === "node" || lang === "go" || lang === "zig") ? "//"
    : null;
  if (commentStart && trimmed.startsWith(commentStart)) {
    return [<span key={kBase} style={{ color: COLOR.com, fontStyle: "italic" }}>{line}</span>];
  }

  const parts: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(...tokenizePlain(line.slice(last, m.index), lang, `${kBase}-p${i}`));
    const isJsonKey = lang === "curl" && line.slice(m.index + m[0].length).trimStart().startsWith(":");
    parts.push(<span key={`${kBase}-s${i}`} style={{ color: isJsonKey ? COLOR.key : COLOR.str }}>{m[0]}</span>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < line.length) parts.push(...tokenizePlain(line.slice(last), lang, `${kBase}-pE`));
  return parts;
}

function tokenizePlain(text: string, lang: Lang, kBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = KEYWORDS[lang];
  if (!re) {
    out.push(<span key={`${kBase}-t`} style={{ color: COLOR.text }}>{text}</span>);
    return out;
  }
  re.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={`${kBase}-t${i}`} style={{ color: COLOR.text }}>{text.slice(last, m.index)}</span>);
    out.push(<span key={`${kBase}-k${i}`} style={{ color: COLOR.kw }}>{m[0]}</span>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(<span key={`${kBase}-tE`} style={{ color: COLOR.text }}>{text.slice(last)}</span>);
  return out;
}
