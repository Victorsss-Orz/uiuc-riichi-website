import { html } from "../../../packages/html/dist/index.js";
import { PageLayout, PageLocals } from "../../components/pageLayout.html.js";
import {
  clubMeetingPhotos,
  yakumanPhotos,
  meetingDetails,
  type GalleryPhoto,
} from "./homeContent.js";

export function home({ resLocals }: { resLocals: PageLocals }) {
  const semesters = resLocals.semesters ?? [];
  return PageLayout({
    resLocals,
    pageTitle: "UIUC Riichi Mahjong Club",
    headContent: html`<link rel="stylesheet" href="/assets/profile.css" />
      <link rel="stylesheet" href="/assets/home.css" />
      <script src="/assets/home-gallery.js" defer></script>`,
    content: html`<div class="club-welcome">
      <p class="eyebrow">UIUC RIICHI MAHJONG CLUB</p>
      <h1>Welcome to UIUC Riichi.</h1>
      <section class="home-section" aria-labelledby="meetings-heading">
        <h2 id="meetings-heading">Meet with us</h2>
        <dl class="meeting-details">
          <div>
            <dt>When</dt>
            <dd>${meetingDetails.when}</dd>
          </div>
          <div>
            <dt>Where</dt>
            <dd>${meetingDetails.where}</dd>
          </div>
        </dl>
      </section>
      <section class="home-section" aria-labelledby="rankings-heading">
        <h2 id="rankings-heading">Rankings & results</h2>
        <p class="lead text-secondary">
          Choose a semester to explore player rankings and match results.
        </p>
        <nav class="semester-list" aria-label="Choose a semester">
          ${semesters.map(
            (semester) =>
              html` <a href="/semester/${semester}/players"
                ><strong>${semester}</strong
                ><span
                  >${semester === resLocals.activeSemester ? "Current semester · " : ""}Player
                  rankings →</span
                ></a
              >`,
          )}
        </nav>
        ${semesters.length ? "" : html`<p>No semesters have been added yet.</p>`}
      </section>
      ${Gallery({
        id: "club-meeting-gallery",
        title: "Club meeting gallery",
        description: "A look at our club meetings and events.",
        photos: clubMeetingPhotos,
        placeholder: "Club meeting photos coming soon",
      })}
      ${Gallery({
        id: "yakuman-gallery",
        title: "Yakuman gallery",
        description: "Memorable Yakuman hands from our club.",
        photos: yakumanPhotos,
        placeholder: "Yakuman photos coming soon",
      })}
    </div>`,
  });
}

function Gallery({
  id,
  title,
  description,
  photos,
  placeholder,
}: {
  id: string;
  title: string;
  description: string;
  photos: GalleryPhoto[];
  placeholder: string;
}) {
  return html`<section
    class="home-section"
    aria-labelledby="${id}"
    data-gallery
  >
    <h2 id="${id}">${title}</h2>
    <p class="text-secondary">${description}</p>
    <div class="gallery-controls" hidden>
      <button
        type="button"
        class="btn btn-outline-primary"
        data-gallery-previous
        aria-controls="${id}-photos"
        aria-label="Previous photo in ${title}"
      >
        ←
      </button>
      <button
        type="button"
        class="btn btn-outline-primary"
        data-gallery-next
        aria-controls="${id}-photos"
        aria-label="Next photo in ${title}"
      >
        →
      </button>
    </div>
    <div
      class="event-gallery"
      id="${id}-photos"
      tabindex="0"
      role="region"
      aria-label="${title} photos"
    >
      ${
        photos.length
          ? photos.map(
              (photo) =>
                html`<figure class="gallery-photo">
                  <a href="/assets/gallery/${photo.src}">
                    <img
                      src="/assets/gallery/${photo.src}"
                      alt="${photo.alt}"
                      loading="lazy"
                      decoding="async"
                      width="800"
                      height="600"
                    />
                  </a>
                  <figcaption>${photo.caption}</figcaption>
                </figure>`,
            )
          : [1, 2, 3].map(
              () =>
                html`<div class="gallery-placeholder">
                  <span>${placeholder}</span>
                </div>`,
            )
      }
    </div>
  </section>`;
}
