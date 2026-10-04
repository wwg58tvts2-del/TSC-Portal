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

      <PortalSection id="forms-section" :section="config?.forms?.section" fallback-title="Formulare" :items="sichtbareFormulare">
        <template #default="{ items }">
          <PortalItemCard v-for="bereich in items" :key="bereich.id" :title="bereich.title" :description="bereich.description">
            <template #action>
              <button class="form-button-label" type="button" @click="oeffneBereich(bereich)">
                Formular öffnen
                <i class="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>

      <PortalSection id="processes-section" :section="config?.processes?.section" fallback-title="Prozesse" :items="sichtbareProzesse">
        <template #default="{ items }">
          <PortalItemCard v-for="prozess in items" :key="prozess.id" :title="prozess.title" :description="prozess.description">
            <template #action>
              <button class="form-button-label" type="button" @click="oeffneBereich(prozess)">
                Öffnen
                <i class="bi bi-arrow-right" aria-hidden="true"></i>
              </button>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>

      <PortalSection id="apps-section" :section="config?.apps?.section" fallback-title="Apps" :items="sichtbareApps">
        <template #default="{ items }">
          <PortalItemCard v-for="bereich in items" :key="bereich.url" :title="bereich.title" :description="bereich.description">
            <template #action>
              <a class="service-button" :href="bereich.url" :target="bereich.openInNewWindow ? '_blank' : '_self'" :rel="bereich.openInNewWindow ? 'noopener noreferrer' : null">
                Öffnen
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </a>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>

      <PortalSection id="services-section" :section="config?.onlineServices?.section" fallback-title="Online-Services" :items="sichtbareOnlineServices" options-class="service-options">
        <template #default="{ items }">
          <PortalItemCard v-for="service in items" :key="service.id || service.url" variant="service" :title="service.title" :description="service.description">
            <template #action>
              <a class="service-button" :href="service.url" :target="service.openInNewWindow ? '_blank' : '_self'" :rel="service.openInNewWindow ? 'noopener noreferrer' : null">
                Öffnen
                <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
              </a>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>

      <PortalSection id="downloads-section" :section="config?.downloads?.section" fallback-title="Downloads" :items="sichtbareDownloads" options-class="download-options">
        <template #default="{ items }">
          <PortalItemCard v-for="download in items" :key="download.id || download.url" variant="download" :title="download.title" :description="download.description">
            <template #action>
              <a class="download-button" :href="download.url" target="_blank" rel="noopener noreferrer">
                <i class="bi bi-download" aria-hidden="true"></i>
                Download
              </a>
            </template>
          </PortalItemCard>
        </template>
      </PortalSection>
    </section>

    <AreaModal v-else-if="view === 'seite'" :title="selectedBereich?.title" @back="zurueck">
        <div class="bereich-inhalt" v-html="selectedBereich?.content"></div>
    </AreaModal>

    <AreaModal v-else :title="selectedBereich?.title" @back="zurueck">
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