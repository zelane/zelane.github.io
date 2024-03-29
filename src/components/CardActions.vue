<script setup lang="ts">
import { useCollections } from '../stores/collections';
import { useCardView, useVersionsView } from '../stores/cards';
import { usePrintsView, useClipboard } from '../stores/cards';
import { useUI } from '../stores/ui';
import { PropType } from 'vue';
import { Card } from '../models/Card';

const clipboard = useClipboard();
const cardView = useCardView();
const collections = useCollections();
const prints = usePrintsView();
const versions = useVersionsView();
const ui = useUI();
const cards = useCardView();

const props = defineProps({
  card: {
    type: Object as PropType<Card>,
    required: true
  },
  actions: {
    type: Array,
    default: () => ['select', 'deselect', 'clip', 'delete', 'prints', 'edit']
  }
});

const emit = defineEmits(['select', 'deselect']);

const clip = async (card: Card) => {
  let copy = {... card};
  copy.count = 1;
  clipboard.add(copy);
  await collections.addMany('clipboard', [card], 'add');
  // await collections.save('clipboard', clipboard.unrefCards());
  const channel = new BroadcastChannel("clipboard");
  channel.postMessage('update');
  ui.clipboard_change = true;
  setTimeout(()=> {
    ui.clipboard_change = false;
  }, 500)
};

const deleteCard = async (card: Card) => {
  if(confirm(`Are you sure you want to delete ${card.data.name} from ${collections.open.join(', ')}`)) {
    await collections.deleteCard(collections.open, card);
    cardView.delete(card);
  };
};
</script>

<template>
  <div class="buttons">
    <!-- <button
      v-if="props.actions.includes('details')"
      class="small details icon icon-details"
      @click.stop="() => {details.loadDetails(card, includeRulings=true); ui.showSidebar('details')}"
      title="View details"
    /> -->
    <button
      v-if="props.actions.includes('select') && !cards.selected.has(card.id + card.finish)"
      class="small select icon icon-check"
      @click.stop="() => {emit('select')}"
      title="Select"
    />
    <button
      v-if="props.actions.includes('deselect') && cards.selected.has(card.id + card.finish)"
      class="small deselect icon icon-clear"
      @click.stop="() => {emit('deselect')}"
      title="Deselect"
    />
    <button
      v-if="props.actions.includes('prints')"
      class="small prints icon icon-prints"
      @click.stop="() => {prints.loadPrints(props.card.data.name); ui.showSidebar('prints')}"
      title="View all prints"
    />
    <button
      v-if="props.actions.includes('prints') && cardView.filters.group"
      class="small versions icon icon-list"
      @click.stop="() => {versions.loadVersions(props.card.data.oracle_id); ui.showSidebar('versions')}"
      title="View versions in open collections"
    />
    <button
      v-if="props.actions.includes('clip')"
      class="small clip icon icon-add"
      @click.stop="clip(card)"
      title="Add to clipboard"
    />
    <button
      v-if="props.actions.includes('edit') && ui.source === 'collection'"
      class="small edit icon icon-edit"
      @click.stop="() => {ui.edit.card = props.card; ui.showSidebar('edit')}"
      title="Edit"
    />
    <button
      v-if="props.actions.includes('delete') && ui.source === 'collection'"
      class="small delete icon icon-delete"
      @click.stop="() => {deleteCard(card); ui.details.show = false; ui.details.card = {}}"
      title="Delete"
    />
  </div>
</template>

<style scoped>
.buttons {
  display: none;
  gap: .5rem;
}
.buttons {
  display: flex;
}

@media (max-width: 640px) {
  .buttons {
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    inset: 0;
  }
}
</style>