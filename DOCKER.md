# Docker und Portainer

## Image

Pushes auf `main` bauen die Vue-Anwendung und veröffentlichen
`ghcr.io/wwg58tvts2-del/tsc-portal` in GHCR. Jeder Build erhält die Tags
`latest` und `sha-<Commit-ID>`. Das Runtime-Image enthält Nginx und `dist/`,
aber weder Node.js noch den Quellcode.

## Portainer-Test-Stack

Der Workflow ruft nach einem erfolgreichen GHCR-Push das GitHub-Secret
`PORTAINER_WEBHOOK_URL` auf. Dieses Secret muss auf den Webhook des
**Task-Portal-Test-Stacks** zeigen. Das Image wird nicht automatisch in Prod
ausgerollt.

`compose.yaml` ist die Stack-Vorlage. Standardmäßig wird Port `8088` auf den
Nginx-Port `80` veröffentlicht. Beim Test-Stack Image-Pulls aktivieren und
`latest` verwenden; für reproduzierbare Rücksprünge einen `sha-<Commit-ID>`-Tag
eintragen.

Bei einem privaten GHCR-Paket die Registry-Zugangsdaten mit einem Token mit
`read:packages` in Portainer hinterlegen. Keine Tokens im Repository speichern.

## Laufzeitabhängigkeiten

OIDC, n8n und Form.io bleiben externe Dienste. Der Test-Ursprung muss dort für
Cookies, CORS und Redirect-URIs zugelassen sein. Der Reverse Proxy muss
`/webhook/*` weiterhin an n8n weiterleiten; die Nginx-SPA-Fallbackregel im
Container ersetzt diese Proxy-Regel nicht.