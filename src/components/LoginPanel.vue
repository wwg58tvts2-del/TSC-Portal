<script setup>
defineProps({
  title: { type: String, default: "Mit Microsoft 365 anmelden" },
  warning: { type: String, default: "" }
});

defineEmits(["login"]);
</script>

<template>
  <section id="member-login-container" class="portal-login" aria-labelledby="login-title">
    <div class="portal-login-heading">
      <p class="section-kicker">Anmeldung</p>
      <h1 id="login-title">Anmeldung zum Vereinsportal</h1>
    </div>
    <p class="portal-login-intro">Bitte melde dich mit deinem Microsoft-365-Konto an.</p>
    <p v-if="warning" class="alert alert-warning" role="alert">{{ warning }}</p>
    <div class="portal-login-controls">
      <section class="portal-login-step-card">
        <div class="portal-login-step-heading">
          <span class="portal-login-step-number">M365</span>
          <h2>Microsoft 365</h2>
        </div>
        <button class="portal-login-button" type="button" @click="$emit('login')">
          <i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>
          <span>{{ title }}</span>
        </button>
      </section>
    </div>
  </section>
</template>