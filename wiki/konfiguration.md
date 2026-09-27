# Konfiguration

## Einstiegspunkt

Die im Repository enthaltene `config.json` verweist auf den n8n-Endpunkt:

```json
{
  "configUrl": "/webhook/config/portal"
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

Jede Kategorie kann zusätzlich `kicker` und `intro` in `section` führen. Apps und Online-Services benötigen `url`; Form.io-Formulare benötigen `id`; Prozessseiten verwenden `content`; Downloads verwenden eine Datei-`url`. Die Legacy-Formate `pages`, `bereiche.items`, `areas`, `titel`, `beschreibung`, `typ`, `inhalt` und `neuesFenster` werden beim Laden teilweise übernommen.

## Login und Suche

`memberLogin.url` startet den Login und fällt ohne URL auf `/webhook/oidc` zurück. `memberStatusUrl` und `memberLogout` konfigurieren Status- und Logout-Aufrufe.

`active: false` blendet ein Item im Frontend aus. `visibility`, `person.gruppen` und OIDC-Rollen werden nicht für Gruppenfilterung verwendet. Die Kopfzeilensuche durchsucht alle fünf Kategorien nach `title`/`titel`, `description`/`beschreibung` und `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` oder `tags`.