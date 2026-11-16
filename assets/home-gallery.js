document.querySelectorAll("[data-gallery]").forEach((gallery) => {
  const track = gallery.querySelector(".event-gallery");
  const controls = gallery.querySelector(".gallery-controls");
  const previous = gallery.querySelector("[data-gallery-previous]");
  const next = gallery.querySelector("[data-gallery-next]");

  const updateControls = () => {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  };

  const move = (direction) => {
    const items = track.children;
    const step =
      items.length > 1
        ? items[1].offsetLeft - items[0].offsetLeft
        : track.clientWidth;
    track.scrollBy({
      left: direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("scroll", updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  controls.hidden = false;
  updateControls();
});
