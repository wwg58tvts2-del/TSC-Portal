# Vorstandsportal

Konfigurierbares internes Portal für den Vorstand. Reines HTML/JS-Frontend (petite-vue, Bootstrap, Form.io), Backend/Konfiguration und Microsoft-365-Anmeldung (OIDC) laufen über n8n. Architektur und Konventionen sind in [agent.md](agent.md) beschrieben.

## Struktur

- `index.html` – Einstiegspunkt, lädt Konfiguration von `/webhook/vorstand-config`.
- `css/` – gleiches Design wie das [Serviceportal](../5_Serviceportal/README.md).
- `js/` – `main.js`, `state.js`, `api.js`, `navigation.js`, `formio.js`.

## Konfigurationsbeispiel (`/webhook/vorstand-config`)

```json
{
  "page": { "title": "Vorstandsportal", "favicon": "img/favicon.png" },
  "header": { "logo": "img/logo.png", "kicker": "Vorstand", "caption": "Internes Portal" },
  "memberLogin": { "active": true, "title": "Mit Microsoft 365 anmelden", "url": "/webhook/oidc" },
  "memberStatusUrl": "/webhook/oidc/me",
  "memberLogout": { "webhookUrl": "/webhook/oidc/logout", "method": "POST", "loadingText": "Du wirst abgemeldet ..." },
  "body": { "kicker": "Willkommen", "title": "Vorstandsportal", "intro": "Interne Bereiche für den Vorstand." },
  "areas": {
    "formBaseUrl": "https://beispiel.form.io/vorstand",
    "forms": {
      "section": {
        "kicker": "Anträge und Anliegen",
        "title": "Formulare",
        "intro": "Digitale Formulare für Anliegen rund um den Verein."
      },
      "items": [
        {
          "id": "spesenantrag",
          "title": "Spesenantrag",
          "description": "Formular für Spesenabrechnungen.",
          "visibility": ["vorstand", "kassenwart"],
          "active": true
        }
      ]
    },
    "apps": {
      "section": {
        "kicker": "Externe Angebote",
        "title": "Apps",
        "intro": "Direkt zu den digitalen Angeboten des Vereins."
      },
      "items": [
        {
          "id": "sharepoint-vorstand",
          "title": "SharePoint Vorstand",
          "description": "Ablage für gemeinsame Dokumente.",
          "url": "https://beispiel.sharepoint.com",
          "openInNewWindow": true,
          "visibility": ["vorstand"],
          "active": true
        }
      ]
    }
  },
  "onlineServices": { "section": {}, "items": [] },
  "downloads": { "section": {}, "items": [] },
  "footer": []
}
```

`person.gruppen` oder ersatzweise `person.roles` (Array, aus `/webhook/oidc/me`) bestimmt, welche Bereiche sichtbar sind – Gruppennamen beziehungsweise App-Rollen kommen aus Azure AD/M365 und werden frei in n8n gepflegt.

Einträge in `areas.forms.items` erscheinen unter **Formulare** und werden über `areas.formBaseUrl` plus `id` in Form.io geöffnet. Einträge in `areas.apps.items` erscheinen darunter als externe Links. `visibility` regelt unabhängig davon den Zugriff. Die Kicker, Titel und Intros der beiden Abschnitte werden über das jeweilige `section`-Objekt konfiguriert.

Der Login startet über `/webhook/oidc`; `/webhook/oidc/me` liefert `{ angemeldet, person, csrfToken, expiresAt }`. Der API-Parser übernimmt die äußeren Sitzungswerte in das normalisierte Person-Objekt. Der Logout sendet `POST /webhook/oidc/logout` mit `credentials: "include"`, `cache: "no-store"` und dem Header `X-CSRF-Token`. `angemeldet: false` oder `authenticated: false` beendet den lokalen Anmeldestatus. Der Proxy muss `Cookie`, `Origin` und `X-CSRF-Token` an n8n weitergeben sowie `X-TSC-Cookie` serverseitig in `Set-Cookie` umwandeln und anschließend aus der Browserantwort entfernen. Token- und Cookie-Felder werden aus den Browser-Console-Logs redigiert.

Die Portal-Loginansicht sammelt keine Zugangsdaten und verwendet kein Form.io. Ihr Button leitet zum konfigurierten `memberLogin.url` oder standardmäßig zu `/webhook/oidc` weiter; Form.io bleibt den eigentlichen Portalformularen vorbehalten.
