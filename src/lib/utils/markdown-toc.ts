export interface Heading {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split("\n");
  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_`#]/g, "");
      let id = slugify(text);
      let suffix = 1;
      const baseId = id;
      while (seen.has(id)) {
        id = `${baseId}-${suffix++}`;
      }
      seen.add(id);
      headings.push({ level, text, id });
    }
  }

  return headings;
}
