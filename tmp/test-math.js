import fs from 'fs';

function isPureMath(str) {
  const trimmed = str.trim();
  if (!trimmed) return false;
  const naturalLanguageWord = /\b(adalah|jika|maka|tentukan|hitung|pilih|titik|potong|terhadap|sumbu|fungsi|kuadrat|grafik|dari|nilai|akar|persamaan|penyelesaian|langkah|dengan|pada|untuk|sehingga|diperoleh|karena|misalkan|substitusi|faktorkan|faktorisasi|hasil|koefisien|koordinat)\b/i;
  if (naturalLanguageWord.test(trimmed)) return false;
  if (/^\(?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)?(?:\s+dan\s+\(?\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\))?$/.test(trimmed)) return false;
  if (/^\\(frac|sqrt|pm|le|ge|ne|cdot|circ|times|div)/.test(trimmed)) return true;
  if (/^[a-zA-Z](?:\([a-zA-Z]\))?\s*=\s*[0-9a-zA-Z+\-*/^()\s.]+$/.test(trimmed) && /[+\-*/^=]/.test(trimmed)) return true;
  if (/^[-+]?[0-9a-zA-Z^()\s*/+-]+$/.test(trimmed) && /[+\-*/^]/.test(trimmed) && /[a-zA-Z]/.test(trimmed) && !/\s{2,}/.test(trimmed)) return true;
  return false;
}

function parseMixedContent(content) {
  if (!content) return [];
  if (/\$[^$]+\$|\$\$[\s\S]+?\$\$/.test(content)) {
    const parts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
    const tokens = [];
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
  if (isPureMath(content)) {
    return [{ type: 'math', value: content, display: false }];
  }
  const formulaRegex = /\b([a-zA-Z]\([a-zA-Z]\)\s*=\s*[-+0-9a-zA-Z^()\s*/]+|[a-zA-Z]\^[0-9a-zA-Z]+(?:\s*[-+*]\s*[-+0-9a-zA-Z^.]+)*(?:\s*=\s*[-+0-9a-zA-Z^.]+)?|[a-zA-Z]\s*=\s*[-+0-9a-zA-Z]+|\([a-zA-Z]\s*[-+]\s*\d+\)\s*\([a-zA-Z]\s*[-+]\s*\d+\)(?:\s*=\s*0)?)\b/g;
  const tokens = [];
  let lastIndex = 0;
  let match;
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

console.log('Test 1:', JSON.stringify(parseMixedContent('Grafik fungsi kuadrat f(x) = -x^2 + 2x + 8 memotong sumbu X di titik...')));
console.log('Test 2:', JSON.stringify(parseMixedContent('Diketahui f(x) = x + 2 dan (g o f)(x) = 2x^2 + 4x - 3. Tentukan g(x)!')));
console.log('Test 3:', JSON.stringify(parseMixedContent('Tentukan titik potong fungsi kuadrat f(x) = x^2 - 5x + 6 terhadap sumbu X.')));
