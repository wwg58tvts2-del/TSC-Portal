<script setup>
import { onMounted, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { usePortalStore } from "../js/state.js";

const route = useRoute();
const portal = usePortalStore();

watch(
  () => route.name,
  (name) => {
    document.title = name === "bereich"
      ? `${portal.selectedBereich?.title || "Bereich"} | Vorstandsportal`
      : portal.config?.page?.title || "Vorstandsportal";
  },
  { immediate: true }
);

onMounted(() => {
  void portal.init();
});
</script>

<template>
  <RouterView />
</template>