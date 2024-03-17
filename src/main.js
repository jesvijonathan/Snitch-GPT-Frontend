import { createApp } from "vue";
import { watch, nextTick } from "vue";

import JOS from "jos-animation";

import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import router from "./router";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import "./style.css";

library.add(fas, far, fab); // Add all the icon packs at once

// const app = createApp(App);
// app.use(router);
// app.mount("#app");

createApp(App)
  .component("font-awesome-icon", FontAwesomeIcon) // Register the component globally
  .use(router)
  .mount("#app");

// will add jos later
// JOS.init({
//   debugMode: true,
//   duration: 0.5,
//   //rootMargin: "10% 0% 10% 0%"
// });

// watch(
//   () => router.currentRoute.value,
//   () => {
//     nextTick(() => {
//       JOS.refresh();
//       console.log("refresh");
//     });
//   }
// );
