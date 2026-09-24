# Vorstandsportal

Konfigurierbares internes Portal für den Vorstand. Reines HTML/JS-Frontend (petite-vue, Bootstrap, Form.io), Backend/Konfiguration und künftig die Anmeldung per Microsoft 365 (OIDC) laufen über n8n. Architektur und Konventionen sind in [agent.md](agent.md) beschrieben.

## Struktur

- `index.html` – Einstiegspunkt, lädt Konfiguration von `/webhook/vorstand-config`.
- `css/` – gleiches Design wie das [Serviceportal](../5_Serviceportal/README.md).
- `js/` – `main.js`, `state.js`, `api.js`, `navigation.js`, `formio.js`.

## Konfigurationsbeispiel (`/webhook/vorstand-config`)

```json
{
  "page": { "title": "Vorstandsportal", "favicon": "img/favicon.png" },
  "header": { "logo": "img/logo.png", "kicker": "Vorstand", "caption": "Internes Portal" },
  "memberLogin": { "active": true, "titel": "Mit Microsoft 365 anmelden", "url": null },
  "memberLogout": { "webhookUrl": "/webhook/logout", "method": "GET", "ladeText": "Du wirst abgemeldet ..." },
  "body": { "kicker": "Willkommen", "title": "Vorstandsportal", "intro": "Interne Bereiche für den Vorstand." },
  "bereiche": {
    "formBaseUrl": "https://beispiel.form.io/vorstand",
    "section": { "kicker": "Bereiche", "title": "Deine Bereiche", "intro": "" },
    "items": [
      {
        "id": "protokolle",
        "titel": "Sitzungsprotokolle",
        "beschreibung": "Übersicht und Ablage der Protokolle.",
        "typ": "seite",
        "inhalt": "<p>Inhalt der Seite ...</p>",
        "sichtbarkeit": ["vorstand"],
        "active": true
      },
      {
        "id": "spesenantrag",
        "titel": "Spesenantrag",
        "beschreibung": "Formular für Spesenabrechnungen.",
        "typ": "formular",
        "sichtbarkeit": ["vorstand", "kassenwart"],
        "active": true
      }
    ]
  },
  "onlineServices": { "section": {}, "items": [] },
  "downloads": { "section": {}, "items": [] },
  "footer": []
}
```

`person.gruppen` (Array, aus `/webhook/me`) bestimmt, welche Bereiche sichtbar sind – Gruppennamen kommen aus Azure AD/M365 und werden frei in n8n gepflegt.
