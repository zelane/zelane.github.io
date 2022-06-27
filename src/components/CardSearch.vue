<script setup>
import { reactive } from 'vue';
import ManaCost from './ManaCost.vue';
import { deepUnref } from 'vue-deepunref';

const ui = reactive({
    search: '',
    results: [],
    loading: false,
});

const emit = defineEmits(['selected']);

let cache = null;
const init = async () => {
    cache = await caches.open('searchCache');
};
const cachedGet = async (cache, url, force=false) => {
  // url = encodeURI(url);
  const request = new Request(url, {
    'cache': force === true ? 'reload' : 'default'
  });
  if(force === true) {
    await cache.delete(request);
  }
  let response = await cache.match(request);
  if (!response) {
    await cache.add(request);
    response = await cache.match(request);
  }
  const json = await response.json();
  return json;
};

const search = async (query) => {
  if(query.length < 3) {
    return;
  }
  let url = 'https://api.scryfall.com/cards/search?' + new URLSearchParams({
    q: `${query} -border:silver -is:digital`,
    unique: 'card'
  });
  let _cards = [];
  ui.loading = true;
  try {
    while (true) {
      let json = await cachedGet(cache, url);
      _cards = _cards.concat(json.data);
      if (!json.has_more) break;
      url = json.next_page;
      await new Promise((r) => setTimeout(r, 100));
    }
    ui.results = _cards;
  }
  finally {
    ui.loading = false;
  }
};

init();

</script>

<template>
  <div class="search">
    <input
      type="text"
      v-model="ui.search"
      @keyup.enter="search(ui.search)"
    >
    <button
      class="small icon icon-search"
      @click="search(ui.search)"
    />
  </div>
  <div class="results">
    <div
      v-for="card in ui.results"
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