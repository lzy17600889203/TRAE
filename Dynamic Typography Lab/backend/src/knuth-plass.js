class Box {
  constructor(width, content) {
    this.width = width;
    this.content = content;
    this.type = 'box';
  }
}

class Glue {
  constructor(width, stretch, shrink, content = '') {
    this.width = width;
    this.stretch = stretch;
    this.shrink = shrink;
    this.content = content;
    this.type = 'glue';
  }
}

class Penalty {
  constructor(width, penalty, flagged = false) {
    this.width = width;
    this.penalty = penalty;
    this.flagged = flagged;
    this.type = 'penalty';
  }
}

function hyphenateWord(word, rules) {
  if (rules === 'none') return [];
  if (word.length < 5) return [];
  
  const patterns = {
    strict: [3, 2],
    normal: [5, 3],
    aggressive: [2, 2]
  };
  
  const [minBefore, minAfter] = patterns[rules] || [5, 3];
  const results = [];
  
  for (let i = minBefore; i <= word.length - minAfter; i++) {
    results.push({
      before: word.slice(0, i) + '-',
      after: word.slice(i),
      position: i
    });
  }
  
  return results;
}

function measureText(text, fontSize = 16, letterSpacing = 0) {
  const baseWidths = {
    'a': 8.8, 'b': 9.6, 'c': 8.2, 'd': 9.6, 'e': 8.8, 'f': 5.6,
    'g': 9.6, 'h': 9.6, 'i': 4.0, 'j': 4.0, 'k': 8.8, 'l': 4.0,
    'm': 14.4, 'n': 9.6, 'o': 9.6, 'p': 9.6, 'q': 9.6, 'r': 5.6,
    's': 8.0, 't': 4.8, 'u': 9.6, 'v': 8.8, 'w': 12.8, 'x': 8.8,
    'y': 8.8, 'z': 8.0, 'A': 11.2, 'B': 10.4, 'C': 11.2, 'D': 11.2,
    'E': 9.6, 'F': 8.8, 'G': 12.0, 'H': 11.2, 'I': 4.8, 'J': 8.0,
    'K': 10.4, 'L': 8.8, 'M': 13.6, 'N': 11.2, 'O': 12.0, 'P': 9.6,
    'Q': 12.0, 'R': 11.2, 'S': 9.6, 'T': 8.8, 'U': 11.2, 'V': 10.4,
    'W': 14.4, 'X': 10.4, 'Y': 10.4, 'Z': 9.6, ' ': 4.8, '.': 4.8,
    ',': 4.8, '!': 4.8, '?': 8.0, ';': 4.8, ':': 4.8, '-': 4.8,
    "'": 2.4, '"': 4.8, '(': 5.6, ')': 5.6, '`': 4.8, '=': 8.0,
    '+': 8.0, '*': 6.4, '/': 4.8, '\\': 4.8, '[': 4.8, ']': 4.8,
    '{': 5.6, '}': 5.6, '<': 8.0, '>': 8.0
  };
  
  const scale = fontSize / 16;
  let width = 0;
  for (const char of text) {
    width += (baseWidths[char] || 8.0) * scale;
  }
  width += Math.max(0, (text.length - 1)) * letterSpacing;
  return width;
}

function tokenize(text, options) {
  const items = [];
  const spaceWidth = measureText(' ', options.fontSize, options.letterSpacing);
  
  const paragraphs = text.split('\n');
  
  for (let p = 0; p < paragraphs.length; p++) {
    const paragraph = paragraphs[p];
    const words = paragraph.split(/\s+/).filter(w => w.length > 0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordWidth = measureText(word, options.fontSize, options.letterSpacing);
      items.push(new Box(wordWidth, word));
      
      if (i < words.length - 1) {
        items.push(new Glue(
          spaceWidth * options.wordSpacing,
          spaceWidth * 0.6,
          spaceWidth * 0.2,
          ' '
        ));
        
        const hyphenations = hyphenateWord(word, options.hyphenationRules);
        if (hyphenations.length > 0) {
          const hyphenWidth = measureText('-', options.fontSize, options.letterSpacing);
          items.push(new Penalty(hyphenWidth, 50, true));
        }
      }
    }
    
    if (p < paragraphs.length - 1) {
      items.push(new Penalty(0, -10000, true));
    }
  }
  
  items.push(new Penalty(0, -10000, true));
  return items;
}

function knuthPlass(text, options) {
  const items = tokenize(text, options);
  const lineWidth = options.columnWidth;
  const tolerance = options.tolerance || 200;
  
  const n = items.length;
  const breaks = new Array(n + 1).fill(null);
  const demerits = new Array(n + 1).fill(Infinity);
  breaks[0] = { position: -1, demerits: 0, previous: null };
  demerits[0] = 0;
  
  for (let i = 0; i <= n; i++) {
    if (breaks[i] === null) continue;
    
    let totalWidth = 0;
    let totalStretch = 0;
    let totalShrink = 0;
    
    for (let j = i; j < n; j++) {
      const item = items[j];
      
      if (item.type === 'box') {
        totalWidth += item.width;
      } else if (item.type === 'glue') {
        totalWidth += item.width;
        totalStretch += item.stretch;
        totalShrink += item.shrink;
      } else if (item.type === 'penalty') {
        if (item.penalty < 0) {
          const adjust = lineWidth - totalWidth;
          let badness;
          
          if (adjust > 0) {
            badness = totalStretch > 0 ? Math.pow(Math.min(adjust / totalStretch, 1), 3) * 100 : 10000;
          } else if (adjust < 0) {
            badness = totalShrink > 0 ? Math.pow(Math.min(-adjust / totalShrink, 1), 3) * 100 : 10000;
          } else {
            badness = 0;
          }
          
          const totalDemerits = demerits[i] + badness * badness;
          
          if (badness <= tolerance && totalDemerits < demerits[j + 1]) {
            demerits[j + 1] = totalDemerits;
            breaks[j + 1] = {
              position: j,
              demerits: totalDemerits,
              previous: breaks[i]
            };
          }
          
          break;
        } else {
          totalWidth += item.width;
        }
      }
      
      if (totalWidth > lineWidth + totalShrink + 50) break;
    }
  }
  
  let best = null;
  for (let i = n; i >= 0; i--) {
    if (breaks[i] !== null) {
      best = breaks[i];
      break;
    }
  }
  
  if (!best) {
    return fallbackTypeset(text, options);
  }
  
  const breakPoints = [];
  let current = best;
  while (current) {
    breakPoints.unshift(current.position);
    current = current.previous;
  }
  
  const result = [];
  for (let i = 0; i < breakPoints.length - 1; i++) {
    const start = breakPoints[i] + 1;
    const end = breakPoints[i + 1];
    
    const lineItems = items.slice(start, end + 1);
    const lineBoxes = lineItems.filter(item => item.type === 'box');
    
    if (lineBoxes.length === 0) continue;
    
    const lineContent = lineBoxes.map(item => item.content).join(' ');
    
    let lineWidthUsed = lineBoxes.reduce((sum, item) => sum + item.width, 0);
    const gluesInLine = lineItems.filter(item => item.type === 'glue');
    const glueCount = gluesInLine.length;
    const glueWidth = gluesInLine.reduce((sum, g) => sum + g.width, 0);
    const totalStretch = gluesInLine.reduce((sum, g) => sum + g.stretch, 0);
    const totalShrink = gluesInLine.reduce((sum, g) => sum + g.shrink, 0);
    
    const actualWidth = lineWidthUsed + glueWidth;
    const adjust = lineWidth - actualWidth;
    
    let adjustRatio = 0;
    if (adjust > 0 && totalStretch > 0) {
      adjustRatio = Math.min(adjust / totalStretch, 1);
    } else if (adjust < 0 && totalShrink > 0) {
      adjustRatio = -Math.min(-adjust / totalShrink, 1);
    }
    
    result.push({
      text: lineContent,
      width: actualWidth,
      adjustRatio: isFinite(adjustRatio) ? adjustRatio : 0,
      glueCount,
      lineNumber: result.length
    });
  }
  
  if (result.length === 0) {
    return fallbackTypeset(text, options);
  }
  
  return result;
}

function fallbackTypeset(text, options) {
  const lines = [];
  const paragraphs = text.split('\n');
  const lineWidth = options.columnWidth;
  
  for (const para of paragraphs) {
    if (!para.trim()) continue;
    
    const words = para.split(/\s+/).filter(w => w.length > 0);
    let currentLine = [];
    let currentWidth = 0;
    const spaceWidth = measureText(' ', options.fontSize, options.letterSpacing) * options.wordSpacing;
    
    for (const word of words) {
      const wordWidth = measureText(word, options.fontSize, options.letterSpacing);
      
      if (currentLine.length === 0) {
        currentLine.push(word);
        currentWidth = wordWidth;
      } else if (currentWidth + spaceWidth + wordWidth <= lineWidth) {
        currentLine.push(word);
        currentWidth += spaceWidth + wordWidth;
      } else {
        lines.push({
          text: currentLine.join(' '),
          width: currentWidth,
          adjustRatio: 0,
          glueCount: currentLine.length - 1,
          lineNumber: lines.length
        });
        currentLine = [word];
        currentWidth = wordWidth;
      }
    }
    
    if (currentLine.length > 0) {
      lines.push({
        text: currentLine.join(' '),
        width: currentWidth,
        adjustRatio: 0,
        glueCount: currentLine.length - 1,
        lineNumber: lines.length
      });
    }
  }
  
  return lines;
}

module.exports = {
  knuthPlass,
  measureText,
  Box,
  Glue,
  Penalty,
  hyphenateWord
};
