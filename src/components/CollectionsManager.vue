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
              v-if="user.collections.has(name) && user.collections.get(name).lastSync"
            >
              {{ (
                new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                  timeZone: 'UTC'
                }).format(new Date(user.collections.get(name).lastSync * 1))) }}
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
          <span>Syncing as {{ user.info.given_name }}</span>
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
.new-collection {
  width: 100%;
  max-width: 640px;
  display: flex;
  gap: .5rem;
}
.new-collection input {
  flex-grow: 2;
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
.logged-in .icon {
  display: inline-block;
  box-shadow: -1px 0px 0 rgba(255,255,255,0.05);
  padding-left: .8rem;
  border-left: 1px solid rgba(0,0,0,0.3);
  line-height: 1.5rem;
}
</style>