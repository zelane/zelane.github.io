import { defineStore, acceptHMRUpdate } from 'pinia';
import { post } from '../utils/network';
import { useCollections } from './collections';
import { decodeCredential } from 'vue3-google-login';
import { useCookies } from "vue3-cookies";

const backendUrl = import.meta.env.VITE_BACKEND_URL;


export const useUser = defineStore('user', {
  state: () => {
    return {
      token: null,
      collections: new Map()
    };
  },
  getters: {
    info(state) {
      return decodeCredential(state.token);
    }
  },
  actions: {
    logout() {
      this.$reset();
    },
    async loadCookie() {
      const cookies = useCookies();
      const cookieToken = cookies.cookies.get('token');
      if (cookieToken) {
        try {
          await this.handleGoogleLogin(cookieToken);
          console.log("User restored from cookie");
        }
        catch(e) {
          console.log("Failed to restore user token from cookie");
          this.token = null;
          cookies.cookies.remove('token');
        }
      }
    },
    async handleGoogleLogin(token) {
      const resp = await post(backendUrl + '/login', {
        token: token
      });

      this.token = token;
      const cookies = useCookies();
      cookies.cookies.set('token', token);

      this.collections = new Map();
      const collections = useCollections();
      for (const c of resp.data.collections) {
        this.collections.set(c.name, c);
        if (!collections.collections.has(c.name)) {
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
