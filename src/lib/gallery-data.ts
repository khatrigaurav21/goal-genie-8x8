import type { HaradaGrid } from "@/lib/harada";

export type GalleryCategory = "Sports" | "Business" | "Education" | "Creative" | "Health";

export interface GalleryItem {
  id: string;
  category: GalleryCategory;
  data: HaradaGrid;
}

export const galleryItems: GalleryItem[] = [
  {
    id: "marathon",
    category: "Sports",
    data: {
      goal: "Run a sub-4 hour marathon",
      pillars: [
        { name: "Endurance", tasks: ["Long run every Sunday", "Increase weekly mileage 10%", "Run 4 days per week", "Add tempo runs weekly", "Practice race pace monthly", "Complete a half marathon", "Run hills twice weekly", "Cross-train with cycling"] },
        { name: "Nutrition", tasks: ["Track daily calorie intake", "Eat protein post-run", "Practice race-day fueling", "Hydrate with electrolytes", "Meal prep weekly", "Cut processed sugar", "Test energy gels", "Eat carb-heavy pre-race"] },
        { name: "Strength", tasks: ["Core workout 3x/week", "Squats and lunges", "Single-leg exercises", "Glute activation drills", "Upper body maintenance", "Plyometric training", "Resistance band work", "Bodyweight circuits"] },
        { name: "Recovery", tasks: ["Sleep 8 hours nightly", "Foam roll after runs", "Ice baths after longs", "Monthly sports massage", "Active recovery days", "Stretch 15 min daily", "Replace shoes at 400mi", "Listen to body signals"] },
        { name: "Mental Game", tasks: ["Visualize race finish", "Develop a mantra", "Break race into segments", "Practice positive self-talk", "Meditate 10 min daily", "Study the course map", "Set training micro-goals", "Journal after each run"] },
        { name: "Gear & Logistics", tasks: ["Get fitted for shoes", "Test race-day outfit", "Buy GPS running watch", "Register for race early", "Book race-day travel", "Prepare race checklist", "Anti-chafe solution", "Organize gear weekly"] },
        { name: "Community", tasks: ["Join a running club", "Find training partner", "Share progress online", "Attend local 5Ks", "Follow elite runners", "Get a running coach", "Volunteer at races", "Inspire one new runner"] },
        { name: "Consistency", tasks: ["Set weekly schedule", "Track all runs logged", "Review monthly progress", "Adjust plan quarterly", "No zero-effort weeks", "Morning routine habit", "Accountability check-ins", "Celebrate milestones"] },
      ],
    },
  },
  {
    id: "startup",
    category: "Business",
    data: {
      goal: "Launch a profitable SaaS product",
      pillars: [
        { name: "Product", tasks: ["Define core value proposition", "Build MVP in 8 weeks", "User testing with 20 people", "Iterate based on feedback", "Set up analytics tracking", "Create product roadmap", "Prioritize top 3 features", "Ship weekly updates"] },
        { name: "Marketing", tasks: ["Build landing page", "Write 12 blog posts", "Launch on Product Hunt", "Create social media presence", "Build email list to 1000", "SEO keyword research", "Run targeted ad campaign", "Create demo video"] },
        { name: "Sales", tasks: ["Define pricing tiers", "Create sales pitch deck", "Cold outreach 50 leads/week", "Set up CRM system", "Offer free trial period", "Build referral program", "Track conversion metrics", "Follow up within 24hrs"] },
        { name: "Finance", tasks: ["Set monthly budget", "Track burn rate weekly", "Explore funding options", "Reduce unnecessary costs", "Set revenue milestones", "Build financial model", "Invoice promptly", "Maintain 6mo runway"] },
        { name: "Team", tasks: ["Hire first engineer", "Define company values", "Weekly team standup", "Document all processes", "Create onboarding guide", "Foster remote culture", "Set clear OKRs", "Regular 1-on-1 meetings"] },
        { name: "Customer Success", tasks: ["Set up support system", "Response time under 4hrs", "Monthly NPS surveys", "Build knowledge base", "Onboarding email sequence", "Collect testimonials", "Reduce churn by 5%/mo", "Host monthly webinars"] },
        { name: "Legal & Ops", tasks: ["Incorporate the company", "Draft terms of service", "Privacy policy compliant", "Set up accounting", "Secure domain and brand", "Insurance coverage", "Contractor agreements", "Compliance checklist"] },
        { name: "Personal Growth", tasks: ["Read 2 books monthly", "Join founder community", "Find a mentor", "Attend 1 conference", "Practice public speaking", "Network weekly", "Maintain work-life balance", "Reflect and journal daily"] },
      ],
    },
  },
  {
    id: "japanese",
    category: "Education",
    data: {
      goal: "Become fluent in Japanese (JLPT N2)",
      pillars: [
        { name: "Kanji", tasks: ["Learn 20 kanji per week", "Use Anki daily reviews", "Write kanji by hand", "Study radicals system", "Read kanji in context", "Practice stroke order", "Review old kanji weekly", "Target 1000 kanji total"] },
        { name: "Grammar", tasks: ["Complete Genki textbook", "Study N3 grammar points", "Practice sentence patterns", "Write example sentences", "Take grammar quizzes", "Study with Bunpro app", "Review errors weekly", "Master keigo basics"] },
        { name: "Listening", tasks: ["Watch anime without subs", "Listen to NHK daily", "Podcast during commute", "Shadowing practice 15min", "Dictation exercises", "Music lyric study", "Watch variety shows", "Listen to audiobooks"] },
        { name: "Speaking", tasks: ["iTalki session 2x/week", "Language exchange partner", "Record and review self", "Practice ordering food", "Roleplay daily scenarios", "Shadow native speakers", "Join conversation group", "Think in Japanese daily"] },
        { name: "Reading", tasks: ["Read NHK Easy News", "Manga in Japanese weekly", "Grade-level readers", "Study newspaper headlines", "Read short stories", "Learn reading strategies", "Extensive reading practice", "Book club participation"] },
        { name: "Vocabulary", tasks: ["Learn 30 words per week", "Context-based learning", "Word family grouping", "Collocations practice", "Review with spaced rep", "Label items at home", "Topic-based word lists", "Use new words in diary"] },
        { name: "Culture", tasks: ["Watch Japanese films", "Cook Japanese recipes", "Study cultural etiquette", "Follow Japanese news", "Celebrate Japanese holidays", "Learn about prefectures", "Study business culture", "Calligraphy practice"] },
        { name: "Testing", tasks: ["Take JLPT practice tests", "Time management drills", "Review past exam papers", "Identify weak sections", "Mock test monthly", "Study test strategies", "Register for JLPT exam", "Post-test error analysis"] },
      ],
    },
  },
  {
    id: "novel",
    category: "Creative",
    data: {
      goal: "Write and publish a novel",
      pillars: [
        { name: "Writing Habit", tasks: ["Write 1000 words daily", "Set fixed writing time", "Track word count weekly", "No editing while drafting", "Write in distraction-free zone", "Morning pages practice", "Weekly writing sprints", "Reach 80K word target"] },
        { name: "Craft", tasks: ["Study story structure", "Read 2 books monthly", "Take a writing course", "Practice dialogue scenes", "Master show-don't-tell", "Study POV techniques", "Analyze favorite novels", "Workshop with peers"] },
        { name: "Plot", tasks: ["Complete story outline", "Define three-act structure", "Create subplot threads", "Write scene-by-scene plan", "Plant and payoff setups", "Build rising tension", "Craft satisfying climax", "Resolve all story threads"] },
        { name: "Characters", tasks: ["Write character profiles", "Define protagonist arc", "Create memorable antagonist", "Develop supporting cast", "Write character backstories", "Voice differentiation drill", "Motivation and conflict map", "Test character decisions"] },
        { name: "Revision", tasks: ["First draft rest period", "Developmental edit pass", "Line editing for prose", "Cut 10% of word count", "Beta reader feedback", "Address plot holes", "Polish opening chapter", "Final proofread pass"] },
        { name: "Publishing", tasks: ["Research agents or self-pub", "Write query letter", "Create book synopsis", "Design or commission cover", "Format manuscript properly", "Build author platform", "Plan launch strategy", "Set publication deadline"] },
        { name: "Community", tasks: ["Join writers group", "Attend writing conference", "Find critique partners", "Follow published authors", "Share writing journey", "Enter writing contests", "Build newsletter list", "Connect with editors"] },
        { name: "Mindset", tasks: ["Embrace imperfect drafts", "Handle rejection gracefully", "Celebrate chapter completions", "Visualize holding your book", "Read about writing process", "Manage imposter syndrome", "Set realistic deadlines", "Enjoy the creative process"] },
      ],
    },
  },
  {
    id: "weightloss",
    category: "Health",
    data: {
      goal: "Lose 20kg and build lasting health habits",
      pillars: [
        { name: "Nutrition", tasks: ["Track meals in app daily", "Cook at home 5x/week", "Eat vegetables every meal", "Control portion sizes", "Reduce sugar intake 50%", "Meal prep on Sundays", "Drink 2L water daily", "No eating after 8pm"] },
        { name: "Exercise", tasks: ["Walk 10K steps daily", "Strength train 3x/week", "Cardio sessions 2x/week", "Try one new activity/month", "Active rest days", "Morning stretch routine", "Track workouts logged", "Progressive overload plan"] },
        { name: "Sleep", tasks: ["Sleep 7-8 hours nightly", "Consistent bedtime routine", "No screens after 9pm", "Dark cool bedroom", "No caffeine after 2pm", "Wind-down ritual", "Track sleep quality", "Weekend schedule same"] },
        { name: "Mental Health", tasks: ["Meditate 10 min daily", "Journal feelings weekly", "Practice self-compassion", "Therapy or counseling", "Manage stress triggers", "Gratitude practice daily", "Social connection weekly", "Limit negative self-talk"] },
        { name: "Accountability", tasks: ["Weigh in weekly same day", "Progress photos monthly", "Share goals with friend", "Find workout buddy", "Track measurements monthly", "Review progress quarterly", "Adjust plan as needed", "Celebrate non-scale wins"] },
        { name: "Education", tasks: ["Read nutrition science", "Learn about metabolism", "Understand macro balance", "Study exercise form", "Follow health podcasts", "Debunk diet myths", "Learn to read labels", "Cook new healthy recipes"] },
        { name: "Environment", tasks: ["Remove junk from kitchen", "Stock healthy snacks", "Prep gym bag nightly", "Create workout space", "Use smaller plates", "Healthy restaurant choices", "Supportive social circle", "Visual goal reminders"] },
        { name: "Sustainability", tasks: ["No crash diets ever", "Allow flexible meals", "Build habits not rules", "Focus on how you feel", "Long-term mindset shift", "Forgive slip-ups quickly", "Enjoy movement daily", "Make health a lifestyle"] },
      ],
    },
  },
];
