<script setup>

  const props = defineProps({
    card: {
      type: Object,
      required: true
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
      v-for="finish in props.card.finishes"
      :key="finish"
    >
      <span
        class="price"
        :class="finish === props.card.finish ? 'match' : ''"
        v-show="props.all || props.card.finish === finish"
        v-if="finish === 'nonfoil'"
      >
        {{ markings[finish] }} {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(props.card.prices['eur'] || (props.card.prices['usd'] * 0.9)) }}
      </span>
      <span
        class="price"
        :class="finish === props.card.finish ? 'match' : ''"
        v-show="props.all || props.card.finish === finish"
        v-else
      >
        {{ markings[finish] }} {{ new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(props.card.prices['eur_' + finish] || (props.card.prices['usd_' + finish] * 0.9)) }}
      </span>
    </span>
  </span>
</template>

<style scoped>

.prices {
  display: flex;
  flex-wrap: wrap;
}
.price {
  opacity: .4;
}
.price.match {
  opacity: 1;
}
</style>