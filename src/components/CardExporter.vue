<script setup>
import { useToast } from "vue-toastification";
import { post } from '../utils/network';
import { reactive, ref } from 'vue';
import Multiselect from '@vueform/multiselect';
import { cardsToText } from '../utils/formatters';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const props = defineProps({
  source: {
    type: Function,
    required: true,
  },
  openDirection: {
    type: String,
    default: 'down'
  }
});

const ui = reactive({
  format: "",
  downloadUrl: ""
});

const toast = useToast();

const downloadButton = ref(null);

const exportList = async () => {
  let cards = props.cards;
  if(cards) {
    cards = await props.source();
  }
  console.log(cards);
  let list = await cardsToText(cards, ui.format);
  if (ui.format === 'moxfield') {
    var blob = new Blob([list], { 
      type: 'text/csv;charset=utf-8;' 
    });
    var url = URL.createObjectURL(blob);
    ui.downloadUrl = url;
    downloadButton.value.setAttribute('download', 'moxfield.csv');
    downloadButton.value.click();
  }
  else {
    navigator.clipboard.writeText(list);
    toast(`Copied to Clipboard`);
  }
};
</script>
<template>
  <div class="row">
    <Multiselect
      :options="{
        'mtgo': 'MTGO',
        'mtga': 'MTGA',
        'mkm': 'MKM',
        'moxfield': 'Moxfield',
      }"
      label="key"
      v-model="ui.format"
      mode="single"
      placeholder="Export to"
      :open-direction="props.openDirection"
    />
    <a
      class="button small icon"
      :class="{
        'icon-clip': ui.format !== 'moxfield',
        'icon-arrow-down': ui.format === 'moxfield'
      }"
      download="moxfield.csv"
      @click="exportList"
    />
    <a
      class="button"
      download="moxfield.csv"
      ref="downloadButton"
      v-show="false"
      :href="ui.downloadUrl"
    >Export</a>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-direction: row;
  gap: .5rem;
}
</style>