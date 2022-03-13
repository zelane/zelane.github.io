<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
  <HelloWorld />
</template>

<style src="@vueform/multiselect/themes/default.css"></style>
<style>
@import "./assets/fonts/beleren/index.css";
body {
  padding: 0;
  margin: 0;
  color: #efefef;
  background-color: #1a1a1e;
}
#app {
  font-family: "Calibri", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input[type="search"]:not(.multiselect-tags-search) {
  background-color: #222;
  box-shadow: 0px 2px 1px #000 !important;
  border: none;
  color: #efefef;
  height: 40px;
  border-radius: 4px;
  padding: 0 10px;
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
