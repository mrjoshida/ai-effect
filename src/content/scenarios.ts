import {
  CategoryMeta,
  DeckPresetId,
  ScenarioCard,
  ScenarioCategory,
  Stance,
  StanceMeta,
} from '../types/game';

export const CATEGORY_META: Record<ScenarioCategory, CategoryMeta> = {
  coworkers: {
    id: 'coworkers',
    label: 'Working with Coworkers',
    shortLabel: 'Coworkers',
    description: 'Peer collaboration, internal feedback, team culture, and management.',
    accentColor: '#3D5A80',
    surfaceTint: '#EEF4F8',
  },
  grantees: {
    id: 'grantees',
    label: 'Working with Grantees',
    shortLabel: 'Grantees',
    description: 'Proposals, advising, reporting, and power dynamics between funders and partners.',
    accentColor: '#2D6A4F',
    surfaceTint: '#E7F2EC',
  },
  community: {
    id: 'community',
    label: 'Working with Community',
    shortLabel: 'Community',
    description: 'Civic engagement, direct services, public dialogue, and neighborhood voice.',
    accentColor: '#B86B14',
    surfaceTint: '#FBF1E1',
  },
  life: {
    id: 'life',
    label: 'Everyday Life Experiences',
    shortLabel: 'Everyday Life',
    description: 'Family care, friendships, personal rituals, and everyday human vulnerability.',
    accentColor: '#B84234',
    surfaceTint: '#FBEAE7',
  },
};

export const CATEGORY_LIST: CategoryMeta[] = [
  CATEGORY_META.coworkers,
  CATEGORY_META.grantees,
  CATEGORY_META.community,
  CATEGORY_META.life,
];

export const STANCE_META: Record<Stance, StanceMeta> = {
  support: {
    id: 'support',
    label: 'Supports Connection',
    shortLabel: 'Supports',
    subtitle: 'Deepens presence, empathy, or mutual understanding',
    description:
      'Uses AI in ways that remove logistical friction, expand access, or create more space for direct human engagement.',
  },
  depends: {
    id: 'depends',
    label: 'It Depends',
    shortLabel: 'Depends',
    subtitle: 'Hinges on intent, transparency, and who holds power',
    description:
      'Can build or break connection depending on whether people know AI is involved and whether power dynamics are respected.',
  },
  erode: {
    id: 'erode',
    label: 'Erodes Connection',
    shortLabel: 'Erodes',
    subtitle: 'Replaces genuine care, masks authenticity, or creates distance',
    description:
      'Substitutes synthetic presence for real human attention, buffers us from vulnerability, or turns relationships transactional.',
  },
};

export const STANCE_LIST: StanceMeta[] = [
  STANCE_META.support,
  STANCE_META.depends,
  STANCE_META.erode,
];

export const PHILANTHROPY_SCENARIOS: ScenarioCard[] = [
  // --- Domain 1: Coworkers ---
  {
    id: 'cw-kudos',
    category: 'coworkers',
    currentId: 'current-01',
    title: 'Peer Recognition Batch',
    mobileSummary:
      'Using an AI assistant to draft heartfelt peer recognition notes for 8 colleagues after a grueling grant cycle.',
    prompt:
      "After a grueling 6-month grant cycle, an exhausted team lead feeds specific accomplishment bullets into an AI assistant to draft articulate peer recognition notes for 8 colleagues so no one's quiet work goes unnoticed.",
    twist:
      'What if two teammates compare notes and realize their glowing recognition messages share the exact same sentence structure and warm adjectives?',
    discussionQuestion:
      'Does AI assistance help us recognize more people when we are stretched thin, or does synthetic polish hollow out our trust in gratitude?',
  },
  {
    id: 'cw-meeting-bot',
    category: 'coworkers',
    currentId: 'current-04',
    title: 'The Time-Zone Stand-In',
    mobileSummary:
      'Sending an AI meeting agent to a cross-team brainstorm instead of attending early across time zones.',
    prompt:
      'To protect deep work and family hours across time zones, a program officer sends an AI meeting agent to a cross-team brainstorm to log action items and reads the digest afterward instead of dialing in early.',
    twist:
      'What if the AI summary captures every action item accurately, but completely misses the tense, unspoken hesitation between two leads about who owns the riskiest deliverable?',
    discussionQuestion:
      'When an AI agent stands in for us, where is the line between healthy boundaries and losing the relational glue of showing up together?',
  },
  {
    id: 'cw-difficult-talk',
    category: 'coworkers',
    currentId: 'current-02',
    title: 'Rehearsing the Pushback',
    mobileSummary:
      'Roleplaying for an hour with an AI persona of your colleague before delivering a 30% budget cut.',
    prompt:
      "Before a difficult conversation about cutting a program budget by 30%, a team member roleplays for an hour with an AI persona instructed to simulate their colleague's past arguments and communication style.",
    twist:
      'What if during the live meeting, the team member anticipates and counters every objection so smoothly that the colleague feels managed and analyzed rather than heard?',
    discussionQuestion:
      'When does rehearsing hard conversations with an AI partner build empathy, and when does it turn human disagreement into a script?',
  },
  {
    id: 'cw-strategy-memo',
    category: 'coworkers',
    currentId: 'current-03',
    title: 'The 5-Minute Brief',
    mobileSummary:
      "Condensing a colleague's 12-page portfolio memo into 5 AI bullets right before their strategy review.",
    prompt:
      "Ten minutes before a strategy review, you use AI to condense a colleague's 12-page portfolio memo into 5 bullet points instead of reading their full narrative.",
    twist:
      'What if you use the 15 minutes saved to ask the author deeper questions during the meeting about the doubts and trade-offs behind their proposal?',
    discussionQuestion:
      "Does summarizing a colleague's writing help us engage at a higher level, or does it skip the shared intellectual work of following their voice?",
  },
  {
    id: 'cw-onboarding',
    category: 'coworkers',
    currentId: 'current-02',
    title: 'The Team Handbook Bot',
    mobileSummary:
      'A new hire asks an AI bot trained on team docs all their initial questions instead of asking colleagues.',
    prompt:
      'A new team hire is given a custom AI assistant trained on all historical grant docs, norms, and processes so they can get instant answers during their first month.',
    twist:
      'What if the new hire feels so self-sufficient with the bot that they schedule half as many informal "get to know you" coffee chats with peers?',
    discussionQuestion:
      'What tacit cultural wisdom and vulnerability are lost when a newcomer never has to ask a colleague a "basic" question?',
  },

  // --- Domain 2: Grantees ---
  {
    id: 'gr-proposal-polish',
    category: 'grantees',
    currentId: 'current-03',
    title: 'The Proposal Equalizer',
    mobileSummary:
      'A grassroots nonprofit uses generative AI to polish their proposal to compete with large organizations.',
    prompt:
      'A small, community-rooted nonprofit uses generative AI to structure and polish their grant proposal so they can compete alongside large nonprofits with dedicated grant writers.',
    twist:
      'What if the AI smooths over local idioms and masks a real operational bottleneck that the organization actually needs flexible capacity support to solve?',
    discussionQuestion:
      'When AI levels the grant-writing playing field, how do we make sure authentic community voice and honest operational needs are not polished away?',
  },
  {
    id: 'gr-checkin-prep',
    category: 'grantees',
    currentId: 'current-04',
    title: 'Relationship Health Brief',
    mobileSummary:
      "Auto-generating a briefing and agenda from a grantee's data and reports before a check-in call.",
    prompt:
      'A grantmaker uses an AI tool to ingest a grantee\'s quarterly milestone data, financial reports, and news clips to auto-generate a briefing and suggested agenda before a check-in call.',
    twist:
      'What if you open the call by sharing the AI brief on screen and asking the grantee: "What did this summary get wrong about how things actually feel on the ground?"',
    discussionQuestion:
      'When does AI synthesis free up time for deeper partnership listening, and when does it make a grantee feel audited by an algorithm?',
  },
  {
    id: 'gr-decline-note',
    category: 'grantees',
    currentId: 'current-01',
    title: 'Tailored Decline Feedback',
    mobileSummary:
      'Using AI to draft personalized decline notes highlighting strengths for unfunded applicants.',
    prompt:
      'To give useful feedback to the 95% of applicants who are not funded, a foundation team uses AI to draft tailored decline notes citing specific proposal strengths rather than sending a generic form letter.',
    twist:
      'What if a nonprofit founder spends hours writing a vulnerable reply engaging with the feedback, unaware that the encouragement was generated by a model?',
    discussionQuestion:
      'Is AI-assisted feedback kinder than a sterile rejection template, or does synthetic warmth erode trust when declining mission-driven work?',
  },
  {
    id: 'gr-story-synthesis',
    category: 'grantees',
    currentId: 'current-03',
    title: '60 Participant Voices',
    mobileSummary:
      'Using AI to code and theme 60 community interview recordings instead of staff listening by hand.',
    prompt:
      'A grantee evaluating a community program uses AI to transcribe and theme-code 60 qualitative interviews with participants instead of staff listening to every recording by hand.',
    twist:
      'What if no human on the grantee or funder team ever listens to the original voice recordings of the quotes featured in the board presentation?',
    discussionQuestion:
      'What is owed to the human voice behind qualitative impact data before we distill lived experience into themes?',
  },
  {
    id: 'gr-prototype-nudge',
    category: 'grantees',
    currentId: 'current-01',
    title: 'The Rapid Prototype Nudge',
    mobileSummary:
      'Showing a nonprofit leader how to build a software prototype with AI over a weekend.',
    prompt:
      'During an advising session, a program officer shows a non-technical nonprofit leader how to use generative AI tools to build a working software prototype over a weekend.',
    twist:
      'What if the nonprofit leader leaves feeling subtle pressure to pivot toward building an "AI product" because they worry future funding depends on it?',
    discussionQuestion:
      'How do power dynamics between funders and nonprofit partners shape the way casual AI enthusiasm is received?',
  },

  // --- Domain 3: Community ---
  {
    id: 'cm-parent-translate',
    category: 'community',
    currentId: 'current-04',
    title: 'Multilingual Family Texts',
    mobileSummary:
      'Real-time AI translation enabling instant direct messaging between teachers and multilingual parents.',
    prompt:
      'A public school district adopts real-time AI text translation so teachers and multilingual parents can message directly every week without waiting days for a district interpreter.',
    twist:
      'What if an automated translation misses cultural nuance in a sensitive note about a student\'s emotional struggle, causing alarm at home?',
    discussionQuestion:
      'How should communities weigh the everyday connection of instant translation against the need for human cultural mediation in sensitive moments?',
  },
  {
    id: 'cm-youth-companion',
    category: 'community',
    currentId: 'current-02',
    title: 'The New-In-Town Companion',
    mobileSummary:
      'A lonely teenager processing moving to a new city by chatting with an AI companion app every evening.',
    prompt:
      'A 15-year-old who recently moved to a new city talks every evening with an empathetic AI companion app to process feelings of loneliness after school.',
    twist:
      'What if the app is explicitly designed to coach the teen toward small real-world interactions at school—and celebrates when they need the app less?',
    discussionQuestion:
      'Can an AI companion serve as a healthy bridge toward human connection, or does unconditional algorithmic validation make real peer relationships harder?',
  },
  {
    id: 'cm-essay-feedback',
    category: 'community',
    currentId: 'current-01',
    title: 'Overnight Essay Coaching',
    mobileSummary:
      'An English teacher generating overnight AI rubric comments for 120 student personal essays.',
    prompt:
      'An overextended high school English teacher uses AI to generate overnight first-pass rubric feedback on 120 student personal essays so students get timely revision notes.',
    twist:
      'What if a student who wrote a vulnerable personal story about their family realizes the encouraging margin note came from a model rather than their teacher?',
    discussionQuestion:
      'Which parts of teaching feedback are skill coaching that AI can support, and which parts are a human witness saying "I hear you"?',
  },
  {
    id: 'cm-town-hall',
    category: 'community',
    currentId: 'current-03',
    title: 'Civic Survey Synthesis',
    mobileSummary:
      'Synthesizing 3,000 open-ended resident survey responses across three languages with AI.',
    prompt:
      'A community coalition uses AI to cluster and summarize 3,000 open-ended resident survey responses in three languages about neighborhood youth priorities.',
    twist:
      'What if city leaders use the clarity of the AI report to skip holding a contentious in-person neighborhood town hall?',
    discussionQuestion:
      'When AI makes it easy to aggregate thousands of community voices asynchronously, what happens to the civic muscle of sitting in a room together?',
  },
  {
    id: 'cm-mock-interview',
    category: 'community',
    currentId: 'current-04',
    title: 'The AI Interview Coach',
    mobileSummary:
      'Job seekers practicing behavioral interview questions with an AI voice coach.',
    prompt:
      'A workforce training nonprofit pairs job seekers with a realistic AI voice interviewer so they can practice answering behavioral questions in a low-stakes space.',
    twist:
      'What if the local employers they apply to also replace their first-round human recruiter phone screens with an automated AI interviewer?',
    discussionQuestion:
      'When AI both coaches the candidate and screens the applicant, what happens to human judgment and opportunity in hiring?',
  },

  // --- Domain 4: Everyday Life ---
  {
    id: 'lf-wedding-toast',
    category: 'life',
    currentId: 'current-03',
    title: "The Best Friend's Toast",
    mobileSummary:
      "Asking an AI assistant to structure and draft a best friend's wedding toast to overcome writer's block.",
    prompt:
      "Struggling with writer's block the week before your closest friend's wedding, you share your favorite memories with an AI assistant to help structure and draft your toast.",
    twist:
      'What if after the toast moves people to tears, you mention to your friend that AI helped you write it?',
    discussionQuestion:
      'In personal rituals, how much of the gift is the beauty of the final words versus the struggle of finding your own voice?',
  },
  {
    id: 'lf-bedtime-story',
    category: 'life',
    currentId: 'current-04',
    title: 'Co-Created Bedtime Story',
    mobileSummary:
      'A parent using generative AI with their 6-year-old to invent and illustrate a bedtime story together.',
    prompt:
      'At the end of a long workday, a parent uses generative AI with their 6-year-old to invent an illustrated bedtime story starring the child and the family dog.',
    twist:
      'What if the parent hands the tablet to the child so an AI voice narrates the story while the parent finishes work emails in the next room?',
    discussionQuestion:
      'What separates technology that sparks shared imagination at home from technology that quietly steps in for our presence?',
  },
  {
    id: 'lf-apology-text',
    category: 'life',
    currentId: 'current-01',
    title: 'Mending the Rift',
    mobileSummary:
      'Using an AI assistant to tone-check a draft apology text to a sibling after an argument.',
    prompt:
      'After a painful argument with a sibling, you paste your draft message into an AI assistant and ask it to help you express your hurt without sounding defensive.',
    twist:
      'What if you learn that your sibling also used AI to interpret your message and compose their heartfelt reply back to you?',
    discussionQuestion:
      'Does AI mediation help us step past our triggers, or does it insulate us from the raw vulnerability required for real repair?',
  },
  {
    id: 'lf-elder-checkin',
    category: 'life',
    currentId: 'current-02',
    title: 'Morning Voice Check-In',
    mobileSummary:
      'An automated AI voice service calling an elderly relative living alone each morning to chat.',
    prompt:
      'A family sets up a warm conversational AI voice assistant to call their 84-year-old grandmother who lives alone every morning to chat about the news and check how she slept.',
    twist:
      'What if family members gradually call less often during the week because the daily AI summary reassures them that she is doing fine?',
    discussionQuestion:
      'How do we design care technologies that supplement human touch without giving busy families permission to step back?',
  },
  {
    id: 'lf-group-trip',
    category: 'life',
    currentId: 'current-04',
    title: 'The Group Trip Mediator',
    mobileSummary:
      'Letting an AI planner optimize a weekend trip itinerary based on everyone’s anonymous budgets.',
    prompt:
      "A 10-person friend group feeds everyone's anonymous budget limits, schedules, and preferences into an AI planner to pick a fair weekend reunion itinerary.",
    twist:
      'What if two quieter friends agree to a trip that stretches them too thin financially because "the algorithm picked the objective middle ground"?',
    discussionQuestion:
      'When we outsource group trade-offs to a neutral agent, do we save friction at the cost of learning to care for each other\'s constraints?',
  },
];

const SCENARIOS_BY_ID = new Map(PHILANTHROPY_SCENARIOS.map((s) => [s.id, s]));

// Spark-8: 8 scenarios (2 per category, exactly 2 covering each of the 4 Currents)
const SPARK_8_IDS: string[] = [
  'cw-kudos',        // coworkers, current-01
  'cw-meeting-bot',  // coworkers, current-04
  'gr-proposal-polish', // grantees, current-03
  'gr-checkin-prep', // grantees, current-04
  'cm-youth-companion', // community, current-02
  'cm-essay-feedback', // community, current-01
  'lf-wedding-toast', // life, current-03
  'lf-elder-checkin', // life, current-02
];

// Current-04 Focus: All 6 Current-04 scenarios + 2 complementary scenarios
const CURRENT_04_FOCUS_IDS: string[] = [
  'cw-meeting-bot',   // current-04
  'gr-checkin-prep',   // current-04
  'cm-parent-translate', // current-04
  'cm-mock-interview', // current-04
  'lf-bedtime-story', // current-04
  'lf-group-trip',     // current-04
  'cw-kudos',          // current-01 complementary
  'gr-proposal-polish', // current-03 complementary
];

export function getPresetScenarios(
  preset: DeckPresetId,
  selectedCategories?: ScenarioCategory[]
): ScenarioCard[] {
  switch (preset) {
    case 'spark-8':
      return SPARK_8_IDS.map((id) => SCENARIOS_BY_ID.get(id)!).filter(Boolean);
    case 'current-04-focus':
      return CURRENT_04_FOCUS_IDS.map((id) => SCENARIOS_BY_ID.get(id)!).filter(Boolean);
    case 'full-20':
      return [...PHILANTHROPY_SCENARIOS];
    case 'custom': {
      if (!selectedCategories || selectedCategories.length === 0) {
        return [...PHILANTHROPY_SCENARIOS];
      }
      return PHILANTHROPY_SCENARIOS.filter((s) => selectedCategories.includes(s.category));
    }
    default:
      return [...PHILANTHROPY_SCENARIOS];
  }
}
