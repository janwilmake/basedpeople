// Categories of tech personalities
export const categories = [
  "CEO/Founder",
  "Programmer/Engineer",
  "Investor/VC",
  "Writer/Journalist",
  "Philosopher/Academic",
  "Podcaster/Media",
  "Product Leader",
  "Security Expert",
  "AI Researcher",
] as const;

export type Category = (typeof categories)[number];

export interface TechPersonality {
  name: string;
  slug: string;
  summary: string;
  category: Category;
}

export type AppearanceType = (typeof appearanceTypes)[number]["type"];

export const appearanceTypes = [
  {
    type: "Podcast Interview",
    summary:
      "Guest appearances on podcasts like Joe Rogan, Lex Fridman, Tim Ferriss, This Week in Startups, etc.",
  },
  {
    type: "Television Interview",
    summary:
      "Appearances on TV shows like CNBC, CNN, BBC, Bloomberg, 60 Minutes, etc.",
  },
  {
    type: "Conference Keynote",
    summary:
      "Main stage presentations at tech conferences like TechCrunch Disrupt, Web Summit, CES, Google I/O, etc.",
  },
  {
    type: "Conference Panel",
    summary:
      "Panel discussions at industry conferences and events with multiple speakers",
  },
  {
    type: "Congressional Hearing",
    summary:
      "Testimony before US Congress, Senate committees, or European Parliament on tech regulation",
  },
  {
    type: "University Talk",
    summary:
      "Guest lectures, commencement speeches, or presentations at universities and academic institutions",
  },
  {
    type: "YouTube Video",
    summary:
      "Appearances on other people's YouTube channels, not their own content",
  },
  {
    type: "Radio Interview",
    summary: "Interviews on radio stations like NPR, BBC Radio, SiriusXM, etc.",
  },
  {
    type: "Documentary Feature",
    summary:
      "Appearances in documentaries about tech, business, or social issues",
  },
  {
    type: "Earnings Call",
    summary:
      "Public quarterly earnings calls where executives speak to investors and analysts",
  },
  {
    type: "Product Launch Event",
    summary:
      "Public presentations at company product launches, often livestreamed",
  },
  {
    type: "Industry Summit",
    summary:
      "Speaking at specialized industry events like AI summits, fintech conferences, etc.",
  },
  {
    type: "Book Tour Event",
    summary:
      "Author appearances at bookstores, literary festivals, or book promotion events",
  },
  {
    type: "Award Ceremony",
    summary:
      "Appearances at tech awards, business awards, or recognition ceremonies",
  },
  {
    type: "Webinar",
    summary: "Online seminars or virtual events, often industry-specific",
  },
  {
    type: "Fireside Chat",
    summary:
      "Informal interview format events, often at conferences or corporate events",
  },
  {
    type: "Press Conference",
    summary:
      "Official company or organizational press announcements with media Q&A",
  },
  {
    type: "Livestream",
    summary:
      "Live streaming events on platforms like Twitter Spaces, Clubhouse, LinkedIn Live",
  },
  {
    type: "News Interview",
    summary:
      "Breaking news interviews or commentary on current events related to tech",
  },
  {
    type: "Trade Show Presentation",
    summary:
      "Speaking at industry trade shows like Mobile World Congress, Computex, etc.",
  },
  {
    type: "Investor Meeting",
    summary:
      "Public investor days, shareholder meetings, or VC pitch presentations",
  },
  {
    type: "Debate/Discussion",
    summary: "Formal debates or structured discussions with other tech figures",
  },
  {
    type: "Think Tank Event",
    summary:
      "Appearances at policy think tanks, research institutions, or advocacy organizations",
  },
  {
    type: "Startup Demo Day",
    summary:
      "Appearances as judges or speakers at accelerator demo days or pitch competitions",
  },
  {
    type: "Corporate Event",
    summary:
      "Speaking at other companies' events, customer conferences, or partner summits",
  },
  {
    type: "International Forum",
    summary:
      "World Economic Forum, G7/G20 meetings, UN events, or other international gatherings",
  },
  {
    type: "Workshop/Masterclass",
    summary:
      "Educational sessions or skill-building workshops open to public or industry",
  },
  {
    type: "Regulatory Hearing",
    summary:
      "Appearances before regulatory bodies like FTC, SEC, or European regulators",
  },
  {
    type: "Charity Event",
    summary:
      "Speaking at fundraising events, nonprofit galas, or social impact conferences",
  },
  {
    type: "Media Roundtable",
    summary:
      "Closed-door sessions with journalists that result in multiple published articles",
  },
] as const;

export type Appearance = {
  /** Name of the person */
  name: string;
  type: AppearanceType;
  /** YYYY-MM-DD */
  date: `${string}-${string}-${string}`;
  /** Max 12 words describing the appearance */
  title: string;
  /** Explain in up to 1 paragraph what the appearance was about */
  summary: string;
  /** Comma separated list of other people that were present in this appearance that were mentioned */
  otherParticipatedPeopleMentioned: string;
  /** Who organized/hosted this event */
  organizerName: string;
  /** Most authorative URL of the website where more information about the appearance can be found */
  url: string;
  /** If available, make a list of the top 10 statements made by the person in this appearance */
  statements: { statement: string; is_exact: boolean }[];
};
