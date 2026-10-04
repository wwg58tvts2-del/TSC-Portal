<script>
import { onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePortalStore } from "../js/state.js";
import { leseBereichIdAusUrl } from "../js/navigation.js";

export default {
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
  <header class="site-header">
    <div class="site-header-inner">
      <img
        id="header-logo"
        class="site-logo"
        src="/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png"
        :src="config?.header?.logo || '/img/Logo_ohne_Noten_transparenter_Hintergrund-1.png'"
        alt="Tanzsportclub Dortmund"
        :alt="config?.header?.logoAlt || 'Tanzsportclub Dortmund'"
      >
      <div v-if="person && view === 'auswahl' && hatSichtbarePortalEintraege" class="header-search">
        <label class="visually-hidden" for="portal-global-search">Suche</label>
        <div class="header-search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="portal-global-search" :value="suchtext" @input="setzeSuchtext($event.target.value)" type="search" placeholder="Suche" autocomplete="off">
          <button v-if="suchtext" class="header-search-clear" type="button" aria-label="Suche löschen" title="Suche löschen" @mousedown.prevent @click="leereSuche()">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <div class="header-right">
        <div class="header-copy">
          <span class="header-kicker">{{ config?.header?.kicker }}</span>
          <span class="header-caption">{{ config?.header?.caption }}</span>
        </div>
        <div class="header-actions" aria-label="Vorstandsbereich" v-if="person && config?.memberLogout">
          <button class="header-login-button member-logout-button" type="button" @click="logout()">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>{{ logoutName + ' abmelden' }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <main id="app">
    <section v-if="view === 'login'" id="member-login-container" class="portal-login" aria-labelledby="login-title">
      <div class="portal-login-heading">
        <p class="section-kicker">Anmeldung</p>
        <h1 id="login-title">Anmeldung zum Vereinsportal</h1>
      </div>
      <p class="portal-login-intro">Bitte melde dich mit deinem Microsoft-365-Konto an.</p>
      <p v-if="warnung" class="alert alert-warning" role="alert">{{ warnung }}</p>
      <div class="portal-login-controls">
        <section class="portal-login-step-card">
          <div class="portal-login-step-heading">
            <span class="portal-login-step-number">M365</span>
            <h2>Microsoft 365</h2>
          </div>
          <button class="portal-login-button" type="button" @click="login()">
            <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
            <span>{{ config?.memberLogin?.title || 'Mit Microsoft 365 anmelden' }}</span>
          </button>
        </section>
      </div>
    </section>

    <section v-else-if="view === 'auswahl'" id="form-selection">
      <section id="body-section">
        <p class="section-kicker">{{ config?.body?.kicker }}</p>
        <h1>{{ config?.body?.title }}</h1>
        <p class="section-intro">{{ config?.body?.intro }}</p>
      </section>

      <p v-if="warnung" class="alert alert-warning" role="alert">{{ warnung }}</p>
      <p v-if="keineSuchergebnisse" class="portal-search-empty" role="status">Keine Ergebnisse gefunden</p>

      <section v-if="sichtbareFormulare.length" id="forms-section">
        <div class="section-divider" aria-hidden="true"></div>
        <p class="section-kicker">{{ config?.forms?.section?.kicker }}</p>
        <h2 class="section-title">{{ config?.forms?.section?.title || 'Formulare' }}</h2>
        <p class="section-intro">{{ config?.forms?.section?.intro }}</p>
        <div class="form-options" aria-live="polite">
          <article class="form-option" v-for="bereich in sichtbareFormulare" :key="bereich.id">
            <h2>{{ bereich.title }}</h2>
            <p>{{ bereich.description }}</p>
            <button class="form-button-label" type="button" @click="oeffneBereich(bereich)">
              Formular öffnen
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </article>
        </div>
      </section>

      <section v-if="sichtbareProzesse.length" id="processes-section">
        <div class="section-divider" aria-hidden="true"></div>
        <p class="section-kicker">{{ config?.processes?.section?.kicker }}</p>
        <h2 class="section-title">{{ config?.processes?.section?.title || 'Prozesse' }}</h2>
        <p class="section-intro">{{ config?.processes?.section?.intro }}</p>
        <div class="form-options" aria-live="polite">
          <article class="form-option" v-for="prozess in sichtbareProzesse" :key="prozess.id">
            <h2>{{ prozess.title }}</h2>
            <p>{{ prozess.description }}</p>
            <button class="form-button-label" type="button" @click="oeffneBereich(prozess)">
              Öffnen
              <i class="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
          </article>
        </div>
      </section>

      <section v-if="sichtbareApps.length" id="apps-section">
        <div class="section-divider" aria-hidden="true"></div>
        <p class="section-kicker">{{ config?.apps?.section?.kicker }}</p>
        <h2 class="section-title">{{ config?.apps?.section?.title || 'Apps' }}</h2>
        <p class="section-intro">{{ config?.apps?.section?.intro }}</p>
        <div class="form-options" aria-live="polite">
          <article class="form-option" v-for="bereich in sichtbareApps" :key="bereich.url">
            <h2>{{ bereich.title }}</h2>
            <p>{{ bereich.description }}</p>
            <a class="service-button" :href="bereich.url" :target="bereich.openInNewWindow ? '_blank' : '_self'" :rel="bereich.openInNewWindow ? 'noopener noreferrer' : null">
              Öffnen
              <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
            </a>
          </article>
        </div>
      </section>

      <section v-if="sichtbareOnlineServices.length" id="services-section">
        <div class="section-divider" aria-hidden="true"></div>
        <p class="section-kicker">{{ config?.onlineServices?.section?.kicker }}</p>
        <h2 class="section-title">{{ config?.onlineServices?.section?.title || 'Online-Services' }}</h2>
        <p class="section-intro">{{ config?.onlineServices?.section?.intro }}</p>
        <div class="form-options service-options" aria-live="polite">
          <article class="form-option service-option" v-for="service in sichtbareOnlineServices" :key="service.id || service.url">
            <h2>{{ service.title }}</h2>
            <p>{{ service.description }}</p>
            <a class="service-button" :href="service.url" :target="service.openInNewWindow ? '_blank' : '_self'" :rel="service.openInNewWindow ? 'noopener noreferrer' : null">
              Öffnen
              <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
            </a>
          </article>
        </div>
      </section>

      <section v-if="sichtbareDownloads.length" id="downloads-section">
        <div class="section-divider" aria-hidden="true"></div>
        <p class="section-kicker">{{ config?.downloads?.section?.kicker }}</p>
        <h2 class="section-title">{{ config?.downloads?.section?.title || 'Downloads' }}</h2>
        <p class="section-intro">{{ config?.downloads?.section?.intro }}</p>
        <div class="form-options download-options" aria-live="polite">
          <article class="form-option download-option" v-for="download in sichtbareDownloads" :key="download.id || download.url">
            <h2>{{ download.title }}</h2>
            <p>{{ download.description }}</p>
            <a class="download-button" :href="download.url" target="_blank" rel="noopener noreferrer">
              <i class="bi bi-download" aria-hidden="true"></i>
              Download
            </a>
          </article>
        </div>
      </section>
    </section>

    <section v-else-if="view === 'seite'" id="page-container" class="form-modal">
      <div class="form-modal-backdrop" aria-hidden="true"></div>
      <div class="form-modal-dialog" role="dialog" aria-modal="true">
        <div class="form-modal-header">
          <button id="back-button" class="btn btn-outline-secondary" type="button" @click="zurueck()">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            Zurück
          </button>
        </div>
        <h1 class="visually-hidden">{{ selectedBereich?.title }}</h1>
        <div class="bereich-inhalt" v-html="selectedBereich?.content"></div>
      </div>
    </section>

    <section v-else id="form-container" class="form-modal">
      <div class="form-modal-backdrop" aria-hidden="true"></div>
      <div class="form-modal-dialog" role="dialog" aria-modal="true">
        <div class="form-modal-header">
          <button id="back-button" class="btn btn-outline-secondary" type="button" @click="zurueck()">
            <i class="bi bi-arrow-left" aria-hidden="true"></i>
            Zurück
          </button>
        </div>
        <h1 class="visually-hidden">{{ selectedBereich?.title }}</h1>
        <div id="formio"></div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <nav class="footer-links" aria-label="Rechtliches">
      <a v-for="link in sichtbareFooterLinks" :key="link.url" class="footer-link" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.title }}</a>
    </nav>
  </footer>

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