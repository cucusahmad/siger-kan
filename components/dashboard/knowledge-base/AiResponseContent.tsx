import type { ReactNode } from "react";

interface AiResponseContentProps {
  readonly content: string;
}

const inlinePattern = /(`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|(?<!\*)\*[^*\n]+\*(?!\*)|(?<!_)_[^_\n]+_(?!_))/g;
const safeLinkPattern = /^(https?:\/\/|mailto:)/i;

function normalizeHtmlLists(content: string): string {
  return content
    .replace(/<ul(?:\s[^>]*)?>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<li(?:\s[^>]*)?>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n")
    .trim();
}

function renderInline(content: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(inlinePattern)) {
    const index = match.index;
    const token = match[0];
    if (index > lastIndex) nodes.push(content.slice(lastIndex, index));

    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("`")) {
      nodes.push(<code key={key} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[.9em] text-navy">{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const closingBracket = token.lastIndexOf("](");
      const label = token.slice(1, closingBracket);
      const href = token.slice(closingBracket + 2, -1);
      nodes.push(safeLinkPattern.test(href)
        ? <a key={key} href={href} target="_blank" rel="noreferrer noopener" className="font-medium text-ocean underline decoration-aqua/50 underline-offset-2 hover:text-navy">{label}</a>
        : <span key={key}>{label}</span>);
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={key} className="font-bold text-navy">{renderInline(token.slice(2, -2), `${key}-strong`)}</strong>);
    } else {
      nodes.push(<em key={key}>{renderInline(token.slice(1, -1), `${key}-em`)}</em>);
    }
    lastIndex = index + token.length;
  }

  if (lastIndex < content.length) nodes.push(content.slice(lastIndex));
  return nodes;
}

function splitTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isBlockStart(lines: readonly string[], index: number): boolean {
  const line = lines[index]?.trim() ?? "";
  const nextLine = lines[index + 1]?.trim() ?? "";
  return !line || /^#{1,6}\s+/.test(line) || /^```/.test(line) || /^>\s?/.test(line)
    || /^([-*_])(?:\s*\1){2,}$/.test(line) || /^[-+*]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
    || (line.includes("|") && isTableDivider(nextLine));
}

export function AiResponseContent({ content }: AiResponseContentProps) {
  const lines = normalizeHtmlLists(content).replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) { index += 1; continue; }

    const fence = trimmed.match(/^```([\w+-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index].trim())) { code.push(lines[index]); index += 1; }
      if (index < lines.length) index += 1;
      blocks.push(<div key={`code-${index}`} className="my-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        {fence[1] && <div className="border-b border-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{fence[1]}</div>}
        <pre className="overflow-x-auto p-4 text-xs leading-5 text-slate-100"><code>{code.join("\n")}</code></pre>
      </div>);
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) { rows.push(splitTableRow(lines[index])); index += 1; }
      blocks.push(<div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead className="bg-seafoam/60"><tr>{headers.map((header, cellIndex) => <th key={`head-${cellIndex}`} scope="col" className="border-b border-slate-200 px-3 py-2.5 font-bold text-navy">{renderInline(header, `head-${index}-${cellIndex}`)}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`} className="align-top even:bg-slate-50/60">{headers.map((_, cellIndex) => <td key={`cell-${cellIndex}`} className="px-3 py-2.5 text-ink">{renderInline(row[cellIndex] ?? "", `cell-${index}-${rowIndex}-${cellIndex}`)}</td>)}</tr>)}</tbody>
        </table>
      </div>);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const className = level <= 2 ? "mt-4 text-base font-bold text-navy" : "mt-3 text-sm font-bold text-navy";
      blocks.push(<h3 key={`heading-${index}`} className={className}>{renderInline(heading[2], `heading-${index}`)}</h3>);
      index += 1;
      continue;
    }

    if (/^([-*_])(?:\s*\1){2,}$/.test(trimmed)) {
      blocks.push(<hr key={`rule-${index}`} className="my-4 border-slate-200" />);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index].trim())) { quote.push(lines[index].trim().replace(/^>\s?/, "")); index += 1; }
      blocks.push(<blockquote key={`quote-${index}`} className="my-3 border-l-4 border-aqua bg-seafoam/35 px-4 py-3 text-muted">{renderInline(quote.join(" "), `quote-${index}`)}</blockquote>);
      continue;
    }

    const unordered = /^[-+*]\s+/.test(trimmed);
    const ordered = /^\d+[.)]\s+/.test(trimmed);
    if (unordered || ordered) {
      const items: string[] = [];
      const itemPattern = unordered ? /^[-+*]\s+(.+)$/ : /^\d+[.)]\s+(.+)$/;
      while (index < lines.length) {
        const item = lines[index].trim().match(itemPattern);
        if (!item) break;
        items.push(item[1]); index += 1;
      }
      const children = items.map((item, itemIndex) => <li key={`item-${itemIndex}`} className="pl-1">{renderInline(item, `item-${index}-${itemIndex}`)}</li>);
      blocks.push(ordered
        ? <ol key={`list-${index}`} className="my-2 ml-5 list-decimal space-y-1 marker:font-semibold marker:text-ocean">{children}</ol>
        : <ul key={`list-${index}`} className="my-2 ml-5 list-disc space-y-1 marker:text-ocean">{children}</ul>);
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push(<p key={`paragraph-${index}`} className="my-2 leading-6">{paragraph.map((part, partIndex) => <span key={`line-${partIndex}`}>{partIndex > 0 && <br />}{renderInline(part, `paragraph-${index}-${partIndex}`)}</span>)}</p>);
  }

  return <div className="min-w-0 first:[&>*]:mt-0 last:[&>*]:mb-0">{blocks}</div>;
}
