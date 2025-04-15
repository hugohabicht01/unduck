import indexPage from "./pages/index.html?raw";
import {
  getCustomBangs,
  saveCustomBang,
  deleteCustomBang,
  validateCustomBang,
  updateEngineDetails,
  loadBangs,
  renderCustomEnginesTable,
} from "./settings";
import settingsPage from "./pages/settings.html?raw";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = indexPage;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });
}

const allBangs = loadBangs();

const DEFAULT_BANG_KEY = "default-bang";
const LS_DEFAULT_BANG = localStorage.getItem(DEFAULT_BANG_KEY) ?? "g";

let defaultBang = allBangs[LS_DEFAULT_BANG]; // Use let

function settingsPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = settingsPage;

  let currentAllBangs = loadBangs(); // Load combined bangs

  // --- Default Engine Setup ---
  const defaultEngineInput =
    app.querySelector<HTMLInputElement>("#default-engine")!;
  if (!defaultEngineInput) {
    console.error("Default engine input not found.");
    return; // Exit if essential element is missing
  }

  defaultEngineInput.value = LS_DEFAULT_BANG; // Display the bang tag itself
  updateEngineDetails(LS_DEFAULT_BANG); // Display details for the initial default bang

  defaultEngineInput.addEventListener("input", (event: Event) => {
    // ... (existing default engine input handler remains largely the same)
    // It needs access to the *potentially updated* `currentAllBangs`
    const target = event.target as HTMLInputElement;
    const updatedValue = target.value.toLowerCase().trim();
    const errorElement = app.querySelector<HTMLSpanElement>("#error-message");
    if (errorElement) errorElement.textContent = "";

    const engineDetailsDiv = document.querySelector<HTMLDivElement>(
      "#default-engine-details",
    );

    if (updatedValue in currentAllBangs) {
      // Check against current combined list
      localStorage.setItem(DEFAULT_BANG_KEY, updatedValue);
      defaultBang = currentAllBangs[updatedValue];
      updateEngineDetails(updatedValue);
      if (engineDetailsDiv) engineDetailsDiv.style.display = "";
    } else {
      if (errorElement) errorElement.textContent = "Invalid bang tag.";
      else console.error("Invalid bang tag:", updatedValue);

      if (engineDetailsDiv) {
        engineDetailsDiv.style.display = "none";
        // Clear spans
        const nameSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-name",
        );
        const domainSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-domain",
        );
        const urlSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-url",
        );
        if (nameSpan) nameSpan.textContent = "";
        if (domainSpan) domainSpan.textContent = "";
        if (urlSpan) urlSpan.textContent = "";
      }
    }
  });

  // --- Custom Engine Setup ---
  const customEnginesTbody = app.querySelector<HTMLTableSectionElement>(
    "#custom-engines-tbody",
  );
  const addEngineButton =
    app.querySelector<HTMLButtonElement>("#add-engine-btn");
  const addEngineError = app.querySelector<HTMLDivElement>("#add-engine-error");

  // Input fields for adding
  const newNameInput = app.querySelector<HTMLInputElement>("#new-engine-name");
  const newTagInput = app.querySelector<HTMLInputElement>("#new-engine-tag");
  const newDomainInput =
    app.querySelector<HTMLInputElement>("#new-engine-domain");
  const newUrlInput = app.querySelector<HTMLInputElement>("#new-engine-url");

  // search bangs section
  const searchBangsInput = app.querySelector<HTMLInputElement>(
    "#bangs-search-input",
  );
  const searchBangsList = app.querySelector<HTMLUListElement>("#bangs-list");

  if (
    !customEnginesTbody ||
    !addEngineButton ||
    !addEngineError ||
    !newNameInput ||
    !newTagInput ||
    !newDomainInput ||
    !newUrlInput
  ) {
    console.error(
      "One or more custom engine elements are missing from the settings page.",
    );
    return;
  }

  // Initial rendering of custom engines
  renderCustomEnginesTable(getCustomBangs(), customEnginesTbody);

  // Event Listener for Adding Custom Bangs
  addEngineButton.addEventListener("click", () => {
    addEngineError.textContent = ""; // Clear previous error

    const newBangData = {
      s: newNameInput.value.trim(),
      t: newTagInput.value.trim().toLowerCase(),
      d: newDomainInput.value.trim(),
      u: newUrlInput.value.trim(),
    };

    const validationError = validateCustomBang(newBangData, currentAllBangs);

    if (validationError) {
      addEngineError.textContent = validationError;
    } else {
      const updatedCustomBangs = saveCustomBang(newBangData);
      currentAllBangs = loadBangs(); // Reload ALL bangs after saving
      renderCustomEnginesTable(updatedCustomBangs, customEnginesTbody);
      // Clear form
      newNameInput.value = "";
      newTagInput.value = "";
      newDomainInput.value = "";
      newUrlInput.value = "";
    }
  });

  // Event Listener for Deleting Custom Bangs (using delegation)
  customEnginesTbody.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("delete-custom-btn")) {
      const tagToDelete = target.dataset.tag;
      if (tagToDelete) {
        const updatedCustomBangs = deleteCustomBang(tagToDelete);
        currentAllBangs = loadBangs(); // Reload ALL bangs after deleting
        renderCustomEnginesTable(updatedCustomBangs, customEnginesTbody);
      }
    }
  });

  // Add listener for default engine input (must be AFTER initial population)
  defaultEngineInput.addEventListener("input", (event: Event) => {
    const target = event.target as HTMLInputElement;
    const updatedValue = target.value.toLowerCase().trim(); // Normalize the input
    const errorElement = app.querySelector<HTMLSpanElement>("#error-message");

    if (errorElement) {
      // Clear previous error
      errorElement.textContent = "";
    }

    const engineDetailsDiv = document.querySelector<HTMLDivElement>(
      "#default-engine-details",
    ); // Select here to hide on error

    if (updatedValue in allBangs) {
      // Valid bang tag
      localStorage.setItem(DEFAULT_BANG_KEY, updatedValue);
      defaultBang = allBangs[updatedValue]; // Update the runtime defaultBang variable
      updateEngineDetails(updatedValue); // Update displayed details
      if (engineDetailsDiv) engineDetailsDiv.style.display = ""; // Ensure details are shown on valid input
    } else {
      // Invalid bang tag
      if (errorElement) {
        errorElement.textContent = "Invalid bang tag.";
      } else {
        console.error("Invalid bang tag:", updatedValue);
      }
      // Clear/hide details display on invalid input
      if (engineDetailsDiv) {
        engineDetailsDiv.style.display = "none";
        // Also clear the content of the spans inside
        const nameSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-name",
        );
        const domainSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-domain",
        );
        const urlSpan = engineDetailsDiv.querySelector<HTMLSpanElement>(
          "#default-engine-url",
        );
        if (nameSpan) nameSpan.textContent = "";
        if (domainSpan) domainSpan.textContent = "";
        if (urlSpan) urlSpan.textContent = "";
      }
    }
  });

  // add listener for bang searchUrl
  searchBangsInput?.addEventListener("input", (event: Event) => {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    if (!searchBangsList) return;

    if (value === "") {
      // don't display anything if we're filtering very little, the list is too large
      searchBangsList.replaceChildren();
      return;
    }

    // do the actual search, very simple string comp
    const filteredBangs = Object.keys(allBangs)
      .filter((key) => key.startsWith(value))
      .sort((a, b) => a.localeCompare(b));

    // render the filtered bangs
    searchBangsList.replaceChildren(
      ...filteredBangs.map((key) => {
        const li = document.createElement("li");
        const formatted = `${allBangs[key].d}: !${key}`;
        li.textContent = formatted;
        return li;
      }),
    );
  });
}

export function getBangRedirectUrl() {
  const url = new URL(window.location.href);
  const fullQuery = url.searchParams.get("q")?.trim() ?? "";
  if (!fullQuery) {
    const path = url.pathname.trim();
    if (path === "/settings") {
      settingsPageRender();
      return null;
    }
    noSearchDefaultPageRender();
    return null;
  }

  const match = fullQuery.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase() ?? ""; // fallback to please ts compiler

  const { query, bang } = getQueryAndBang(bangCandidate, fullQuery);
  // Only go to domain without query
  if (query === "") {
    return `https://${bang.d}`;
  }

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = bang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(query).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

export function getQueryAndBang(bangTag: string, query: string) {
  let selectedBang = allBangs[bangTag];
  if (!selectedBang) {
    // fallback, but keep entire query intact
    selectedBang = defaultBang;
    return { bang: defaultBang, query };
  }

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  return {
    bang: selectedBang,
    query: cleanQuery,
  };
}

function doRedirect() {
  const searchUrl = getBangRedirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
