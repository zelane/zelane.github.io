<script setup>

import { reactive } from 'vue';
import { useToast } from "vue-toastification";
import { useCollections } from '../stores/collections';
import { useUser } from '../stores/user';
import CardExporter from './CardExporter.vue';

const user = useUser();
const collections = useCollections();
const toast = useToast();
const ui = reactive({
  name: null,
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

</script>

<template>
  <div class="upload">
    <div class="flex">
      <div
        class="collections"
        v-if="collections.names.length > 0"
      >
        <div
          class="collection"
          v-for="[name, col] in collections.collections.entries()"
          :key="name"
          :style="{
            'background-image': `url(${col.image})`
          }"
        >
          <div class="row">
            <div class="name">
              {{ name }}
            </div>
            <!-- <span>
            <span 
              v-if="user.collections.has(name) && user.collections.get(name).lastSync"
            >
              {{ (
                new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                  timeZone: 'UTC'
                }).format(new Date(user.collections.get(name).lastSync * 1))) }}
            </span>
          </span> -->
          </div>
          <div class="row actions">
            <div
              class="act"
              v-if="user.token && col.downloaded"
              @click.exact="uploadCollection(name)"
              @click.ctrl="uploadCollection(name)"
            >
              <span class="icon icon-arrow-up" />
              <div class="text">
                Upload
              </div>
            </div>
            <div
              class="act"
              v-if="user.token && user.collections.has(name)"
              @click.exact="refreshCollection(name)"
            >
              <span class="icon icon-arrow-down" />
              <div class="text">
                Download
              </div>
            </div>
            <div
              class="act"
              @click.exact="() => {}"
            >
              <span class="icon icon-arrow-right" />
              <div class="text">
                Export
              </div>
            </div>
            <div
              class="act"
              @click="deleteCollection(name)"
            >
              <span class="icon icon-delete" />
              <div class="text">
                Delete
              </div>
            </div>
          
            <!-- <CardExporter :cards="[]" /> -->
          </div>
          <!-- <a
            class="action icon icon-clipboard"
            @click.exact="copyUrl(name)"
          /> -->
        </div>
      </div>
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
  max-height: 60vh;
  overflow: auto;
  width: 100%;
  max-width: 640px;
  gap: 1rem;
  display: flex;
  flex-direction: column;
}
.collection {
  background-size: cover;
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow);
  border-radius: var(--default-br);
  background-position: center center;
  /* background-image: none !important; */
}
.collection .row {
  display: flex;
  padding: .5rem;
}
.collection .name {
  width: 100%;
  flex-grow: 1;
  font-weight: 500;
  line-height: 3rem;
  text-shadow: 1px 1px 10px black, 1px 1px 1px black;
  font-family: var(--font-magic-smallcaps);
}
.collection .actions {
  gap: .5rem;
  background: rgb(37, 32, 40);
  justify-content: space-evenly;
  align-content: center;
}

.actions .act {
  flex-grow: 1;
  border-radius: 0;
  text-align: center;
  padding: 0;
  cursor: pointer;
}
.actions .act .text {
  display: block;
  font-size: .6rem;
  margin-top: .5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.actions .act .icon {
  color: var(--colour-anchor);
  font-size: 1.2em;
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