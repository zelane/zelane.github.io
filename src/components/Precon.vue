<script setup>

  import { reactive } from 'vue';
  import Multiselect from '@vueform/multiselect';
  import { useToast } from "vue-toastification";


  const toast = useToast();
  // const skyfallUrl = 'https://mtg-couchdb.1drmrcrnnfo1c.eu-west-2.cs.amazonlightsail.com';
  const skyfallUrl = 'http://localhost:3001';

  const values = reactive({
    name: '',
    set: '',
    cards: '',
  });

  const vars = reactive({
    sets: []
  });
  
  const cachedGet = async (cache, url) => {
    const request = new Request(url);
    let response = await cache.match(request);
    if (!response) {
      await cache.add(request);
      response = await cache.match(request);
    }
    const json = await response.json();
    return json;
  };
  ;
  caches.open('cardDataCache').then(async (cache) => {
    let as = await cachedGet(cache, 'https://api.scryfall.com/sets');
    vars.sets = as.data;
  });

  const post = async (url = '', data = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  };

  const uploadPrecon = async () => {
    const re = /([0-9]+) (.+)/g;
    const matches = values.cards.matchAll(re);
    const cards = [];
    for (const m of matches) {
      cards.push({
        count: parseInt(m[1]),
        name: m[2].trim()
      });
    }
    await post(skyfallUrl + '/precon', {
      name: values.name,
      commander: values.commander,
      set: values.set,
      cards: cards,
    });
    toast(`Uploaded ${values.name}`);
  };

</script>

<template>
  <div class="precon">
    <div class="flex">
      <div class="form">
        <label for="name">Name</label>
        <input
          id="name"
          type="text"
          v-model="values.name"
        >
        <label for="set">Set Code</label>
        <Multiselect
          v-model="values.set"
          :options="vars.sets"
          label="name"
          value-prop="code"
          :searchable="true"
          mode="single"
          placeholder="Set"
        />
        <label for="name">Commander</label>
        <input
          id="name"
          type="text"
          v-model="values.commander"
        >
        <textarea v-model="values.cards" />
        <button @click="uploadPrecon">
          Upload
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.precon {
  position: absolute;
  padding: 1rem;
  inset: 0;
  overflow: auto;
  z-index: 1;
  background-color: var(--colour-dark-grey);
}
.flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  height: 100%;
}
label {
  vertical-align: middle;
}
.form {
  display: grid;
  grid-template-columns: auto auto;
  gap: 20px;
  max-width: 480px;
  width: 100%;
  align-items: center;
}
textarea {
  grid-column: span 2;
}
button {
  grid-column: span 2;
}
</style>