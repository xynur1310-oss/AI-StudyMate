import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Normalizes ASCII math expressions (e.g., "x^2", "2x^2 - 4x - 3", "(g o f)(x)", "f(x) = x + 2")
 * into LaTeX syntax if not already enclosed in delimiters.
 */
function toLatexSnippet(text: string): string {
  let s = text.trim();
  // If already delimited by $...$ or $$...$$, strip them
  if ((s.startsWith('$$') && s.endsWith('$$')) || (s.startsWith('$') && s.endsWith('$'))) {
    s = s.replace(/^\$\$?/, '').replace(/\$\$?$/, '').trim();
  }

  // Common replacements for neat rendering
  // Replace composite function notation: (g o f)(x) or (g ○ f)(x) -> (g \circ f)(x)
  s = s.replace(/\(\s*([a-zA-Z])\s*[oO○]\s*([a-zA-Z])\s*\)/g, '($1 \\circ $2)');
  // Replace * with \cdot
  s = s.replace(/\s*\*\s*/g, ' \\cdot ');
  // Replace <= and >=
  s = s.replace(/<=/g, ' \\le ').replace(/>=/g, ' \\ge ');
  // Replace !=
  s = s.replace(/!=/g, ' \\ne ');
  // Replace sqrt(...) with \sqrt{...}
  s = s.replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');
  // Replace fractions like (a)/(b) when obvious
  s = s.replace(/\\?frac\{([^}]+)\}\{([^}]+)\}/g, '\\frac{$1}{$2}');
  // Handle derivatives like (u / v)' or f'(x)
  s = s.replace(/'/g, "'");

  return s;
}

/**
 * Checks if a string segment is purely a math expression (e.g. "f(x) = x^2 - 5x + 6", "2x^2 - 4x - 3", "(2, 0) dan (3, 0)")
 * Strictly returns false if it contains regular descriptive Indonesian words to avoid squishing sentences into KaTeX.
 */
function isPureMath(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Words that indicate natural language, not a standalone formula
  const naturalLanguageWord = /\b(adalah|jika|maka|tentukan|hitung|pilih|titik|potong|terhadap|sumbu|fungsi|kuadrat|grafik|dari|nilai|akar|persamaan|penyelesaian|langkah|dengan|pada|untuk|sehingga|diperoleh|karena|misalkan|substitusi|faktorkan|faktorisasi|hasil|koefisien|koordinat)\b/i;
  if (naturalLanguageWord.test(trimmed)) {
    return false;
  }

  // Pure coordinate pair format: (a, b) or (a, b) dan (c, d)
  if (/^\(?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)?(?:\s+dan\s+\(?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\))?$/.test(trimmed)) {
    return false; // Render coordinates as nicely spaced regular text/inline numbers to preserve "dan" and spaces!
  }

  // Has LaTeX symbols
  if (/^\\(frac|sqrt|pm|le|ge|ne|cdot|circ|times|div)/.test(trimmed)) return true;

  // Formula patterns like "f(x) = ...", "g(x) = ...", "y = ...", "x^2 - 5x + 6 = 0"
  if (/^[a-zA-Z](?:\([a-zA-Z]\))?\s*=\s*[0-9a-zA-Z+\-*/^()\s.]+$/.test(trimmed) && /[+\-*/^=]/.test(trimmed)) {
    return true;
  }

  // Pure algebraic expression: "2x^2 - 4x - 3" or "x^2 + 2x - 3" or "(x - 2)(x - 3)"
  if (/^[-+]?[0-9a-zA-Z^()\s*/+-]+$/.test(trimmed) && /[+\-*/^]/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && !/\s{2,}/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Splits a mixed text into alternating natural language and math segments
 */
function parseMixedContent(content: string): Array<{ type: 'text' | 'math' | 'latex'; value: string; display?: boolean }> {
  if (!content) return [];

  // 1. If explicit LaTeX delimiters ($...$ or $$...$$) exist
  if (/\$[^$]+\$|\$\$[\s\S]+?\$\$/.test(content)) {
    const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
    const tokens: Array<{ type: 'text' | 'math' | 'latex'; value: string; display?: boolean }> = [];
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('$$') && part.endsWith('$$')) {
        tokens.push({ type: 'latex', value: part.slice(2, -2).trim(), display: true });
      } else if (part.startsWith('$') && part.endsWith('$')) {
        tokens.push({ type: 'latex', value: part.slice(1, -1).trim(), display: false });
      } else {
        tokens.push({ type: 'text', value: part });
      }
    }
    return tokens;
  }

  // 2. If the whole text is a pure math formula
  if (isPureMath(content)) {
    return [{ type: 'math', value: content, display: false }];
  }

  // 3. Mixed Indonesian text with inline formulas like:
  // "Tentukan titik potong terhadap sumbu x dari fungsi kuadrat f(x) = x^2 - 5x + 6."
  // We extract formulas like `f(x) = x^2 - 5x + 6`, `x^2 - 5x + 6 = 0`, `f(x) = 0`, `(x - 2)(x - 3) = 0`, `x = 2`, `x = 3`
  const formulaRegex = /\b([a-zA-Z]\([a-zA-Z]\)\s*=\s*[-+0-9a-zA-Z^()\s*/]+|[a-zA-Z]\^[0-9a-zA-Z]+(?:\s*[-+*]\s*[-+0-9a-zA-Z^.]+)*(?:\s*=\s*[-+0-9a-zA-Z^.]+)?|[a-zA-Z]\s*=\s*[-+0-9a-zA-Z]+|\([a-zA-Z]\s*[-+]\s*\d+\)\s*\([a-zA-Z]\s*[-+]\s*\d+\)(?:\s*=\s*0)?)\b/g;

  const tokens: Array<{ type: 'text' | 'math' | 'latex'; value: string; display?: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = formulaRegex.exec(content)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    if (matchStart > lastIndex) {
      tokens.push({ type: 'text', value: content.substring(lastIndex, matchStart) });
    }

    const matchedFormula = match[0].trim();
    if (isPureMath(matchedFormula)) {
      tokens.push({ type: 'math', value: matchedFormula, display: false });
    } else {
      tokens.push({ type: 'text', value: match[0] });
    }

    lastIndex = matchEnd;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: 'text', value: content.substring(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: content }];
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  const tokens = parseMixedContent(content);

  // If simple text with no special tokens, render clean text
  if (tokens.length === 1 && tokens[0].type === 'text') {
    return <span className={`break-words whitespace-normal leading-relaxed ${className}`}>{tokens[0].value}</span>;
  }

  return (
    <span className={`inline-math-container max-w-full break-words whitespace-normal leading-relaxed ${className}`}>
      {tokens.map((token, idx) => {
        if (token.type === 'latex') {
          try {
            const html = katex.renderToString(token.value, {
              displayMode: token.display,
              throwOnError: false,
            });
            if (token.display) {
              return (
                <div
                  key={idx}
                  className="my-2 max-w-full overflow-x-auto py-1 text-center"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            }
            return (
              <span
                key={idx}
                className="inline-block max-w-full overflow-x-auto align-middle px-1"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={idx} className="font-mono text-indigo-700 px-1">{token.value}</span>;
          }
        }

        if (token.type === 'math') {
          try {
            const latex = toLatexSnippet(token.value);
            const html = katex.renderToString(latex, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="inline-block max-w-full overflow-x-auto align-middle px-1 text-indigo-950 font-medium"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={idx} className="font-mono text-indigo-900 px-1">{token.value}</span>;
          }
        }

        // Natural text segment - preserve spaces, allow normal line wraps
        return (
          <span key={idx} className="whitespace-normal break-words">
            {token.value}
          </span>
        );
      })}
    </span>
  );
};

/**
 * Splits an explanation block into individual vertical steps, even if provided
 * as a single wall of text (e.g., "1. ... 2. ...", "Langkah 1: ... Langkah 2: ...")
 */
function splitExplanationSteps(raw: string): string[] {
  if (!raw) return [];
  const clean = raw.trim();

  // If already separated by newlines
  if (clean.includes('\n')) {
    const rawLines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    // Flatten if lines contain embedded "1. ... 2. ..."
    const result: string[] = [];
    for (const line of rawLines) {
      if (/(?:^|\s+)(?:[2-9]|\d{2,})\.\s+/.test(line)) {
        const sub = line.split(/(?=(?:^|\s+)\d+\.\s+)/).map(s => s.trim()).filter(Boolean);
        result.push(...sub);
      } else {
        result.push(line);
      }
    }
    return result;
  }

  // If single line with numbered steps: "1. Tentukan ... 2. Faktorkan ... 3. Cari ... Jadi ..."
  if (/(?:^|\s+)\d+\.\s+/.test(clean)) {
    const steps = clean.split(/(?=(?:^|\s+)\d+\.\s+)/).map(s => s.trim()).filter(Boolean);
    if (steps.length > 1) return steps;
  }

  // If single line with "Langkah 1: ... Langkah 2: ..."
  if (/Langkah\s+\d+:/i.test(clean)) {
    const steps = clean.split(/(?=Langkah\s+\d+:)/i).map(s => s.trim()).filter(Boolean);
    if (steps.length > 1) return steps;
  }

  // If single line with "Step 1: ... Step 2: ..."
  if (/Step\s+\d+:/i.test(clean)) {
    const steps = clean.split(/(?=Step\s+\d+:)/i).map(s => s.trim()).filter(Boolean);
    if (steps.length > 1) return steps;
  }

  // Split by periods followed by capital letters if very long
  if (clean.length > 160 && clean.includes('. ')) {
    const sentences = clean.split(/(?<=\.)\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
    if (sentences.length > 1) return sentences;
  }

  return [clean];
}

/**
 * Structured display for calculation steps and explanation:
 * Strictly vertically stacked, numbered step badges, full-width responsive cards,
 * with no horizontal stretching or squished text.
 */
export const StructuredExplanation: React.FC<{ explanation: string; className?: string }> = ({
  explanation,
  className = '',
}) => {
  if (!explanation) return null;

  const steps = splitExplanationSteps(explanation);

  return (
    <div className={`w-full max-w-full min-w-0 space-y-3 text-xs sm:text-sm leading-relaxed text-slate-700 ${className}`}>
      {steps.map((step, idx) => {
        const trimmed = step.trim();

        // Check if header line like "Langkah Penyelesaian:", "Konsep Kunci:", "Kesimpulan:"
        const isHeader = /^(langkah\s*penyelesaian|konsep|rumus|penyelesaian|kesimpulan|ringkasan|catatan|diketahui|ditanya|jawab):/i.test(trimmed);

        if (isHeader) {
          return (
            <div
              key={idx}
              className="pt-2 font-bold text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              <div className="flex-1 min-w-0 break-words whitespace-normal">
                <MathRenderer content={trimmed} />
              </div>
            </div>
          );
        }

        // Check if step is a conclusion / final answer: "Jadi, ...", "Kesimpulan: ..."
        const isConclusion = /^(jadi|maka|kesimpulan|dengan demikian|hasil akhir)/i.test(trimmed);

        if (isConclusion) {
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 font-medium flex items-start gap-3 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                ★
              </div>
              <div className="flex-1 min-w-0 break-words whitespace-normal leading-relaxed">
                <MathRenderer content={trimmed} />
              </div>
            </div>
          );
        }

        // Regular numbered or bullet step
        const stepNumMatch = trimmed.match(/^(\d+)\.\s+/);
        const stepNum = stepNumMatch ? stepNumMatch[1] : String(idx + 1);
        const stepText = trimmed.replace(/^(\d+\.|\-|\*|\•|Langkah\s+\d+:?|Step\s+\d+:?)\s*/i, '');

        return (
          <div
            key={idx}
            className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors flex items-start gap-3 shadow-2xs w-full min-w-0"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
              {stepNum}
            </div>
            <div className="flex-1 min-w-0 break-words whitespace-normal leading-relaxed text-slate-800">
              <MathRenderer content={stepText} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
