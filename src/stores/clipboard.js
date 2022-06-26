import { defineStore, acceptHMRUpdate } from 'pinia';

const formatter = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' });

export const useClipboard = defineStore('clipboard', {
  state: () => {
    return {
      cards: new Map(),
    };
  },
  getters: {
    count(state) {
      return [... state.cards.values()].reduce((total, card) => {
        return total += card.count;
      }, 0);
    },
    price(state) {
      const total = [...state.cards.values()].reduce((sum, a) => sum += a.price * a.count, 0);
      return formatter.format(total);
    }
  },
  actions: {
    add(card, countAll = false) {
      let clipcard = this.cards.get(card.id);

      if (!card.price) card.price = parseFloat(card.prices.eur || parseFloat(card.prices.usd) * 0.9 || 0);
      if (!clipcard) {
        clipcard = { ...card };
        if (!card.count) clipcard.count = 1;
      }
      else {
        clipcard.count += countAll ? (card.count || 1) : 1;
      }
      this.cards.set(clipcard.id, clipcard);
    },
    addMany(cards, countAll = false) {
      cards.forEach(card => {
        this.add(card, countAll);
      });
    }
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useClipboard, import.meta.hot));
}
