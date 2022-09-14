<script setup>
import MenuButton from './MenuButton.vue';
import { useToast } from "vue-toastification";
import { post } from '../utils/network';
import { useMeta } from '../stores/meta';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
});

const meta = useMeta();
const toast = useToast();

const exportList = async (format) => {
  let list = "";
  if(format === 'mtgo') {
    for(const card of props.cards.values()) {
      list += `${card.count || 1} ${card.name} \n`;
    };
  }
  else if(format === 'mtga') {
    for(const card of props.cards.values()) {
      list += `${card.count || 1} ${card.name} (${card.set}) ${card.collector_number}\n`;
    };
  }
  else if(format === 'mkm') {
    const versions = await post(`${backendUrl}/mkmVersions`, {
      ids: props.cards.map(c => c.id),
    });
    for(const card of props.cards.values()) {
      const version = versions.data[card.id] || 1;
      let set_name = "" + card.set_name;
      if(card.promo) {
        set_name = set_name.replace(" Promos", ": Promos");
      }
      else if(!card.booster) {
        set_name = set_name += ": Extras";
      }
      if(versions.data[card.id]) {
        list += `${card.count || 1}x ${card.name} (V.${version}) (${set_name})\n`;
      }
      else {
        list += `${card.count || 1}x ${card.name} (${set_name})\n`;
      }
    };
  }
  else if (format === 'moxfield') {
    list = '"Count","Tradelist Count","Name","Edition","Condition","Language","Foil","Tags","Last Modified","Collector Number"\n';
    for(const card of props.cards.values()) {
      list += `"${card.count || 1}","0","${card.name}","${card.set}","Near Mint","English","","","2022-03-22 02:52:33.210000","${card.collector_number}"\n`;
    };
  }
  navigator.clipboard.writeText(list);
  toast(`Copied to Clipboard`);
};
</script>
<template>
  <MenuButton 
    text="Export"
    :actions="{
      'MTGO': 'mtgo',
      'MTGA': 'mtga',
      'MKM': 'mkm',
      'Moxfield': 'moxfield',
    }"
    @click="exportList"
  />
</template>

<style scoped>

</style>