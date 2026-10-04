import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import router from "../src/router.js";
import { usePortalStore } from "./state.js";
import "../css/main.css";
import "../css/bereiche.css";

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
const state = usePortalStore(pinia);


window.showMsgBox = (titel, inhalt, zurueckNachSchliessen, options = {}) =>
  state.zeigeMeldung(titel, inhalt, zurueckNachSchliessen, options);


window.closeMsgBox = () =>
  state.schliesseMeldung();


window.zeigeLaden = (text) =>
  state.zeigeLadenIntern(text);


window.versteckeLaden = () =>
  state.versteckeLadenIntern();


window.showLoading =
  window.zeigeLaden;


window.hideLoading =
  window.versteckeLaden;


window.ladeMemberDaten = (options) =>
  state.ladeMemberDaten(options);


window.pruefeMeWebhook =
  window.ladeMemberDaten;


window.logoutMember = () =>
  state.logout();


window.sendeFormular = (instance, config) =>
  state.sendeFormular(instance, config);


app.mount("#vue-app");
