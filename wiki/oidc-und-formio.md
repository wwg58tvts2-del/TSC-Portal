# OIDC und Form.io

## OIDC-Sitzung

Die Loginansicht sammelt keine Zugangsdaten. `state.login()` leitet zu `memberLogin.url` oder `/webhook/oidc` weiter. Nach der Weiterleitung prüft `memberStatusUrl` (üblich: `/webhook/oidc/me`) die Sitzung. Der Parser unterstützt `{ angemeldet, person, csrfToken, expiresAt }` und kompatible Felder wie `authenticated`, `gefunden` und `erfolgreich`.

Requests schließen Cookies ein und verwenden `cache: "no-store"`. Der Logout ist ausschließlich POST; `api.js` verlangt ein CSRF-Token und sendet es als `X-CSRF-Token`. Backend und Reverse Proxy müssen Session-Cookie und CSRF-Header konsistent behandeln. Die Logs redigieren Cookie-, Token- und Secret-Felder.

## Form.io

Formulare werden aus `forms.items` ausgewählt und anhand von `formBaseUrl` plus URL-kodierter `id` geladen. Login und OIDC verwenden kein Form.io.

Form.io-Custom-JavaScript ruft `window.sendeFormular(instance, config)` auf. Der Submit sendet standardmäßig POST mit `{ request: { data } }`, Cookies und `cache: "no-store"`. `method`, `webhookUrl`, `ladeText`, `zurueckNachErfolg`, `onSuccess` und optional `data` kommen aus der Formular-Konfiguration. Ohne `data` wird `instance.root.data` verwendet.

Die Antwort muss ein Objekt mit booleschem `erfolgreich` enthalten. Fachliche Fehler zeigen Servertexte und laufen nicht in den Erfolgsweg. Bei Erfolg kann eine Base64-Datei ausgeliefert werden; danach wird `onSuccess` abgewartet. Loader und Button werden im `finally`-Pfad bereinigt.

## Fehlergrenze

401/403 bei der Statusprüfung ergeben eine nicht angemeldete Sitzung. Andere HTTP- oder JSON-Fehler werden als Fehler weitergegeben. Logout-Antworten dürfen auch explizite Nicht-angemeldet-Status enthalten. Änderungen an diesen Verträgen mit dem n8n-Workflow und Proxy gemeinsam prüfen.