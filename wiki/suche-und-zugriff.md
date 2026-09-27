# Suche und Zugriff

## Sichtbare Items

`normalisiereKonfiguration()` setzt die Kategorien auf eine gemeinsame Form mit `type`, `title`, `description` und einem Laufzeitfeld `visible`. Die Suchfunktion aktualisiert dieses Feld beim Laden und bei jeder Eingabe. Die Kategorie-Getter liefern Items mit `visible === true`; die vorhandenen `v-for`-Listen rendern diese Getter direkt.

Die Suche gilt für Apps, Formulare, Prozesse, Online-Services und Downloads. Verglichen werden Titel, Beschreibung und zusätzliche Suchbegriffe. Unterstützte Felder sind `searchTerms`, `searchKeywords`, `keywords`, `suchbegriffe`, `suchwoerter` und `tags`; der Vergleich ignoriert Groß-/Kleinschreibung. Leere Eingabe stellt alle vom Backend gelieferten Items wieder her. Kategorien ohne Treffer verschwinden, und bei null Treffern erscheint „Keine Ergebnisse gefunden“.

`visible` ist flüchtiger UI-State. Es wird bei der Konfigurationsnormalisierung gesetzt und nicht als serverseitige Berechtigung gespeichert.

## Berechtigungen

`active` und `visibility` werden vom Frontend nicht ausgewertet. `visibility`-Werte werden bei Legacy-Daten gegebenenfalls normalisiert, aber nicht mit Gruppen oder OIDC-Rollen abgeglichen. Die Funktion `/webhook/oidc/me` steuert, ob eine Sitzung besteht, nicht welche einzelnen Formulare oder Links autorisiert sind. n8n filtert die ausgelieferten Items; n8n/Form.io prüfen Berechtigungen bei jedem geschützten Request.

Alle geschützten Form.io- und Prozess-Endpunkte müssen die Berechtigung serverseitig prüfen. `content` von Prozessseiten wird als HTML eingesetzt; nur vertrauenswürdige Inhalte hinterlegen.

## Änderungen testen

Suchänderungen mit jeweils einem Treffer in jeder Kategorie, Suchbegriffen, Groß-/Kleinschreibung, backendseitig ausgelieferten Listen, leerer Eingabe und null Treffern prüfen. Die sichtbaren Getter müssen der einzige Filterweg zum Template bleiben; eine zusätzliche `v-show`-Schicht auf denselben gefilterten Items kann Render- und Key-Probleme erzeugen.