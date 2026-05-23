import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AnimationEvent, AnimationType } from '@/types';

interface PendingAnimation {
  id: string;
  type: AnimationType;
  target: string;
  duration: number;
  startTime: number;
  completed: boolean;
}

export const useAnimationStore = defineStore('animation', () => {
  const isAnimating = ref(false);
  const speed = ref<'slow' | 'normal' | 'fast'>('normal');
  const pendingAnimations = ref<PendingAnimation[]>([]);
  const currentEvents = ref<AnimationEvent[]>([]);
  const animationQueue = ref<AnimationEvent[]>([]);
  const currentEventIndex = ref(0);

  const speeds = {
    slow: 500,
    normal: 200,
    fast: 50
  };

  const animationDurations: Record<AnimationType, number> = {
    decision_branch: 300,
    satisfaction_check: 200,
    conflict_flash: 150,
    backtrack_erase: 400,
    variable_switch: 250,
    learned_clause_add: 350
  };

  const animations = computed(() => pendingAnimations.value);

  function setSpeed(newSpeed: 'slow' | 'normal' | 'fast') {
    speed.value = newSpeed;
  }

  function addEvent(event: AnimationEvent) {
    animationQueue.value.push(event);
    if (!isAnimating.value) {
      processNextEvent();
    }
  }

  function setEvents(events: AnimationEvent[]) {
    animationQueue.value = [...events];
    currentEventIndex.value = 0;
  }

  function processNextEvent() {
    if (currentEventIndex.value >= animationQueue.value.length) {
      isAnimating.value = false;
      return;
    }

    isAnimating.value = true;
    const event = animationQueue.value[currentEventIndex.value];
    currentEventIndex.value++;
    currentEvents.value.push(event);

    const animationType = mapEventToAnimation(event.type);
    if (animationType) {
      const animation: PendingAnimation = {
        id: `anim-${event.timestamp}`,
        type: animationType,
        target: getAnimationTarget(event),
        duration: animationDurations[animationType],
        startTime: Date.now(),
        completed: false
      };

      pendingAnimations.value.push(animation);

      setTimeout(() => {
        animation.completed = true;
        pendingAnimations.value = pendingAnimations.value.filter(a => a.id !== animation.id);
        processNextEvent();
      }, animation.duration / (speed.value === 'fast' ? 3 : speed.value === 'slow' ? 0.5 : 1));
    } else {
      processNextEvent();
    }
  }

  function mapEventToAnimation(eventType: AnimationEvent['type']): AnimationType | null {
    const mapping: Record<string, AnimationType> = {
      decision: 'decision_branch',
      propagation: 'variable_switch',
      conflict: 'conflict_flash',
      backtrack: 'backtrack_erase',
      learn: 'learned_clause_add',
      satisfy: 'satisfaction_check'
    };
    return mapping[eventType] || null;
  }

  function getAnimationTarget(event: AnimationEvent): string {
    if (event.data.variable) {
      return `variable-${event.data.variable}`;
    }
    if (event.data.clauseId) {
      return `clause-${event.data.clauseId}`;
    }
    if (event.data.learnedClause) {
      return `learned-clause-${event.data.learnedClause.id}`;
    }
    return 'unknown';
  }

  function clearAnimations() {
    pendingAnimations.value = [];
    currentEvents.value = [];
    animationQueue.value = [];
    currentEventIndex.value = 0;
    isAnimating.value = false;
  }

  function pause() {
    isAnimating.value = false;
  }

  function resume() {
    if (animationQueue.value.length > currentEventIndex.value) {
      isAnimating.value = true;
      processNextEvent();
    }
  }

  return {
    isAnimating,
    speed,
    pendingAnimations,
    currentEvents,
    animations,
    setSpeed,
    addEvent,
    setEvents,
    clearAnimations,
    pause,
    resume
  };
});
