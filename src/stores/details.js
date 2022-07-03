import { defineStore, acceptHMRUpdate } from 'pinia';
import { cachedGet } from '../utils/network';


export const useDetails = defineStore('details', {
  state: () => {
    return {
      card: {},
      rulings: [],
    };
  },
  actions: {
    async loadDetails(card, includeRulings = false) {
      this.rulings = [];
      this.card = card;
      if(includeRulings) {
        const cache = await caches.open('cardDataCache');
        const resp = await cachedGet(cache, card.rulings_uri);
        this.rulings = resp.data;
      }
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDetails, import.meta.hot));
}
