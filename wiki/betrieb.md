# Betrieb

## Laufzeit

Das Projekt benötigt Node.js 20.19 oder neuer. Lokal: `npm ci`, `npm run dev`; Produktion: `npm ci`, `npm run build`. Das Docker-Image baut mit Node 24 und liefert `dist/` über Nginx aus. Produktivbetrieb benötigt HTTPS und korrekt weitergereichte Cookies; OIDC-Status und Logout verwenden `cache: "no-store"`.

`public/config.json` bestimmt den Konfigurationswebhook. Die OIDC-URLs und Form.io-Basisadresse kommen aus dessen Antwort. Vite bündelt JavaScript/CSS mit Inhalts-Hashes; Konfiguration, Bilder und gepinnte Vendor-Dateien werden aus `public/` nach `dist/` kopiert.

## Test-Deployment

`.github/workflows/docker-image.yml` baut bei Pushes auf `main` das Image `ghcr.io/wwg58tvts2-del/tsc-portal` mit `latest` und Commit-SHA-Tags und ruft danach den Portainer-Test-Stack-Webhook auf. Dafür muss das GitHub-Secret `PORTAINER_WEBHOOK_URL` ausschließlich auf den Task-Portal-Test-Stack zeigen. Compose verwendet standardmäßig Port `8088`.

Der Workflow aktualisiert nicht den Produktiv-Stack. GHCR-Zugangsdaten werden bei privatem Image in Portainer hinterlegt, nie im Repository. Keine Live-n8n-Webhook-Aufrufe als lokalen Funktionstest behandeln.

## Prüfung und Diagnose

- Produktionsbuild: `npm run build`.
- JSON-Konfiguration: `python3 -m json.tool public/config.json`.
- Suche: pro Kategorie Treffer, leere Suche und keine Treffer prüfen; `active` und `visibility` verbleiben beim Backend.
- OIDC: Statusantwort, Cookie-Weitergabe, CSRF-Logout und 401/403-Pfad prüfen.
- Form.io: HTTP-Fehler, fachliches `erfolgreich: false`, optionalen Download, Callback und `finally`-Cleanup prüfen.

Es gibt keinen eingebauten Browser-Test- oder Unit-Test-Runner. Für Portalansichten das vorgesehene Testsystem verwenden. API-Logs sind redigiert, dennoch keine Tokens oder Cookies in Ausgaben aufnehmen.