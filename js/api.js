// Reines Netzwerk-/Logging-Modul, kein Zugriff auf den reaktiven State

// document.cookie sieht HttpOnly-Cookies nicht, dient nur als Zusatzinfo fürs Debugging
export function hatSichtbarenCookie() {
  return document.cookie.trim().length > 0;
}

export function loggeResponse(label, response, body) {
  const header = {};

  response.headers.forEach((value, key) => {
    header[key] = key.toLowerCase() === "set-cookie"
      ? "[vom Browser aus Sicherheitsgründen nicht lesbar]"
      : value;
  });

  console.group(`[Vorstandsportal] ${label}`);
  console.log("Status:", response.status, response.statusText);
  console.log("URL:", response.url);
  console.log("Response-Header:", header);
  console.log("Response-Body:", body);
  console.groupEnd();
}

export async function ladeConfigDaten(url) {
  const start = performance.now();
  console.group(`[Vorstandsportal] Konfiguration laden: ${url}`);
  console.log("Request gestartet");
  console.log("Methode:", "GET");
  console.log("Credentials:", "include (Cookies werden nicht geloggt)");
  console.log("Cache:", "no-store");

  let response;
  try {
    response = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });
  } catch (error) {
    console.error("Netzwerkfehler beim Laden der Konfiguration:", error);
    console.groupEnd();
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  let result;
  try {
    result = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch (error) {
    console.error("Antwort konnte nicht als JSON/Text gelesen werden:", error);
    console.groupEnd();
    throw error;
  }

  console.log("Antwort erhalten nach:", `${Math.round(performance.now() - start)} ms`);
  console.log("HTTP-Status:", response.status, response.statusText);
  console.log("Content-Type:", contentType || "nicht gesetzt");
  loggeResponse(url, response, result);

  if (!response.ok) {
    console.error("Konfiguration konnte nicht geladen werden.");
    console.groupEnd();
    throw new Error(`Konfiguration konnte nicht geladen werden (${response.status}).`);
  }

  if (!result || typeof result !== "object") {
    console.error("Konfiguration ist kein gültiges JSON-Objekt.");
    console.groupEnd();
    throw new Error("Die Konfiguration hat kein gültiges JSON-Objekt geliefert.");
  }

  console.log("JSON-Schlüssel:", Object.keys(result));
  console.log("Bereiche:", Array.isArray(result.bereiche?.items) ? result.bereiche.items.length : 0);
  console.log("Online-Services:", Array.isArray(result.onlineServices?.items) ? result.onlineServices.items.length : 0);
  console.log("Downloads:", Array.isArray(result.downloads?.items) ? result.downloads.items.length : 0);
  console.log("Footer-Links:", Array.isArray(result.footer) ? result.footer.length : 0);
  console.log("Konfiguration erfolgreich verarbeitet.");
  console.groupEnd();

  return result;
}

export async function holeMemberStatus(url) {
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  loggeResponse(url, response, result);

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    const error = new Error(
      typeof result === "string" ? result : `HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  const daten = Array.isArray(result) ? result[0] : result;
  const person = daten?.person || (daten?.authenticated === true ? daten : null);
  const gefunden =
    daten?.authenticated === true ||
    daten?.gefunden === true ||
    daten?.erfolgreich === true;
  const nichtAngemeldet = daten?.status === "fehlender_coockie"
    || daten?.status === "fehlender_cookie"
    || daten?.status === "nicht_angemeldet";

  if (nichtAngemeldet || !gefunden || !person) {
    return null;
  }

  return person;
}

export async function sendeLogout(config = {}, csrfToken) {
  const webhookUrl = config.webhookUrl || "/webhook/oidc/logout";
  const method = String(config.method || "POST").toUpperCase();

  if (method !== "POST") {
    throw new Error("Der OIDC-Logout muss per POST erfolgen.");
  }

  if (typeof csrfToken !== "string" || !csrfToken.trim()) {
    throw new Error("Das CSRF-Token für den Logout fehlt.");
  }

  const response = await fetch(webhookUrl, {
    method,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Accept": "application/json",
      "X-CSRF-Token": csrfToken
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  loggeResponse(webhookUrl, response, result);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.result = result;
    throw error;
  }

  const gueltigeAntwort =
    result &&
    typeof result === "object" &&
    !Array.isArray(result) &&
    (
      typeof result.erfolgreich === "boolean" ||
      result.authenticated === false ||
      result.status === "nicht_angemeldet"
    );

  if (!gueltigeAntwort) {
    const error = new Error("Ungültige JSON-Antwort.");
    error.result = result;
    throw error;
  }

  return result;
}

export async function sendeFormularRequest(webhookUrl, method, data) {
  const requestMethod = String(method || "POST").toUpperCase();
  const requestOptions = {
    method: requestMethod,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Accept": "application/json"
    },
  };

  if (requestMethod !== "GET" && requestMethod !== "HEAD") {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify({
      request: {
        data
      }
    });
  }

  const response = await fetch(webhookUrl, requestOptions);

  const result = await response.json();

  loggeResponse(
    webhookUrl,
    response,
    result
  );

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.result = result;
    throw error;
  }

  return result;
}
