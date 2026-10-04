# Konfiguration

## Einstiegspunkt

Die unter `public/config.json` abgelegte und unter `/config.json` ausgelieferte Datei verweist auf den n8n-Endpunkt:

```json
{
  "configUrl": "/webhook/portal-config"
}
```

`state.js` lädt zuerst diesen Endpunkt und normalisiert anschließend die Antwort. Wenn der konfigurierte Webhook fehlschlägt, versucht der State `config.local.json`; diese Datei ist nicht eingecheckt und wird nicht mitgeliefert.

## Beispielstruktur

```json
{
  "page": { "title": "Task-Portal", "favicon": "img/favicon.png" },
  "header": { "logo": "img/logo.png", "kicker": "Portal", "caption": "Anwendungen und Prozesse" },
  "body": { "kicker": "Willkommen", "title": "Portal", "intro": "Zentraler Zugang." },
  "memberLogin": { "url": "/webhook/oidc" },
  "memberStatusUrl": "/webhook/oidc/me",
  "memberLogout": { "webhookUrl": "/webhook/oidc/logout", "method": "POST" },
  "formBaseUrl": "https://example.form.io/portal",
  "forms": { "section": { "title": "Formulare" }, "items": [{ "id": "antrag", "title": "Antrag", "description": "Beschreibung", "active": true }] },
  "apps": { "section": { "title": "Apps" }, "items": [{ "id": "app", "title": "Anwendung", "description": "Beschreibung", "url": "https://example.org", "active": true }] },
  "processes": { "section": { "title": "Prozesse" }, "items": [{ "id": "ablauf", "title": "Ablauf", "description": "Beschreibung", "content": "<p>Inhalt</p>", "active": true }] },
  "onlineServices": { "section": { "title": "Online-Services" }, "items": [] },
  "downloads": { "section": { "title": "Downloads" }, "items": [] },
  "footer": []
}
```

`areas[]` im System-JSON definiert die Portalbereiche in Reihenfolge. Jede Area enthält `id`, `type`, `section` und ihre in der API-Antwort ergänzten Items; die Tabellenzeilen werden anhand von `system_id` und `area == id` zugeordnet. `section` verwendet `kicker`, `title` und `intro`.

`area.type` ist der Standardtyp für Items ohne eigenen Typ. Jedes Item kann `type` auf `form`, `page`, `link`, `app`, `service` oder `download` setzen. Formulare verwenden die Item-`id` und `formBaseUrl`; `width: 1` ist die Standardbreite, `width: 2` belegt zwei Kartenraster-Spalten. Link-Items verwenden `url` und `openInNewWindow: true` für ein neues Fenster (`false` öffnet im selben Fenster). Seiten verwenden `id` und `content`. Legacy-Felder wie `pages`, `bereiche.items`, `titel`, `beschreibung`, `typ`, `inhalt` und `neuesFenster` werden für die Übergangszeit normalisiert.

## Login und Suche

`memberLogin.url` startet den Login und fällt ohne URL auf `/webhook/oidc` zurück. `memberStatusUrl` und `memberLogout` konfigurieren Status- und Logout-Aufrufe.

`active` und `visibility` sind Backend-Metadaten. Das Frontend filtert sie nicht; n8n entscheidet, welche Items ausgeliefert werden, und n8n/Form.io müssen geschützte Requests autorisieren. Die Kopfzeilensuche durchsucht alle fünf Kategorien nach `title`/`titel`, `description`/`beschreibung` und `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` oder `tags`.