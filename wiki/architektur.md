# Architektur

## Laufzeit

Das Task-Portal ist eine statische Website mit ES-Modulen und Petite Vue. Bootstrap, Bootstrap Icons und Form.io werden in `index.html` über CDNs eingebunden. Ein npm-Build oder Serverprozess ist im Repository nicht vorhanden. Die eigentliche Konfiguration und die OIDC-Endpunkte kommen von n8n.

## Module

| Modul | Verantwortung |
| --- | --- |
| `index.html` | Login, Kopfzeilensuche, Kategorien und ausgewählter Bereich |
| `js/main.js` | Petite-Vue-Mount und globale Schnittstellen |
| `js/state.js` | Konfigurationsnormalisierung, OIDC-State, Suche, Navigation, Meldungen und Form.io |
| `js/api.js` | Konfigurations-, Sitzungs-, Logout- und Formularrequests; redigiertes Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | `?bereich=` und Browser-History |
| `css/main.css` | Importiert Stylesheets; `responsive.css` kommt zuletzt |

## Startablauf

1. `config.json` liefert `configUrl` (aktuell `/webhook/config/portal`).
2. `state.js` lädt die Laufzeitkonfiguration ohne Cache und normalisiert die fünf Kategorien.
3. `/webhook/oidc/me` wird geprüft; ohne Sitzung erscheint der Login.
4. Nach Anmeldung erscheinen aktive Portal-Items. Die Suche setzt pro Item das Laufzeitfeld `visible`.
5. Formulare werden bei Auswahl über `formBaseUrl/<id>` in Form.io geöffnet; Prozessseiten zeigen `content` im Portal.

## Normalisierung

Root-Listen `apps`, `forms`, `processes`, `onlineServices` und `downloads` werden unterstützt. Prozesse können auch unter `pages` oder in älteren `areas`-/`bereiche`-Strukturen liegen. Englische Felder wie `title`/`description` und ältere deutsche Varianten `titel`/`beschreibung` werden beim Laden normalisiert. Die Suche arbeitet auf dieser normalisierten Config, nicht direkt auf HTML.

## Vertrauensgrenze

Das Portal stellt OIDC-Sitzungsstatus dar, ersetzt aber keine serverseitige Autorisierung. Prozess-HTML wird über `v-html` eingesetzt und muss aus einer vertrauenswürdigen, kontrollierten Konfiguration stammen.