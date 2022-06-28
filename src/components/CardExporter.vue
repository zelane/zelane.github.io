<script setup>
import MenuButton from './MenuButton.vue';
import { useToast } from "vue-toastification";

const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
});

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
    for(const card of props.cards.values()) {
      list += `${card.count || 1} ${card.name} (${card.set_name})\n`;
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