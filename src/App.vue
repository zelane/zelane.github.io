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
  --default-br: 1px;
  --default-shadow: 3px 3px 4px 0px rgba(0, 0, 0, 0.15),
    inset 1px 1px 1px 0px rgba(255, 255, 255, 0.03);
  --default-border: none;
  --colour-input-grey: #221e26;
  --colour-light-font: #efefef;
  --colour-dark-grey: #110d12;
  --colour-accent: #938996;

  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #100c0f;
  background-color: var(--colour-dark-grey);
  --slider-height: 30px;
  --slider-bg: #918295;
  --slider-connect-bg: var(--colour-input-grey);
  --slider-radius: var(--default-br);
  --slider-handle-bg: #e5dbdc;
  --slider-handle-height: 30px;
  --slider-handle-width: 30px;
  --slider-handle-radius: 50%;
  --slider-handle-shadow: var(--default-shadow);
  --slider-handle-ring-width: 0px;
  --slider-tooltip-bg: #10b981;
  --slider-tooltip-font-size: 1rem;
  --slider-tooltip-bg: transparent;
  --slider-tooltip-color: var(--colour-input-grey);
  --slider-tooltip-py: 2px;
  --slider-tooltip-px: 6px;
  --slider-tooltip-distance: -30px;
  --slider-tooltip-arrow-size: 1px;

  --ms-radius: var(--default-br);
  --ms-bg: var(--colour-input-grey);
  --ms-dropdown-bg: var(--colour-input-grey);
  --ms-tag-bg: #6f334c;

  --ms-color: var(--colour-light-font);
  /* --ms-border-width: 0; */
}
button,
.button {
  font-family: var(--default-fonts);
  border: var(--default-border);
  min-width: 120px;
  min-height: 40px;
  border-radius: var(--default-br);
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
  border-radius: var(--default-br);
  min-width: 40px;
  height: 40px;
  text-align: center;
  line-height: 44px;
  font-size: 30px;
  background-color: var(--colour-input-grey);
  font-family: "Beleren SmallCaps Bold";
  box-shadow: var(--default-shadow);
  color: #e5dbdc;
}
.slider-target {
  box-shadow: var(--default-shadow);
}
div,
span {
  box-sizing: border-box;
}
#app {
  font-family: var(--default-fonts);
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input[type="text"]:not(.multiselect-tags-search),
input[type="search"]:not(.multiselect-tags-search),
input[type="number"] {
  background-color: var(--colour-input-grey);
  box-shadow: var(--default-shadow) !important;
  border: var(--default-border);
  color: #efefef;
  height: 40px;
  border-radius: var(--default-br);
  padding: 0 10px;
  font-family: var(--default-fonts);
  font-size: 16px;
}

.multiselect {
  /* background-color: var(--colour-input-grey); */
  box-shadow: var(--default-shadow) !important;
  border: var(--default-border);
}
.multiselect-search {
  background-color: var(--colour-input-grey);
  height: 40px;
  color: #efefef;
}
.multiselect-tags-search {
  background-color: var(--colour-input-grey);
  color: #efefef;
}
.multiselect-dropdown {
  background-color: var(--colour-input-grey);
  border: var(--default-border);
}
.multiselect-option {
  background-color: var(--colour-input-grey);
}
</style>
