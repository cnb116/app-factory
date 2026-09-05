export interface DiffToken {
  text: string;
  changed: boolean;
}

/**
 * Word-level diff via LCS. Whitespace runs are tokens too, so spacing
 * changes get flagged along with word changes. Good enough for showing
 * "what did the AI change" — not meant to be a general-purpose diff.
 */
export function diffWords(before: string, after: string): DiffToken[] {
  const tokenize = (s: string) => s.match(/\S+|\s+/g) ?? [];
  const a = tokenize(before);
  const b = tokenize(after);
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const tokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (j < n) {
    if (i < m && a[i] === b[j]) {
      tokens.push({ text: b[j], changed: false });
      i++;
      j++;
    } else if (i < m && dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      tokens.push({ text: b[j], changed: true });
      j++;
    }
  }
  return tokens;
}

export function hasLongDigitRun(text: string): boolean {
  return /\d{3,}/.test(text);
}
