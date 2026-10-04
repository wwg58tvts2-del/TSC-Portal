# Task-Portal

Vue-3-SPA für Anwendungen, Formulare, Prozessseiten, Online-Services und Downloads. Das Frontend lädt Konfiguration und Microsoft-Entra-ID/OIDC-Sitzungsstatus über n8n. Form.io wird für die konfigurierten Portalformulare verwendet.

## Start

`public/config.json` verweist aktuell auf `/webhook/config/portal`. Die eigentliche Laufzeitkonfiguration kommt von diesem Endpunkt. Für Login und geschützte Formularrequests ist HTTPS mit funktionierender Cookie-Weitergabe erforderlich. Bootstrap, Bootstrap Icons und Form.io liegen lokal gepinnt unter `public/vendor/`.

Node.js 20.19 oder neuer wird benötigt:

```sh
npm ci
npm run dev
npm run build
```

Vite baut die SPA nach `dist/`; die Ansichten liegen unter `/#/`, `/#/login` und `/#/bereich/:id`.

## Kategorien

Die Root-Konfiguration enthält `apps.items`, `forms.items`, `processes.items`, `onlineServices.items` und `downloads.items`. Prozessseiten können auch als `pages` geliefert werden. Abschnittstexte stehen unter `section`. Formulare werden mit `formBaseUrl` und der Formular-`id` geöffnet; Anwendungen und Online-Services verwenden `url`; Prozessseiten verwenden `content`; Downloads verwenden `url`.

Die Kopfzeilensuche durchsucht alle fünf Kategorien nach Titel, Beschreibung und Suchbegriffen. `active` und `visibility` sind Backend-Metadaten: n8n muss Einträge vor der Auslieferung filtern und geschützte Requests serverseitig prüfen. Das Frontend zeigt alle gelieferten Einträge und wertet diese Felder nicht als Berechtigung aus.

## Anmeldung und Datenschutz

Der Loginbutton startet den konfigurierten `memberLogin.url` oder `/webhook/oidc`. `/webhook/oidc/me` prüft die Sitzung. Der Logout sendet POST mit `X-CSRF-Token`. Requests verwenden Cookies und `cache: "no-store"`; Token- und Cookie-Felder werden aus API-Logs redigiert. Proxy und n8n müssen die Session- und CSRF-Header korrekt weiterleiten.

`state.js` versucht bei einem nicht erreichbaren Konfigurationswebhook auf `config.local.json` zurückzufallen. Diese Datei ist nicht Bestandteil des Repositories und muss, falls dieser Entwicklungsweg genutzt wird, gesondert bereitgestellt werden.

## Dateien

| Pfad | Verantwortung |
| --- | --- |
| `index.html` | einziger Vite-Einstieg |
| `public/config.json` | URL zur Laufzeitkonfiguration |
| `src/App.vue` | Router-Shell und Store-Initialisierung |
| `src/PortalPage.vue` | Login, Kategorien, Suche und Bereichsdetails |
| `src/router.js` | Hash-Routen für Portal, Login und Bereiche |
| `src/stores/exposeReactiveState.js` | Pinia-Bindings für vorhandene Actions/Getters |
| `js/main.js` | Vue-/Pinia-Mount und globale Integrationen |
| `js/state.js` | Pinia-Store für Normalisierung, OIDC, Suche und Form.io |
| `js/api.js` | HTTP-Aufrufe und redigiertes Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | Lesen bestehender `?bereich=`-Direktlinks |
| `css/main.css` | Importiert die aufgeteilten Stylesheets |
| `wiki/` | Technische Referenz und Betriebswissen |

Details stehen im [Wiki](wiki/README.md); Regeln für Änderungen stehen in [agent.md](agent.md).

## Docker und Test

Pushes auf `main` bauen `ghcr.io/wwg58tvts2-del/tsc-portal` und aktualisieren ausschließlich den Portainer-Test-Stack über das Repository-Secret `PORTAINER_WEBHOOK_URL`. Der Standard-Testport ist `8088`; der Produktiv-Stack wird nicht automatisch aktualisiert. Details stehen in [DOCKER.md](DOCKER.md).