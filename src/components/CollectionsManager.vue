<script setup>

import { reactive } from 'vue';
import { useToast } from "vue-toastification";
import { useCollections } from '../stores/collections';

const collections = useCollections();
const toast = useToast();
const ui = reactive({
  name: null,
  upload: false,
});

const emit = defineEmits(['change', 'delete', 'close']);

const downloadCollection = async (name, code) => {
  toast(`Downloading [${code}] to ${name}.`);
  const success = await collections.download(name, code);
  if(success) {
    toast(`${name} downloaded.`);
    emit('change', name);
    emit('close');
  }
  else {
    console.error(error);
    toast.error(`Failed to download ${code}.`);
  }
};

const refreshCollection = async (name) => {
  const stid = toast(`Refreshing collection ${name}`);
  const success = await collections.refresh(name);
  if(success) {
    toast.dismiss(stid);
    toast(`${name} refreshed.`);
    emit('change', name);
  }
  else {
    toast.dismiss(stid);
    toast.error(`Failed to refresh ${name}.`);
  }
};

const uploadCollection = async (name, force=false) => {
  const stid = toast(`Uploading ${name}`);
  const code = await collections.upload(name);
  if(code) {
    navigator.clipboard.writeText(code);
    toast.dismiss(stid);
    toast(`${name} uploaded. Code copied to clipboard`);
  }
  else {
    toast.dismiss(stid);
    toast.error(`${name} failed to upload.`);
  }
};

const copySyncCode = async (name) => {
  const collection = await collections.get(name);
  navigator.clipboard.writeText(collection.syncCode);
  toast(`${name} sync code copied to clipboard.`);
};

const newCollection = async (name) => {
  collections.save(name.trim(), []);
  emit('change', name.trim());
  emit('close');
};

const deleteCollection = async (name) => {
  if(confirm(`Are you sure you want to delete ${name}`)) {
    collections.delete(name);
  }
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
        v-if="collections.all.length > 0"
      >
        <div
          class="collection"
          v-for="[name, col] in collections.collections.entries()"
          :key="name"
        >
          <div>{{ name }}</div>
          <!-- <a
          class="action icon icon-arrow_downward"
        /> -->
          <span
            class="code"
            @click.exact="copySyncCode(name)"
          >{{ col.code }}</span>
          <a
            class="action icon icon-arrow_upward"
            @click.exact="uploadCollection(name)"
            @click.ctrl="uploadCollection(name, true)"
          />
          <a
            class="action icon icon-arrow_downward"
            @click.exact="refreshCollection(name)"
          />
          <!-- <a
            class="action icon icon-clipboard"
            @click.exact="copySyncCode(name)"
          /> -->
          <a
            class="action"
            @click="deleteCollection(name)"
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
.code {
  color: var(--colour-accent);
  cursor: copy;
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
  max-height: 20rem;
  overflow: auto;
  width: 100%;
  max-width: 640px;
  gap: .5rem;
  display: flex;
  flex-direction: column;
}
.collection {
  display: flex;
  gap: 1rem;
  flex-direction: row;
  height: 3rem;
  align-items: center;
  padding: 1rem;
  color: var(--colour-light-text);
  background-color: var(--colour-input-grey);
  /* border-bottom: 1px solid var(--colour-accent); */
}
.collection div:first-child {
  flex-grow: 1;
  font-weight: 500;
}
.form {
  display: grid;
  gap: 1rem;
  align-items: center;
}
</style>