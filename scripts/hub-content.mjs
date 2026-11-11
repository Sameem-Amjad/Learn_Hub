/**
 * LearnHub demo content for the shared Supabase hub: courses, modules,
 * lessons (with the slides and narration their videos are made from), the
 * media library, and the sample learners. Used by scripts/make-media.mjs
 * (builds the video, PDF, audio and EPUB files) and scripts/seed-hub.mjs.
 *
 * Everything here is original sample material written for the demo.
 */

export const DOMAIN = "demo.learnhub.dev";
export const PASSWORD = "LearnHub@2026";

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

// Fixed ids so re-running the seed updates rows instead of duplicating them.
// Shaped as v4 UUIDs, since the API validates ids strictly.
const C = (n) => `20000000-0000-4000-8000-00000000000${n}`;
const M = (c, n) => `30000000-0000-4000-800${c}-00000000000${n}`;
const L = (c, m, n) => `40000000-0000-4000-800${c}-0000000000${m}${n}`;

/**
 * A lesson with `slides` gets a narrated video (one slide per narration
 * paragraph); without slides it is a reading lesson.
 */
export const COURSES = [
  {
    id: C(1),
    title: "Product Strategy Foundations",
    slug: "product-strategy-foundations",
    description: "Turn a fuzzy goal into a clear bet: frame the problem, decide quickly, and write it down so a team can act on it.",
    thumbnail_url: img("photo-1461749280684-dccba630e2f6"),
    required_tier: "insider",
    is_published: true,
    modules: [
      {
        id: M(1, 1), title: "Foundations", slug: "foundations", description: "Seeing the problem before choosing the solution.",
        lessons: [
          {
            id: L(1, 1, 1), title: "The Strategic Lens", slug: "strategic-lens", is_preview: true,
            content: "Strategy starts with tension: what users need, what the market rewards and what the business can sustain rarely point the same way. This lesson gives you three questions to ask before any roadmap discussion.\n\n## The three questions\n\n- Who is this for, and what are they doing today instead?\n- What would have to be true for this to work?\n- What are we choosing not to do?\n\nWrite one sentence for each. If a sentence is hard to write, that is where the strategy is still unclear.",
            slides: [
              { title: "The Strategic Lens", bullets: ["Users, market and business pull in different directions", "Strategy is choosing where to stand"], say: "Welcome to Product Strategy Foundations. Every product decision sits between three forces: what users need, what the market rewards, and what the business can sustain. They rarely point the same way, and strategy is the act of choosing where to stand." },
              { title: "Three questions", bullets: ["Who is this for, and what do they do today?", "What would have to be true?", "What are we choosing not to do?"], say: "Before any roadmap meeting, answer three questions. Who is this for, and what are they doing today instead? What would have to be true for this to work? And what are we choosing not to do?" },
              { title: "One sentence each", bullets: ["Hard to write means still unclear", "Bring the sentences, not the slides"], say: "Write one sentence for each question. If a sentence is hard to write, you've found the part of the strategy that is still unclear. Bring those three sentences to the meeting instead of a slide deck." },
            ],
          },
          {
            id: L(1, 1, 2), title: "Framing the Problem", slug: "problem-framing",
            content: "A well-framed problem names the person, the moment and the outcome they want, without naming a solution. \"Add bulk export\" is a solution; \"finance leads lose a day each month rebuilding reports by hand\" is a problem.\n\nA useful test: could three different teams propose three different solutions to your problem statement? If not, you have written a feature request.\n\n- Name the person and the moment\n- Describe the outcome, not the feature\n- Attach one number you would expect to move",
            slides: [
              { title: "Problems, not features", bullets: ["\"Add bulk export\" is a solution", "\"Finance leads lose a day a month\" is a problem"], say: "A well-framed problem names the person, the moment, and the outcome they want, without naming a solution. Add bulk export is a solution. Finance leads lose a day each month rebuilding reports by hand: that's a problem." },
              { title: "The three-team test", bullets: ["Could three teams propose three answers?", "If not, it's a feature request"], say: "Here's a quick test. Could three different teams read your problem statement and propose three different solutions? If they couldn't, you've written a feature request, not a problem." },
              { title: "Make it measurable", bullets: ["Person and moment", "Outcome, not feature", "One number you expect to move"], say: "Finish by attaching one number you'd expect to move. It keeps the discussion honest, and it tells you later whether the work actually helped." },
            ],
          },
          {
            id: L(1, 1, 3), title: "Jobs to Be Done in Practice", slug: "jobs-to-be-done",
            content: "People don't buy products; they hire them to make progress in a situation. Interview five recent customers about the moment they started looking for a solution, not about your features.\n\n## Questions that work\n\n- What was happening the day you started looking?\n- What did you try first, and why did it fall short?\n- What almost stopped you from switching?\n\nGroup the answers by situation. Each group is a job, and each job suggests a different way to position the same product.",
          },
        ],
      },
      {
        id: M(1, 2), title: "Decision Systems", slug: "decision-systems", description: "Making good calls quickly, and making them stick.",
        lessons: [
          {
            id: L(1, 2, 1), title: "Decision Velocity", slug: "decision-velocity",
            content: "Most decisions are reversible, and treating them as if they weren't is the most common cause of slow teams. Sort each decision before you debate it.\n\n- One-way doors: hard to undo. Slow down, write it up, involve the right people.\n- Two-way doors: easy to undo. Decide in the meeting, set a date to check, move on.\n\nWhen a two-way door goes wrong, the cost is a week. When a team treats every door as one-way, the cost is a quarter.",
            slides: [
              { title: "Most doors are two-way", bullets: ["Most decisions can be undone", "Treating them as final slows teams down"], say: "Most decisions are reversible. Treating them as if they weren't is the most common reason teams move slowly. So before you debate a decision, sort it." },
              { title: "Sort before you debate", bullets: ["One-way door: slow down, write it up", "Two-way door: decide now, check later"], say: "A one-way door is hard to undo: slow down, write it up, and bring in the right people. A two-way door is easy to undo: decide in the meeting, set a date to check the result, and move on." },
              { title: "The real cost", bullets: ["A wrong two-way call costs a week", "Treating every call as one-way costs a quarter"], say: "When a two-way door goes wrong, it costs you a week. When a team treats every door as one-way, it costs a quarter." },
            ],
          },
          {
            id: L(1, 2, 2), title: "Writing a One-Page Strategy", slug: "one-page-strategy",
            content: "If a strategy doesn't fit on one page, it isn't finished. Use four headings and keep each to a short paragraph.\n\n## The four headings\n\n- Where we are: the situation, with one or two numbers\n- Where we're going: the outcome in twelve months\n- How we'll get there: three bets, in priority order\n- What we won't do: the tempting work we are leaving out\n\nShare it before the meeting, and spend the meeting on the third heading.",
          },
          {
            id: L(1, 2, 3), title: "Saying No Well", slug: "saying-no-well",
            content: "Every yes is a no to something else, so a good no is part of the job. Say no to the request, not to the person, and leave a door open.\n\n- Restate the need so they know you heard it\n- Name what it would displace\n- Offer what you can do, or when you could revisit it",
            slides: [
              { title: "Every yes is a no", bullets: ["Capacity is fixed", "A good no protects the plan"], say: "Every yes is a no to something else. A team's capacity is fixed, so saying no well is part of protecting the plan, not a failure of collaboration." },
              { title: "No to the request, not the person", bullets: ["Restate the need", "Name what it would displace", "Offer an alternative or a date"], say: "Say no to the request, not to the person. Restate their need so they know you heard it, name what it would displace, and offer what you can do, or when you could look at it again." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: C(2),
    title: "Systems for Senior ICs",
    slug: "systems-for-senior-ics",
    description: "Grow your impact beyond your own code: influence without a title, explain architecture simply, and run work that unblocks others.",
    thumbnail_url: img("photo-1518770660439-4636190af475"),
    required_tier: "core",
    is_published: true,
    modules: [
      {
        id: M(2, 1), title: "Technical Leverage", slug: "technical-leverage", description: "Impact that reaches past your own pull requests.",
        lessons: [
          {
            id: L(2, 1, 1), title: "Influence Without a Title", slug: "influence-without-title", is_preview: true,
            content: "Senior engineers are trusted for their judgement, not their authority. That trust builds from small, visible acts: clear write-ups, reviews that teach, and promises kept.\n\n- Write down decisions and their reasons\n- Review to teach, not to gatekeep\n- Make small commitments and keep every one",
            slides: [
              { title: "Influence Without a Title", bullets: ["Trusted for judgement, not authority", "Trust builds from small, visible acts"], say: "As a senior engineer, people follow you because they trust your judgement, not because of your title. That trust builds slowly, from small and visible acts." },
              { title: "Three habits", bullets: ["Write down decisions and reasons", "Review to teach", "Keep every small promise"], say: "Three habits do most of the work. Write down decisions and the reasons behind them. Review code to teach, not to gatekeep. And make small commitments, then keep every one of them." },
            ],
          },
          {
            id: L(2, 1, 2), title: "The Architecture Narrative", slug: "architecture-narrative",
            content: "An architecture is only as good as the team's shared understanding of it. Tell it as a story in three layers: what the system does for users, how the main parts talk to each other, and where it is most likely to break.\n\nStart every design review with the first layer, even with engineers. It anchors the detail that follows.",
            slides: [
              { title: "Tell it in three layers", bullets: ["What it does for users", "How the main parts talk", "Where it will break"], say: "An architecture is only as good as the team's shared understanding of it. Tell it as a story in three layers: what the system does for users, how the main parts talk to each other, and where it's most likely to break." },
              { title: "Start with the user", bullets: ["Even in engineering reviews", "Anchors the detail that follows"], say: "Start every design review with the first layer, even when the room is full of engineers. It anchors all the detail that follows, and it's where most misunderstandings hide." },
            ],
          },
          {
            id: L(2, 1, 3), title: "Choosing What Not to Build", slug: "what-not-to-build",
            content: "The cheapest code is code nobody writes. Before building, check three alternatives: an existing internal tool, a managed service, and a manual process for the first hundred users.\n\nRecord the alternatives you rejected and why. Six months later, that note saves a week of re-litigation.",
          },
        ],
      },
      {
        id: M(2, 2), title: "Execution Systems", slug: "execution-systems", description: "Planning and running work that keeps others moving.",
        lessons: [
          {
            id: L(2, 2, 1), title: "Planning in Bets", slug: "planning-in-bets",
            content: "Plans fail when they pretend to be certain. Frame each piece of work as a bet: what we expect, how we'll know, and when we'll decide whether to continue.\n\n- Expectation: the outcome we think it produces\n- Signal: the evidence that tells us early\n- Checkpoint: the date we decide to double down or stop",
            slides: [
              { title: "Plans are bets", bullets: ["Certainty is the usual fiction", "Make the uncertainty explicit"], say: "Plans fail when they pretend to be certain. A better habit is to frame each piece of work as a bet, and make the uncertainty explicit from the start." },
              { title: "Every bet has three parts", bullets: ["Expectation", "Signal", "Checkpoint"], say: "Every bet has three parts: what we expect it to achieve, the early signal that tells us whether it's working, and the checkpoint date when we decide to double down or stop." },
            ],
          },
          {
            id: L(2, 2, 2), title: "Running a Design Review", slug: "design-review",
            content: "A design review is for finding risks, not for approving a document. Send the doc a day ahead, open with the riskiest assumption, and end with owners for every open question.\n\n## A 45-minute agenda\n\n- 5 minutes: the problem and the user\n- 25 minutes: risks, starting with the biggest\n- 10 minutes: alternatives considered\n- 5 minutes: open questions and owners",
          },
          {
            id: L(2, 2, 3), title: "Unblocking Others", slug: "unblocking-others",
            content: "A senior engineer's best hour is often spent on someone else's problem. Keep a short daily slot for unblocking: answer the waiting question, review the stuck pull request, pair for twenty minutes.\n\nTrack who you unblocked for a month. It is the clearest evidence of leverage you will ever collect.",
            slides: [
              { title: "Your best hour", bullets: ["Often spent on someone else's problem", "Protect a daily unblocking slot"], say: "A senior engineer's most valuable hour is often spent on someone else's problem. Protect a short slot every day for unblocking others: answer the waiting question, review the stuck pull request, or pair for twenty minutes." },
              { title: "Keep the evidence", bullets: ["Track who you unblocked", "The clearest proof of leverage"], say: "Keep a simple list of who you unblocked, for one month. It's the clearest evidence of your leverage you'll ever collect, and it makes the next performance review much easier to write." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: C(3),
    title: "Executive Communication Lab",
    slug: "executive-communication-lab",
    description: "Say the important thing first: concise updates, hard conversations, and writing that busy leaders actually read.",
    thumbnail_url: img("photo-1552664730-d307ca884978"),
    required_tier: "pro",
    is_published: true,
    modules: [
      {
        id: M(3, 1), title: "Executive Presence", slug: "executive-presence", description: "Clarity under pressure.",
        lessons: [
          {
            id: L(3, 1, 1), title: "Reading the Room", slug: "room-dynamics", is_preview: true,
            content: "Before you present, find out what the most senior person in the room is worried about this week. Open with how your topic touches that worry, and you will have their attention for the rest.\n\n- Ask their chief of staff or a peer beforehand\n- Open with their concern, then your proposal\n- Watch for the first question: it shows what they really care about",
            slides: [
              { title: "Reading the Room", bullets: ["Find the senior person's worry", "Open with how you touch it"], say: "Before you present to leadership, find out what the most senior person in the room is worried about this week. Open with how your topic touches that worry, and you'll have their attention for the rest of the meeting." },
              { title: "The first question", bullets: ["Shows what they really care about", "Answer it fully before moving on"], say: "Then watch for the first question. It tells you what they really care about. Answer it fully before you move on to your next slide, even if it means skipping some." },
            ],
          },
          {
            id: L(3, 1, 2), title: "The One-Minute Update", slug: "one-minute-update",
            content: "Busy leaders read the first two lines. Put the conclusion there, then the reason, then what you need from them.\n\n## The pattern\n\n- Headline: where things stand, in one sentence\n- Why: the one or two facts behind it\n- Ask: a decision, a name, or nothing\n\nIf you need nothing, say so. It is a gift.",
            slides: [
              { title: "Conclusion first", bullets: ["Leaders read the first two lines", "Put the answer there"], say: "Busy leaders read the first two lines of anything you send. So put the conclusion there: where things stand, in a single sentence." },
              { title: "Headline, why, ask", bullets: ["Headline in one sentence", "One or two facts behind it", "A clear ask, or none"], say: "Follow it with the one or two facts behind it, and then your ask: a decision, a name, or nothing at all. If you need nothing, say so. It's a small gift to a busy reader." },
            ],
          },
          {
            id: L(3, 1, 3), title: "Writing for Executives", slug: "writing-for-executives",
            content: "Executives skim. Write so that the headings alone tell the story, keep paragraphs to three sentences, and move detail to an appendix.\n\nRead your draft aloud. Anything you would not say in a meeting should not be in the memo either.",
          },
        ],
      },
      {
        id: M(3, 2), title: "Hard Conversations", slug: "hard-conversations", description: "Bad news, disagreement and scope, handled well.",
        lessons: [
          {
            id: L(3, 2, 1), title: "Delivering Bad News", slug: "delivering-bad-news",
            content: "Bad news ages badly. Share it early, in person or on a call, and arrive with a plan.\n\n- Say it in the first sentence\n- Own your part without over-apologising\n- Bring two options and your recommendation",
            slides: [
              { title: "Bad news ages badly", bullets: ["Share it early", "Say it in the first sentence"], say: "Bad news ages badly. The longer you wait, the worse it gets. Share it early, in person or on a call, and say it in your very first sentence." },
              { title: "Arrive with a plan", bullets: ["Own your part", "Bring two options", "Recommend one"], say: "Own your part without over-apologising, and arrive with a plan: two options and your recommendation. People forgive the news far faster than they forgive the surprise." },
            ],
          },
          {
            id: L(3, 2, 2), title: "Disagree and Commit", slug: "disagree-and-commit",
            content: "Disagreement is useful until a decision is made; after that it becomes friction. Argue fully before the call, then commit completely, and say so out loud.\n\nIf new evidence appears, reopen the decision openly, with the evidence, rather than slowing the work quietly.",
          },
          {
            id: L(3, 2, 3), title: "Negotiating Scope", slug: "negotiating-scope",
            content: "When a deadline and a scope collide, trade explicitly. Offer three versions: the full scope on a later date, a smaller scope on the original date, or the full scope on time with a named risk.\n\nLet the person who owns the outcome choose.",
            slides: [
              { title: "Trade explicitly", bullets: ["Deadline and scope collide", "Offer three versions"], say: "When a deadline and a scope collide, don't quietly cut corners. Trade explicitly, and offer three versions." },
              { title: "Three versions", bullets: ["Full scope, later date", "Smaller scope, same date", "Full scope on time, named risk"], say: "The full scope on a later date. A smaller scope on the original date. Or the full scope on time, with a risk you name out loud. Then let the person who owns the outcome choose." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: C(4),
    title: "AI Product Playbook",
    slug: "ai-product-playbook",
    description: "Where AI features earn their place, and how to judge them before and after launch.",
    thumbnail_url: img("photo-1677442136019-21780ecad995"),
    required_tier: "core",
    is_published: false,
    modules: [
      {
        id: M(4, 1), title: "Getting Started", slug: "getting-started", description: "Draft module.",
        lessons: [
          { id: L(4, 1, 1), title: "Where AI Fits", slug: "where-ai-fits", content: "Start from a task people already do and find tedious, not from the model. Good first AI features save a step the user would gladly skip." },
          { id: L(4, 1, 2), title: "Judging an AI Feature", slug: "judging-ai-features", content: "Collect fifty real examples before launch and grade the outputs by hand. Keep the set and re-run it after every change." },
        ],
      },
    ],
  },
];

/** Library items. `file` is the path in the private bucket. */
export const MEDIA = [
  { id: "80000000-0000-4000-8000-000000000001", title: "Strategic Thinking Handbook", type: "pdf", file: "library/strategic-thinking-handbook.pdf", required_tier: "core", cover_url: img("photo-1455885666463-9f6f1cb4f8f6").replace("w=1200", "w=600"), description: "A short handbook of the frameworks from the strategy course, with worksheets." },
  { id: "80000000-0000-4000-8000-000000000002", title: "Leadership Audio Session", type: "audio", file: "library/leadership-audio-session.mp3", required_tier: "insider", cover_url: img("photo-1516280440614-37939bbacd81").replace("w=1200", "w=600"), description: "A guided audio session on preparing for a difficult conversation." },
  { id: "80000000-0000-4000-8000-000000000003", title: "Executive Communication Playbook", type: "epub", file: "library/executive-communication-playbook.epub", required_tier: "pro", cover_url: img("photo-1512820790803-83ca734da794").replace("w=1200", "w=600"), description: "The communication patterns from the lab as a pocket e-book." },
  { id: "80000000-0000-4000-8000-000000000004", title: "Decision Journal Template", type: "pdf", file: "library/decision-journal-template.pdf", required_tier: "insider", cover_url: img("photo-1484480974693-6ca0a78fb36b").replace("w=1200", "w=600"), description: "A printable page for recording a decision, its reasons and when to check it." },
];

/**
 * Sample people. `login` marks the two public demo logins. Plans are
 * relative to the seed date. Everyone else is a sample learner the demo
 * admin may change.
 */
export const PEOPLE = [
  { key: "admin", email: `demo.admin@${DOMAIN}`, name: "Demo Admin", roles: ["admin"], noDelete: true, login: true },
  { key: "omar", email: `omar.khan@${DOMAIN}`, name: "Omar Khan", roles: ["member"], plan: ["pro", "active", -14, 16], login: true },
  { key: "elena", email: `elena.varga@${DOMAIN}`, name: "Elena Varga", roles: ["admin"], plan: ["pro", "active", -40, 20] },
  { key: "priya", email: `priya.desai@${DOMAIN}`, name: "Priya Desai", roles: ["instructor"], plan: ["core", "active", -8, 22] },
  { key: "lina", email: `lina.rivera@${DOMAIN}`, name: "Lina Rivera", roles: ["member"], plan: ["insider", "trialing", -3, 11] },
  { key: "jules", email: `jules.armand@${DOMAIN}`, name: "Jules Armand", roles: ["member"], plan: ["core", "past_due", -32, -2] },
  { key: "maya", email: `maya.chen@${DOMAIN}`, name: "Maya Chen", roles: ["member"], plan: ["pro", "canceled", -45, -15], cancel: true },
  { key: "ben", email: `ben.okafor@${DOMAIN}`, name: "Ben Okafor", roles: ["member"], plan: ["core", "active", -20, 10] },
  { key: "sofia", email: `sofia.marquez@${DOMAIN}`, name: "Sofia Marquez", roles: ["member"], plan: ["insider", "active", -6, 24] },
  { key: "hannah", email: `hannah.weiss@${DOMAIN}`, name: "Hannah Weiss", roles: ["member"], plan: ["pro", "active", -2, 28] },
  { key: "tom", email: `tom.becker@${DOMAIN}`, name: "Tom Becker", roles: ["member"], plan: ["core", "canceled", -70, -40], cancel: true },
  { key: "aisha", email: `aisha.bello@${DOMAIN}`, name: "Aisha Bello", roles: ["member"], plan: ["insider", "active", -11, 19] },
  { key: "lucas", email: `lucas.martin@${DOMAIN}`, name: "Lucas Martin", roles: ["member"], plan: ["core", "trialing", -1, 13] },
  { key: "daniel", email: `daniel.kim@${DOMAIN}`, name: "Daniel Kim", roles: ["member"] },
];

/** All lessons, flattened, with their course. */
export const LESSONS = COURSES.flatMap((c) => c.modules.flatMap((m) => m.lessons.map((l, i) => ({ ...l, order_index: i + 1, module_id: m.id, course: c }))));
