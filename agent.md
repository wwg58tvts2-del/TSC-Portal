# Vorstandsportal – Codepflege

Stand: 24.09.2026, Version `20260924-init-1`. Schwesterprojekt des [Serviceportals](../5_Serviceportal/agent.md) – gleiche Architektur (petite-vue, Bootstrap, Form.io, n8n als Backend), aber eigener Zweck: konfigurierbares internes Portal für den Vorstand statt Selfservice für Mitglieder.

## Architektur und Stil

`main.js` veröffentlicht globale Funktionen und startet Petite Vue. `state.js` steuert Zustand und Oberfläche; `api.js` enthält Netzwerkaufrufe und Logging ohne Zugriff auf den State. `formio.js` erstellt und zerstört Formularinstanzen. `navigation.js` steuert URL (`?bereich=...`) und History. Die Konfiguration wird über `/webhook/vorstand-config` geladen (eigener Endpunkt, unabhängig vom Serviceportal); CSS wird über `css/main.css` eingebunden, `responsive.css` zuletzt.

Deutsche Namen und Modulgrenzen wie im Serviceportal beibehalten. Neue Aufrufe kompakt schreiben, keine unnötigen Zeilenumbrüche oder beiläufigen Umformatierungen.

## Unterschied zum Serviceportal: Bereiche statt Formulare

Statt einer festen Formularliste liefert n8n konfigurierbare **Bereiche** (`config.bereiche.items`), die der Vorstand selbst pflegt. Jeder Bereich hat einen `typ`:

- `"seite"`: statische Inhaltsseite. `bereich.inhalt` enthält HTML, das per `v-html` gerendert wird (Klasse `bereich-inhalt`, siehe `css/bereiche.css`). Der Inhalt gilt als vertrauenswürdig, da er ausschließlich vom Vorstand über n8n gepflegt wird – keine Nutzereingaben werden hier gerendert.
- `"formular"`: Form.io-Formular, analog zum Serviceportal. Wird über `config.bereiche.formBaseUrl` + `bereich.id` geladen.

Sichtbarkeit läuft über `bereich.sichtbarkeit` (Array von Gruppennamen oder `"alle"`) gegen die Gruppen des angemeldeten Vorstandsmitglieds (`state.gruppen`). Anders als im Serviceportal gibt es keine feste Werteliste – Gruppennamen kommen frei konfigurierbar aus Azure-AD-/M365-Gruppen, die n8n im `/webhook/me`-Ergebnis unter `person.gruppen` (Array) mitliefert.

`onlineServices`, `downloads` und `footer` funktionieren unverändert wie im Serviceportal (externe Links, Downloads, Footer-Links).

## Anmeldung (Microsoft 365 / OIDC)

Die Anmeldung läuft künftig vollständig über n8n als OIDC-Client gegen Microsoft Entra ID (M365). Der Login-Button ruft `state.login()` auf:

- Ist `config.memberLogin.url` gesetzt, leitet der Browser dorthin weiter (n8n startet dort den OIDC-Flow und setzt am Ende das Session-Cookie).
- Ist die URL noch nicht konfiguriert, zeigt der Button nur einen Platzhalter-Hinweis ("Anmeldung noch nicht verfügbar"). Kein Dummy-Login, keine lokale Simulation von Anmeldedaten.

`/webhook/me` und `/webhook/logout` funktionieren wie im Serviceportal (Cookie-Session, gleiche JSON-Verträge). `person.gruppen` ersetzt lediglich `person.statusGruppe`.

## Formulare, Meldungen, Datei-Downloads

Identisch zum Serviceportal: `window.sendeFormular(instance, config)`, Servertexte über `zeigeServerMeldung()`, optionaler Base64-Datei-Download, `finally` schließt Loader und entsperrt Button. Siehe [Serviceportal-agent.md](../5_Serviceportal/agent.md) für die vollständigen JSON- und Fehlerregeln – sie gelten hier unverändert.

## Offene Punkte

- `/webhook/vorstand-config` und der OIDC-Start-Endpunkt in n8n existieren noch nicht produktiv; bis dahin bleibt der Login-Button ein Platzhalter.
- Rechte-/Gruppenmodell (welche M365-Gruppe = welche Portalgruppe) wird in n8n gepflegt, nicht im Frontend.
- Kein eigenes CMS für `bereich.inhalt` – HTML wird direkt in der n8n-Konfiguration hinterlegt.
