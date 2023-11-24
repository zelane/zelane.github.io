import { defineStore, acceptHMRUpdate } from 'pinia';
import { cachedGet } from '../utils/network';
import { Card } from '../models/Card';


export const useDetails = defineStore('details', {
  state: () => {
    return {
      card: {
        id: '',
        finish: '',
        count: 1,
        price: 0,
        data: {
          prices: {
            usd: 0,
            usd_foil: 0,
            usd_etched: 0,
            eur: 0,
            eur_foil: 0
          }
        }
      } as Card,
      rulings: [] as any,
    };
  },
  actions: {
    async loadDetails(card: Card, includeRulings: boolean = false) {
      this.rulings = [];
      this.card = card;
      if (includeRulings) {
        const cache = await caches.open('cardDataCache');
        const resp = await cachedGet(cache, card.data.rulings_uri);
        this.rulings = resp.data;
      }
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDetails, import.meta.hot));
}
