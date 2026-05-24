import { Injectable } from '@angular/core';
import {
  animate,
  animation,
  AnimationBuilder,
  AnimationPlayer,
  style,
  keyframes,
  query,
  stagger
} from '@angular/animations';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  constructor(private builder: AnimationBuilder) {}

  // Typewriter-like progressive reveal: sets el text one char at a time.
  typewrite(el: HTMLElement, text: string, speed = 18): Promise<void> {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const id = setInterval(() => {
        if (i >= text.length) {
          clearInterval(id);
          resolve();
          return;
        }
        el.textContent += text[i++];
      }, speed);
    });
  }

  // Trigger element animations using Web Animations API
  flashError(el: HTMLElement) {
    if (!el) return;
    el.animate([
      { boxShadow: '0 0 0 0 rgba(255,64,64,0)', background: 'rgba(255,64,64,0.05)' },
      { boxShadow: '0 0 0 6px rgba(255,64,64,0.45)', background: 'rgba(255,64,64,0.18)' },
      { boxShadow: '0 0 0 0 rgba(255,64,64,0)', background: 'rgba(255,64,64,0.05)' }
    ], { duration: 900, iterations: 2 });
  }

  popCheck(el: HTMLElement) {
    if (!el) return;
    el.animate([
      { transform: 'scale(0.2)', opacity: '0' },
      { transform: 'scale(1.3)', opacity: '1' },
      { transform: 'scale(1)', opacity: '1' }
    ], { duration: 420, easing: 'cubic-bezier(0.34,1.56,0.64,1)' });
  }

  fadeIn(el: HTMLElement) {
    if (!el) return;
    el.animate([
      { opacity: '0', transform: 'translateY(6px)' },
      { opacity: '1', transform: 'translateY(0)' }
    ], { duration: 380 });
  }

  slideLevel(el: HTMLElement, level: number) {
    if (!el) return;
    el.animate([
      { transform: `translateX(${level * 40 + 40}px)`, opacity: '0' },
      { transform: `translateX(${level * 20}px)`, opacity: '1' }
    ], { duration: 360, easing: 'cubic-bezier(0.22,1,0.36,1)' });
  }
}
