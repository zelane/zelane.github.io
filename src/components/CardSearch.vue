<script setup>
import { reactive } from 'vue';
import ManaCost from './ManaCost.vue';
import { deepUnref } from 'vue-deepunref';
import { useSearchView } from '../stores/cards';

const search = useSearchView();

const ui = reactive({
    search: '',
    results: [],
    loading: false,
});

const emit = defineEmits(['selected']);

</script>

<template>
  <div class="search">
    <input
      type="text"
      v-model="ui.search"
      @keyup.enter="search.loadSearch(ui.search)"
    >
    <button
      class="small icon icon-search"
      @click="search.loadSearch(ui.search)"
    />
  </div>
  <div class="results">
    <div
      v-for="card in search.cards"
      :key="card.name"
      class="result"
    >
      <span class="name">{{ card.name }}</span>
      <ManaCost :mana="card.mana_cost" />
      <button
        class="small"
        @click="emit('selected', deepUnref(card))"
      >
        +
      </button>
    </div>
  </div>
</template>

<style scoped>
.search {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 1rem;
}
.search input {
  flex-grow: 1;
}
.results {
  max-height: minmax(30rem, 50vh);
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 100%;
  overflow: auto;
}
.result {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
}
.name {
  flex-grow: 1;
}
</style>