<script setup>

import { reactive } from 'vue';
import Multiselect from '@vueform/multiselect';
import { useToast } from "vue-toastification";
import { useMeta } from '../stores/meta';
import { post } from '../utils/network';

const meta = useMeta();
const toast = useToast();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const values = reactive({
  name: '',
  set: '',
  cards: '',
});

const emit = defineEmits(['close']);

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
  await post(backendUrl + '/precon', {
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
      <button
        class="small close"
        @click="emit('close')"
      >
        <span>+</span>
      </button>
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
          :options="meta.sets"
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
.close {
  align-self: flex-end;
}
.close span {
  display: block;
  transform: rotate(45deg);
}
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