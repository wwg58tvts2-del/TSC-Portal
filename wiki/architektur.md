# Architektur

## Laufzeit

Das Task-Portal ist eine Vue-3-SPA mit Vite, Pinia und Vue Router. Es gibt genau einen HTML-Einstieg (`index.html`); `npm run build` erzeugt die auszuliefernde Anwendung unter `dist/`. Bootstrap, Bootstrap Icons und Form.io liegen lokal gepinnt in `public/vendor/`. Die eigentliche Konfiguration und die OIDC-Endpunkte kommen von n8n.

## Module

| Modul | Verantwortung |
| --- | --- |
| `index.html` | einziger Vite-Einstieg |
| `src/App.vue` | Router-Shell und Pinia-Initialisierung |
| `src/PortalPage.vue` | Login, Suche, Kategorien und Bereichsansichten |
| `src/router.js` | Hash-Routen ohne Server-Rewrite-Regel |
| `js/main.js` | Vue-/Pinia-Mount und globale Schnittstellen |
| `js/state.js` | Pinia-Store: Konfigurationsnormalisierung, OIDC, Suche, Meldungen und Form.io |
| `js/api.js` | Konfigurations-, Sitzungs-, Logout- und Formularrequests; redigiertes Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | Lesen bestehender `?bereich=`-Direktlinks |
| `css/main.css` | Importiert Stylesheets; `responsive.css` kommt zuletzt |

## Startablauf

1. `/config.json` liefert `configUrl` (aktuell `/webhook/config/portal`).
2. `state.js` lädt die Laufzeitkonfiguration ohne Cache und normalisiert die fünf Kategorien.
3. `/webhook/oidc/me` wird geprüft; ohne Sitzung erscheint der Login.
4. Nach Anmeldung erscheinen aktive Portal-Items. Die Suche setzt pro Item das Laufzeitfeld `visible`.
5. Vue Router verwaltet `/#/`, `/#/login` und `/#/bereich/:id`. Formulare werden über `formBaseUrl/<id>` in Form.io geöffnet; Prozessseiten zeigen `content` im Portal.

## Normalisierung

Root-Listen `apps`, `forms`, `processes`, `onlineServices` und `downloads` werden unterstützt. Prozesse können auch unter `pages` oder in älteren `areas`-/`bereiche`-Strukturen liegen. Englische Felder wie `title`/`description` und ältere deutsche Varianten `titel`/`beschreibung` werden beim Laden normalisiert. Die Suche arbeitet auf dieser normalisierten Config, nicht direkt auf HTML.

## Vertrauensgrenze

Das Portal stellt OIDC-Sitzungsstatus dar, ersetzt aber keine serverseitige Autorisierung. Prozess-HTML wird über `v-html` eingesetzt und muss aus einer vertrauenswürdigen, kontrollierten Konfiguration stammen.