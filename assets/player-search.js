// @ts-check
const playerSearchForm = document.querySelector('form.player-search');
const playerSearchInput = document.getElementById('player-query');
if (playerSearchForm instanceof HTMLFormElement && playerSearchInput instanceof HTMLInputElement) {
  const key = `player-search:${location.pathname}`;
  playerSearchForm.addEventListener('submit', event => {
    // Storage can be disabled; searching must still work in that case.
    try { sessionStorage.setItem(key, playerSearchInput.value); } catch {}
    if (!new URLSearchParams(location.search).has('q')) return;
    event.preventDefault();
    const query = new URLSearchParams();
    new FormData(playerSearchForm).forEach((value, name) => {
      if (typeof value === 'string') query.append(name, value);
    });
    location.replace(`${playerSearchForm.action}?${query}`);
  });
  window.addEventListener('pageshow', () => {
    const term = new URLSearchParams(location.search).get('q');
    try { playerSearchInput.value = term ?? sessionStorage.getItem(key) ?? ''; }
    catch { playerSearchInput.value = term ?? ''; }
  });
  const clear = document.querySelector('.search-summary a');
  if (clear instanceof HTMLAnchorElement) {
    clear.addEventListener('click', event => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      try { sessionStorage.removeItem(key); } catch {}
      location.replace(clear.href);
    });
  }
}
