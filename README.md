# Task-Portal

Statisches Petite-Vue-Portal für Anwendungen, Formulare, Prozessseiten, Online-Services und Downloads. Das Frontend lädt seine Konfiguration und den Microsoft-Entra-ID/OIDC-Sitzungsstatus über n8n. Form.io wird nur für die konfigurierten Portalformulare verwendet.

## Start

`config.json` verweist aktuell auf `/webhook/config/portal`. Die eigentliche Laufzeitkonfiguration kommt von diesem Endpunkt. Für Login und geschützte Formularrequests ist HTTPS mit funktionierender Cookie-Weitergabe erforderlich. Petite Vue, Bootstrap, Bootstrap Icons und Form.io werden von CDNs geladen. Im Repository gibt es keinen Paketmanager oder Build-Schritt.

## Kategorien

Die Root-Konfiguration enthält `apps.items`, `forms.items`, `processes.items`, `onlineServices.items` und `downloads.items`. Prozessseiten können auch als `pages` geliefert werden. Abschnittstexte stehen unter `section`. Formulare werden mit `formBaseUrl` und der Formular-`id` geöffnet; Anwendungen und Online-Services verwenden `url`; Prozessseiten verwenden `content`; Downloads verwenden `url`.

Die Kopfzeilensuche durchsucht alle fünf Kategorien nach Titel, Beschreibung und Suchbegriffen. `active: false` blendet einen Eintrag aus. Einträge mit `visibility` werden nicht nach OIDC-Gruppen gefiltert; die UI ersetzt keine serverseitige Berechtigungsprüfung.

## Anmeldung und Datenschutz

Der Loginbutton startet den konfigurierten `memberLogin.url` oder `/webhook/oidc`. `/webhook/oidc/me` prüft die Sitzung. Der Logout sendet POST mit `X-CSRF-Token`. Requests verwenden Cookies und `cache: "no-store"`; Token- und Cookie-Felder werden aus API-Logs redigiert. Proxy und n8n müssen die Session- und CSRF-Header korrekt weiterleiten.

`state.js` versucht bei einem nicht erreichbaren Konfigurationswebhook auf `config.local.json` zurückzufallen. Diese Datei ist nicht Bestandteil des Repositories und muss, falls dieser Entwicklungsweg genutzt wird, gesondert bereitgestellt werden.

## Dateien

| Pfad | Verantwortung |
| --- | --- |
| `index.html` | Kopfzeile, Suche, Kategorien und Formular-/Prozessansichten |
| `config.json` | URL zur Laufzeitkonfiguration |
| `js/main.js` | Petite-Vue-Mount und globale Integrationen |
| `js/state.js` | Normalisierung, OIDC-State, sichtbare Items, Suche und Form.io |
| `js/api.js` | HTTP-Aufrufe und redigiertes Logging |
| `js/formio.js` | Form.io-Instanzen erstellen und zerstören |
| `js/navigation.js` | `?bereich=` und Browser-History |
| `css/main.css` | Importiert die aufgeteilten Stylesheets |
| `wiki/` | Technische Referenz und Betriebswissen |

Details stehen im [Wiki](wiki/README.md); Regeln für Änderungen stehen in [agent.md](agent.md).