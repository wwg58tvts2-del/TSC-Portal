<script setup>
defineProps({
  config: { type: Object, default: () => ({}) },
  person: { type: Object, default: null },
  view: { type: String, default: "auswahl" },
  query: { type: String, default: "" },
  hasSearchItems: { type: Boolean, default: false }
});

defineEmits(["search", "clear-search", "logout"]);
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
      <div v-if="person && view === 'auswahl' && hasSearchItems" class="header-search">
        <label class="visually-hidden" for="portal-global-search">Suche</label>
        <div class="header-search-field">
          <i class="bi bi-search" aria-hidden="true"></i>
          <input id="portal-global-search" :value="query" @input="$emit('search', $event.target.value)" type="search" placeholder="Suche" autocomplete="off">
          <button v-if="query" class="header-search-clear" type="button" aria-label="Suche löschen" title="Suche löschen" @mousedown.prevent @click="$emit('clear-search')">
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
          <button class="header-login-button member-logout-button" type="button" @click="$emit('logout')">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>{{ (person.vorname || person.name || 'Vorstand').trim().split(/\s+/)[0] + ' abmelden' }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>