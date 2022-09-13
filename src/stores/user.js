import { defineStore, acceptHMRUpdate } from 'pinia';
import { post } from '../utils/network';
import { useCollections } from './collections';

const backendUrl = import.meta.env.VITE_BACKEND_URL;


export const useUser = defineStore('user', {
  state: () => {
    return {
      token: null,
      collections: new Map()
    };
  },
  getters: {
  },
  actions: {
    async handleGoogleLogin(response) {
      this.token = response.credential;
      const resp = await post(backendUrl + '/login', {
        token: response.credential
      });
      this.collections = new Map();
      const collections = useCollections();
      for (const c of resp.data.collections) {
        this.collections.set(c.name, c);
        if (!collections.collections.has(c.name)){
          collections.collections.set(c.name, {
            lastSync: 0,
            downloaded: false
          });
        }
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot));
}
