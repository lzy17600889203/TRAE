<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let variables = [];
  export let value = { terms: [], op: '<=', rhs: 0, label: '' };

  if (!value.terms || value.terms.length === 0) {
    value.terms = variables.map((v) => ({ name: v, coefficient: 0 }));
  }

  function addTerm() {
    value.terms.push({ name: variables[0] || 'x1', coefficient: 0 });
    value = value;
  }
  function removeTerm(i) {
    value.terms.splice(i, 1);
    value = value;
  }
</script>

<div class="constraint">
  <div class="con-row">
    <input placeholder="约束标签" bind:value={value.label} />
    <select bind:value={value.op}>
      <option value="<=">≤</option>
      <option value=">=">≥</option>
      <option value="=">=</option>
    </select>
    <input type="number" step="any" bind:value={value.rhs} />
    <button class="danger" on:click={() => dispatch('remove')}>✕</button>
  </div>
  {#each value.terms as term, i}
    <div class="var-row">
      <select bind:value={term.name}>
        {#each variables as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
      <input type="number" step="any" bind:value={term.coefficient} />
      <button class="danger" on:click={() => removeTerm(i)}>✕</button>
    </div>
  {/each}
  <button on:click={addTerm}>+ 项</button>
</div>

<style>
  .constraint { display: grid; gap: 6px; padding: 8px; background: var(--panel-2); border-radius: 8px; }
</style>
