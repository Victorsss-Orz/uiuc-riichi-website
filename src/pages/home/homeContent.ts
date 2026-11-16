// Fill in these details when the club's meeting schedule is confirmed.
export const meetingDetails = {
  when: "Fridays 6pm.",
  where: "Illini Union Basement.",
};

export type GalleryPhoto = {
  // Path relative to assets/gallery/, including any subfolders.
  src: string;
  alt: string;
  caption: string;
};

// Add photos to assets/gallery/ and list only their relative paths here. For example:
// { src: "meetings/club-meeting.jpg", alt: "Members playing mahjong at club meeting", caption: "Club meeting" },
export const clubMeetingPhotos: GalleryPhoto[] = [
  {
    src: "meetings/meeting-1.jpg",
    alt: "Playing mahjong at club meeting",
    caption: "Illini Union club meeting",
  },
  {
    src: "meetings/meeting-2.jpg",
    alt: "Playing mahjong at club meeting",
    caption: "Illini Union club meeting",
  },
  {
    src: "meetings/quad-day-1.jpg",
    alt: "Quad day",
    caption: "Quad day",
  },
  {
    src: "meetings/quad-day-2.jpg",
    alt: "Quad day",
    caption: "Quad day",
  },
];

// Add Yakuman photos separately, using the same src, alt, and caption fields.
export const yakumanPhotos: GalleryPhoto[] = [
  { src: "yakuman/九連宝燈.jpg", alt: "Chuuren poutou", caption: "Life--;" },
  { src: "yakuman/国士無双.jpg", alt: "Kokushi musou", caption: "国士無双" },
  { src: "yakuman/数え役満.jpg", alt: "Kazoe yakuman", caption: "数え役満" },
];
