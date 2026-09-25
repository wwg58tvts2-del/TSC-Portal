# Vorstandsportal – Codepflege

Stand: 26.09.2026, Version `20260926-flat-config-1`. Schwesterprojekt des [Serviceportals](../5_Serviceportal/agent.md) – gleiche Architektur (petite-vue, Bootstrap, Form.io, n8n als Backend), aber eigener Zweck: konfigurierbares internes Portal für den Vorstand statt Selfservice für Mitglieder.
Stand: 26.09.2026, Version `20260926-flat-config-1`. Schwesterprojekt des [Serviceportals](../5_Serviceportal/agent.md) – gleiche Architektur (petite-vue, Bootstrap, Form.io, n8n als Backend), aber eigener Zweck: konfigurierbares internes Portal für den Vorstand statt Selfservice für Mitglieder.

## Architektur und Stil

`main.js` veröffentlicht globale Funktionen und startet Petite Vue. `state.js` steuert Zustand und Oberfläche; `api.js` enthält Netzwerkaufrufe und Logging ohne Zugriff auf den State. `formio.js` erstellt und zerstört Formularinstanzen. `navigation.js` steuert URL (`?bereich=...`) und History. Die Konfiguration wird über `/webhook/vorstand-config` geladen (eigener Endpunkt, unabhängig vom Serviceportal); CSS wird über `css/main.css` eingebunden, `responsive.css` zuletzt.

Deutsche Namen und Modulgrenzen wie im Serviceportal beibehalten. Neue Aufrufe kompakt schreiben, keine unnötigen Zeilenumbrüche oder beiläufigen Umformatierungen.

## Unterschied zum Serviceportal: Bereiche statt Formulare

Die Startseite trennt die englische Root-Konfiguration in `config.forms` und `config.apps`; beide Kategorien enthalten jeweils `section` (`kicker`, `title`, `intro`) und `items`:

- `apps.items`: externe Webseiten mit `url`; sie erscheinen unter Apps.
- `forms.items`: Form.io-Formulare; sie erscheinen unter Formulare und werden über `config.formBaseUrl` + `id` geladen.
- Zur Migration werden die früheren deutschen Schlüssel und das alte `bereiche.items`-Array beim Laden normalisiert; eine `url` kennzeichnet darin einen App-Link, `typ: "formular"` ein Form.io-Formular.

Sichtbarkeit läuft unabhängig vom Typ über `visibility` (Array von Gruppennamen oder `"all"`) gegen die Gruppen des angemeldeten Vorstandsmitglieds (`state.gruppen`). Das Portal verwendet `person.gruppen` oder ersatzweise die OIDC-App-Rollen `roles` aus `/webhook/oidc/me`.

`onlineServices`, `downloads` und `footer` funktionieren unverändert wie im Serviceportal (externe Links, Downloads, Footer-Links).

## Anmeldung (Microsoft 365 / OIDC)

Die Anmeldung läuft vollständig über n8n als OIDC-Client gegen Microsoft Entra ID (M365). Die eigene Loginansicht sammelt keine Zugangsdaten; ihr Button ruft `state.login()` auf:

- `config.memberLogin.url` wird verwendet; ohne URL gilt `/webhook/oidc` als Standard. n8n startet dort den OIDC-Flow und setzt am Ende das Session-Cookie.
- Form.io ist ausschließlich für Portalbereiche vom Typ `formular`, nicht für die Anmeldung.

Login-Start: `/webhook/oidc`; Statusprüfung: `/webhook/oidc/me`. Aktueller Vertrag: `{ angemeldet, person, csrfToken, expiresAt }`; Parser normalisiert äußere `csrfToken`-/`expiresAt`-Werte in `person` und unterstützt außerdem bisherige `authenticated`, `gefunden` und `erfolgreich`-Antworten. `roles` werden als Bereichsgruppen verwendet, sofern `gruppen` fehlt. Der Logout sendet das normalisierte `person.csrfToken` als `X-CSRF-Token`: `POST /webhook/oidc/logout` mit Cookies und ohne Cache. `angemeldet: false` oder `authenticated: false` beendet den lokalen Loginstatus. Der Browser setzt `Origin` selbst; Proxy und n8n müssen `Cookie`, `Origin` und `X-CSRF-Token` weiterreichen. Response-Logs redigieren Token- und Cookie-Felder.

## Formulare, Meldungen, Datei-Downloads

Identisch zum Serviceportal: `window.sendeFormular(instance, config)`, Servertexte über `zeigeServerMeldung()`, optionaler Base64-Datei-Download, `finally` schließt Loader und entsperrt Button. Siehe [Serviceportal-agent.md](../5_Serviceportal/agent.md) für die vollständigen JSON- und Fehlerregeln – sie gelten hier unverändert.

## Offene Punkte

- `/webhook/vorstand-config` und die OIDC-Endpunkte in n8n müssen in der Produktivumgebung veröffentlicht und in der Portal-Konfiguration eingetragen sein.
- Rechte-/Gruppenmodell (welche M365-Gruppe = welche Portalgruppe) wird in n8n gepflegt, nicht im Frontend.
- Kein eigenes CMS für `area.content` – HTML wird direkt in der n8n-Konfiguration hinterlegt.
