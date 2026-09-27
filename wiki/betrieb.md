# Betrieb

## Laufzeit

Das Portal wird als statische Website ausgeliefert. Ein npm-/Buildprozess ist im Repository nicht vorhanden. Die HTML-Seite bindet Petite Vue, Bootstrap, Bootstrap Icons und Form.io über CDNs ein. Produktivbetrieb benötigt HTTPS und korrekt weitergereichte Cookies; OIDC-Status und Logout verwenden `cache: "no-store"`.

`config.json` bestimmt den Konfigurationswebhook. Die OIDC-URLs und Form.io-Basisadresse kommen aus dessen Antwort. Änderungen an `index.html`, `main.js`, `state.js` oder CSS müssen mit den Cachekennungen in Script-, Modul- und Stylesheet-URLs abgestimmt werden.

## Deployment

Dieses Repository enthält keinen GitHub-Actions-Deploymentworkflow. Der produktive Veröffentlichungsweg ist daher nicht aus den Repository-Dateien ableitbar; vor einer Veröffentlichung den vereinbarten externen Deployprozess verwenden. Keine Live-n8n-Webhook-Aufrufe als lokalen Funktionstest behandeln.

## Prüfung und Diagnose

- JavaScript-Syntax: `node --check js/state.js` und `node --check js/main.js`.
- JSON-Konfiguration: `python3 -m json.tool config.json`.
- Suche: pro Kategorie Treffer, leere Suche und keine Treffer prüfen; `active` und `visibility` verbleiben beim Backend.
- OIDC: Statusantwort, Cookie-Weitergabe, CSRF-Logout und 401/403-Pfad prüfen.
- Form.io: HTTP-Fehler, fachliches `erfolgreich: false`, optionalen Download, Callback und `finally`-Cleanup prüfen.

Es gibt keinen eingebauten Browser-Test- oder Unit-Test-Runner. Für Portalansichten das vorgesehene Testsystem verwenden. API-Logs sind redigiert, dennoch keine Tokens oder Cookies in Ausgaben aufnehmen.