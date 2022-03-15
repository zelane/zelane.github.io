<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from './components/HelloWorld.vue';
</script>

<template>
  <HelloWorld />
</template>

<style src="@vueform/multiselect/themes/default.css"></style>
<style src="@vueform/slider/themes/default.css"></style>
<style>
@import "./assets/fonts/index.css";
@import url("https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=PT+Serif:wght@400;700&family=Spectral:wght@300;400;500&display=swap");

* {
  box-sizing: border-box;
}

body {
  --default-fonts: "Spectral", Helvetica, Arial, sans-serif;
  --default-br: 4px;
  --default-shadow: 0px 2px 1px #000;
  --colour-input-grey: #222;
  --colour-light-font: #efefef;

  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #1a1a1e;
  --slider-height: 30px;
  --slider-connect-bg: #222;
  --slider-radius: 4px;
  --slider-handle-bg: #e5dbdc;
  --slider-handle-height: 30px;
  --slider-handle-width: 30px;
  --slider-handle-radius: 4px;
  --slider-handle-shadow: 0px 2px 1px #000;
  --slider-handle-ring-width: 0px;
  --slider-tooltip-bg: #10b981;
  --slider-tooltip-font-size: 1rem;
  --slider-tooltip-bg: transparent;
  --slider-tooltip-color: #222;
  --slider-tooltip-py: 2px;
  --slider-tooltip-px: 6px;
  --slider-tooltip-distance: -30px;
  --slider-tooltip-arrow-size: 1px;
}
button,
.button {
  font-family: var(--default-fonts);
  min-width: 120px;
  min-height: 40px;
  border-radius: var(--default-br);
  border: none;
  box-shadow: var(--default-shadow);
  background-color: var(--input-grey);
  color: var(--colour-light-font);
  font-size: 18px;
  font-weight: 600;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.1s;
  margin-top: 1px;
  margin-bottom: 1px;
}
button:hover,
button.small:hover,
.button:hover,
.button.small:hover {
  margin-top: 2px;
  margin-bottom: 0px;
  box-shadow: 0px 1px 1px #000;
  background-color: #292929;
}
button.small,
.button.small {
  border-radius: 4px;
  min-width: 40px;
  height: 40px;
  text-align: center;
  line-height: 44px;
  font-size: 30px;
  /* background-color: #42b983; */
  background-color: #222;
  border: none;
  /* border-bottom: 3px solid #42b983; */
  font-family: "Beleren SmallCaps Bold";
  box-shadow: 0px 2px 1px #000;
  color: #e5dbdc;
}
.slider-target {
  box-shadow: 0px 2px 1px #000;
}
div,
span {
  box-sizing: border-box;
}
#app {
  font-family: "Spectral", Helvetica, Arial, sans-serif;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input[type="text"]:not(.multiselect-tags-search),
input[type="search"]:not(.multiselect-tags-search),
input[type="number"] {
  background-color: #222;
  box-shadow: 0px 2px 1px #000 !important;
  border: none;
  color: #efefef;
  height: 40px;
  border-radius: 4px;
  padding: 0 10px;
  font-family: var(--default-fonts);
  font-size: 16px;
}

.multiselect {
  background-color: #222;
  box-shadow: 0px 2px 1px #000 !important;
  border: none;
}
.multiselect-search {
  background-color: #222;
  height: 40px;
  color: #efefef;
}
.multiselect-tags-search {
  background-color: #222;
  color: #efefef;
}
.multiselect-dropdown {
  background-color: #222;
  border: none;
}
.multiselect-option {
  background-color: #222;
}
</style>
