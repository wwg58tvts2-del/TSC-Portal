// ============================================================================
// FORM.IO – ZENTRALE FORMULARVERWALTUNG
// ============================================================================
//
// Diese Datei kapselt den direkten Umgang mit der global eingebundenen
// Form.io-Bibliothek.
//
// Neben dem Laden und Zerstören von Formularen wird hier das Request-Verhalten
// von Form.io für Webhook-Aufrufe angepasst.
//
// Hintergrund:
// Form.io löst relative URLs aus URL-Datenquellen standardmäßig relativ zum
// Form.io-Server auf.
//
// Beispiel:
//   /webhook/trainer
//
// würde bei einem Formular von
//   https://tsc-forms.m-wiesner.de
//
// standardmäßig zu
//   https://tsc-forms.m-wiesner.de/webhook/trainer
//
// aufgelöst.
//
// Webhooks sollen jedoch immer über die aktuell aufgerufene Portal-Instanz
// laufen. Dadurch können dieselben Formulare unverändert in unterschiedlichen
// Umgebungen (z. B. Test und Produktion) verwendet werden.
//
// Beispiel:
//   https://tsc-portal.m-wiesner.de/webhook/trainer
//
// Hierzu werden ausschließlich Requests auf "/webhook/" auf den aktuellen
// window.location.origin umgeleitet.
// ============================================================================


// Verhindert, dass Formio.fetch beim Laden mehrerer Formulare mehrfach
// überschrieben wird.
let formioFetchKonfiguriert = false;


/**
 * Konfiguriert das Request-Verhalten von Form.io.
 *
 * Relative bzw. von Form.io bereits aufgelöste Webhook-Requests werden auf
 * die Origin der aktuell geöffneten Anwendung umgeleitet.
 *
 * Alle anderen Form.io-Requests bleiben unverändert und werden weiterhin
 * über die ursprüngliche Formio.fetch-Implementierung ausgeführt.
 */
function konfiguriereFormioFetch() {

  // Die Konfiguration darf pro Seitenaufruf nur einmal durchgeführt werden.
  if (formioFetchKonfiguriert) {
    return;
  }


  // Ursprüngliche Form.io-Fetch-Funktion sichern.
  //
  // Diese wird weiterhin für alle Requests verwendet, die keine Webhooks
  // unserer Anwendung sind.
  const originalFetch = Formio.fetch.bind(Formio);


  // Form.io-Fetch zentral überschreiben.
  Formio.fetch = (url, options = {}) => {

    // Die übergebene URL in ein URL-Objekt umwandeln.
    //
    // Form.io kann entweder ein Request-Objekt oder eine URL als String
    // übergeben.
    const requestUrl =
      url instanceof Request
        ? new URL(url.url)
        : new URL(String(url), window.location.origin);


    // ------------------------------------------------------------------------
    // WEBHOOK-REQUEST
    // ------------------------------------------------------------------------
    //
    // Alle Requests auf "/webhook/" sollen nicht gegen den Form.io-Server,
    // sondern gegen die aktuell geöffnete Portal-Instanz ausgeführt werden.
    //
    // Beispiel:
    //
    // Form.io erzeugt:
    //   https://tsc-forms.m-wiesner.de/webhook/trainer?limit=100&skip=0
    //
    // Daraus wird:
    //   https://tsc-portal.m-wiesner.de/webhook/trainer?limit=100&skip=0
    //
    // window.location.origin sorgt dafür, dass dies automatisch auch in
    // anderen Umgebungen funktioniert.
    if (requestUrl.pathname.startsWith("/webhook/")) {

      // Ziel-URL auf Basis der aktuell geöffneten Anwendung erzeugen.
      //
      // Pfad, Query-Parameter und Fragment werden vom ursprünglichen
      // Form.io-Request übernommen.
      const portalUrl =
        window.location.origin +
        requestUrl.pathname +
        requestUrl.search +
        requestUrl.hash;


      // Webhook über den Browser aufrufen.
      //
      // "credentials: include" stellt sicher, dass vorhandene Cookies bzw.
      // Sessioninformationen mitgesendet werden.
      return window.fetch(portalUrl, {
        ...options,
        credentials: "include"
      });
    }


    // ------------------------------------------------------------------------
    // NORMALER FORM.IO-REQUEST
    // ------------------------------------------------------------------------
    //
    // Alle anderen Requests unverändert an Form.io weitergeben.
    //
    // Dadurch bleiben insbesondere das Laden der Formulare und sämtliche
    // sonstigen Form.io-API-Aufrufe auf dem vorgesehenen Form.io-Server.
    return originalFetch(url, options);
  };


  // Kennzeichnen, dass die Fetch-Konfiguration bereits durchgeführt wurde.
  formioFetchKonfiguriert = true;
}


/**
 * Lädt und initialisiert ein Form.io-Formular.
 *
 * @param {HTMLElement} container
 *   HTML-Element, in das das Formular gerendert werden soll.
 *
 * @param {string} formUrl
 *   URL des zu ladenden Form.io-Formulars.
 *
 * @param {Object} options
 *   Zusätzliche Optionen für die Formularinitialisierung.
 *
 * @param {Function} options.onSubmitDone
 *   Optionale Callback-Funktion, die nach erfolgreichem Absenden des
 *   Formulars ausgeführt wird.
 *
 * @returns {Promise<Object>}
 *   Die erzeugte Form.io-Formularinstanz.
 */
export async function ladeFormular(
  container,
  formUrl,
  { onSubmitDone } = {}
) {

  // Vor dem Erzeugen des Formulars sicherstellen, dass Webhook-Aufrufe
  // auf die aktuelle Portal-Instanz umgeleitet werden.
  konfiguriereFormioFetch();


  // Formular laden und im angegebenen Container rendern.
  const instance = await Formio.createForm(container, formUrl, {

    // Form.io-eigene Alert-Ausgaben zulassen.
    noAlerts: false,

    // Formular im Bearbeitungsmodus laden.
    readOnly: false,


    // ------------------------------------------------------------------------
    // HTML-SANITIZING
    // ------------------------------------------------------------------------
    //
    // Form.io bereinigt eingebettetes HTML standardmäßig.
    // Für unsere PDF-Anzeige werden zusätzlich <iframe>-Elemente sowie die
    // dafür benötigten Attribute zugelassen.
    sanitizeConfig: {
      addTags: [
        "iframe"
      ],
      addAttr: [
        "src",
        "title",
        "style",
        "frameborder",
        "allow",
        "allowfullscreen"
      ]
    }
  });


  // Wird ausgelöst, nachdem das Formular erfolgreich abgesendet wurde.
  instance.on("submitDone", () => {

    // Optionalen Callback der aufrufenden Anwendung ausführen.
    if (typeof onSubmitDone === "function") {
      onSubmitDone();
    }
  });


  // Form.io-Fehler zentral in der Browser-Konsole protokollieren.
  instance.on("error", (error) => {
    console.error("Form.io-Fehler:", error);
  });


  // Fertig initialisierte Formularinstanz zurückgeben.
  return instance;
}


/**
 * Zerstört eine vorhandene Form.io-Formularinstanz.
 *
 * Dadurch werden unter anderem die von Form.io erzeugten Komponenten,
 * Event-Handler und DOM-Strukturen entfernt.
 *
 * @param {Object|null} instance
 *   Zu zerstörende Form.io-Formularinstanz.
 */
export function zerstoereFormular(instance) {

  // Nur zerstören, wenn tatsächlich eine Instanz vorhanden ist.
  if (instance) {
    instance.destroy(true);
  }
}