export const bugFlags: Record<string, boolean> = {
  indexOffset: false,
  staleOverride: false,
  randomDrop: false
};

export function setBug(name: string, value: boolean) {
  if (name in bugFlags) {
    bugFlags[name] = value;
    return { ok: true, name, value };
  }
  return { ok: false, message: `Unknown bug: ${name}` };
}
