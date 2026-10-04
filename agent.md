# Agent Guide: Task-Portal

## Projektgrenzen

Das Task-Portal ist eine Vue-3-SPA mit Vite, Pinia und Vue Router. n8n liefert die Portal-Konfiguration und betreibt den OIDC-Client; Form.io betreibt die konfigurierten Formulare. Diese externen Systeme und ihre Produktivdaten sind nicht Teil dieses Repositories.

Abhängigkeiten stehen in `package.json`/`package-lock.json`; `npm ci`, `npm run dev` und `npm run build` sind die Standardbefehle. Drittanbieter-CSS/JS bleibt lokal gepinnt in `public/vendor/`. Für Portalansichten das vorgesehene Testsystem verwenden; keine lokale Portalwebsite im integrierten Browser öffnen.

## Zuständigkeiten

- `index.html`: einziger Vite-Einstieg.
- `src/App.vue`: Router-Shell, Pinia-Initialisierung und Portal-Outlet.
- `src/PortalPage.vue`: Header/Suche, fünf Kategorien, Login und Bereichsdetails.
- `src/router.js`: Hash-Routen für Portal, Login und Bereich.
- `src/stores/exposeReactiveState.js`: Pinia-Adapter für bestehende Actions/Getters.
- `js/state.js`: Task-Portal-Pinia-Store mit Normalisierung, OIDC, Suche und Form.io.
- `js/api.js`: Fetch-Aufrufe und redigiertes Response-Logging.
- `js/formio.js`: Lebenszyklus von Form.io-Instanzen.
- `js/navigation.js`: Legacy-`?bereich=`-Direktlinks lesen.
- `js/main.js`: Vue-/Pinia-Mount und globale Schnittstellen.
- `css/main.css`: Importreihenfolge; `responsive.css` zuletzt laden.
- `Dockerfile`, `compose.yaml`, `docker/`: Nginx-Image und Test-Stack.

## Daten- und Zugriffsregeln

- Konfigurationsobjekte werden beim Laden in `apps`, `forms`, `processes`, `onlineServices` und `downloads` normalisiert. Legacy-Formen wie `bereiche.items`, `pages`, `titel` und `beschreibung` bleiben unterstützt.
- Jedes normalisierte Item erhält `visible`. Die Kopfzeilensuche aktualisiert diese Flags; die Kategorien rendern ihre gefilterten Getter. Suchfelder: Titel, Beschreibung sowie `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` und `tags`.
- `active` und `visibility` werden im Frontend nicht ausgewertet. n8n verantwortet die Auswahl ausgelieferter Einträge; n8n/Form.io erzwingen Zugriffsrechte serverseitig. OIDC liefert den Sitzungsstatus, keine Item-Gruppenberechtigung.
- Apps und Online-Services benötigen eine URL. Form.io-Formulare benötigen `id` und `formBaseUrl`; Prozessseiten verwenden HTML-Inhalt in `content`.
- OIDC: Login über konfigurierte URL oder `/webhook/oidc`; Status über `/webhook/oidc/me`; Logout ausschließlich POST mit CSRF-Token.
- Form.io-Requests bleiben über `window.sendeFormular(instance, config)` zentralisiert. Responses mit `erfolgreich`, Meldung und optionalem Dateiinhalt gemäß bestehendem Vertrag behandeln.
- `visible` ist Laufzeitstatus, kein Backend-Zugriffsmerkmal. `v-for` soll die sichtbaren Getter verwenden; keine zusätzliche `v-show`-Schicht auf dieselben gefilterten Kacheln legen.

## Vorgehen und Prüfung

1. Quellcode ist die Referenz für Laufzeitverhalten; Konfiguration kommt vom n8n-Endpunkt.
2. `npm run build` prüft Vue-SFCs, Imports und die HTML-Einstiegsseite.
3. JSON mit `python3 -m json.tool <datei>` validieren.
4. Suchänderungen mit Treffern aus allen Kategorien, leerer Suche, Legacy-Feldern und Suchbegriffen prüfen; gelieferte `active`- und `visibility`-Metadaten nicht clientseitig als Filter behandeln.
5. OIDC-/Form.io-Änderungen zusätzlich auf Fehlerpfade, CSRF, Cleanup und Rücknavigation prüfen. Keine Live-Webhook-Aufrufe ohne ausdrückliche Freigabe.

Es gibt keinen Unit-Test-Runner. Simulierte State-Tests nicht als Live-Integrationstest ausgeben.