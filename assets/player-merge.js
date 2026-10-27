// @ts-check
// The server renders escaped search results. Selection keeps Discord IDs as strings.
for (const picker of document.querySelectorAll("[data-account-picker]")) {
  const search = picker.querySelector("[data-account-search]");
  const id = picker.querySelector("[data-account-id]");
  const results = picker.querySelector("[data-account-results]");
  if (
    !(search instanceof HTMLInputElement) ||
    !(id instanceof HTMLInputElement) ||
    !(results instanceof HTMLElement)
  )
    continue;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** @type {AbortController | undefined} */
  let request;
  const closeResults = () => {
    results.hidden = true;
  };
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !picker.contains(event.target))
      closeResults();
  });
  picker.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Escape") {
      clearTimeout(timer);
      request?.abort();
      closeResults();
    }
  });
  picker.addEventListener("focusout", (event) => {
    if (
      event instanceof FocusEvent &&
      (!(event.relatedTarget instanceof Node) ||
        !picker.contains(event.relatedTarget))
    )
      closeResults();
  });
  search.addEventListener("focus", () => {
    if (results.hasChildNodes()) results.hidden = false;
  });
  search.addEventListener("input", () => {
    clearTimeout(timer);
    request?.abort();
    id.value = "";
    results.replaceChildren();
    closeResults();
    const term = search.value.trim();
    if (!term) return;
    timer = setTimeout(async () => {
      const current = new AbortController();
      request = current;
      try {
        const response = await fetch(
          `/admin/players/merge-search?q=${encodeURIComponent(term)}`,
          { signal: current.signal },
        );
        if (response.redirected || !response.ok)
          throw new Error("Search unavailable");
        const markup = await response.text();
        if (!current.signal.aborted) {
          results.innerHTML = markup;
          results.hidden = document.activeElement !== search;
        }
      } catch (error) {
        if (!current.signal.aborted) {
          results.textContent =
            "Search unavailable. Reload the page or enter the full Discord ID.";
          results.hidden = document.activeElement !== search;
        }
      }
    }, 200);
  });
  results.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-player-id]");
    if (!(button instanceof HTMLButtonElement)) return;
    clearTimeout(timer);
    request?.abort();
    id.value = button.dataset.playerId ?? "";
    search.value = button.dataset.playerName ?? "";
    results.replaceChildren();
    closeResults();
  });
}
