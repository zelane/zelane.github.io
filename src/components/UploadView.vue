<script setup>

import { reactive, ref } from 'vue';
import Multiselect from '@vueform/multiselect';
import { useToast } from "vue-toastification";


const toast = useToast();
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const ui = reactive({
  name: null,
  upload: false,
});

const props = defineProps({ db: Object, collections: Array, setIds: Set });
const emit = defineEmits(['change', 'delete', 'close']);

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

const downloadCollection = async (name, code) => {
  toast(`Downloading [${code}] to ${name}.`);
  try {
    const resp = await fetch(backendUrl + '/collection?id=' + code);
    const json = await resp.json();
    toast(`${name} downloaded.`);
    emit('change', name, json.data, code);
    emit('close');
  }
  catch (error) {
    console.error(error);
    toast.error(`Failed to download ${code}.`);
  }
  finally {
  }
};

const refreshCollection = async (name) => {
  const stid = toast(`Refreshing collection ${name}`);
  try {
    const collection = await props.db.collections.get({ name: name });
    if(!collection.syncCode) {
      return;
    }
    const resp = await fetch(backendUrl + '/collection?id=' + collection.syncCode);
    const json = await resp.json();
    toast.dismiss(stid);
    toast(`${name} refreshed.`);
    emit('change', name, json.data, collection.syncCode);
  }
  catch (error) {
    console.error(error);
    toast.dismiss(stid);
    toast.error(`Failed to refresh ${name}.`);
  }
  finally {
  }
};

const uploadCollection = async (name, force=false) => {
  const stid = toast(`Uploading ${name}`);
  try {
    const collection = await props.db.collections.get({ name: name });
    let data = {
      cards: collection.cards.map(c => {
        return {
          id: c.id,
          count: c.count,
          tags: c.tags,
          finish: c.finish,
        };
      })
    };
    let code = collection.syncCode;
    if(code) {
      data.id = code;
    }
    const resp = await post(backendUrl + '/collection', data);
    code = resp.data;
    await props.db.collections.update(name, {
      "syncCode": code
    });
    navigator.clipboard.writeText(code);
    toast.dismiss(stid);
    toast(`${name} uploaded. Code copied to clipboard`);
  }
  catch (error) {
    toast.dismiss(stid);
    toast.error(`${name} failed to upload.`);
    console.error(error);
  }
};

const copySyncCode = async (name) => {
  const collection = await props.db.collections.get({ name: name });
  navigator.clipboard.writeText(collection.syncCode);
  toast(`${name} sync code copied to clipboard.`);
};

const newCollection = async (name) => {
  emit('change', name.trim(), []);
  emit('close');
};

</script>

<template>
  <div class="upload">
    <div class="flex">
      <button
        class="small close"
        @click="emit('close')"
      >
        <span>+</span>
      </button>

      <div
        class="collections"
        v-if="props.collections.length > 0"
      >
        <div
          class="collection"
          v-for="col in props.collections"
          :key="col"
        >
          <div>{{ col }}</div>
          <!-- <a
          class="action icon icon-arrow_downward"
        /> -->
          <a
            class="action icon icon-arrow_upward"
            @click.exact="uploadCollection(col)"
            @click.ctrl="uploadCollection(col, true)"
          />
          <a
            class="action icon icon-arrow_downward"
            @click.exact="refreshCollection(col)"
          />
          <a
            class="action icon icon-clipboard"
            @click.exact="copySyncCode(col)"
          />
          <a
            class="action"
            @click="emit('delete', [col])"
          >-</a>
        </div>
      </div>
      <hr>
      <h3>New collection</h3>
      <div class="form">
        <label>Name</label>
        <input
          type="text"
          v-model="ui.name"
        >

        <label>Sync code (optional)</label>
        <input
          type="text"
          v-model="ui.code"
        >
      </div>
      
      <button
        @click="ui.code ? downloadCollection(ui.name, ui.code) : newCollection(ui.name)"
      >
        Add
      </button>
    </div>
  </div>
</template>

<style scoped>
.form {
  display: grid;
  grid-template-columns: fit-content(10rem) auto;
}
.upload {
  position: absolute;
  padding: 1rem;
  inset: 0;
  overflow: auto;
}
.flex {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}
.close {
  align-self: flex-end;
}
.close span {
  display: block;
  transform: rotate(45deg);
}
.collections {
  background-color: var(--colour-input-grey);
  max-height: 20rem;
  overflow: auto;
  width: 100%;
  max-width: 640px;
}
.collection {
  display: flex;
  gap: 1rem;
  flex-direction: row;
  height: 3rem;
  align-items: center;
  padding: 1rem;
  color: var(--colour-light-text);
}
.collection div:first-child {
  flex-grow: 1;
  font-weight: 500;
}
</style>