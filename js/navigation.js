// Liest/schreibt ausschließlich den ?bereich=...-Query-Parameter und die Browser-History

export function leseBereichIdAusUrl() {
  return new URLSearchParams(window.location.search).get("bereich");
}

export function aktualisiereUrl(bereichId) {
  const pageUrl = new URL(window.location.href);

  if (bereichId) {
    pageUrl.searchParams.set("bereich", bereichId);
  } else {
    pageUrl.searchParams.delete("bereich");
  }

  const nextUrl = `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.pushState({ bereichId: bereichId || null }, "", nextUrl);
  }
}
