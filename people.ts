// Categories of tech personalities
export const categories = [
  "CEO/Founder",
  "Programmer/Engineer",
  "Investor/VC",
  "Political Figure",
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
  summary: string;
  category: Category;
}

export const techPersonalities: TechPersonality[] = [
  // CEOs/Founders
  {
    name: "Elon Musk",
    summary:
      "CEO of Tesla and SpaceX, owner of X (formerly Twitter), frequently appears on podcasts like Joe Rogan and interviews",
    category: "CEO/Founder",
  },
  {
    name: "Mark Zuckerberg",
    summary:
      "CEO of Meta (Facebook), often appears in congressional hearings, tech conferences, and interviews",
    category: "CEO/Founder",
  },
  {
    name: "Sundar Pichai",
    summary:
      "CEO of Alphabet (Google), regular at tech conferences and congressional testimonies",
    category: "CEO/Founder",
  },
  {
    name: "Tim Cook",
    summary:
      "CEO of Apple, frequent keynote speaker and interview guest on major media outlets",
    category: "CEO/Founder",
  },
  {
    name: "Satya Nadella",
    summary:
      "CEO of Microsoft, regular conference speaker and media interview participant",
    category: "CEO/Founder",
  },
  {
    name: "Jensen Huang",
    summary:
      "CEO of NVIDIA, frequently speaks at AI conferences and tech events about GPUs and AI",
    category: "CEO/Founder",
  },
  {
    name: "Sam Altman",
    summary:
      "CEO of OpenAI, frequent podcast guest and conference speaker on AI topics",
    category: "CEO/Founder",
  },
  {
    name: "Patrick Collison",
    summary:
      "CEO of Stripe, often appears on tech podcasts and startup conferences",
    category: "CEO/Founder",
  },
  {
    name: "Daniel Ek",
    summary:
      "CEO of Spotify, regularly appears in European tech media and conferences",
    category: "CEO/Founder",
  },
  {
    name: "Reid Hoffman",
    summary:
      "Co-founder of LinkedIn, frequent podcast host and guest, venture capitalist",
    category: "CEO/Founder",
  },
  {
    name: "Brian Chesky",
    summary:
      "CEO of Airbnb, regular conference speaker and interview participant",
    category: "CEO/Founder",
  },
  {
    name: "Drew Houston",
    summary: "CEO of Dropbox, appears on startup and tech podcasts",
    category: "CEO/Founder",
  },
  {
    name: "Stewart Butterfield",
    summary: "Co-founder of Slack, frequent tech conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Melanie Perkins",
    summary:
      "CEO of Canva, regular at startup conferences and women in tech events",
    category: "CEO/Founder",
  },
  {
    name: "Tobias Lütke",
    summary: "CEO of Shopify, appears on e-commerce and tech podcasts",
    category: "CEO/Founder",
  },

  // Programmers/Engineers
  {
    name: "Linus Torvalds",
    summary:
      "Creator of Linux and Git, occasional conference speaker and interview participant",
    category: "Programmer/Engineer",
  },
  {
    name: "John Carmack",
    summary:
      "Legendary game programmer (id Software, Oculus), frequent conference keynote speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Guido van Rossum",
    summary:
      "Creator of Python programming language, appears at Python conferences and tech talks",
    category: "Programmer/Engineer",
  },
  {
    name: "Brendan Eich",
    summary:
      "Creator of JavaScript, founder of Brave Browser, tech conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Anders Hejlsberg",
    summary:
      "Creator of TypeScript and C#, Microsoft technical fellow, conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Rich Hickey",
    summary:
      "Creator of Clojure programming language, conference speaker on functional programming",
    category: "Programmer/Engineer",
  },
  {
    name: "DHH (David Heinemeier Hansson)",
    summary:
      "Creator of Ruby on Rails, CTO of Basecamp, frequent podcast guest and blogger",
    category: "Programmer/Engineer",
  },
  {
    name: "Fabrice Bellard",
    summary:
      "French programmer behind QEMU, FFmpeg, and JSLinux, occasional conference speaker",
    category: "Programmer/Engineer",
  },

  // Investors/VCs
  {
    name: "Marc Andreessen",
    summary:
      "Co-founder of Andreessen Horowitz, frequent Twitter commentator and podcast guest",
    category: "Investor/VC",
  },
  {
    name: "Peter Thiel",
    summary:
      "Co-founder of PayPal and Palantir, investor, author, frequent interview participant",
    category: "Investor/VC",
  },
  {
    name: "Ben Horowitz",
    summary:
      "Co-founder of Andreessen Horowitz, author, podcast guest on business topics",
    category: "Investor/VC",
  },
  {
    name: "Mary Meeker",
    summary:
      "Venture capitalist, famous for annual Internet Trends report, conference speaker",
    category: "Investor/VC",
  },
  {
    name: "Naval Ravikant",
    summary: "AngelList founder, philosopher-investor, popular podcast guest",
    category: "Investor/VC",
  },
  {
    name: "Chamath Palihapitiya",
    summary: "Former Facebook executive, SPAC investor, frequent podcast guest",
    category: "Investor/VC",
  },
  {
    name: "Keith Rabois",
    summary:
      "PayPal Mafia member, Founders Fund partner, active on Twitter and podcasts",
    category: "Investor/VC",
  },

  // Political Figures
  {
    name: "Alexandria Ocasio-Cortez",
    summary:
      "US Representative, frequent commentator on tech policy and big tech regulation",
    category: "Political Figure",
  },
  {
    name: "Elizabeth Warren",
    summary:
      "US Senator, advocate for breaking up big tech companies, frequent media appearances",
    category: "Political Figure",
  },
  {
    name: "Margrethe Vestager",
    summary:
      "EU Competition Commissioner, leads European tech regulation efforts",
    category: "Political Figure",
  },
  {
    name: "Josh Hawley",
    summary:
      "US Senator, critic of big tech, frequent congressional hearing participant",
    category: "Political Figure",
  },
  {
    name: "Lina Khan",
    summary: "FTC Chair, antitrust expert focused on tech companies",
    category: "Political Figure",
  },
  {
    name: "Thierry Breton",
    summary:
      "EU Internal Market Commissioner, oversees digital regulation in Europe",
    category: "Political Figure",
  },

  // Writers/Journalists
  {
    name: "Kara Swisher",
    summary:
      "Tech journalist, podcast host (Pivot, Sway), frequent interview show guest",
    category: "Writer/Journalist",
  },
  {
    name: "Casey Newton",
    summary: "Tech journalist, Platformer newsletter, frequent podcast guest",
    category: "Writer/Journalist",
  },
  {
    name: "Ben Thompson",
    summary:
      "Stratechery newsletter author, Sharp Tech podcast, business strategy analyst",
    category: "Writer/Journalist",
  },
  {
    name: "Walt Mossberg",
    summary:
      "Veteran tech journalist, co-founder of Recode, frequent media appearances",
    category: "Writer/Journalist",
  },
  {
    name: "Shoshana Zuboff",
    summary:
      "Author of 'The Age of Surveillance Capitalism', Harvard professor, media commentator",
    category: "Writer/Journalist",
  },
  {
    name: "Cathy O'Neil",
    summary:
      "Author of 'Weapons of Math Destruction', data scientist, frequent speaker on algorithmic bias",
    category: "Writer/Journalist",
  },
  {
    name: "Zeynep Tufekci",
    summary:
      "NYT columnist, author, expert on technology and society, frequent media guest",
    category: "Writer/Journalist",
  },
  {
    name: "Steven Levy",
    summary:
      "Senior writer at Wired, author of multiple tech books, frequent interview participant",
    category: "Writer/Journalist",
  },

  // Philosophers/Academics
  {
    name: "Yuval Noah Harari",
    summary:
      "Historian and philosopher, author of 'Sapiens', frequent speaker on AI and future of humanity",
    category: "Philosopher/Academic",
  },
  {
    name: "Nick Bostrom",
    summary:
      "Oxford philosopher, expert on existential risks and AI safety, author of 'Superintelligence'",
    category: "Philosopher/Academic",
  },
  {
    name: "Sherry Turkle",
    summary:
      "MIT professor, expert on human-computer interaction, author, frequent media appearances",
    category: "Philosopher/Academic",
  },
  {
    name: "Jaron Lanier",
    summary:
      "Computer scientist, author of 'Ten Arguments for Deleting Your Social Media Accounts'",
    category: "Philosopher/Academic",
  },
  {
    name: "Cynthia Dwork",
    summary:
      "Harvard professor, pioneer in differential privacy, frequent academic conference speaker",
    category: "Philosopher/Academic",
  },
  {
    name: "Timnit Gebru",
    summary:
      "AI ethics researcher, former Google researcher, frequent speaker on AI bias",
    category: "Philosopher/Academic",
  },

  // Podcasters/Media
  {
    name: "Joe Rogan",
    summary:
      "Popular podcast host who frequently interviews tech personalities",
    category: "Podcaster/Media",
  },
  {
    name: "Lex Fridman",
    summary:
      "AI researcher and podcast host, interviews tech leaders and scientists",
    category: "Podcaster/Media",
  },
  {
    name: "Tim Ferriss",
    summary:
      "Author and podcast host, frequently interviews successful tech entrepreneurs",
    category: "Podcaster/Media",
  },
  {
    name: "Jason Calacanis",
    summary:
      "Angel investor and podcast host (This Week in Startups), frequent conference speaker",
    category: "Podcaster/Media",
  },

  // Product Leaders
  {
    name: "Marissa Mayer",
    summary:
      "Former Yahoo CEO and Google VP, frequent conference speaker on product development",
    category: "Product Leader",
  },
  {
    name: "Susan Wojcicki",
    summary:
      "Former YouTube CEO, frequent speaker on digital media and platform governance",
    category: "Product Leader",
  },
  {
    name: "Sheryl Sandberg",
    summary:
      "Former Facebook COO, author of 'Lean In', frequent business conference speaker",
    category: "Product Leader",
  },
  {
    name: "Adam Mosseri",
    summary:
      "Head of Instagram, frequent spokesperson for Meta's social media platforms",
    category: "Product Leader",
  },

  // Security Experts
  {
    name: "Bruce Schneier",
    summary:
      "Cryptographer and security technologist, author, frequent media commentator on cybersecurity",
    category: "Security Expert",
  },
  {
    name: "Edward Snowden",
    summary:
      "NSA whistleblower, privacy advocate, frequent remote conference speaker",
    category: "Security Expert",
  },
  {
    name: "Kevin Mitnick",
    summary:
      "Former hacker turned security consultant, frequent conference speaker and media guest",
    category: "Security Expert",
  },

  // AI Researchers
  {
    name: "Geoffrey Hinton",
    summary:
      "Deep learning pioneer, former Google researcher, frequent speaker on AI development",
    category: "AI Researcher",
  },
  {
    name: "Yann LeCun",
    summary:
      "Facebook AI Research director, NYU professor, frequent AI conference speaker",
    category: "AI Researcher",
  },
  {
    name: "Andrew Ng",
    summary:
      "AI researcher, Coursera co-founder, frequent educator and conference speaker",
    category: "AI Researcher",
  },
  {
    name: "Fei-Fei Li",
    summary:
      "Stanford AI professor, former Google Cloud AI chief scientist, frequent speaker",
    category: "AI Researcher",
  },
  {
    name: "Demis Hassabis",
    summary:
      "DeepMind CEO and co-founder, frequent speaker on AI and neuroscience",
    category: "AI Researcher",
  },
  {
    name: "Yoshua Bengio",
    summary:
      "Montreal AI researcher, Turing Award winner, frequent academic conference speaker",
    category: "AI Researcher",
  },
  {
    name: "Stuart Russell",
    summary:
      "UC Berkeley AI professor, author of 'Human Compatible', expert on AI safety",
    category: "AI Researcher",
  },

  // Additional European Tech Figures
  {
    name: "Niklas Zennström",
    summary:
      "Skype co-founder, Atomico founder, frequent European tech conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Klaus Schwab",
    summary:
      "World Economic Forum founder, frequent speaker on Fourth Industrial Revolution",
    category: "Philosopher/Academic",
  },
  {
    name: "Martha Lane Fox",
    summary:
      "Lastminute.com co-founder, digital inclusion advocate, frequent UK tech policy speaker",
    category: "CEO/Founder",
  },
  {
    name: "Hermann Hauser",
    summary:
      "ARM co-founder, venture capitalist, frequent European tech conference speaker",
    category: "Investor/VC",
  },
  {
    name: "Reshma Saujani",
    summary: "Girls Who Code founder, frequent speaker on diversity in tech",
    category: "CEO/Founder",
  },
  {
    name: "Mitchell Baker",
    summary:
      "Mozilla chairwoman, frequent speaker on internet freedom and open source",
    category: "CEO/Founder",
  },
  {
    name: "Mikkel Svane",
    summary:
      "Zendesk CEO, frequent SaaS and customer service conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Anne Wojcicki",
    summary:
      "23andMe CEO, frequent speaker on genomics and personalized medicine",
    category: "CEO/Founder",
  },
  {
    name: "Chad Dickerson",
    summary:
      "Former Etsy CEO, frequent speaker on e-commerce and marketplace businesses",
    category: "CEO/Founder",
  },
  {
    name: "John Collison",
    summary:
      "Stripe co-founder and president, frequent fintech conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Hiroshi Mikitani",
    summary: "Rakuten CEO, frequent speaker on Japanese and global e-commerce",
    category: "CEO/Founder",
  },
  {
    name: "Lei Jun",
    summary:
      "Xiaomi founder and CEO, frequent speaker at Chinese and international tech events",
    category: "CEO/Founder",
  },
  {
    name: "Tony Fadell",
    summary:
      "iPod creator, Nest founder, frequent product design and innovation speaker",
    category: "Product Leader",
  },
  {
    name: "Jan Koum",
    summary:
      "WhatsApp co-founder, occasional conference speaker on messaging and privacy",
    category: "CEO/Founder",
  },
  {
    name: "Kevin Systrom",
    summary:
      "Instagram co-founder, frequent speaker on social media and photography",
    category: "CEO/Founder",
  },
  {
    name: "Mike Krieger",
    summary:
      "Instagram co-founder, frequent speaker on mobile development and social platforms",
    category: "CEO/Founder",
  },
  {
    name: "Evan Spiegel",
    summary: "Snapchat CEO, frequent speaker on AR, social media, and Gen Z",
    category: "CEO/Founder",
  },
  {
    name: "Bobby Murphy",
    summary:
      "Snapchat co-founder and CTO, occasional technical conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Jack Dorsey",
    summary:
      "Twitter co-founder, Block (Square) founder, frequent fintech and social media speaker",
    category: "CEO/Founder",
  },
  {
    name: "Parag Agrawal",
    summary:
      "Former Twitter CEO, occasional tech leadership conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Linda Yaccarino",
    summary:
      "Current X (Twitter) CEO, frequent media and advertising industry speaker",
    category: "CEO/Founder",
  },
  {
    name: "Andy Jassy",
    summary:
      "Amazon CEO, frequent cloud computing and enterprise conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Werner Vogels",
    summary:
      "Amazon CTO, frequent AWS and distributed systems conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Dara Khosrowshahi",
    summary:
      "Uber CEO, frequent transportation and gig economy conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Travis Kalanick",
    summary: "Uber co-founder, occasional startup and entrepreneurship speaker",
    category: "CEO/Founder",
  },
  {
    name: "Logan Green",
    summary:
      "Lyft co-founder and CEO, frequent transportation and sustainability speaker",
    category: "CEO/Founder",
  },
  {
    name: "John Zimmer",
    summary:
      "Lyft co-founder and president, frequent shared mobility conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Tony Xu",
    summary:
      "DoorDash CEO, frequent food delivery and logistics conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Apoorva Mehta",
    summary:
      "Instacart founder, frequent grocery tech and on-demand economy speaker",
    category: "CEO/Founder",
  },
  {
    name: "Fidji Simo",
    summary:
      "Instacart CEO, former Facebook executive, frequent product leadership speaker",
    category: "CEO/Founder",
  },
  {
    name: "Frank Slootman",
    summary:
      "Snowflake CEO, frequent enterprise software and data conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Marc Benioff",
    summary:
      "Salesforce CEO, frequent business software and philanthropy conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Parker Conrad",
    summary:
      "Rippling CEO, former Zenefits CEO, frequent HR tech conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Aaron Levie",
    summary:
      "Box CEO, frequent enterprise cloud storage conference speaker and Twitter commentator",
    category: "CEO/Founder",
  },
  {
    name: "Eric Yuan",
    summary:
      "Zoom CEO, frequent video communications and remote work conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Vlad Tenev",
    summary:
      "Robinhood co-founder and CEO, frequent fintech and trading conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Baiju Bhatt",
    summary:
      "Robinhood co-founder, frequent financial technology conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Max Levchin",
    summary:
      "PayPal co-founder, Affirm CEO, frequent fintech conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "David Marcus",
    summary:
      "Former Facebook/Meta payments executive, frequent cryptocurrency and payments speaker",
    category: "Product Leader",
  },
  {
    name: "Brian Armstrong",
    summary:
      "Coinbase CEO, frequent cryptocurrency and blockchain conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Changpeng Zhao (CZ)",
    summary: "Former Binance CEO, frequent cryptocurrency conference speaker",
    category: "CEO/Founder",
  },
  {
    name: "Vitalik Buterin",
    summary:
      "Ethereum co-founder, frequent blockchain and cryptocurrency conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Gavin Wood",
    summary:
      "Ethereum co-founder, Polkadot founder, frequent blockchain conference speaker",
    category: "Programmer/Engineer",
  },
  {
    name: "Chris Dixon",
    summary:
      "a16z crypto partner, frequent Web3 and blockchain conference speaker",
    category: "Investor/VC",
  },
];

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
