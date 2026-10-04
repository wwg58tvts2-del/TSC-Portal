import { createRouter, createWebHashHistory } from "vue-router";
import PortalPage from "./PortalPage.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "portal", component: PortalPage },
    { path: "/login", name: "login", component: PortalPage },
    { path: "/bereich/:bereichId", name: "bereich", component: PortalPage },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});