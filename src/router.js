import { createRouter, createWebHistory } from "vue-router";
import PortalPage from "./PortalPage.vue";

if (window.location.hash.startsWith("#/")) {
  const legacyRoute = window.location.hash.slice(1);
  const basePath = window.location.pathname.endsWith("/index.html")
    ? window.location.pathname.slice(0, -"index.html".length)
    : window.location.pathname;
  window.history.replaceState(
    window.history.state,
    "",
    `${basePath}${window.location.search}${legacyRoute}`
  );
}

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "portal", component: PortalPage },
    { path: "/login", name: "login", component: PortalPage },
    {
      path: "/bereich/:bereichId",
      name: "legacy-bereich",
      redirect: (route) => ({ name: "bereich", params: { bereichId: route.params.bereichId } })
    },
    { path: "/:bereichId", name: "bereich", component: PortalPage },
    { path: "/:pathMatch(.*)*", redirect: "/" }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});