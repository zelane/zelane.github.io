<script setup lang="ts">
  import { PropType } from 'vue';
import { useMeta } from '../stores/meta';
import { Card } from '../models/Card';

  
  const meta = useMeta();
  const props = defineProps({
    card: {
      type: Object as PropType<Card>,
      required: true,
    },
    all: {
      type: Boolean,
      default: true
    }
  });

  const markings = {
    'nonfoil': '',
    'etched': '#',
    'foil': '☆'
  };

</script>

<template>
  <span 
    class="prices"
  >
    <span
      v-for="finish in props.card.data.finishes"
      :key="finish"
    >
      <span
        class="price"
        :class="finish === props.card.finish ? 'match' : ''"
        v-show="props.all || props.card.finish === finish"
        v-if="finish === 'nonfoil'"
      >
        {{ markings[finish] }} {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
          props.card.data.prices['eur'] * meta.forex['eur'] || (props.card.data.prices['usd'] * meta.forex['usd'])
        ) 
        }}
      </span>
      <span
        class="price"
        :class="finish === props.card.finish ? 'match' : ''"
        v-show="props.all || props.card.finish === finish"
        v-else
      >
        {{ markings[finish] }} {{ 
          new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(
            props.card.data.prices['eur_' + finish] * meta.forex['eur'] || (props.card.data.prices['usd_' + finish] * meta.forex['usd']
            )) 
        }}
      </span>
    </span>
  </span>
</template>

<style scoped>

.prices {
  display: flex;
  flex-wrap: wrap;
  gap: .5em;
}
.price {
  opacity: .4;
}
.price.match {
  opacity: 1;
}
</style>