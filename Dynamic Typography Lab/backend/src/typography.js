const ligatureMap = {
  'fi': 'ﬁ',
  'fl': 'ﬂ',
  'ffi': 'ﬃ',
  'ffl': 'ﬄ',
  'ff': 'ﬀ',
  'st': 'ﬆ',
  'ct': 'ﬅ',
  'oe': 'œ',
  'OE': 'Œ',
  'ae': 'æ',
  'AE': 'Æ'
};

const conflictLigatures = {
  'fi': 'f\u200Di',
  'fl': 'f\u200Dl',
  'ff': 'f\u200Df'
};

function isLatinChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0041 && code <= 0x005A) ||
         (code >= 0x0061 && code <= 0x007A) ||
         (code >= 0x00C0 && code <= 0x00FF) ||
         (code >= 0x0100 && code <= 0x017F);
}

function isArabicChar(char) {
  const code = char.charCodeAt(0);
  return (code >= 0x0600 && code <= 0x06FF) ||
         (code >= 0x0750 && code <= 0x077F) ||
         (code >= 0x08A0 && code <= 0x08FF) ||
         (code >= 0xFB50 && code <= 0xFDFF) ||
         (code >= 0xFE70 && code <= 0xFEFF);
}

function applyLigatures(text, mode = 'normal') {
  if (mode === 'none') return text;

  function processSegment(segment) {
    const hasNonLatin = Array.from(segment).some(c => !isLatinChar(c) && c !== ' ');
    if (hasNonLatin) return segment;

    let result = segment;

    if (mode === 'conflict') {
      Object.keys(conflictLigatures).sort((a, b) => b.length - a.length).forEach(pattern => {
        result = result.split(pattern).join(conflictLigatures[pattern]);
      });
      return result;
    }

    if (mode === 'aggressive') {
      Object.keys(ligatureMap).sort((a, b) => b.length - a.length).forEach(pattern => {
        result = result.split(pattern).join(ligatureMap[pattern]);
      });
      return result;
    }

    const commonLigs = ['ff', 'fi', 'fl', 'ffi', 'ffl'];
    commonLigs.sort((a, b) => b.length - a.length).forEach(pattern => {
      result = result.split(pattern).join(ligatureMap[pattern]);
    });

    return result;
  }

  const segments = text.split(/(\s+|\n|[^\x00-\x7F]+)/);
  return segments.map(processSegment).join('');
}

const arabicIsolatedForms = {
  'ا': 'ا', 'ب': 'ب', 'ت': 'ت', 'ث': 'ث', 'ج': 'ج', 'ح': 'ح', 'خ': 'خ',
  'د': 'د', 'ذ': 'ذ', 'ر': 'ر', 'ز': 'ز', 'س': 'س', 'ش': 'ش', 'ص': 'ص',
  'ض': 'ض', 'ط': 'ط', 'ظ': 'ظ', 'ع': 'ع', 'غ': 'غ', 'ف': 'ف', 'ق': 'ق',
  'ك': 'ك', 'ل': 'ل', 'م': 'م', 'ن': 'ن', 'ه': 'ه', 'و': 'و', 'ي': 'ي',
  'آ': 'آ', 'أ': 'أ', 'إ': 'إ', 'ة': 'ة', 'ى': 'ى', 'ئ': 'ئ', 'ؤ': 'ؤ',
  'ء': 'ء'
};

const nonConnectingChars = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و', 'آ', 'أ', 'إ', 'ة', 'ى', 'ؤ']);

const lamAlefLigatures = {
  'لا': 'ﻻ',
  'لأ': 'ﻷ',
  'لإ': 'ﻹ',
  'لآ': 'ﻵ'
};

function processArabic(text, breakConnections = false) {
  if (breakConnections) {
    return text.split('').map(char => {
      if (isArabicChar(char)) {
        return (arabicIsolatedForms[char] || char) + '\u200C';
      }
      return char;
    }).join('');
  }

  const chars = text.split('');
  const result = [];

  for (let i = 0; i < chars.length; i++) {
    const current = chars[i];

    if (!isArabicChar(current)) {
      result.push(current);
      continue;
    }

    if (i < chars.length - 1 && current === 'ل') {
      const next = chars[i + 1];
      const ligature = lamAlefLigatures['ل' + next];
      if (ligature) {
        result.push(ligature);
        i++;
        continue;
      }
    }

    const prev = i > 0 ? chars[i - 1] : null;
    const next = i < chars.length - 1 ? chars[i + 1] : null;

    const canConnectLeft = prev && isArabicChar(prev) && !nonConnectingChars.has(prev);
    const canConnectRight = next && isArabicChar(next) && !nonConnectingChars.has(current);

    if (canConnectLeft || canConnectRight) {
      result.push(current);
    } else {
      result.push(arabicIsolatedForms[current] || current);
    }
  }

  return result.join('');
}

function applyKerning(text, fontMetrics) {
  if (!fontMetrics || fontMetrics.length === 0) return text;
  return text;
}

function applyOpticalMarginAlignment(lines, options) {
  const punctuation = new Set(['.', ',', '!', '?', ';', ':', '-', '"', "'", '(', ')']);

  return lines.map(line => {
    const firstChar = line.text[0];
    const lastChar = line.text[line.text.length - 1];

    let leftOffset = 0;
    let rightOffset = 0;

    if (punctuation.has(firstChar)) {
      leftOffset = -3;
    }
    if (punctuation.has(lastChar)) {
      rightOffset = -3;
    }

    return {
      ...line,
      leftOffset,
      rightOffset
    };
  });
}

function detectRiverEffect(lines, columnWidth) {
  const issues = [];

  lines.forEach((line, index) => {
    if (line.adjustRatio > 0.7) {
      issues.push({
        line: index,
        type: 'river',
        severity: line.adjustRatio,
        message: '单词间距过大，可能产生河流效应'
      });
    }
  });

  return issues;
}

function detectOverflow(lines, columnWidth) {
  const issues = [];

  lines.forEach((line, index) => {
    if (line.width > columnWidth + 5) {
      issues.push({
        line: index,
        type: 'overflow',
        severity: (line.width - columnWidth) / columnWidth,
        message: '行尾溢出，标点挤压失效'
      });
    }
  });

  return issues;
}

function detectLigatureIssues(text) {
  const issues = [];
  const conflictPatterns = ['f\u200Di', 'f\u200Dl', 'f\u200Df'];

  conflictPatterns.forEach(pattern => {
    let pos = text.indexOf(pattern);
    while (pos !== -1) {
      issues.push({
        position: pos,
        type: 'ligature',
        severity: 0.8,
        message: '连字冲突：可能出现渲染乱码'
      });
      pos = text.indexOf(pattern, pos + 1);
    }
  });

  return issues;
}

function detectArabicConnectionIssues(text) {
  const issues = [];
  const zeroWidthNonJoiner = '\u200C';

  let pos = text.indexOf(zeroWidthNonJoiner);
  while (pos !== -1) {
    issues.push({
      position: pos,
      type: 'arabic',
      severity: 0.6,
      message: '阿拉伯文连接断裂'
    });
    pos = text.indexOf(zeroWidthNonJoiner, pos + 1);
  }

  return issues;
}

module.exports = {
  applyLigatures,
  processArabic,
  applyKerning,
  applyOpticalMarginAlignment,
  detectRiverEffect,
  detectOverflow,
  detectLigatureIssues,
  detectArabicConnectionIssues,
  isArabicChar,
  isLatinChar
};
