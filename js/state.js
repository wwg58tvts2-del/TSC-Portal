import { reactive } from "https://unpkg.com/petite-vue?module";

import {
  hatSichtbarenCookie,
  ladeConfigDaten,
  holeMemberStatus,
  sendeLogout,
  sendeFormularRequest
} from "./api.js?v=20260926-flat-config-1";

import {
  leseBereichIdAusUrl,
  aktualisiereUrl
} from "./navigation.js?v=20260925-oidc-logout-1";

import {
  ladeFormular,
  zerstoereFormular
} from "./formio.js?v=20260925-oidc-logout-1";


function normalisiereKonfiguration(konfiguration) {
  const {
    bereiche,
    areas: nestedAreas,
    apps: rootApps,
    forms: rootForms,
    formBaseUrl: rootFormBaseUrl,
    pages: rootPages,
    ...rest
  } = konfiguration;
  const quellAreas = nestedAreas || bereiche || {};
  const {
    items,
    applikationen,
    formulare,
    apps: nestedApps,
    forms: nestedForms,
    pages: nestedPages,
    section: alteSection
  } = quellAreas;
  const alteEintraege = Array.isArray(items) ? items : [];
  const istAltesFormular = (eintrag) =>
    ["form", "formular"].includes(
      String(eintrag?.type || eintrag?.typ || "").toLowerCase()
    );
  const alteApps = alteEintraege.filter(
    (eintrag) => eintrag?.url && !istAltesFormular(eintrag)
  );
  const alteForms = alteEintraege.filter(istAltesFormular);
  const alteSeiten = alteEintraege.filter(
    (eintrag) => !eintrag?.url && !istAltesFormular(eintrag)
  );
  const appsDaten = rootApps ?? nestedApps ?? applikationen;
  const formsDaten = rootForms ?? nestedForms ?? formulare;
  const appsObjekt = appsDaten && !Array.isArray(appsDaten) ? appsDaten : {};
  const formsObjekt = formsDaten && !Array.isArray(formsDaten) ? formsDaten : {};
  const apps = Array.isArray(appsDaten)
    ? appsDaten
    : Array.isArray(appsObjekt.items)
      ? appsObjekt.items
    : Array.isArray(applikationen)
      ? applikationen
      : alteApps;
  const forms = Array.isArray(formsDaten)
    ? formsDaten
    : Array.isArray(formsObjekt.items)
      ? formsObjekt.items
    : Array.isArray(formulare)
      ? formulare
      : alteForms;
  const pagesDaten = rootPages ?? nestedPages;
  const pages = Array.isArray(pagesDaten)
    ? pagesDaten
    : Array.isArray(pagesDaten?.items)
      ? pagesDaten.items
    : alteSeiten;

  const normalisiereSection = (section) => {
    const quelle = section && typeof section === "object" ? section : {};
    const {titel, ...restSection} = quelle;
    return {
      ...restSection,
      title: quelle.title ?? titel ?? "",
      kicker: quelle.kicker ?? "",
      intro: quelle.intro ?? ""
    };
  };

  const normalisiereEintrag = (eintrag, type) => {
    const {
      titel,
      beschreibung,
      sichtbarkeit,
      neuesFenster,
      inhalt,
      typ,
      ...restEintrag
    } = eintrag || {};
    const visibility = eintrag?.visibility ?? sichtbarkeit ?? "all";

    return {
      ...restEintrag,
      type,
      title: eintrag?.title ?? titel ?? "",
      description: eintrag?.description ?? beschreibung ?? "",
      visibility: Array.isArray(visibility)
        ? visibility.map((gruppe) => String(gruppe).toLowerCase() === "alle" ? "all" : gruppe)
        : String(visibility).toLowerCase() === "alle" ? "all" : visibility,
      openInNewWindow: eintrag?.openInNewWindow ?? neuesFenster ?? false,
      content: eintrag?.content ?? inhalt
    };
  };

  const memberLogin = konfiguration.memberLogin
    ? (({titel, ...login}) => ({
        ...login,
        title: konfiguration.memberLogin.title ?? titel ?? ""
      }))(konfiguration.memberLogin)
    : konfiguration.memberLogin;
  const memberLogout = konfiguration.memberLogout
    ? (({ladeText, ...logout}) => ({
        ...logout,
        loadingText: konfiguration.memberLogout.loadingText ?? ladeText
      }))(konfiguration.memberLogout)
    : konfiguration.memberLogout;
  const footer = Array.isArray(konfiguration.footer)
    ? konfiguration.footer.map(({titel, ...link}) => ({
        ...link,
        title: link.title ?? titel ?? ""
      }))
    : konfiguration.footer;

  return {
    ...rest,
    memberLogin,
    memberLogout,
    footer,
    formBaseUrl: rootFormBaseUrl ?? quellAreas.formBaseUrl,
    apps: {
      ...appsObjekt,
      section: normalisiereSection(appsObjekt.section || alteSection),
      items: apps.map((eintrag) => normalisiereEintrag(eintrag, "app"))
    },
    forms: {
      ...formsObjekt,
      section: normalisiereSection(formsObjekt.section || alteSection),
      items: forms.map((eintrag) => normalisiereEintrag(eintrag, "form"))
    },
    pages: pages.map((eintrag) => normalisiereEintrag(eintrag, "page"))
  };
}


export const state = reactive({
  config: null,
  person: null,
  view: "login",
  selectedBereich: null,
  activeFormInstance: null,
  warnung: "",

  msgbox: {
    visible: false,
    titel: "",
    inhalt: "",
    buttonText: "Schließen",
    zurueckNachSchliessen: true,
    onClose: null
  },

  loading: {
    visible: false,
    text: ""
  },

  memberCheckTimer: null,


  async init() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.msgbox.visible) {
        this.schliesseMeldung();
      }
    });

    window.addEventListener(
      "popstate",
      () => this.behandlePopState()
    );

    await this.ladeConfig();
    this.starteMemberUeberwachung();
    this.behandleUrlBeimStart();
  },


  starteMemberUeberwachung() {
    if (this.memberCheckTimer) {
      clearInterval(this.memberCheckTimer);
    }

    this.memberCheckTimer = setInterval(() => {
      this.ladeMemberDaten({ silent: true });
    }, 30000);
  },


  async ladeConfig() {
    console.log("[Vorstandsportal] ladeConfig() gestartet");
    try {
      const konfigurationsQuelle =
        await ladeConfigDaten(
          "config.json"
        );

      const configUrl =
        konfigurationsQuelle.configUrl ||
        "/webhook/selfservice-config";

      try {
        this.config =
          await ladeConfigDaten(
            configUrl
          );
      } catch (webhookError) {
        // Solange n8n den Endpunkt nicht bereitstellt, lokale Testdaten verwenden.
        console.warn(
          `[Vereinsportal] ${configUrl} nicht erreichbar, verwende config.local.json:`,
          webhookError
        );

        this.config =
          await ladeConfigDaten(
            "config.local.json"
          );
      }

      this.config = normalisiereKonfiguration(this.config);

      console.log("[Vorstandsportal] Konfiguration im State übernommen");

      document.title =
        this.config.page?.title ||
        "Vorstandsportal";

      const favicon =
        document.getElementById("favicon");

      if (
        favicon &&
        this.config.page?.favicon
      ) {
        favicon.href =
          this.config.page.favicon;
      }

      console.info(
        "[Vorstandsportal] Sichtbarer Cookie vorhanden:",
        hatSichtbarenCookie()
      );

      // /webhook/oidc/me immer abwarten,
      // damit Login-Status vor Bereichs-
      // und Header-Anzeige feststeht
      await this.ladeMemberDaten({
        silent: true
      });

    } catch (error) {
      console.error(
        "Die Konfiguration konnte nicht geladen werden:",
        error
      );

      this.warnung =
        "Die Bereiche konnten nicht geladen werden. Bitte versuche es später erneut.";
    } finally {
      console.log("[Vorstandsportal] ladeConfig() beendet");
    }
  },


  get logoutName() {
    const name = this.person?.vorname || this.person?.name || "Vorstand";
    return String(name).trim().split(/\s+/)[0] || "Vorstand";
  },


  get bereichsEintraege() {
    return [
      ...(Array.isArray(this.config?.apps?.items) ? this.config.apps.items : []),
      ...(Array.isArray(this.config?.forms?.items) ? this.config.forms.items : []),
      ...(Array.isArray(this.config?.pages) ? this.config.pages : [])
    ];
  },


  get sichtbareBereiche() {
    if (!this.person) {
      return [];
    }

    return this.bereichsEintraege.filter(
      (bereich) =>
        bereich.active !== false
    );
  },


  get sichtbareApps() {
    return this.sichtbareBereiche.filter(
      (bereich) =>
        typeof bereich.url === "string" &&
        bereich.url.trim().length > 0 &&
        bereich.type === "app"
    );
  },


  get sichtbareFormulare() {
    return this.sichtbareBereiche.filter(
      (bereich) => bereich.type === "form"
    );
  },


  get sichtbareFooterLinks() {
    const links =
      Array.isArray(
        this.config?.footer
      )
        ? this.config.footer
        : [];

    return links.filter(
      (link) =>
        link.active !== false
    );
  },


  async ladeMemberDaten(
    options = {}
  ) {
    const silent =
      options.silent === true;

    if (!silent) {
      this.zeigeLadenIntern(
        "Anmeldestatus wird geprüft ..."
      );
    }

    try {
      const person =
        await holeMemberStatus(
          this.config?.memberStatusUrl
        );

      this.person = person;

      if (!person) {
        this.zeigeAnmeldung();
        return person;
      }

      if (this.view === "login") {
        this.view = "auswahl";
      }

      if (!silent) {
        this.zeigeMeldung(
          "Angemeldet",
          `Willkommen ${person.name || `${person.vorname || ""} ${person.nachname || ""}`.trim()}`.trim(),
          false
        );
      }

      return person;

    } catch (error) {
        console.error(
          "Fehler beim Aufruf von /webhook/oidc/me:",
          error
        );

      if (silent && (error.status === 401 || error.status === 403)) {
        this.person = null;
      }

      if (!this.person) {
        this.zeigeAnmeldung();
      }

      if (!silent) {
        this.zeigeMeldung(
          "/webhook/oidc/me fehlgeschlagen",
          error.message ||
            "Der Anmeldestatus konnte nicht geprüft werden.",
          false
        );
      }

    } finally {
      if (!silent) {
        this.versteckeLadenIntern();
      }
    }
  },


  login() {
    const url = this.config?.memberLogin?.url || "/webhook/oidc";
    window.location.assign(url);
  },


  zeigeAnmeldung() {
    this.zerstoereFormio();
    this.selectedBereich = null;
    this.view = "login";
    this.warnung = "";
    aktualisiereUrl(null);
  },


  async logout() {
    const config = this.config?.memberLogout || {};

    this.zeigeLadenIntern(config.loadingText || "Du wirst abgemeldet ...");

    try {
      const result = await sendeLogout(config, this.person?.csrfToken);

      if (
        result.erfolgreich === true ||
        result.status === "nicht_angemeldet" ||
        result.authenticated === false ||
        result.angemeldet === false
      ) {
        this.person = null;
      }

      this.zeigeServerMeldung(result, false);

    } catch (error) {
      console.error("Fehler beim Logout:", error);

      const result = error.result;

      if (
        (result?.erfolgreich === false && result.status === "nicht_angemeldet") ||
        result?.authenticated === false ||
        result?.angemeldet === false
      ) {
        this.person = null;
      }

      if (result) {
        this.zeigeServerMeldung(result, false);
      }

    } finally {
      if (!this.person) {
        this.zeigeAnmeldung();
      }

      this.versteckeLadenIntern();
    }
  },


  oeffneBereich(bereich) {
    this.warnung = "";
    this.selectedBereich = bereich;
    this.view =
      bereich.type === "form"
        ? "formular"
        : "seite";

    aktualisiereUrl(bereich.id);
  },


  zurueck() {
    this.zerstoereFormio();

    this.view = "auswahl";
    this.selectedBereich = null;

    aktualisiereUrl(null);
    window.scrollTo(0, 0);
  },


  zerstoereFormio() {
    zerstoereFormular(
      this.activeFormInstance
    );

    this.activeFormInstance = null;
  },


  async ladeFormioEffect() {
    const bereich =
      this.selectedBereich;

    const baseUrl =
      this.config?.formBaseUrl;

    if (!bereich || bereich.type !== "form" || !baseUrl) {
      return;
    }

    const formUrl =
      `${baseUrl.replace(/\/$/, "")}/${encodeURIComponent(bereich.id)}`;

    const container =
      document.getElementById(
        "formio"
      );

    if (!container) {
      return;
    }

    try {
      this.activeFormInstance =
        await ladeFormular(
          container,
          formUrl,
          {
            onSubmitDone: async () => {
              await this.ladeMemberDaten({ silent: true });

              if (this.person) {
                this.selectedBereich = null;
                this.view = "auswahl";
                aktualisiereUrl(null);
              }
            }
          }
        );
    } catch (error) {
      console.error(
        "Der Bereich konnte nicht geladen werden:",
        error
      );

      container.innerHTML = `
        <div
          class="alert alert-danger"
          role="alert"
        >
          Das Formular konnte nicht geladen werden.
          Bitte versuche es später erneut.
        </div>
      `;
    }
  },


  behandleUrlBeimStart() {
    if (!this.person) {
      return;
    }

    const bereichId =
      leseBereichIdAusUrl();

    if (!bereichId) {
      return;
    }

    const bereich = this.findeBereich(bereichId);

    if (!bereich) {
      this.warnung =
        "Der angeforderte Bereich wurde nicht gefunden.";

      return;
    }

    this.selectedBereich = bereich;
    this.view =
      bereich.type === "form"
        ? "formular"
        : "seite";
  },


  behandlePopState() {
    if (!this.person) {
      this.zeigeAnmeldung();
      return;
    }

    const bereichId =
      leseBereichIdAusUrl();

    if (!bereichId) {
      this.zerstoereFormio();

      this.view = "auswahl";
      this.selectedBereich = null;

      return;
    }

    const bereich = this.findeBereich(bereichId);

    if (!bereich) {
      return;
    }

    this.zerstoereFormio();

    this.selectedBereich = bereich;
    this.view =
      bereich.type === "form"
        ? "formular"
        : "seite";
  },


  findeBereich(bereichId) {
    return this.bereichsEintraege.find(
      (item) =>
        item.id === bereichId &&
        item.type !== "app" &&
        !item.url
    );
  },


  /*
   * Zentrale Verarbeitung für
   * Form.io-Formulare.
   */
  async sendeFormular(
    instance,
    config = {}
  ) {
    const webhookUrl =
      config.webhookUrl;

    const method =
      config.method ||
      "POST";

    const ladeText =
      config.ladeText ||
      "Deine Daten werden übermittelt …";

    const zurueckNachErfolg =
      config.zurueckNachErfolg ??
      true;

    if (!webhookUrl) {
      console.error(
        "sendeFormular: webhookUrl fehlt."
      );

      return;
    }

    try {
      // Button während des Requests sperren
      instance.disabled = true;
      instance.redraw();

      // Globale Ladeanzeige
      this.zeigeLadenIntern(
        ladeText
      );

      // Daten über api.js an n8n senden
      const result =
        await sendeFormularRequest(
          webhookUrl,
          method,
          config.data !== undefined ? config.data : instance.root.data
        );

      if (!result || typeof result.erfolgreich !== "boolean") {
        const error = new Error("Ungültige JSON-Antwort.");
        error.result = result;
        throw error;
      }

      /*
       * n8n hat den Request verarbeitet,
       * meldet aber fachlich einen Fehler.
       */
      if (
        result.erfolgreich === false
      ) {
        this.zeigeServerMeldung(result, false);

        return;
      }

      /*
       * Erfolgreiche Verarbeitung.
       */
      if (
        result.erfolgreich === true
      ) {

        /*
         * Optional:
         * n8n kann eine Datei als
         * Base64 zurückgeben.
         */
        if (
          result.datei &&
          typeof result.datei ===
            "object" &&
          result.datei.base64
        ) {
          this.ladeDateiHerunter(
            result.datei.base64,
            result.datei.dateiname,
            result.datei.mimeType ||
              "application/pdf"
          );
        }

        if (typeof config.onSuccess === "function") {
          await config.onSuccess(result);
        }

        this.zeigeServerMeldung(result, zurueckNachErfolg);

        return;
      }

      throw new Error(
        "Ungültige JSON-Antwort."
      );

    } catch (error) {
      console.error(
        "Fehler beim Absenden des Formulars:",
        error
      );

      if (error.result) {
        this.zeigeServerMeldung(error.result, false);
      }

    } finally {
      this.versteckeLadenIntern();

      instance.disabled = false;
      instance.redraw();
    }
  },


  /*
   * Optionalen Base64-Dateiinhalt
   * aus einer n8n-Antwort herunterladen.
   */
  ladeDateiHerunter(
    base64,
    dateiname,
    mimeType = "application/pdf"
  ) {
    const binary =
      atob(base64);

    const bytes =
      new Uint8Array(
        binary.length
      );

    for (
      let i = 0;
      i < binary.length;
      i++
    ) {
      bytes[i] =
        binary.charCodeAt(i);
    }

    const blob =
      new Blob(
        [bytes],
        {
          type: mimeType
        }
      );

    const downloadUrl =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      downloadUrl;

    link.download =
      dateiname ||
      "Dokument.pdf";

    link.style.display =
      "none";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(
        downloadUrl
      );
    }, 1000);
  },


  zeigeServerMeldung(result, zurueckNachSchliessen = false) {
    const titel = typeof result?.titel === "string" ? result.titel : "";
    const nachricht = typeof result?.nachricht === "string" ? result.nachricht : "";

    if (!titel.trim() && !nachricht.trim()) {
      console.error("Serverantwort enthält keine Meldungstexte:", result);
      return;
    }

    this.zeigeMeldung(titel, nachricht, zurueckNachSchliessen);
  },


  zeigeMeldung(
    titel,
    inhalt,
    zurueckNachSchliessen = true,
    options = {}
  ) {
    this.msgbox.titel =
      titel || "";

    this.msgbox.inhalt =
      inhalt || "";

    this.msgbox.buttonText =
      options.buttonText ||
      "Schließen";

    this.msgbox.zurueckNachSchliessen =
      zurueckNachSchliessen;

    this.msgbox.onClose =
      typeof options.onClose ===
      "function"
        ? options.onClose
        : null;

    this.msgbox.visible = true;
  },


  schliesseMeldung() {
    if (!this.msgbox.visible) {
      return;
    }

    this.msgbox.visible = false;

    const callback =
      this.msgbox.onClose;

    this.msgbox.onClose = null;

    if (callback) {
      callback();
    }

    if (
      this.msgbox
        .zurueckNachSchliessen
    ) {
      this.zurueck();
    }
  },


  zeigeLadenIntern(text) {
    this.loading.text =
      text ||
      "Daten werden verarbeitet ...";

    this.loading.visible = true;
  },


  versteckeLadenIntern() {
    this.loading.visible = false;
  }
});
