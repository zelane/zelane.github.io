<script setup>

import { reactive, watchEffect } from 'vue';
import { useToast } from "vue-toastification";
import { useCollections } from '../stores/collections';
import { useUser } from '../stores/user';
import CardExporter from './CardExporter.vue';
import Multiselect from '@vueform/multiselect';
import { useCardView } from '../stores/cards';

const user = useUser();
const collections = useCollections();
const cards = useCardView();

const toast = useToast();
const ui = reactive({
  collection: null,
  obj: null,
});

watchEffect(() => {
  ui.collection = collections.open.length > 0 ? collections.open[0] : null;
});

watchEffect(() => {
  ui.obj = collections.obj.filter(c => {
    return c.name === ui.collection;
  })[0];
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
  const id = user.collections.get(name).id;
  const success = await collections.download(id);
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
  ui.name = null;
  emit('change', name.trim());
  emit('close');
};

const deleteCollection = async (name) => {
  if(confirm(`Are you sure you want to delete ${name}`)) {
    collections.delete(name);
  }
};

const cardSource = async (name) => {
  const cards = await collections.getCards([ui.collection]);
  return cards;
};

</script>

<template>
  <div class="upload flex">
    <div class="row">
      <Multiselect
        v-model="ui.collection"
        :options="collections.names"
        mode="single"
      />
      <button
        class="small icon icon-delete" 
        @click="deleteCollection(ui.collection)"
      />
    </div>
    
    <div
      class="collection flex"
      v-if="ui.obj"
    >
      <div
        class="img"
        :style="{
          'background-image': `url(${ui.obj.image})`
        }"
      />
      <div>
        <span>Cards: </span><span> {{ ui.obj.count }}</span>
      </div>
      <div v-if="user.token && ui.obj.downloaded ">
        <span>Last sync: </span>
        {{ (
          new Intl.DateTimeFormat('en-GB', {
            dateStyle: 'short',
            timeStyle: 'medium',
            timeZone: 'UTC'
          }).format(new Date(ui.obj.lastSync * 1))) }}
      </div>
      <div
        class="row"
        v-if="user.token"
      >
        <button
          v-if="ui.obj.downloaded"
          @click.exact="uploadCollection(ui.collection)"
          @click.ctrl="uploadCollection(ui.collection)"
        >
          <!-- <span class="icon icon-arrow-up" /> -->
          <div class="text">
            Upload
          </div>
        </button>
        <button
          v-if="user.collections.has(ui.collection)"
          @click.exact="refreshCollection(ui.collection)"
        >
          <!-- <span class="icon icon-arrow-down" /> -->
          <div class="text">
            Download
          </div>
        </button>
      </div>
      <CardExporter
        :source="cardSource"
      />
    </div>
    <hr>

    <div class="new-collection">
      <input
        type="text"
        v-model="ui.name"
        placeholder="New collection"
      >
      
      <button
        @click="newCollection(ui.name)"
        class="button small icon icon-plus"
      />
    </div>
    <hr>
    <div class="google-sync">
      <GoogleLogin
        v-if="!user.token"
        :callback="r => user.handleGoogleLogin(r.credential)"
        popup-type="TOKEN"
      />
      <div
        class="logged-in"
        v-if="user.token"
        @click="user.logout()"
      >
        <img :src="user.info.picture">
        <span class="text">Syncing as {{ user.info.given_name }}</span>
        <span class="icon icon-close" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  gap: .5rem;
}
.row button {
  flex-grow: 1;
}
.code {
  color: var(--colour-accent);
  cursor: copy;
}
.flex {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.img {
  background-size: cover;
  background-position: center center;
  height: 8rem;
  width: 100%;
}

.new-collection {
  width: 100%;
  max-width: 640px;
  display: flex;
  gap: .5rem;
}
.new-collection input {
  flex-grow: 2;
}
.google-sync {
  width: 100%;
}
.logged-in {
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow);
  border-radius: var(--default-br);
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-right: 1rem;
  gap: 1rem;
  cursor: pointer;
}
.logged-in img {
  box-shadow: inset 0 0 2px 2px;
  height: 50px;
}
.logged-in .text {
  flex-grow: 1;
}
.logged-in .icon {
  display: inline-block;
  box-shadow: -1px 0px 0 rgba(255,255,255,0.05);
  padding-left: .8rem;
  border-left: 1px solid rgba(0,0,0,0.3);
  line-height: 1.5rem;
}
</style>