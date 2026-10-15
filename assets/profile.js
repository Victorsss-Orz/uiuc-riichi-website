(() => {
  const pageNumbers = (page, pages, available) => {
    const narrow = window.matchMedia("(max-width: 379px)").matches;
    const itemWidth = narrow ? 28 : 32;
    const gapWidth = narrow ? 1.6 : 2.4;
    const slots = Math.min(11, Math.floor((available + gapWidth) / (itemWidth + gapWidth)));
    if (pages + 2 <= slots) return Array.from({ length: pages }, (_, i) => i + 1);
    const candidates = page <= 3
      ? [[1, 2, 3, 4, 5, pages], [1, 2, 3, pages], [1, 2, pages]]
      : page >= pages - 2
        ? [[1, pages - 4, pages - 3, pages - 2, pages - 1, pages], [1, pages - 2, pages - 1, pages], [1, pages - 1, pages]]
        : [[1, page - 1, page, page + 1, pages], [1, page, page + 1, pages], [1, page - 1, page, pages], [1, page, pages]];
    const fillGaps = (values) => {
      const sorted = [...new Set(values.filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
      const result = [];
      sorted.forEach((n, i) => {
        if (i && n - sorted[i - 1] === 2) result.push(n - 1);
        else if (i && n - sorted[i - 1] > 2) result.push(null);
        result.push(n);
      });
      return result;
    };
    return candidates.map(fillGaps).find(items => items.length + 2 <= slots) ?? fillGaps([1, page, pages]);
  };

  const renderPagination = (nav, page, pages, kind) => {
    nav.dataset.page = String(page);
    const controls = nav.querySelector(".pagination-controls");
    const countWidth = nav.querySelector(".pagination-count")?.getBoundingClientRect().width ?? 0;
    const available = window.matchMedia("(max-width: 650px)").matches
      ? nav.clientWidth : Math.max(0, nav.clientWidth - countWidth - 12);
    const target = kind === "history" ? "history-heading" : "opponents-heading";
    const control = (number, label, arrow = false) => {
      const valid = number >= 1 && number <= pages;
      const item = document.createElement(kind === "history" && valid ? "a" : "button");
      item.className = arrow ? "pagination-arrow" : "pagination-page";
      item.textContent = label;
      item.setAttribute("aria-label", arrow ? `${number < page ? "Previous" : "Next"} page` : `Page ${number}`);
      if (valid) {
        item.dataset.page = String(number);
        if (kind === "history") item.href = `?page=${number}#${target}`;
        else item.type = "button";
      } else {
        item.type = "button";
        item.disabled = true;
      }
      return item;
    };
    const items = [];
    if (pages > 1) items.push(control(page - 1, "‹", true));
    for (const number of pageNumbers(page, pages, available)) {
      if (number === null) {
        const gap = document.createElement("span");
        gap.className = "pagination-ellipsis";
        gap.textContent = "…";
        gap.setAttribute("aria-hidden", "true");
        items.push(gap);
      } else if (number === page) {
        const current = document.createElement("span");
        current.className = "pagination-page pagination-current";
        current.textContent = String(number);
        current.setAttribute("aria-current", "page");
        current.setAttribute("aria-label", `Page ${number} of ${pages}`);
        current.tabIndex = -1;
        items.push(current);
      } else items.push(control(number, String(number)));
    }
    if (pages > 1) items.push(control(page + 1, "›", true));
    controls.replaceChildren(...items);
  };

  const opponentRows = [...document.querySelectorAll("#opponent-rows tr")];
  const opponentPagination = document.getElementById("h2h-pagination");
  if (opponentPagination && opponentRows.length) {
    let page = 1;
    const pages = Math.ceil(opponentRows.length / 10);
    const update = () => {
      opponentRows.forEach((row, index) => { row.hidden = index < (page - 1) * 10 || index >= page * 10; });
      renderPagination(opponentPagination, page, pages, "opponents");
    };
    opponentPagination.hidden = false;
    update();
    opponentPagination.addEventListener("click", (event) => {
      const button = event.target.closest?.("button[data-page]");
      if (!button) return;
      page = Number(button.dataset.page);
      update();
      opponentPagination.querySelector(".pagination-current")?.focus({ preventScroll: true });
    });
  }

  const enhanceHistoryPagination = (root = document) => {
    const nav = root.querySelector(".history-pagination");
    if (nav) renderPagination(nav, Number(nav.dataset.page), Number(nav.dataset.pages), "history");
  };
  enhanceHistoryPagination();
  window.addEventListener("resize", () => {
    if (opponentPagination) renderPagination(opponentPagination, Number(opponentPagination.dataset.page), Number(opponentPagination.dataset.pages), "opponents");
    enhanceHistoryPagination();
  });

  let loading = false;
  let statusTimer;
  document.addEventListener("click", async (event) => {
    const link = event.target.closest?.(".history-pagination a[data-page]");
    if (!link) return;
    event.preventDefault();
    if (loading) return;
    const content = document.getElementById("match-history-content");
    const status = document.getElementById("history-load-status");
    if (!content || !status) { window.location.assign(link.href); return; }
    const horizontalPosition = content.querySelector(".match-table-wrap")?.scrollLeft ?? 0;

    loading = true;
    window.clearTimeout(statusTimer);
    content.setAttribute("aria-busy", "true");
    status.textContent = "Loading matches…";
    try {
      const url = new URL(link.href);
      url.pathname = `${url.pathname.replace(/\/$/, "")}/history`;
      url.hash = "";
      const response = await fetch(url, { headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`History request failed: ${response.status}`);
      const next = new DOMParser().parseFromString(await response.text(), "text/html")
        .getElementById("match-history-content");
      if (!next) throw new Error("History response is missing its content");
      content.replaceWith(next);
      const nextWrap = next.querySelector(".match-table-wrap");
      if (nextWrap) nextWrap.scrollLeft = horizontalPosition;
      enhanceHistoryPagination(next);
      const nav = next.querySelector(".history-pagination");
      status.textContent = `Page ${nav.dataset.page} of ${nav.dataset.pages} loaded.`;
      nav.querySelector(".pagination-current")?.focus({ preventScroll: true });
      statusTimer = window.setTimeout(() => { status.textContent = ""; }, 2000);
    } catch {
      window.location.assign(link.href);
    } finally {
      loading = false;
      document.getElementById("match-history-content")?.removeAttribute("aria-busy");
    }
  });
})();
