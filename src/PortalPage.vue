<script>
import { onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePortalStore } from "../js/state.js";
import { leseBereichIdAusUrl } from "../js/navigation.js";
import AreaModal from "./components/AreaModal.vue";
import LoginPanel from "./components/LoginPanel.vue";
import PortalFooter from "./components/PortalFooter.vue";
import PortalHeader from "./components/PortalHeader.vue";
import PortalItemCard from "./components/PortalItemCard.vue";
import PortalSection from "./components/PortalSection.vue";

export default {
  components: {
    AreaModal,
    LoginPanel,
    PortalFooter,
    PortalHeader,
    PortalItemCard,
    PortalSection
  },
  setup() {
    const state = usePortalStore();
    const route = useRoute();
    const router = useRouter();

    watch(
      () => [state.view, state.selectedBereich?.id],
      ([view, bereichId]) => {
        if (view === "login" && route.name !== "login") {
          void router.replace({ name: "login" });
        } else if (
          (view === "formular" || view === "seite") &&
          bereichId &&
          (route.name !== "bereich" || route.params.bereichId !== bereichId)
        ) {
          void router.replace({ name: "bereich", params: { bereichId } });
        } else if (view === "auswahl" && route.name !== "portal") {
          void router.replace({ name: "portal" });
        }
      },
      { flush: "post" }
    );

    watch(
      () => [route.name, route.params.bereichId, state.config, state.person, state.memberStatusChecked],
      ([routeName, routeBereichId, config, person]) => {
        if (!config || !state.memberStatusChecked) {
          return;
        }

        if (!person) {
          state.zeigeAnmeldung();
          return;
        }

        if (routeName === "login") {
          void router.replace({ name: "portal" });
          return;
        }

        const bereichId = routeName === "bereich"
          ? String(routeBereichId || "")
          : leseBereichIdAusUrl();
        if (bereichId) {
          const bereich = state.findeBereich(bereichId);
          if (!bereich) {
            state.warnung = "Der angeforderte Bereich wurde nicht gefunden.";
            state.zurueck();
            return;
          }
          if (state.selectedBereich?.id !== bereich.id) {
            state.zerstoereFormio();
            state.selectedBereich = bereich;
          }
          state.view = bereich.type === "form" ? "formular" : "seite";
          return;
        }

        if (routeName === "portal") {
          state.zerstoereFormio();
          state.selectedBereich = null;
          state.view = "auswahl";
        }
      },
      { immediate: true }
    );

    watch(
      () => [state.view, state.selectedBereich?.id],
      ([view, bereichId]) => {
        if (view === "formular" && bereichId) {
          void state.ladeFormioEffect();
        }
      },
      { flush: "post", immediate: true }
    );

    onBeforeUnmount(() => {
      state.zerstoereFormio();
    });

    return state;
  }
};
</script>

<template>
  <PortalHeader
    :config="config"
    :person="person"
    :view="view"
    :query="suchtext"
    :has-search-items="hatSichtbarePortalEintraege"
    @search="setzeSuchtext"
    @clear-search="leereSuche"
    @logout="logout"
  />

  <main id="app">
    <LoginPanel v-if="view === 'login'" :title="config?.memberLogin?.title" :warning="warnung" @login="login" />

    <section v-else-if="view === 'auswahl'" id="form-selection">
      <section id="body-section">
        <p class="section-kicker">{{ config?.body?.kicker }}</p>
        <h1>{{ config?.body?.title }}</h1>
        <p class="section-intro">{{ config?.body?.intro }}</p>
      </section>

      <p v-if="warnung" class="alert alert-warning" role="alert">{{ warnung }}</p>
      <p v-if="keineSuchergebnisse" class="portal-search-empty" role="status">Keine Ergebnisse gefunden</p>

      <PortalSection
        v-for="area in sichtbareAreas"
        :id="area.id"
        :key="area.id"
        :section="area.section"
        :fallback-title="area.title || area.id"
        :items="area.items"
        :options-class="area.optionsClass || (area.type === 'service' ? 'service-options' : area.type === 'download' ? 'download-options' : '')"
      >
        <template #default="{ items }">
          <PortalItemCard
            v-for="(item, index) in items"
            :key="item.id || item.url || `${area.id}-${index}`"
            :variant="['link', 'app', 'service'].includes(item.type) ? 'service' : item.type === 'download' ? 'download' : ''"
            :title="item.title"
            :description="item.description"
          >
            <template #action>
              <button
                v-if="item.type === 'form' || item.type === 'page'"
                class="form-button-label"
                type="button"
                @click="oeffneBereich(item)"
              >
                {{ item.type === 'form' ? 'Formular öffnen' : 'Öffnen' }}
                <i class="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
              <a
                v-else
                :class="item.type === 'download' ? 'download-button' : 'service-button'"
                :href="item.url"
                :target="(item.openInNewWindow ?? item.neuesFenster ?? item.type === 'download') ? '_blank' : '_self'"
                :rel="(item.openInNewWindow ?? item.neuesFenster ?? item.type === 'download') ? 'noopener noreferrer' : null"
              >
                <i :class="item.type === 'download' ? 'bi bi-download' : 'bi bi-box-arrow-up-right'" aria-hidden="true"></i>
                {{ item.type === 'download' ? 'Download' : 'Öffnen' }}
              </a>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>
    </section>

    <AreaModal v-else-if="view === 'seite'" :title="selectedBereich?.title" @back="zurueck">
        <div class="bereich-inhalt" v-html="selectedBereich?.content"></div>
    </AreaModal>

    <AreaModal v-else :title="selectedBereich?.title" :wide="Number(selectedBereich?.width) === 2" @back="zurueck">
        <div id="formio"></div>
    </AreaModal>
  </main>

  <PortalFooter :links="sichtbareFooterLinks" />

  <div class="msgbox-overlay" v-if="msgbox.visible">
    <div class="msgbox-backdrop" aria-hidden="true" @click="schliesseMeldung()"></div>
    <div class="msgbox-dialog" role="alertdialog" aria-modal="true">
      <h3 class="msgbox-title">{{ msgbox.titel }}</h3>
      <div class="msgbox-content" style="white-space: pre-line">{{ msgbox.inhalt }}</div>
      <button class="msgbox-close-btn" type="button" @click="schliesseMeldung()">{{ msgbox.buttonText }}</button>
    </div>
  </div>

  <div class="lade-overlay" v-cloak v-if="loading.visible" role="status" aria-live="polite">
    <div class="lade-box">
      <div class="lade-spinner" aria-hidden="true"></div>
      <div class="lade-text">{{ loading.text }}</div>
    </div>
  </div>
</template>