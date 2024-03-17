<script setup>
import { ref } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";

if (window.innerWidth < 800) {
  document.body.innerHTML = `<div style='
    height: 100%;
        width: 100%;
        font-size: 3vw;
        font-family: Poppins, sans-serif;
        font-weight: 600;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        font-family: cocoon;
        justify-content: center;
        color: black;
        z-index: 10;
        position: fixed;
        flex-direction: column;
        text-align: center;

  '>
    Sorry, this website is not available on mobile devices.
    <br/><br/>
    Use a desktop or laptop to view this website.
  </div>`;
}
</script>

<template>
  <div class="app">
    <router-view :key="$route.path" />
    <Footer />
  </div>
</template>

<style scoped></style>
