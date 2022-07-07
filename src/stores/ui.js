import { defineStore, acceptHMRUpdate } from 'pinia';

export const useUI = defineStore('ui', {
  state: () => {
    return {
      sidebar: {
        show: false,
        selected: '',
      },
      mainView: 'cards',
      zoom: 0,
    };
  },
  getters: {
  },
  actions: {
    showSidebar(view) {
      this.sidebar.selected = view;
      this.sidebar.show = true;
    },
    loadMain(view) {
      this.mainView = view;
      if(['upload', 'precons'].includes(view)) {
        this.sidebar.show = false;
      }
    },
  }
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUI, import.meta.hot));
}
