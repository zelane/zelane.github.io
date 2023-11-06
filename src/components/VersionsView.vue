<script setup>
import CardView from './CardView.vue';
import { useVersionsView } from '../stores/cards';

const prints = useVersionsView();
const emit = defineEmits(['changed']);

</script>

<template>
  <h3>Prints</h3>
  <div class="prints">
    <CardView
      :store="prints"
      :actions="['clip']"
    />
  </div>
</template>

<style scoped>
</style>
