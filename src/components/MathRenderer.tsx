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
    s = s.replace(/^\$\$?/, '').replace(/\$\$?$/, '');
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
 * Checks if a string segment is likely a math expression
 */
function isMathSegment(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;

  // Has LaTeX symbols
  if (/[\\_^{}=]|\\circ|\\frac|\\sqrt|\\pm|\\le|\\ge|\\ne|\\cdot/.test(trimmed)) {
    return true;
  }
  // Formula shapes like "f(x) = ...", "g(x) = ...", "2x^2", "x²", "ax + b"
  if (/^[a-zA-Z]\([a-zA-Z]\)\s*=/.test(trimmed)) return true;
  if (/\b\d*[a-zA-Z]\^[-0-9a-zA-Z]/.test(trimmed)) return true;
  if (/[²³⁴⁵⁶⁷⁸⁹⁺⁻]/.test(trimmed)) return true;
  if (/^[0-9a-zA-Z+\-*/^()\s=.,]+$/.test(trimmed) && /[+\-*/^=]/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && !/\b(dan|atau|adalah|jika|maka|tentukan|hitung|pilih|benar|salah)\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  // Check if content contains explicit LaTeX delimiters ($...$ or $$...$$)
  const hasDelimiters = /\$([^$]+)\$|\$\$([^$]+)\$\$/.test(content);

  if (hasDelimiters) {
    // Split by $...$ or $$...$$
    const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);

    return (
      <span className={`inline-math-container max-w-full overflow-x-auto ${className}`}>
        {parts.map((part, idx) => {
          if (!part) return null;
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const math = part.slice(2, -2).trim();
            try {
              const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
              return (
                <div
                  key={idx}
                  className="my-2 max-w-full overflow-x-auto py-1 text-center"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return <span key={idx} className="font-mono text-indigo-700">{part}</span>;
            }
          } else if (part.startsWith('$') && part.endsWith('$')) {
            const math = part.slice(1, -1).trim();
            try {
              const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
              return (
                <span
                  key={idx}
                  className="inline-block max-w-full overflow-x-auto align-middle"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return <span key={idx} className="font-mono text-indigo-700">{part}</span>;
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </span>
    );
  }

  // If entire content appears to be a pure formula (e.g. in option card "2x^2 - 4x - 3" or "g(x) = 2x^2 - 4x - 3")
  if (isMathSegment(content)) {
    try {
      const latex = toLatexSnippet(content);
      const html = katex.renderToString(latex, { displayMode: !inline && content.length > 35, throwOnError: false });
      return (
        <span
          className={`inline-block max-w-full overflow-x-auto align-middle ${className}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      // Fallback to formatted unicode
      return <span className={`font-mono ${className}`}>{content}</span>;
    }
  }

  // Plain text fallback (safe string)
  return <span className={className}>{content}</span>;
};

/**
 * Structured display for calculation steps and explanation
 */
export const StructuredExplanation: React.FC<{ explanation: string; className?: string }> = ({
  explanation,
  className = '',
}) => {
  if (!explanation) return null;

  // Split lines
  const lines = explanation.split('\n').filter(l => l.trim().length > 0);

  return (
    <div className={`space-y-2.5 text-sm leading-relaxed text-slate-700 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Check if line is a header like "Langkah Penyelesaian:" or "Konsep:" or "Kesimpulan:"
        const isHeader = /^(langkah|konsep|rumus|penyelesaian|kesimpulan|ringkasan|catatan|diketahui|ditanya|jawab):/i.test(trimmed);

        if (isHeader) {
          return (
            <div key={idx} className="pt-1.5 font-semibold text-slate-900 border-b border-slate-100 pb-1">
              <MathRenderer content={trimmed} />
            </div>
          );
        }

        // Check if line is a step (e.g., "1. ...", "- ...", "Misalkan ...")
        const isStep = /^(\d+\.|\-|\*|\•)\s+/.test(trimmed);

        return (
          <div key={idx} className={`flex items-start gap-2 ${isStep ? 'pl-2' : ''}`}>
            {isStep && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            )}
            <div className="flex-1 overflow-x-auto">
              <MathRenderer content={trimmed.replace(/^(\d+\.|\-|\*|\•)\s+/, '')} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
