import { bangs } from "./bang";

const allBangs = loadBangs();

type OptionalSpecificKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Infer BangType from the imported bangs array element type
export type FullBangType = (typeof bangs)[number];
export type BangType = OptionalSpecificKeys<FullBangType, "c" | "sc" | "r">;

// Type for the data expected when creating a custom bang
type CustomBangInput = { t: string; s: string; d: string; u: string };

export type BangLookupType = Record<string, BangType>;

export function getCustomBangs() {
  return JSON.parse(
    localStorage.getItem("customBangs") ?? "{}",
  ) as BangLookupType;
}

export function mergeBangs(
  bangLeft: BangLookupType,
  bangRight: BangLookupType,
) {
  return { ...bangLeft, ...bangRight };
}

export function transformToLookup(bangList: typeof bangs) {
  return bangList.reduce<BangLookupType>((acc, cur) => {
    acc[cur["t"]] = cur;
    return acc;
  }, {});
}

export function loadBangs() {
  const customBangs = getCustomBangs();
  const defaultBangs = transformToLookup(bangs);
  return mergeBangs(defaultBangs, customBangs);
}

export function setDefaultSearchEngine(searchEngineBang: string) {
  if (!bangs.find((b) => b.t === searchEngineBang)) {
    throw new Error("invalid search engine");
  }
  localStorage.setItem("default-bang", searchEngineBang);
}

export function getDefaultSearchEngine() {
  return localStorage.getItem("default-bang") ?? "g";
}

// --- Custom Bang Management ---

const CUSTOM_BANGS_KEY = "customBangs";

/**
 * Validates a potential custom bang object.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateCustomBang(
  bang: CustomBangInput,
  existingBangs: BangLookupType,
  isUpdate: boolean = false,
  originalTag?: string, // Required if isUpdate is true and tag might change
): string | null {
  const currentTag = bang.t.startsWith("!") ? bang.t.slice(1) : bang.t;

  if (!currentTag || !bang.s || !bang.d || !bang.u) {
    return "All fields (Tag, Name, Domain, URL) are required.";
  }
  if (!/^[a-z0-9]+$/.test(currentTag)) {
    return "Tag must contain only lowercase letters and numbers.";
  }
  // Check if the tag exists, but only if it's not the original tag during an update
  if (
    currentTag in existingBangs &&
    (!isUpdate || currentTag !== originalTag)
  ) {
    return `Tag '!${currentTag}' is already in use (either default or custom).`;
  }
  if (bang.d.startsWith("http")) {
    return "Domain should not include protocol (http/https).";
  }
  try {
    // Basic domain check (doesn't guarantee validity but catches obvious errors)
    new URL(`https://${bang.d}`);
  } catch (_) {
    return "Domain is not a valid format.";
  }

  return null; // Validation passed
}

/**
 * Saves a single custom bang to local storage.
 * Assumes the bang has already been validated.
 */
export function saveCustomBang(bang: CustomBangInput): BangLookupType {
  if (bang.t.startsWith("!")) {
    bang.t = bang.t.slice(1); // remove the leading '!'
  }
  const customBangs = getCustomBangs();
  // Add the 'c' property to mark it as custom
  // Construct the object explicitly to match BangType inferred from bangs array
  const newBang: BangType = {
    t: bang.t,
    s: bang.s,
    d: bang.d,
    u: bang.u,
    // Add other properties from BangType if they exist and need default values, e.g., r: 0, sc: ''
    // If BangType definitively DOES NOT have 'c', remove it here and adjust expectations.
    // For now, assuming 'c: 1' is the correct way to mark custom bangs.
  };
  customBangs[bang.t] = newBang;
  localStorage.setItem(CUSTOM_BANGS_KEY, JSON.stringify(customBangs));
  return customBangs; // Return updated custom bangs
}

/**
 * Deletes a custom bang from local storage by its tag.
 */
export function deleteCustomBang(tag: string): BangLookupType {
  const customBangs = getCustomBangs();
  if (customBangs[tag]) {
    delete customBangs[tag];
    localStorage.setItem(CUSTOM_BANGS_KEY, JSON.stringify(customBangs));
  }
  return customBangs; // Return updated custom bangs
}

/**
 * Updates an existing custom bang in local storage.
 * Assumes the new bang data has been validated.
 * If the tag (t) is changed, it removes the old entry and adds a new one.
 */
export function updateCustomBang(
  originalTag: string,
  updatedBangData: CustomBangInput,
): BangLookupType {
  if (updatedBangData.t.startsWith("!")) {
    updatedBangData.t = updatedBangData.t.slice(1); // remove the leading '!' if present
  }
  const customBangs = getCustomBangs();
  const existingBang = customBangs[originalTag];

  if (!existingBang) {
    // Should not happen if called correctly, but handle defensively
    console.error(
      `Cannot update non-existent bang with original tag: ${originalTag}`,
    );
    return customBangs;
  }

  // Construct the updated bang object in the correct format
  const updatedBang: BangType = {
    t: updatedBangData.t,
    s: updatedBangData.s,
    d: updatedBangData.d,
    u: updatedBangData.u,
    // Preserve any other properties if necessary, assuming 'c' is implicit or added later
    // Example: Copy other potential properties from existingBang if BangType has more fields
  };

  // If the tag hasn't changed, just update the entry
  if (originalTag === updatedBang.t) {
    customBangs[originalTag] = updatedBang;
  } else {
    // If the tag has changed, remove the old one and add the new one
    delete customBangs[originalTag];
    customBangs[updatedBang.t] = updatedBang;
  }

  localStorage.setItem(CUSTOM_BANGS_KEY, JSON.stringify(customBangs));
  return customBangs; // Return updated custom bangs
}

export function renderCustomEnginesTable(
  customBangs: BangLookupType,
  tableBody: HTMLTableSectionElement | null,
) {
  if (!tableBody) return;

  tableBody.innerHTML = ""; // Clear existing rows

  Object.values(customBangs).forEach((bang) => {
    const row = tableBody.insertRow();
    row.insertCell().textContent = bang.s; // Name
    row.insertCell().textContent = `!${bang.t}`; // Shortcut
    row.insertCell().textContent = bang.d; // domain
    row.insertCell().textContent = bang.u; // url template
    const actionCell = row.insertCell();
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "×";
    deleteButton.classList.add("delete-btn", "delete-custom-btn"); // Add specific class for delegation
    deleteButton.dataset.tag = bang.t; // Store tag for deletion
    actionCell.appendChild(deleteButton);
  });
}

export function updateEngineDetails(bangKey: string) {
  const engineDetailsDiv = document.querySelector<HTMLDivElement>(
    "#default-engine-details",
  );
  const nameSpan = document.querySelector<HTMLSpanElement>(
    "#default-engine-name",
  );
  const domainSpan = document.querySelector<HTMLSpanElement>(
    "#default-engine-domain",
  );
  const urlSpan = document.querySelector<HTMLSpanElement>(
    "#default-engine-url",
  );

  // Ensure the container div exists before trying to access elements within it
  if (!engineDetailsDiv) {
    console.error("Engine details container not found.");
    return;
  }
  if (!nameSpan || !domainSpan || !urlSpan) {
    console.error("One or more engine detail spans not found.");
    // Attempt to hide container if elements are missing within it
    engineDetailsDiv.style.display = "none";
    return;
  }

  const bangData = allBangs[bangKey];
  if (bangData) {
    nameSpan.textContent = bangData.s ?? "N/A"; // Use ?? for safety
    domainSpan.textContent = bangData.d ?? "N/A";
    urlSpan.textContent = bangData.u ?? "N/A";
    engineDetailsDiv.style.display = ""; // Show details
  } else {
    // Clear details if bangKey is invalid or not found
    nameSpan.textContent = "";
    domainSpan.textContent = "";
    urlSpan.textContent = "";
    engineDetailsDiv.style.display = "none"; // Hide details
  }
}
