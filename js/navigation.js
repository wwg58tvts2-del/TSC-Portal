// Liest den alten ?bereich=...-Query-Parameter für bestehende Direktlinks.

export function leseBereichIdAusUrl() {
  return new URLSearchParams(window.location.search).get("bereich");
}

