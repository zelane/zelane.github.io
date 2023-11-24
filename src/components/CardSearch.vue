<script setup lang="ts">
import { reactive } from 'vue';
import { deepUnref } from 'vue-deepunref';
import { useSearchView } from '../stores/cards';
import { useMeta } from '../stores/meta';
import Multiselect from '@vueform/multiselect';
import CardImage from './CardImage.vue';
import CheckBar from './CheckBar.vue';
import { Card } from '../models/Card';

const search = useSearchView();
const meta = useMeta();

const ui = reactive({
  search: '',
  cn: '',
  set: null,
  count: 1,
  autoAdd: false,
  results: [],
  loading: false,
  preview: null,
});

const emit = defineEmits(['selected']);

const clear = () => {
  ui.search = null;
  ui.cn = null;
  ui.set = null;
  ui.count = 1;
  search.$reset();
};

// Power mode? Shift + Enter add foil

const runSearch = async () => {
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
  await search.loadSearch(query, 'prints');
  if(ui.autoAdd && search.count === 1) emit('selected', deepUnref(search.cards.values().next().value));
};

const select = (card: Card) => {
  let obj = deepUnref(card);
  obj.count = ui.count;
  emit('selected', obj);
};

</script>

<template>
  <div class="form">
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
    <input
      type="text"
      v-model="ui.cn"
      @keyup.enter="runSearch"
      placeholder="Collector number (Optional)"
    >
    <Multiselect
      v-model="ui.set"
      :options="meta.sets"
      label="name"
      value-prop="code"
      :searchable="true"
      mode="single"
      placeholder="Set (Optional)"
    />
    <input
      type="number"
      v-model="ui.count"
      placeholder="Quantity"
    >
    <CheckBar
      v-model="ui.autoAdd"
      v-if="false"
    >
      Auto add single result
    </CheckBar>
    
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
      :key="card.data.name"
      class="result"
      @click="ui.preview = ui.preview === null ? card.id : null"
    >
      <div class="name">
        <span class="cn">{{ card.data.collector_number }}</span> - {{ card.data.name }} 
      </div>
      <div class="set">
        {{ card.data.set }} - {{ card.data.set_name }}
      </div>
      <button
        class="small"
        @click.stop="select(card)"
      >
        +
      </button>
      <div
        class="preview"
        v-if="ui.preview === card.id"
      >
        <CardImage :card="card" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}
.form input, .form .multiselect, .form .checkbar {
  grid-column: span 2;
}
.form .row {
  display: flex;
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
  display: grid;
  grid-template-columns: repeat(2, auto);
  align-items: center;
}
.result .cn {
  font-weight: 600;
}
.result .set {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: var(--colour-accent);
}
.result div {
  grid-column: 1;
}
.result button {
  grid-column: 2;
  grid-row: 1 / 4;
  width: min-content;
  justify-self: flex-end;
}
.result .preview {
  margin-top: 1rem;
}
.name {
  flex-grow: 1;
}
</style>