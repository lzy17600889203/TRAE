import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TypographyService, TypesetOptions, TypesetResult, TypesetLine, Preset } from './typography.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  sampleText = `The Knuth-Plass algorithm is a line-breaking algorithm that was developed by Donald Knuth and Michael Plass in 1977. It is used to choose the optimal positions for breaking a paragraph into lines such that the total "badness" of the paragraph is minimized. The algorithm considers all possible breakpoints and uses dynamic programming to find the optimal solution.

This is a demonstration of advanced typography features including ligatures like fi, fl, ffi, and ffl. Notice how these characters merge together beautifully. The algorithm also handles punctuation carefully, ensuring proper spacing around periods, commas, and other marks.

لكتابة النصوص العربية بشكل صحيح، يجب توصيل الحروف مع بعضها البعض. هذا يظهر أهمية معالجة النصوص المعقدة في أنظمة الطباعة الحديثة.

When working with code blocks like ` + '`const result = calculate(42);`' + `, we need special handling to preserve formatting while maintaining readability. The challenge is to balance technical accuracy with aesthetic appeal.`;

  inputText: string = '';
  result: TypesetResult | null = null;
  isProcessing = false;
  selectedPreset: string | null = null;
  presets: Preset[] = [];
  selectedChars: Set<number> = new Set();
  reflowingLines: Set<number> = new Set();
  ligatureLines: Set<number> = new Set();

  options: TypesetOptions = {
    columnWidth: 400,
    wordSpacing: 1.0,
    letterSpacing: 0,
    hyphenationRules: 'normal',
    ligatureMode: 'normal',
    fontSize: 16,
    tolerance: 200,
    arabicBreakConnections: false,
    opticalMarginAlignment: true
  };

  @ViewChild('previewContainer') previewContainer!: ElementRef;

  constructor(private typographyService: TypographyService) {}

  ngOnInit() {
    this.inputText = this.sampleText;
    this.loadPresets();
  }

  loadPresets() {
    this.typographyService.getPresets().subscribe({
      next: (response) => {
        if (response.success) {
          this.presets = response.data;
        }
      },
      error: (err) => console.error('加载预设失败:', err)
    });
  }

  applyPreset(preset: Preset) {
    this.selectedPreset = preset.name;
    this.options.columnWidth = preset.column_width;
    this.options.wordSpacing = preset.word_spacing;
    this.options.letterSpacing = preset.letter_spacing;
    this.options.hyphenationRules = preset.hyphenation_rules;

    if (preset.name === '窄栏新闻场景') {
      this.options.ligatureMode = 'normal';
      this.options.tolerance = 100;
      this.options.arabicBreakConnections = false;
    } else if (preset.name === '宽屏阅读场景') {
      this.options.ligatureMode = 'aggressive';
      this.options.tolerance = 300;
      this.options.arabicBreakConnections = false;
    } else if (preset.name === '代码块混排场景') {
      this.options.ligatureMode = 'none';
      this.options.tolerance = 500;
      this.options.arabicBreakConnections = false;
    } else if (preset.name === '极端连字规则场景') {
      this.options.ligatureMode = 'conflict';
      this.options.tolerance = 50;
      this.options.arabicBreakConnections = true;
    }

    this.typeset();
  }

  typeset() {
    if (!this.inputText.trim()) return;

    this.isProcessing = true;
    this.selectedChars.clear();

    this.typographyService.typeset(this.inputText, this.options).subscribe({
      next: (response) => {
        if (response.success) {
          if (this.result) {
            this.reflowingLines = new Set(response.data.lines.map((_, i) => i));
            this.ligatureLines = new Set(response.data.lines.map((_, i) => i));
            
            setTimeout(() => {
              this.reflowingLines.clear();
            }, 500);
            
            setTimeout(() => {
              this.ligatureLines.clear();
            }, 600);
          }

          this.result = response.data;
        }
        this.isProcessing = false;
      },
      error: (err) => {
        console.error('排版计算失败:', err);
        this.isProcessing = false;
      }
    });
  }

  onCharClick(lineIndex: number, charIndex: number) {
    const globalIndex = lineIndex * 1000 + charIndex;
    if (this.selectedChars.has(globalIndex)) {
      this.selectedChars.delete(globalIndex);
    } else {
      this.selectedChars.add(globalIndex);
    }
  }

  getCharClass(lineIndex: number, charIndex: number): string {
    const classes = ['char'];
    const globalIndex = lineIndex * 1000 + charIndex;

    if (this.selectedChars.has(globalIndex)) {
      classes.push('selected');
    }
    if (this.ligatureLines.has(lineIndex)) {
      classes.push('ligature-forming');
    }

    return classes.join(' ');
  }

  getLineClass(lineIndex: number): string {
    return this.reflowingLines.has(lineIndex) ? 'line-content reflowing' : 'line-content';
  }

  getWordSpacing(line: TypesetLine): number {
    const baseSpacing = 0.25 * this.options.fontSize * this.options.wordSpacing;
    const additionalSpacing = line.adjustRatio * baseSpacing * 0.5;
    return baseSpacing + additionalSpacing;
  }

  formatDemerits(value: number): string {
    return value.toFixed(0);
  }

  getIssueIcon(type: string): string {
    switch (type) {
      case 'river': return '🌊';
      case 'overflow': return '⚠️';
      case 'ligature': return '🔤';
      case 'arabic': return '🕌';
      default: return '❓';
    }
  }
}
