<script setup>
defineProps({
  title: { type: String, default: "" },
  wide: { type: Boolean, default: false }
});

defineEmits(["back"]);
</script>

<template>
  <section class="form-modal">
    <div class="form-modal-backdrop" aria-hidden="true"></div>
    <div class="form-modal-dialog" :class="{ 'form-modal-dialog--wide': wide }" role="dialog" aria-modal="true">
      <div class="form-modal-header">
        <button id="back-button" class="btn btn-outline-secondary" type="button" @click="$emit('back')">
          <i class="bi bi-arrow-left" aria-hidden="true"></i>
          Zurück
        </button>
      </div>
      <h1 class="visually-hidden">{{ title }}</h1>
      <slot />
    </div>
  </section>
</template>

  <style scoped>
  .form-modal-dialog {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
  }

  .form-modal-dialog--wide {
    max-width: 1040px;
  }

  @media (max-width: 600px) {
    .form-modal-dialog,
    .form-modal-dialog--wide {
      max-width: 100%;
    }
  }
  </style>