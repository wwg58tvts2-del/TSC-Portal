# Agent Guide: Task-Portal

## Projektgrenzen

Das Task-Portal ist ein statisches Petite-Vue-Frontend. n8n liefert die Portal-Konfiguration und betreibt den OIDC-Client; Form.io betreibt die konfigurierten Formulare. Diese externen Systeme und ihre Produktivdaten sind nicht Teil dieses Repositories.

Es gibt kein npm-Projekt und keinen Buildschritt. Bibliotheken werden über CDN-URLs eingebunden. Für Portalansichten das vorgesehene Testsystem verwenden; keine lokale Portalwebsite im integrierten Browser öffnen.

## Zuständigkeiten

- `index.html`: Header-/Suche, fünf Kategorien, Login und ausgewählter Portalbereich.
- `js/state.js`: Konfigurationsnormalisierung, Sitzungsstatus, sichtbare Items, Suche, URL-Zustand und Formularabläufe.
- `js/api.js`: Fetch-Aufrufe und redigiertes Response-Logging.
- `js/formio.js`: Lebenszyklus von Form.io-Instanzen.
- `js/navigation.js`: `?bereich=` und Browser-History.
- `js/main.js`: Petite-Vue-Mount und globale Schnittstellen.
- `css/main.css`: Importreihenfolge; `responsive.css` zuletzt laden.

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
2. Bei Moduländerungen Cachekennungen in `index.html` und importierenden Modulen zusammen aktualisieren.
3. Geänderte JavaScript-Dateien mit `node --check <datei>` prüfen; JSON mit `python3 -m json.tool <datei>`.
4. Suchänderungen mit Treffern aus allen Kategorien, leerer Suche, Legacy-Feldern und Suchbegriffen prüfen; gelieferte `active`- und `visibility`-Metadaten nicht clientseitig als Filter behandeln.
5. OIDC-/Form.io-Änderungen zusätzlich auf Fehlerpfade, CSRF, Cleanup und Rücknavigation prüfen. Keine Live-Webhook-Aufrufe ohne ausdrückliche Freigabe.

Es gibt hier kein automatisches Test- oder Buildsystem. Simulierte State-Tests nicht als Live-Integrationstest ausgeben.