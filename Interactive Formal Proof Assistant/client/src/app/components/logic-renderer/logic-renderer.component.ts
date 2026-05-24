import { Component, ElementRef, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { LogicRenderService } from '../../services/logic-render.service';

@Component({
  selector: 'app-logic-renderer',
  template: `<span #content class="logic-text"></span>`,
  styles: [`
    :host { display: inline; }
    .logic-text { font-family: 'Cambria Math', 'Segoe UI', serif; font-size: 16px; }
    .sym { display: inline-block; margin: 0 2px; font-weight: 600; }
    .sym.impl { color: #7cc8ff; }
    .sym.equiv { color: #d68bff; }
    .sym.and { color: #ffd064; }
    .sym.or { color: #7dffae; }
    .sym.not { color: #ff9ac2; }
    .sym.quant { color: #6de0ff; }
    .sym.bool-t { color: #9cffcf; }
    .sym.bool-f { color: #ff9a9a; }
    .var.pred { color: #c8e4ff; }
    .var.term { color: #ffb380; }
  `]
})
export class LogicRendererComponent implements OnInit, AfterViewInit {
  @Input() formula!: string;
  @Input() animated = true;
  @ViewChild('content', { static: true }) contentRef!: ElementRef<HTMLElement>;

  constructor(private render: LogicRenderService) {}

  ngOnInit(): void {
    this.renderFormula();
  }

  ngAfterViewInit(): void {
    if (this.animated) {
      const el = this.contentRef.nativeElement;
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        el.animate([
          { opacity: '0', filter: 'blur(4px)' },
          { opacity: '1', filter: 'blur(0px)' }
        ], { duration: 700, easing: 'ease-out' });
        el.style.opacity = '1';
      });
    }
  }

  renderFormula(): void {
    const el = this.contentRef.nativeElement;
    el.innerHTML = this.render.render(this.formula || '');
  }
}
