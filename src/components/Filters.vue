<script setup>
import Multiselect from '@vueform/multiselect';
import Colours from './Colours.vue';
import { useCollections } from '../stores/collections';
import { useCardView } from '../stores/cards';
import { useMeta } from '../stores/meta';

const collections = useCollections();
const cardView = useCardView();
const meta = useMeta();

const rarities = ['special', 'mythic', 'rare', 'uncommon', 'common'];


</script>

<template>
  <div class="filter-group rarities">
    <div
      class="input-group rarity"
      :data-rarity="rarity"
      v-for="rarity in rarities"
      :key="rarity"
    >
      <input
        type="checkbox"
        v-model="cardView.filters.rarity"
        :value="rarity"
        :id="rarity"
      >
      <label
        :for="rarity"
        :title="rarity"
      />
    </div>
  </div>

  <div class="filter-group colours">
    <Multiselect 
      :options="{
        'commander': 'Commader colours', 
        'exact': 'Has exactly these colours',
        'all': 'Has all of these colours',
        'any': 'Has any of these colours',
      }"
      v-model="cardView.filters.colours.mode"
      placeholder="Colour mode"
      :can-clear="false"
    />
    <Colours v-model="cardView.filters.colours.colours" />
  </div>
  <div class="filter-group">
    <input
      type="search"
      v-model="cardView.filters.name"
      placeholder="Name"
    >
  </div>

  <div class="filter-group mana">
    <input
      type="number"
      v-model="cardView.filters.mana.value[0]"
      placeholder="Mana (min)"
    >
    <input
      type="number"
      v-model="cardView.filters.mana.value[1]"
      placeholder="Mana (max)"
    >
  </div>

  <div class="filter-group price">
    <input
      type="number"
      v-model="cardView.filters.price.value[0]"
      placeholder="Price (min)"
    >
    <input
      type="number"
      v-model="cardView.filters.price.value[1]"
      placeholder="Price (max)"
    >
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="cardView.filters.tribes"
      :options="meta.types"
      :searchable="true"
      mode="tags"
      :create-option="true"
      placeholder="Types"
    />
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="cardView.filters.keywords"
      :options="cardView.keywords"
      :searchable="true"
      mode="tags"
      placeholder="Keywords"
    />
  </div>

  <div class="filter-group">
    <input
      type="search"
      v-model="cardView.filters.cardText"
      placeholder="Card text"
    >
  </div>

  <div class="filter-group">
    <Multiselect
      v-model="cardView.filters.sets"
      :options="cardView.sets"
      :searchable="true"
      mode="tags"
      placeholder="Sets"
    />
  </div>

  <div
    class="filter-group"
    v-if="cardView.tags.length > 0"
  >
    <Multiselect
      v-model="cardView.filters.tags"
      :options="[...cardView.tags]"
      :searchable="true"
      mode="tags"
      placeholder="Tags"
    />
  </div>

  <div
    class="filter-group compare"
    v-if="collections.all.length > 0"
  >
    <div class="header">
      <h3>Compare</h3>
      <a
        href="#"
        @click="() => {cardView.filters.incCol = []; cardView.filters.excCol = [];}"
      >X</a>
    </div>
    <div class="grid">
      <template
        v-for="col in collections.all"
        :key="col"
      >
        <div>{{ col }}</div>
        <div>
          <input
            type="checkbox"
            :id="col + '-cmp'"
            v-model="cardView.filters.cmpCol"
            :value="col"
          >
          <label
            class="cmp icon icon-compare_arrows"
            :for="col + '-cmp'"
          />
        </div>
        <div>
          <input
            type="checkbox"
            :id="col + '-inc'"
            v-model="cardView.filters.incCol"
            :value="col"
          >
          <label
            class="inc"
            :for="col + '-inc'"
          />
        </div>
        <div>
          <input
            type="checkbox"
            :id="col + '-exc'"
            v-model="cardView.filters.excCol"
            :value="col"
          >
          <label
            class="exc"
            :for="col + '-exc'"
          />
        </div>
      </template>
    </div>
  </div>
  
  <Multiselect
    v-model="cardView.filters.finish"
    :options="['nonfoil', 'foil', 'etched']"
    mode="single"
    placeholder="Finish"
  />
  
  <Multiselect
    v-model="cardView.filters.border"
    :options="['borderless', 'black', 'white']"
    mode="single"
    placeholder="Border"
  />

  <div class="filter-group quantity">
    <input
      type="number"
      v-model="cardView.filters.quantity.value[0]"
      placeholder="Count (min)"
    >
    <input
      type="number"
      v-model="cardView.filters.quantity.value[1]"
      placeholder="Count (max)"
    >
  </div>

  <div class="filter-group">
    <h3>Other</h3>
    <!-- <label for="group">Group by</label>
    <input
      id="group"
      type="checkbox"
      v-model="cardView.filters.group"
    > -->
    <Multiselect
      :options="['Name']"
      mode="single"
      placeholder="Group by"
      v-model="cardView.filters.group"
    />
  </div>
</template>

<style scoped>
.compare .grid {
  display: grid;
  grid-template-columns: 10fr 1fr 1fr 1fr;
  line-height: 1rem;
  background-color: var(--colour-input-grey);
  padding: 0.5rem;
  max-height: 10rem;
  overflow: auto;
  gap: 1rem;
}

.compare input[type="checkbox"] {
  display: none;
}
.compare label {
  display: block;
  text-align: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 1.5rem;
  line-height: 1.7rem;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--colour-dark-grey);
  font-family: var(--font-magic);
}
.compare label.inc::before {
  content: "+";
}
.compare label.exc::before {
  content: "-";
}
.compare input[type="checkbox"]:checked ~ label.cmp {
  color: var(--colour-green);
}
.compare input[type="checkbox"]:checked ~ label.inc {
  color: var(--colour-green);
}
.compare input[type="checkbox"]:checked ~ label.exc {
  color: var(--colour-red);
}
/* .mana {
  padding: 0 10px;
}
.mana input {
  min-width: 0;
} */
.filter-group.colours {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}
.price, .mana, .quantity {
  display: grid;
  gap: 0 .5rem;
  grid-template-columns: auto auto;
}
.price h3, .mana h3, .quantity h3 {
  grid-column: span 2;
}

.rarities {
  display: flex;
  gap: 0 .5rem;
}
.rarities {
  gap: 0 .5rem;
}
.rarities input[type="checkbox"]:checked + label {
  opacity: 1;
}
.rarities .input-group {
  min-width: 40px;
}
.rarities input[type="checkbox"] {
  display: none;
}
.rarity label {
  display: block;
  width: var(--height-input);
  opacity: 0.5;
  transition: all 0.1s;
  cursor: pointer;
  /* box-shadow: var(--default-shadow); */
}

.rarity label {
  font-size: var(--height-input);
  text-align: center;
  text-shadow: 0px 0px 1px black;
  border-radius: 50%;
  height: 30px;
  width: 30px;
  opacity: 0.3;
  margin: auto;
}

.rarity[data-rarity="mythic"] label {
  color: #bf4427;
  background-color: #de822b;
  /* color: var(--colour-input-grey);
  font-size: 0;
  background: linear-gradient(
    45deg,
    rgba(191, 122, 39, 1) 0%,
    rgba(191, 68, 39, 1) 100%
  );
  border-radius: 50%;
  height: 40px;
  width: 40px;
  display: block; */
}
.rarity[data-rarity="rare"] label {
  color: #a58e4a;
  background-color: #dbc98e;
}
.rarity[data-rarity="uncommon"] label {
  color: #707883;
  background-color: #7a939d;
}
.rarity[data-rarity="common"] label {
  background-color: #efefef;
}
.rarity[data-rarity="special"] label {
  background-color: #d8c6e1;
}

@media (max-width: 640px) {
}

</style>