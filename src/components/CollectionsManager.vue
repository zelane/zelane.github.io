<script setup>

import { reactive } from 'vue';
import { useToast } from "vue-toastification";
import { useCollections } from '../stores/collections';
import { useUser } from '../stores/user';

const user = useUser();
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

const uploadCollection = async (name) => {
  const stid = toast(`Uploading ${name}`);
  const col = await collections.upload(user.token, name);
  if(col) {
    toast.dismiss(stid);
    toast(`${name} uploaded.`);
    user.collections.set(name, col);
  }
  else {
    toast.dismiss(stid);
    toast.error(`${name} failed to upload.`);
  }
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
          <span>
            <span 
              v-if="user.collections.has(name)"
            >
              {{ user.collections.get(name).id }}
            </span>
          </span>
          <a
            v-if="user.token && col.downloaded"
            class="action icon icon-arrow-up"
            @click.exact="uploadCollection(name)"
            @click.ctrl="uploadCollection(name)"
          />
          <a
          
            v-if="user.token && user.collections.has(name)"
            class="action icon icon-arrow-down"
            @click.exact="refreshCollection(name)"
          />
          <!-- <a
            class="action icon icon-clipboard"
            @click.exact="copyUrl(name)"
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
      </div>
      
      <button
        @click="ui.code ? downloadCollection(ui.name, ui.code) : newCollection(ui.name)"
      >
        Add
      </button>
      <div class="google-sync">
        <GoogleLogin
          :callback="user.handleGoogleLogin"
          popup-type="TOKEN"
          prompt
        />
      </div>
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