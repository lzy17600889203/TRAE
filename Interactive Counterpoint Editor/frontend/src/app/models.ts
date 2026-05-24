export interface Note {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  octave: number;
  alter: '' | '#' | '##' | 'b' | 'bb' | 'n';
  duration: 'whole' | 'half' | 'quarter' | 'eighth' | '16th';
}

export interface Voice {
  name: string;
  notes: Note[];
}

export interface Key {
  fifths: number;
  mode: string;
}

export interface TimeSig {
  beats: number;
  beatType: number;
}

export interface Score {
  id?: string;
  title: string;
  key: Key;
  time: TimeSig;
  clefs: string[];
  roleOrder: number[];
  voices: Voice[];
  keyChangeAt?: { index: number; fifths: number; mode: string };
}

export interface Issue {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  positions: { voice: number; index: number }[];
  suggestions: string[];
}
