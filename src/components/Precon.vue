<script setup>

  import { reactive } from 'vue';

  
  // const skyfallUrl = 'https://mtg-couchdb.1drmrcrnnfo1c.eu-west-2.cs.amazonlightsail.com';
  const skyfallUrl = 'http://localhost:3001';

  const values = reactive({
    name: '',
    set: '',
    cards: '',
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
        name: m[2]
      });
    }
    await post(skyfallUrl + '/precon', {
      name: values.name,
      set: values.set,
      cards: cards,
    });
  };

</script>

<template>
  <div class="precon">
    <div class="flex">
      <label for="name">Name</label>
      <input
        id="name"
        type="text"
        v-model="values.name"
      >
      <label for="set">Set Code</label>
      <input
        id="set"
        type="text"
        v-model="values.set"
      >
      <textarea v-model="values.cards" />
      <button @click="uploadPrecon">
        Upload
      </button>
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
textarea {
  max-width: 640px;
}
</style>