<script setup>
import Prices from './Prices.vue';
import { useCollections } from '../stores/collections';
import { useCardView } from '../stores/cards';
import { usePrintsView, useClipboard } from '../stores/cards';
import { useDetails } from '../stores/details';
import { useUI } from '../stores/ui';
import { reactive } from 'vue';
import CardImage from './CardImage.vue';

const clipboard = useClipboard();
const cardView = useCardView();
const collections = useCollections();
const prints = usePrintsView();
const details = useDetails();
const ui = useUI();

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  actions: {
    type: Array,
    default: () => ['clip', 'delete', 'prints']
  }
});


const markings = {
  'nonfoil': '',
  'etched': '#',
  'foile': '☆'
};

const clip = async (card) => {
  let copy = {... card};
  copy.count = 1;
  clipboard.add(copy);
  await collections.save('clipboard', clipboard.unrefCards());
  const channel = new BroadcastChannel("clipboard");
  channel.postMessage('update');
};

const deleteCard = async (card) => {
  if(confirm(`Are you sure you want to delete ${card.name} from ${collections.open.join(', ')}`)) {
    await collections.deleteCard(collections.open, card);
    cardView.delete(card);
  };
};

</script>

<template>
  <div
    class="card"
    :style="{
      opacity: cardView.filters.cmpCol.length === 0 || cardView.have.get(card.oracle_id) ? 1 : 0.5
    }"
    :data-id="props.card.id"
  >
    <div class="wrap">
      <CardImage 
        :card="props.card"
        @click.stop="() => {details.loadDetails(card, includeRulings=true);}"
      />
      <div class="buttons">
        <!-- <button
          v-if="props.actions.includes('details')"
          class="small details icon icon-details"
          @click.stop="() => {details.loadDetails(card, includeRulings=true); ui.showSidebar('details')}"
          title="View details"
        /> -->
        <button
          v-if="props.actions.includes('prints')"
          class="small prints icon icon-prints"
          @click.stop="() => {prints.loadPrints(props.card.name); ui.showSidebar('prints')}"
          title="View all prints"
        />
        <button
          v-if="props.actions.includes('clip')"
          class="small clip icon icon-add"
          @click.stop="clip(card)"
          title="Add to clipboard"
        />
        <button
          v-if="props.actions.includes('delete')"
          class="small delete icon icon-delete"
          @click.stop="deleteCard(card)"
          title="Delete"
        />
      </div>
    </div>
    <div class="details">
      <p class="name">
        {{ props.card.count }} {{ props.card.name }} {{ markings[props.card.finish] }}
      </p>
      <p>
        {{ props.card.set_name }}
        <a
          v-if="props.card.purchase_uris"
          :href="props.card.purchase_uris.cardmarket"
          target="_blank"
          class="set-id"
        >{{ props.card.set }}:{{ props.card.collector_number }}</a>
      </p>
      <p>
        <Prices :card="props.card" />
      </p>
      <div class="tags">
        <div 
          class="tag" 
          v-for="tag in props.card.tags"
          :key="tag"
        >
          {{ tag }}
        </div>
        <template 
          v-if="props.card.promo_types"
        >
          <div
            class="tag"
            v-for="tag in props.card.promo_types.filter(card => {
              return card !== 'boosterfun';
            })"
            :key="tag"
          >
            {{ tag }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
}
.wrap .buttons {
  display: none;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  flex-direction: column;
  gap: .5rem;
}
.wrap:hover .buttons {
  display: flex;
}
p {
  font-size: .9em;
  text-indent: .5rem;
}
.name {
  font-weight: bold;
  display: block;
  font-size: 1em;
  font-family: "Beleren Bold";
  line-height: 1;
  /* font-weight: 600; */
}
.tags {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}
.tags .tag {
  font-size: .8rem;
  background-color: var(--colour-accent);
  color: #111;
  padding: .2rem .5rem;
  border-radius: 50px;
}
.set-id {
  color: #827684;
}

@media (max-width: 640px) {
  .card {
    /* scroll-snap-align: start; */
  }
  .wrap .buttons {
    display: flex;
    position: relative;
    flex-direction: row;
    margin-top: 1rem;
    align-items: center;
    justify-content: center;
    inset: 0;
  }
}
</style>