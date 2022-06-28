<script setup>
import CardView from './CardView.vue';
import { usePrintsView } from '../stores/cards';

const prints = usePrintsView();
const emit = defineEmits(['changed']);

prints.$onAction(() => {
  emit('changed');
});
</script>

<template>
  <h3>Prints</h3>
  <CardView
    :store="prints"
    :zoom="1"
    :actions="['clip']"
  />
</template>

<style scoped>

</style>