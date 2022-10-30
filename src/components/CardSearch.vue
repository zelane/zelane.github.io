<script setup>
import { reactive } from 'vue';
import ManaCost from './ManaCost.vue';
import { deepUnref } from 'vue-deepunref';
import { useSearchView } from '../stores/cards';
import { useMeta } from '../stores/meta';
import Multiselect from '@vueform/multiselect';

const search = useSearchView();
const meta = useMeta();

const ui = reactive({
    search: '',
    cn: null,
    set: null,
    results: [],
    loading: false,
});

const emit = defineEmits(['selected']);

const clear = () => {
  ui.search = null;
  ui.cn = null;
  ui.set = null;
};

const runSearch = () => {
  if((!ui.search || ui.search.length < 3) && (!ui.cn && !ui.set)) {
    return;
  }
  let query = ui.search;
  if(ui.cn) {
    query += " cn:" + ui.cn;
  }
  if(ui.set) {
    query += " set:" + ui.set;
  }
  search.loadSearch(query);
};

</script>

<template>
  <div class="row">
    <input
      type="text"
      v-model="ui.search"
      @keyup.enter="runSearch"
      placeholder="Name / Query"
    >
    <!-- <button
      class="small icon icon-search"
      @click="runSearch"
    /> -->
  </div>
  <div class="row">
    <input
      type="text"
      v-model="ui.cn"
      @keyup.enter="runSearch"
      placeholder="Collector number (Optional)"
    >
  </div>
  <div class="row">
    <Multiselect
      v-model="ui.set"
      :options="meta.sets"
      label="name"
      value-prop="code"
      :searchable="true"
      mode="single"
      placeholder="Set (Optional)"
    />
  </div>
  <div class="row">
    <button
      @click="clear"
    >
      Clear
    </button>
    <button
      @click="runSearch"
    >
      Search
    </button>
  </div>
  <div class="results">
    <div
      v-for="card in search.cards.values()"
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
.row {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 1rem;
}
.row input, .row button {
  flex-grow: 1;
}
.results {
  max-height: min(30rem, 50vh);
  display: flex;
  flex-direction: column;
  gap: .5rem;
  width: 100%;
  overflow: auto;
  padding-right: 1rem;
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