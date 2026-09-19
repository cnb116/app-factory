export interface CleanOptions {
  lineBreaks: boolean;
  spacing: boolean;
}

// 카톡/메모에서 복사한 텍스트의 불필요한 줄바꿈을 정리해 문단 단위로 합친다.
// 계좌번호·전화번호처럼 숫자-하이픈 조합이 있는 줄은 독립된 줄로 보존한다.
export function cleanLineBreaks(text: string): string {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => {
      const lines = paragraph
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        .filter((line) => line.length > 0);

      const outputLines: string[] = [];
      let buffer: string[] = [];
      const flushBuffer = () => {
        if (buffer.length > 0) {
          outputLines.push(buffer.join(" "));
          buffer = [];
        }
      };

      for (const line of lines) {
        if (/\d{2,}-\d/.test(line)) {
          flushBuffer();
          outputLines.push(line);
        } else {
          buffer.push(line);
        }
      }
      flushBuffer();

      return outputLines.join("\n");
    })
    .filter((paragraph) => paragraph.length > 0);

  return paragraphs.join("\n\n");
}

// 공백으로 구분된 토큰을 보면서, "한 글자짜리 한글 음절"이 연속으로 이어지는
// 구간만 찾아 그 구간의 공백만 제거한다. 정규식 하나로 처리하면 실제 단어의
// 마지막 한 글자가 다음 단어와 우연히 겹쳐 매칭되면서 문장 전체의 공백이
// 사라지는 사고가 나기 쉬워(예: "...게 말했습니다" 같은 정상 문장까지 붙어버림),
// 공백 기준으로 토큰을 나눠 실제 단어 경계를 지키는 방식으로 안전하게 처리한다.
// "그 집"처럼 정상적인 한 글자 단어 두 개가 우연히 붙는 경우는 여전히 남아있는
// 트레이드오프지만, 문장 전체가 뭉개지는 것보다는 훨씬 안전하다.
function joinSpacedHangulSyllables(line: string): string {
  const tokens = line.split(" ");
  const result: string[] = [];
  let run: string[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    result.push(run.length >= 2 ? run.join("") : run[0]);
    run = [];
  };

  for (const token of tokens) {
    if (token.length === 1 && /[가-힣]/.test(token)) {
      run.push(token);
    } else {
      flushRun();
      result.push(token);
    }
  }
  flushRun();

  return result.join(" ");
}

// 줄바꿈(개행 문자)은 건드리지 않고 한 줄 안의 공백만 정리한다.
// - 스페이스/탭 2칸 이상 -> 1칸
// - 마침표·쉼표·물음표·느낌표 앞의 공백 제거 (예: "안녕 . 하세요" -> "안녕. 하세요")
// - 카톡 복사 시 한 글자씩 띄어 붙는 한글 음절 사이 공백 제거 (예: "제 가" -> "제가")
export function fixSpacing(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      let result = line.replace(/[ \t]{2,}/g, " ");
      result = result.replace(/[ \t]+([.,?!])/g, "$1");
      result = joinSpacedHangulSyllables(result);
      return result.trim();
    })
    .join("\n");
}

export function cleanText(text: string, options: CleanOptions): string {
  let result = text.replace(/\r\n/g, "\n");
  if (options.lineBreaks) {
    result = cleanLineBreaks(result);
  }
  if (options.spacing) {
    result = fixSpacing(result);
  }
  return result;
}
