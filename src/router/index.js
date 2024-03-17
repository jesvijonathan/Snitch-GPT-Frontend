import { createRouter, createWebHistory } from "vue-router";

import home from "../views/home.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: home,
    },
    {
      path: "/404",
      name: "404",
      return: "failed",
    },
    // {
    //   path: "/:pathMatch(.*)*",
    //   redirect: "/404",
    // },
  ],
});
export default router;

// router.beforeEach((to, from, next) => {
//   if (to.matched.length === 0) {
//     next("/404");
//   } else {
//     next();
//   }
// });

// // render only PathNotFound component if path is not found, no need for a layout
// router.onError((error) => {
//   if (error.name === "NavigationDuplicated") {
//     router.push(error.location);
//   } else {
//     router.push("/404");
//   }
// });
