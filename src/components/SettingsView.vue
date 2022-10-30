<script setup>

import { useUI } from '../stores/ui';

const ui = useUI();
</script>


<template>
  <h3>Settings</h3>
  <div class="grid">
    <label for="zoom">Zoom</label>
    <input
      id="zoom"
      type="number"
      v-model="ui.zoom"
    >
    <label for="columns">Columns</label>
    <input
      id="columns"
      type="number"
      v-model="ui.columns"
    >
  </div>
</template>

<style scoped>
  .grid {
    margin-top: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 1rem ;
  }
</style>