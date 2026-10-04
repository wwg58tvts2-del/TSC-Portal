# Architektur

## Laufzeit

Das Task-Portal ist eine Vue-3-SPA mit Vite, Pinia und Vue Router. Es gibt genau einen HTML-Einstieg (`index.html`); `npm run build` erzeugt die auszuliefernde Anwendung unter `dist/`. Bootstrap, Bootstrap Icons und Form.io liegen lokal gepinnt in `public/vendor/`. Die eigentliche Konfiguration und die OIDC-Endpunkte kommen von n8n.

## Module

| Modul | Verantwortung |
| --- | --- |
| `index.html` | einziger Vite-Einstieg |
| `src/App.vue` | Router-Shell und Pinia-Initialisierung |
| `src/PortalPage.vue` | Login, Suche, Kategorien und Bereichsansichten |
| `src/router.js` | Pfadrouten für Portal, Login und Bereichs-IDs mit Legacy-Weiterleitungen |
| `js/main.js` | Vue-/Pinia-Mount und globale Schnittstellen |
| `js/state.js` | Pinia-Store: Konfigurationsnormalisierung, OIDC, Suche, Meldungen und Form.io |
| `js/api.js` | Konfigurations-, Sitzungs-, Logout- und Formularrequests; redigiertes Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | Lesen bestehender `?bereich=`-Direktlinks |
| `css/main.css` | Importiert Stylesheets; `responsive.css` kommt zuletzt |

## Startablauf

1. `/config.json` liefert die Basis-URL `/webhook/portal-config`; das Frontend sendet `systemId=portal` als Query-Parameter.
2. `state.js` lädt die Laufzeitkonfiguration ohne Cache und normalisiert die fünf Kategorien.
3. `/webhook/oidc/me` wird geprüft; ohne Sitzung erscheint der Login.
4. Nach Anmeldung erscheinen aktive Portal-Items. Die Suche setzt pro Item das Laufzeitfeld `visible`.
5. Vue Router verwaltet `/`, `/login` und `/<bereich-id>`. Formular- und Prozessareas navigieren anhand ihrer IDs; Form.io lädt über `formBaseUrl/<id>`, Prozessareas zeigen `content`. Alte Hash-/Query-Links werden migriert.

## Normalisierung

`areas[]` aus dem System-JSON ist die primäre Konfiguration für Portalbereiche. Alte Root-Listen, `pages` und `bereiche.items` werden vorübergehend in Areas normalisiert. Englische Felder wie `title`/`description` und ältere deutsche Varianten `titel`/`beschreibung` werden beim Laden normalisiert.

## Vertrauensgrenze

Das Portal stellt OIDC-Sitzungsstatus dar, ersetzt aber keine serverseitige Autorisierung. Prozess-HTML wird über `v-html` eingesetzt und muss aus einer vertrauenswürdigen, kontrollierten Konfiguration stammen.