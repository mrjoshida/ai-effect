import {
  CategoryMeta,
  CustomDeckOptions,
  DeckPresetId,
  RithmCurrentId,
  ScenarioCard,
  ScenarioCategory,
  Stance,
  StanceMeta,
} from '../types/game';

export const CATEGORY_META: Record<ScenarioCategory, CategoryMeta> = {
  life: {
    id: 'life',
    label: 'Everyday Life Experiences',
    shortLabel: 'Everyday Life',
    description: 'Family care, friendships, personal rituals, and everyday human vulnerability.',
    accentColor: '#B84234',
    surfaceTint: '#FBEAE7',
  },
  community: {
    id: 'community',
    label: 'Working with Community',
    shortLabel: 'Community',
    description: 'Civic engagement, direct services, public dialogue, and neighborhood voice.',
    accentColor: '#B86B14',
    surfaceTint: '#FBF1E1',
  },
  mentorship: {
    id: 'mentorship',
    label: 'Teaching & Mentoring',
    shortLabel: 'Mentorship',
    description: 'Classrooms, coaching, apprenticeships, student feedback, and the vulnerable work of learning.',
    accentColor: '#4D5382',
    surfaceTint: '#EEF0F8',
  },
  caregiving: {
    id: 'caregiving',
    label: 'Caregiving & Support',
    shortLabel: 'Caregiving',
    description: 'Healthcare, mental health support, family and elder care, and holding space during vulnerability.',
    accentColor: '#A84258',
    surfaceTint: '#FAF0F2',
  },
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
  leadership: {
    id: 'leadership',
    label: 'Leadership & Governance',
    shortLabel: 'Leadership',
    description: 'Executive stewardship, board decisions, organizational trade-offs, and institutional ethics.',
    accentColor: '#2B5B6C',
    surfaceTint: '#EAF3F6',
  },
  creative: {
    id: 'creative',
    label: 'Creative & Research Craft',
    shortLabel: 'Creative Craft',
    description: 'Co-authoring, qualitative inquiry, design, storytelling, and shared intellectual discovery.',
    accentColor: '#8C5828',
    surfaceTint: '#F9F1E8',
  },
};

export const CATEGORY_LIST: CategoryMeta[] = [
  CATEGORY_META.life,
  CATEGORY_META.community,
  CATEGORY_META.mentorship,
  CATEGORY_META.caregiving,
  CATEGORY_META.coworkers,
  CATEGORY_META.grantees,
  CATEGORY_META.leadership,
  CATEGORY_META.creative,
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

const RAW_SCENARIOS: ScenarioCard[] = [
  // ==========================================
  // --- Domain 1: Everyday Life (lf-) [8] ---
  // ==========================================
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
      "When we outsource group trade-offs to a neutral agent, do we save friction at the cost of learning to care for each other's constraints?",
  },
  {
    id: 'lf-condolence-note',
    category: 'life',
    currentId: 'current-01',
    title: 'The Condolence Draft',
    mobileSummary:
      'Using an AI assistant to compose a sympathy letter to a grieving friend during acute emotional overwhelm.',
    prompt:
      'Paralyzed by grief and fear of saying the wrong thing, you ask an AI assistant to compose a condolence letter to a close friend.',
    twist:
      'What if your friend treasures the letter, framing it on their desk, unaware that the poignant reflections were generated by an algorithm?',
    discussionQuestion:
      'In moments of profound mourning, does the authenticity of our presence matter more than the eloquence of our expression?',
  },
  {
    id: 'lf-family-memory',
    category: 'life',
    currentId: 'current-02',
    title: 'The Ancestral Storyteller',
    mobileSummary:
      'Recreating a deceased grandparent’s voice and memories with an AI conversational agent for family storytelling.',
    prompt:
      'A family trains an interactive AI voice model on letters and audio recordings of their late grandmother so great-grandchildren can hear her stories.',
    twist:
      'What if younger family members begin asking the avatar for advice on modern personal crises that the real grandmother never faced?',
    discussionQuestion:
      'Where does honoring family memory end and creating an synthetic illusion that evades the finality of loss begin?',
  },
  {
    id: 'lf-journal-coach',
    category: 'life',
    currentId: 'current-03',
    title: 'Daily Introspection Companion',
    mobileSummary:
      'Using an AI journaling app that reframes personal reflections and suggests emotional takeaways every night.',
    prompt:
      'To build a reflective habit, a person uses an AI journaling companion that analyzes nightly entries and suggests re-interpretations of emotional conflicts.',
    twist:
      'What if the user begins viewing their own instincts with doubt until the AI confirms their emotional reaction is healthy and balanced?',
    discussionQuestion:
      'When we let AI interpret our inner lives, does it cultivate self-awareness or teach us to outsource our moral intuition?',
  },

  // ==========================================
  // --- Domain 2: Community (cm-) [8] ---
  // ==========================================
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
      "What if an automated translation misses cultural nuance in a sensitive note about a student's emotional struggle, causing alarm at home?",
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
  {
    id: 'cm-neighbor-dispute',
    category: 'community',
    currentId: 'current-01',
    title: 'Neighborhood Dispute Mediator',
    mobileSummary:
      'A municipal tenant union deploying an AI mediator to resolve noise complaints between neighbors.',
    prompt:
      'A neighborhood association introduces an anonymous AI mediation portal to draft compromise agreements between residents experiencing escalating disputes.',
    twist:
      'What if neighbors follow the written terms perfectly but permanently stop greeting each other in common hallways?',
    discussionQuestion:
      'Does algorithmic mediation resolve conflict efficiently, or does it prevent residents from developing the tolerance needed for living together?',
  },
  {
    id: 'cm-senior-listener',
    category: 'community',
    currentId: 'current-02',
    title: 'The Community Center Listener',
    mobileSummary:
      'An interactive voice terminal installed in a community center for residents seeking companionship and conversation.',
    prompt:
      'A community center installs an interactive AI voice booth where isolated neighborhood residents can share memories and engage in daily conversation.',
    twist:
      'What if community volunteers spend less time visiting the center because they believe the automated system has met the social need?',
    discussionQuestion:
      'Can conversational technology safely ease community loneliness without eroding our shared moral responsibility to care for our neighbors?',
  },
  {
    id: 'cm-advocacy-letter',
    category: 'community',
    currentId: 'current-03',
    title: 'Civic Petition Generator',
    mobileSummary:
      'A civic campaign providing residents with automated tools to produce personalized letters to town council.',
    prompt:
      'An environmental coalition deploys a tool that helps local residents turn bullet points into articulate, personal letters to their city council members.',
    twist:
      'What if council members disregard all resident messages after discovering hundreds of submissions share algorithmic syntax and vocabulary?',
    discussionQuestion:
      'When AI lowers the barrier to civic expression, does it empower community voice or devalue the currency of public testimony?',
  },

  // ==========================================
  // --- Domain 3: Mentorship (mn-) [8] ---
  // ==========================================
  {
    id: 'mn-recommendation-letter',
    category: 'mentorship',
    currentId: 'current-01',
    title: 'The Recommendation Generator',
    mobileSummary:
      'A professor using AI to generate glowing letters of recommendation for thirty graduating students.',
    prompt:
      'Swamped with admissions deadlines, a university professor uses an AI tool to generate thirty personalized letters of recommendation from student resumes.',
    twist:
      'What if an admissions committee detects identical sentence structures across multiple candidates from the same department?',
    discussionQuestion:
      'Does AI allow educators to advocate for more students, or does synthetic praise devalue the currency of mentorship endorsements?',
  },
  {
    id: 'mn-office-hours-bot',
    category: 'mentorship',
    currentId: 'current-01',
    title: 'Virtual Office Hours',
    mobileSummary:
      'A teacher deploying a chatbot avatar of themselves to answer student conceptual questions overnight.',
    prompt:
      'A computer science instructor creates an AI avatar of themselves trained on lecture transcripts to answer student questions around the clock.',
    twist:
      'What if students who struggle most prefer asking the bot because they fear looking unintelligent in front of their real teacher?',
    discussionQuestion:
      'When an AI stand-in lowers the intimidation of asking for help, does it build confidence or reinforce the fear of human evaluation?',
  },
  {
    id: 'mn-socratic-tutor',
    category: 'mentorship',
    currentId: 'current-02',
    title: 'The Patient Socratic Tutor',
    mobileSummary:
      'A struggling apprentice studying with an infinitely patient AI tutor rather than consulting their assigned mentor.',
    prompt:
      'A culinary apprentice uses an interactive AI coach to practice menu planning and flavor theory late into the night rather than asking their head chef.',
    twist:
      'What if the apprentice masters technical concepts rapidly but fails to develop the interpersonal resilience required in a high-pressure kitchen?',
    discussionQuestion:
      'Can an AI tutor build technical mastery without cultivating the relational stamina learned through human apprenticeship?',
  },
  {
    id: 'mn-math-companion',
    category: 'mentorship',
    currentId: 'current-02',
    title: 'Late-Night Study Partner',
    mobileSummary:
      'A middle-school student forming an emotional attachment to an adaptive AI study buddy.',
    prompt:
      'A seventh-grader spends hours each evening doing homework with an encouraging AI study buddy that offers relentless positive reinforcement.',
    twist:
      'What if the student grows anxious during collaborative classroom group work because human peers are not as patient or affirming?',
    discussionQuestion:
      'When educational AI offers unconditional patience, does it prepare learners for collaboration or make messy human relationships harder?',
  },
  {
    id: 'mn-creative-outline',
    category: 'mentorship',
    currentId: 'current-03',
    title: 'The Dissertation Outliner',
    mobileSummary:
      'A graduate student relying on AI to structure the central thesis argument of their dissertation.',
    prompt:
      'Paralyzed by the scale of their dissertation, a doctoral candidate uses AI to synthesize disparate research notes into a coherent theoretical outline.',
    twist:
      "What if the advisor praises the conceptual structure, but the student secretly feels like an imposter who merely edited a machine's synthesis?",
    discussionQuestion:
      "Where is the boundary between healthy scaffolding in education and abdicating the intellectual struggle of finding one's own thesis?",
  },
  {
    id: 'mn-code-copilot',
    category: 'mentorship',
    currentId: 'current-03',
    title: 'The Apprentice Code Assistant',
    mobileSummary:
      'A junior programmer accepting automated code suggestions without mentally tracing the underlying algorithm.',
    prompt:
      'A junior software apprentice relies on automated code suggestions to complete complex development assignments ahead of schedule.',
    twist:
      'What if during a technical interview without AI assistance, the apprentice cannot explain the design decisions behind their own portfolio code?',
    discussionQuestion:
      'Does generative scaffolding accelerate the learning curve, or does it bypass the essential friction where deep understanding takes root?',
  },
  {
    id: 'mn-grading-rubric',
    category: 'mentorship',
    currentId: 'current-04',
    title: 'Automated Essay Grader',
    mobileSummary:
      'A school district utilizing an automated model to score standardized student essays and provide remarks.',
    prompt:
      'An underfunded district adopts an automated scoring system to evaluate high school analytical essays and generate constructive margin notes.',
    twist:
      'What if the algorithm consistently marks down non-traditional narrative structures written by students from immigrant backgrounds?',
    discussionQuestion:
      'When automated agents evaluate human intellectual work, whose cultural and stylistic assumptions become the invisible standard?',
  },
  {
    id: 'mn-retention-early-warning',
    category: 'mentorship',
    currentId: 'current-04',
    title: 'Early Warning Retention Flag',
    mobileSummary:
      'A college advising system automatically dispatching remedial nudges to students flagged as at risk of failing.',
    prompt:
      'A university advising office uses a predictive model to monitor student portal activity and automatically dispatch intervention notices to at-risk undergraduates.',
    twist:
      'What if students receiving automated warning emails feel stigmatized and surveilled rather than supported by their academic institution?',
    discussionQuestion:
      'Does automated academic triage protect vulnerable students, or does algorithmic monitoring replace authentic pastoral care?',
  },

  // ==========================================
  // --- Domain 4: Caregiving (cg-) [8] ---
  // ==========================================
  {
    id: 'cg-triage-intake',
    category: 'caregiving',
    currentId: 'current-01',
    title: 'Clinical Intake Summarizer',
    mobileSummary:
      'An emergency clinic using conversational AI to collect and synthesize patient medical histories before triage.',
    prompt:
      'A busy community health clinic uses an AI intake tablet to interview patients in the waiting room and summarize symptoms for attending physicians.',
    twist:
      'What if a patient leaves out a crucial history of domestic trauma because sharing it with a machine felt clinical rather than safe?',
    discussionQuestion:
      'Can automated intake capture clinical facts while preserving the vulnerable trust necessary for holistic patient care?',
  },
  {
    id: 'cg-discharge-notes',
    category: 'caregiving',
    currentId: 'current-01',
    title: 'Post-Op Care Instructions',
    mobileSummary:
      'Translating complex medical discharge instructions into plain language using an AI assistant for patient families.',
    prompt:
      'A hospital nurse uses an AI tool to translate dense post-surgical clinical instructions into accessible, empathetic home care instructions for families.',
    twist:
      'What if the simplified text glosses over a subtle warning sign of infection that requires immediate emergency intervention?',
    discussionQuestion:
      'When AI translates medical expertise for caregivers, where does helpful accessibility end and risky oversimplification begin?',
  },
  {
    id: 'cg-dementia-companion',
    category: 'caregiving',
    currentId: 'current-02',
    title: 'The Calming Companion',
    mobileSummary:
      'An interactive robotic companion comforting a memory care resident by repeating familiar reminiscence stories.',
    prompt:
      'A memory care facility introduces an interactive conversational device to comfort an anxious resident with dementia by gently repeating familiar stories.',
    twist:
      'What if the resident forms a deep emotional attachment to the device, believing it is an attentive visiting grandchild?',
    discussionQuestion:
      'Is it compassionate to provide comfort through therapeutic artificial companionship, or does simulated presence cross an ethical line?',
  },
  {
    id: 'cg-therapy-chat',
    category: 'caregiving',
    currentId: 'current-02',
    title: 'The On-Demand Mental Health Bot',
    mobileSummary:
      'A university offering students an AI conversational agent for late-night emotional support and coping techniques.',
    prompt:
      'To address a three-week counseling waitlist, a student health center offers an AI mental health chat application for immediate emotional support.',
    twist:
      'What if a student in acute distress avoids reaching out to human counselors because the bot provides immediate, non-judgmental temporary relief?',
    discussionQuestion:
      'Can automated emotional first-aid bridge critical mental health gaps, or does it risk substituting for necessary human therapeutic care?',
  },
  {
    id: 'cg-caregiver-burnout',
    category: 'caregiving',
    currentId: 'current-03',
    title: 'The Caregiver Journal',
    mobileSummary:
      'An exhausted family caregiver using an AI tool to reframe guilty feelings about nursing home placement.',
    prompt:
      'A person caring for an ailing parent uses an AI therapeutic journal to process overwhelming guilt regarding the decision to seek hospice care.',
    twist:
      "What if the AI's rational, reassuring reframing causes the caregiver to suppress their necessary, messy grief rather than experiencing it?",
    discussionQuestion:
      'Does algorithmic emotional reframing help caregivers cope with crisis, or does it sanitize the painful reality of human devotion?',
  },
  {
    id: 'cg-diagnosis-research',
    category: 'caregiving',
    currentId: 'current-03',
    title: 'The Differential Explorer',
    mobileSummary:
      'A parent using an AI medical model to interrogate a pediatrician’s rare disease diagnosis.',
    prompt:
      "Faced with a child's rare medical diagnosis, an anxious parent feeds clinical lab records into an AI model to generate alternative treatment paths.",
    twist:
      'What if the parent enters the clinical consultation armed with AI arguments, creating an adversarial dynamic with the care team?',
    discussionQuestion:
      'How does personal AI medical research shift the traditional relationship of trust between patients, families, and healthcare providers?',
  },
  {
    id: 'cg-bedside-monitor',
    category: 'caregiving',
    currentId: 'current-04',
    title: 'Continuous Patient Monitoring',
    mobileSummary:
      'An automated bedside sensor system tracking elder room movement to prevent falls in a rehabilitation center.',
    prompt:
      'A post-acute nursing facility installs computer vision sensors to monitor elder room movements and alert nurses before falls occur.',
    twist:
      'What if staff spend significantly less time doing in-person room rounds because the algorithmic monitoring system feels foolproof?',
    discussionQuestion:
      'When automated surveillance prevents physical harm, what invisible relational contact and human reassurance are lost?',
  },
  {
    id: 'cg-appointment-scheduler',
    category: 'caregiving',
    currentId: 'current-04',
    title: 'Autonomous Health Navigator',
    mobileSummary:
      'An AI assistant managing complex medical appointments and insurance authorizations for a chronic illness patient.',
    prompt:
      'A patient with multiple chronic conditions entrusts an AI agent with scheduling specialist visits, coordinating lab work, and filing insurance appeals.',
    twist:
      'What if the agent makes an administrative error that cancels a critical infusion, and neither the clinic nor patient catches it in time?',
    discussionQuestion:
      'When we delegate healthcare navigation to autonomous agents, who bears moral responsibility for failures in care coordination?',
  },

  // ==========================================
  // --- Domain 5: Coworkers (cw-) [8] ---
  // ==========================================
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
  {
    id: 'cw-perf-review',
    category: 'coworkers',
    currentId: 'current-01',
    title: 'Performance Review Synthesis',
    mobileSummary:
      'Using an AI assistant to distill 360 feedback into annual evaluation reviews for direct reports.',
    prompt:
      'A manager uses an AI tool to summarize multi-source 360-degree feedback into formal annual performance reviews for five direct reports.',
    twist:
      'What if a direct report realizes the critique was framed by an AI algorithm that flattened the unique context of their cross-team collaboration?',
    discussionQuestion:
      'Can an AI summary provide unbiased performance evaluations, or does delegating appraisal compromise the trust between managers and staff?',
  },
  {
    id: 'cw-ghostwriting',
    category: 'coworkers',
    currentId: 'current-03',
    title: 'The Executive Ghostwriter',
    mobileSummary:
      'Using generative AI to compose an all-hands strategy announcement expressing personal organizational values.',
    prompt:
      'A newly appointed director uses generative AI to draft an all-hands message communicating their strategic vision and core leadership values.',
    twist:
      'What if staff find the memo inspiring, but in subsequent meetings discover the director cannot articulate those values without referring to the prepared text?',
    discussionQuestion:
      'When leaders use AI to articulate core principles, does it clarify vision or create an illusion of personal conviction?',
  },
  {
    id: 'cw-calendar-mediator',
    category: 'coworkers',
    currentId: 'current-04',
    title: 'Autonomous Calendar Negotiator',
    mobileSummary:
      'Allowing an AI scheduling agent to decline lower-priority 1-on-1 meeting requests from junior colleagues.',
    prompt:
      'A senior engineer authorizes an autonomous calendar agent to protect their focus time by declining or rescheduling meeting requests from junior teammates.',
    twist:
      'What if junior team members stop reaching out altogether because facing algorithmic rejection feels colder than approaching a busy colleague?',
    discussionQuestion:
      'Does automated schedule defense protect critical focus, or does it erect relational barriers that isolate leaders from their teams?',
  },

  // ==========================================
  // --- Domain 6: Grantees (gr-) [8] ---
  // ==========================================
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
      "A grantmaker uses an AI tool to ingest a grantee's quarterly milestone data, financial reports, and news clips to auto-generate a briefing and suggested agenda before a check-in call.",
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
  {
    id: 'gr-site-visit-bot',
    category: 'grantees',
    currentId: 'current-02',
    title: 'Virtual Field Debrief',
    mobileSummary:
      'A program officer using an AI reflection partner to process complex emotional field visit observations.',
    prompt:
      'After an intense week of community site visits, a program officer talks through field notes with an AI conversational partner to process emotional impressions.',
    twist:
      'What if the officer relies so heavily on the AI debrief that they stop holding collaborative post-visit reflections with community advisors?',
    discussionQuestion:
      'Can conversing with an AI partner help process emotionally heavy field work, or does it replace necessary human solidarity?',
  },
  {
    id: 'gr-grantee-advisor',
    category: 'grantees',
    currentId: 'current-02',
    title: 'The 24/7 Capacity Coach',
    mobileSummary:
      'Offering grantees an always-available AI organizational coach instead of funding dedicated human consultants.',
    prompt:
      'A foundation offers grantees unlimited access to an AI coaching platform trained on nonprofit governance instead of providing stipends for human mentors.',
    twist:
      'What if grantees report feeling comforted by the instantaneous advice, but miss building lasting professional networks with real sector peers?',
    discussionQuestion:
      'When funders offer automated coaching in place of human advisors, are they expanding equity or institutionalizing second-tier support?',
  },
  {
    id: 'gr-impact-dashboard',
    category: 'grantees',
    currentId: 'current-04',
    title: 'Algorithmic Grant Scoring',
    mobileSummary:
      'Employing an automated model to rank renewal applications against historical outcome metrics before committee review.',
    prompt:
      'To manage overwhelming grant volumes, a foundation deploys an automated predictive model to score renewal applications based on past performance milestones.',
    twist:
      'What if the algorithm deprioritizes an innovative pilot project that chose deep relationship-building over rapid measurable metrics?',
    discussionQuestion:
      'When algorithms screen and rank grant renewals, how do funders maintain accountability to transformative but hard-to-quantify work?',
  },

  // ==========================================
  // --- Domain 7: Leadership (ld-) [8] ---
  // ==========================================
  {
    id: 'ld-restructure-memo',
    category: 'leadership',
    currentId: 'current-01',
    title: 'Staff Reorganization Announcement',
    mobileSummary:
      'An executive leadership team using AI to craft an empathetic memo announcing team layoffs.',
    prompt:
      'An executive team uses an AI assistant to tone-calibrate a sensitive staff memo announcing departmental layoffs and organizational restructuring.',
    twist:
      'What if affected employees discover the compassionate message was written using an algorithmic prompt designed to minimize union organizing?',
    discussionQuestion:
      'Can AI-crafted corporate communication ever express genuine leadership empathy during organizational crises?',
  },
  {
    id: 'ld-board-transparency',
    category: 'leadership',
    currentId: 'current-01',
    title: 'Governance Meeting Digest',
    mobileSummary:
      'Publishing AI-summarized minutes of closed-door trustee meetings to increase transparency for organizational staff.',
    prompt:
      'A nonprofit board publishes automated AI summaries of their confidential governance deliberations to demonstrate open leadership to staff.',
    twist:
      'What if trustees become guarded in private discussions because they know an algorithm will parse every raw idea for public release?',
    discussionQuestion:
      'Does algorithmic summarization enhance institutional transparency, or does it chill honest debate among governing leaders?',
  },
  {
    id: 'ld-executive-advisor',
    category: 'leadership',
    currentId: 'current-02',
    title: 'The Confidential Strategy Bot',
    mobileSummary:
      'A chief executive vetting sensitive leadership decisions with a customized AI advisor rather than their board.',
    prompt:
      'An isolated nonprofit director uses a customized private AI advisor to sanity-check sensitive personnel decisions and ethical dilemmas.',
    twist:
      "What if the executive trusts the AI's objective detachment so much that they disregard the warnings of their human executive team?",
    discussionQuestion:
      'When senior leaders consult AI instead of trusted colleagues, does it avoid office politics or insulate them from accountability?',
  },
  {
    id: 'ld-culture-pulse',
    category: 'leadership',
    currentId: 'current-02',
    title: 'The Sentiment Engine',
    mobileSummary:
      'Leadership monitoring internal communication channels with an AI tool to measure employee morale and belonging.',
    prompt:
      'An organization deploys an AI sentiment tool across internal collaboration channels to generate a weekly happiness index for leadership.',
    twist:
      'What if employees alter their writing style and withhold criticism because they know their phrasing feeds an algorithmic dashboard?',
    discussionQuestion:
      'Can automated sentiment tracking foster a healthy culture, or does algorithmic surveillance undermine organizational psychological safety?',
  },
  {
    id: 'ld-strategic-vision',
    category: 'leadership',
    currentId: 'current-03',
    title: 'Strategic Planning Synthesis',
    mobileSummary:
      'Using generative AI to synthesize five hundred community inputs into a multi-year institutional strategic plan.',
    prompt:
      'A foundation leadership team asks an AI system to synthesize five hundred stakeholder survey responses into four core multi-year strategic pillars.',
    twist:
      'What if the resulting pillars are so clean and generic that they erase the contentious trade-offs that defined the community debates?',
    discussionQuestion:
      'Does algorithmic synthesis help leaders discern overarching themes, or does it smooth over the vital tensions of governance?',
  },
  {
    id: 'ld-crisis-response',
    category: 'leadership',
    currentId: 'current-03',
    title: 'Public Crisis Statement',
    mobileSummary:
      'Drafting an immediate institutional response to a community crisis using a rapid AI messaging model.',
    prompt:
      'When a public controversy emerges, an executive communications team uses AI to draft three rapid response scenarios balancing stakeholder equities.',
    twist:
      'What if the chosen statement sounds perfectly measured but fails to convey any moral clarity or willingness to accept organizational fault?',
    discussionQuestion:
      'In moments of institutional crisis, does AI risk management protect leadership at the expense of genuine moral courage?',
  },
  {
    id: 'ld-resource-allocation',
    category: 'leadership',
    currentId: 'current-04',
    title: 'Algorithmic Budget Optimization',
    mobileSummary:
      'A leadership team delegating department budget reductions to an optimization model to eliminate human bias.',
    prompt:
      'Facing a ten percent budget deficit, an executive team relies on an AI optimization model to recommend program cuts based on outcome data.',
    twist:
      'What if leadership justifies painful cuts to long-standing community initiatives by stating that the algorithm made the neutral call?',
    discussionQuestion:
      'When leaders use algorithmic models to make hard trade-offs, does it ensure equity or provide moral cover for painful choices?',
  },
  {
    id: 'ld-hiring-pipeline',
    category: 'leadership',
    currentId: 'current-04',
    title: 'Executive Screening Agent',
    mobileSummary:
      'Employing an autonomous AI agent to screen and rank candidates for senior mission-critical leadership roles.',
    prompt:
      'A search committee uses an automated AI recruiter to screen and rank hundreds of applicants for key institutional leadership positions.',
    twist:
      'What if the agent screens out non-traditional candidates whose unconventional career paths demonstrate deep community resilience?',
    discussionQuestion:
      'Can automated vetting identify institutional leadership potential, or does it replicate existing patterns of institutional privilege?',
  },

  // ==========================================
  // --- Domain 8: Creative Craft (cr-) [8] ---
  // ==========================================
  {
    id: 'cr-coauthored-memoir',
    category: 'creative',
    currentId: 'current-01',
    title: 'The Assisted Memoir',
    mobileSummary:
      'A writer using generative AI to expand fragmentary journal notes into a published family memoir.',
    prompt:
      "A biographer uses generative AI to expand a grandfather's sparse wartime diary entries into vivid, descriptive narrative chapters.",
    twist:
      "What if readers feel moved by the emotional scenes, but family members feel the fabricated dialogue betrays the real man's quiet dignity?",
    discussionQuestion:
      'When AI elaborates historical narrative, where is the boundary between creative restoration and historical fabrication?',
  },
  {
    id: 'cr-peer-critique',
    category: 'creative',
    currentId: 'current-01',
    title: 'Algorithmic Writers Workshop',
    mobileSummary:
      'A novelist using an AI critique model for story feedback before sharing drafts with human workshop peers.',
    prompt:
      'A novelist runs draft chapters through an AI developmental editor to identify plot holes and pacing flaws before sharing them with their writers group.',
    twist:
      "What if the writer becomes defensive when human peers offer feedback that contradicts the AI editor's structural validation?",
    discussionQuestion:
      'Does pre-screening creative drafts with AI sharpen artistic craft, or does it close our minds to peer human vulnerability?',
  },
  {
    id: 'cr-creative-muse',
    category: 'creative',
    currentId: 'current-02',
    title: 'The Relentless Muse',
    mobileSummary:
      'A graphic designer collaborating late into the night with a visual generative model for creative inspiration.',
    prompt:
      'A freelance illustrator spends late nights riffing on visual concepts with a generative AI tool, treating the system as a collaborative creative partner.',
    twist:
      'What if the illustrator finds human client collaborations increasingly frustrating because human collaborators cannot iterate instantaneously?',
    discussionQuestion:
      'Can an AI brainstorming partner expand creative reach without diminishing our patience for the friction of human collaboration?',
  },
  {
    id: 'cr-collaborative-story',
    category: 'creative',
    currentId: 'current-02',
    title: 'Interactive Worldbuilding',
    mobileSummary:
      'Two writing partners using an AI roleplayer to simulate secondary characters in their shared fantasy novel.',
    prompt:
      'Two screenwriters co-writing a drama use an AI agent to improv dialogue for secondary characters to keep their writing momentum moving.',
    twist:
      'What if the writers spend more time refining prompts for the AI character than discussing the underlying themes with each other?',
    discussionQuestion:
      'When AI enters the creative partnership, does it accelerate generative flow or distract from direct human intellectual exchange?',
  },
  {
    id: 'cr-poetry-generation',
    category: 'creative',
    currentId: 'current-03',
    title: 'The Commemorative Poem',
    mobileSummary:
      'A poet using an AI assistant to finish a commissioned poem for a community memorial service.',
    prompt:
      'Facing severe creative paralysis on a commissioned civic memorial poem, a writer prompts an AI to generate metaphors and concluding stanzas.',
    twist:
      'What if the audience weeps during the reading, but the poet feels a persistent sense of fraudulence during the standing ovation?',
    discussionQuestion:
      'In artistic expression, does the aesthetic impact of the work excuse the artist from the personal vulnerability of creating it?',
  },
  {
    id: 'cr-research-synthesis',
    category: 'creative',
    currentId: 'current-03',
    title: 'Qualitative Fieldwork Synthesis',
    mobileSummary:
      'An ethnographic researcher using AI to cluster hundreds of hours of community field notes into theory.',
    prompt:
      'An anthropologist uses generative AI to analyze and cluster field observations from six months of immersive neighborhood fieldwork.',
    twist:
      'What if the model surfaces themes that fit mainstream academic literature but overlooks subversive cultural practices visible only in person?',
    discussionQuestion:
      'When AI analyzes qualitative human observation, does it distill insight or impose standardized intellectual frameworks?',
  },
  {
    id: 'cr-editorial-curator',
    category: 'creative',
    currentId: 'current-04',
    title: 'Automated Literary Curation',
    mobileSummary:
      'A community journal using an AI screening agent to filter thousands of unsolicited poetry submissions.',
    prompt:
      'A nonprofit literary magazine uses an AI evaluation tool to screen three thousand unsolicited poetry submissions and pick the top fifty finalists.',
    twist:
      'What if the screening agent consistently eliminates experimental, raw verses that challenge conventional syntactic harmony?',
    discussionQuestion:
      'When algorithms curate artistic expression, what happens to marginal voices that do not conform to standardized aesthetic patterns?',
  },
  {
    id: 'cr-documentary-editor',
    category: 'creative',
    currentId: 'current-04',
    title: 'The Algorithmic Rough Cut',
    mobileSummary:
      'A documentary film editor letting an AI model assemble the first rough cut from two hundred hours of footage.',
    prompt:
      'A documentary filmmaker uses an automated editing tool to scan two hundred hours of raw footage and assemble a chronological rough cut.',
    twist:
      "What if the editor builds the entire documentary around the AI's assembly, never discovering spontaneous quiet moments captured between takes?",
    discussionQuestion:
      'When machines curate narrative sequences, do we gain structural efficiency while losing the accidental discoveries of human attention?',
  },
];

const SCENARIOS_BY_ID = new Map(RAW_SCENARIOS.map((s) => [s.id, s]));

// Interleaved 64-card order: 8 rounds rotating through:
// Everyday Life -> Community -> Mentorship -> Caregiving -> Coworkers -> Grantees -> Leadership -> Creative Craft
// so sessions never front-load workplace scenarios and always alternate human contexts.
const INTERLEAVED_FULL_64_IDS: string[] = [
  // --- Round 1 ---
  'lf-wedding-toast',          // life, current-03
  'cm-essay-feedback',         // community, current-01
  'mn-recommendation-letter',   // mentorship, current-01
  'cg-triage-intake',          // caregiving, current-01
  'cw-kudos',                  // coworkers, current-01
  'gr-proposal-polish',        // grantees, current-03
  'ld-restructure-memo',       // leadership, current-01
  'cr-coauthored-memoir',      // creative, current-01

  // --- Round 2 ---
  'lf-elder-checkin',          // life, current-02
  'cm-youth-companion',        // community, current-02
  'mn-socratic-tutor',         // mentorship, current-02
  'cg-dementia-companion',     // caregiving, current-02
  'cw-meeting-bot',            // coworkers, current-04
  'gr-checkin-prep',           // grantees, current-04
  'ld-executive-advisor',      // leadership, current-02
  'cr-creative-muse',          // creative, current-02

  // --- Round 3 ---
  'lf-bedtime-story',          // life, current-04
  'cm-parent-translate',       // community, current-04
  'mn-creative-outline',       // mentorship, current-03
  'cg-caregiver-burnout',      // caregiving, current-03
  'cw-difficult-talk',         // coworkers, current-02
  'gr-decline-note',           // grantees, current-01
  'ld-strategic-vision',       // leadership, current-03
  'cr-poetry-generation',      // creative, current-03

  // --- Round 4 ---
  'lf-apology-text',           // life, current-01
  'cm-town-hall',              // community, current-03
  'mn-grading-rubric',         // mentorship, current-04
  'cg-bedside-monitor',        // caregiving, current-04
  'cw-strategy-memo',          // coworkers, current-03
  'gr-story-synthesis',        // grantees, current-03
  'ld-resource-allocation',    // leadership, current-04
  'cr-editorial-curator',      // creative, current-04

  // --- Round 5 ---
  'lf-group-trip',             // life, current-04
  'cm-mock-interview',         // community, current-04
  'mn-office-hours-bot',       // mentorship, current-01
  'cg-discharge-notes',        // caregiving, current-01
  'cw-onboarding',             // coworkers, current-02
  'gr-prototype-nudge',        // grantees, current-01
  'ld-board-transparency',     // leadership, current-01
  'cr-peer-critique',          // creative, current-01

  // --- Round 6 ---
  'lf-condolence-note',        // life, current-01
  'cm-neighbor-dispute',       // community, current-01
  'mn-math-companion',         // mentorship, current-02
  'cg-therapy-chat',           // caregiving, current-02
  'cw-perf-review',            // coworkers, current-01
  'gr-site-visit-bot',         // grantees, current-02
  'ld-culture-pulse',          // leadership, current-02
  'cr-collaborative-story',    // creative, current-02

  // --- Round 7 ---
  'lf-family-memory',          // life, current-02
  'cm-senior-listener',        // community, current-02
  'mn-code-copilot',           // mentorship, current-03
  'cg-diagnosis-research',     // caregiving, current-03
  'cw-ghostwriting',           // coworkers, current-03
  'gr-grantee-advisor',        // grantees, current-02
  'ld-crisis-response',        // leadership, current-03
  'cr-research-synthesis',     // creative, current-03

  // --- Round 8 ---
  'lf-journal-coach',          // life, current-03
  'cm-advocacy-letter',        // community, current-03
  'mn-retention-early-warning',// mentorship, current-04
  'cg-appointment-scheduler',  // caregiving, current-04
  'cw-calendar-mediator',      // coworkers, current-04
  'gr-impact-dashboard',       // grantees, current-04
  'ld-hiring-pipeline',        // leadership, current-04
  'cr-documentary-editor',     // creative, current-04
];

export const ALL_SCENARIOS: ScenarioCard[] = INTERLEAVED_FULL_64_IDS.map(
  (id) => SCENARIOS_BY_ID.get(id)!
).filter(Boolean);

export const PHILANTHROPY_SCENARIOS: ScenarioCard[] = ALL_SCENARIOS;

// Spark-8: 8 interleaved scenarios (2 per category across the 4 foundational domains, 2 per Current, no adjacent categories)
const SPARK_8_IDS: string[] = [
  'lf-wedding-toast',    // life, current-03
  'cm-essay-feedback',   // community, current-01
  'cw-kudos',            // coworkers, current-01
  'gr-proposal-polish',  // grantees, current-03
  'lf-elder-checkin',    // life, current-02
  'gr-checkin-prep',     // grantees, current-04
  'cm-youth-companion',  // community, current-02
  'cw-meeting-bot',      // coworkers, current-04
];

// Current-01 Focus (Our sense of trust): 5 Current-01 scenarios + 1 complementary, interleaved
const CURRENT_01_FOCUS_IDS: string[] = [
  'lf-apology-text',     // life, current-01
  'cm-essay-feedback',   // community, current-01
  'cw-kudos',            // coworkers, current-01
  'gr-decline-note',     // grantees, current-01
  'lf-wedding-toast',    // life, current-03 complementary
  'gr-prototype-nudge',  // grantees, current-01
];

// Current-02 Focus (Relationships with AI): 4 Current-02 scenarios + 2 complementary, interleaved
const CURRENT_02_FOCUS_IDS: string[] = [
  'lf-elder-checkin',    // life, current-02
  'cm-youth-companion',  // community, current-02
  'cw-difficult-talk',   // coworkers, current-02
  'gr-checkin-prep',     // grantees, current-04 complementary
  'lf-bedtime-story',    // life, current-04 complementary
  'cw-onboarding',       // coworkers, current-02
];

// Current-03 Focus (Our inner voice): 5 Current-03 scenarios + 1 complementary, interleaved
const CURRENT_03_FOCUS_IDS: string[] = [
  'lf-wedding-toast',    // life, current-03
  'cm-town-hall',        // community, current-03
  'cw-strategy-memo',    // coworkers, current-03
  'gr-proposal-polish',  // grantees, current-03
  'cm-essay-feedback',   // community, current-01 complementary
  'gr-story-synthesis',  // grantees, current-03
];

// Current-04 Focus (Acting for us): 6 Current-04 scenarios, interleaved
const CURRENT_04_FOCUS_IDS: string[] = [
  'lf-bedtime-story',    // life, current-04
  'cm-parent-translate', // community, current-04
  'cw-meeting-bot',      // coworkers, current-04
  'gr-checkin-prep',     // grantees, current-04
  'lf-group-trip',       // life, current-04
  'cm-mock-interview',   // community, current-04
];

const CATEGORY_WARM_UP_ORDER: ScenarioCategory[] = [
  'life',
  'community',
  'mentorship',
  'caregiving',
  'coworkers',
  'grantees',
  'leadership',
  'creative',
];

const CURRENTS_ORDER: RithmCurrentId[] = [
  'current-01',
  'current-02',
  'current-03',
  'current-04',
];

function createPrng(seed?: string | number): () => number {
  if (seed === undefined) {
    return Math.random;
  }
  let s = 0;
  if (typeof seed === 'number') {
    s = seed >>> 0;
  } else {
    for (let i = 0; i < seed.length; i++) {
      s = (Math.imul(31, s) + seed.charCodeAt(i)) >>> 0;
    }
  }
  // Mulberry32
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export function getMatchingScenariosPool(options?: CustomDeckOptions): ScenarioCard[] {
  const categories =
    options?.categories && options.categories.length > 0 ? options.categories : undefined;
  const currents =
    options?.currents && options.currents.length > 0 ? options.currents : undefined;

  return ALL_SCENARIOS.filter((card) => {
    if (categories && !categories.includes(card.category)) {
      return false;
    }
    if (currents && !currents.includes(card.currentId)) {
      return false;
    }
    return true;
  });
}

export const SEEN_SCENARIOS_STORAGE_KEY = 'ai-effect-seen-scenarios-v1';
let inMemorySeenScenarioIds: string[] = [];

export function getRecentlySeenScenarioIds(): string[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(SEEN_SCENARIOS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          inMemorySeenScenarioIds = parsed.filter(
            (item): item is string => typeof item === 'string'
          );
          return [...inMemorySeenScenarioIds];
        }
      }
    } catch {
      // Fallback to in-memory
    }
  }
  return [...inMemorySeenScenarioIds];
}

export function markScenariosSeen(ids: string[]): void {
  if (!ids || ids.length === 0) {
    return;
  }
  const current = getRecentlySeenScenarioIds();
  const incomingSet = new Set(ids);
  const dedupedIncoming: string[] = [];
  for (const id of ids) {
    if (!dedupedIncoming.includes(id)) {
      dedupedIncoming.push(id);
    }
  }
  const filtered = current.filter((id) => !incomingSet.has(id));
  const combined = [...filtered, ...dedupedIncoming];
  const maxCapacity = ALL_SCENARIOS.length;
  const capped =
    combined.length > maxCapacity
      ? combined.slice(combined.length - maxCapacity)
      : combined;

  inMemorySeenScenarioIds = [...capped];

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(SEEN_SCENARIOS_STORAGE_KEY, JSON.stringify(capped));
    } catch {
      // Ignore
    }
  }
}

export function clearSeenScenariosForTesting(): void {
  inMemorySeenScenarioIds = [];
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(SEEN_SCENARIOS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

function minCostAssignment(costMatrix: number[][]): number[] {
  const n = costMatrix.length;
  if (n === 0) return [];
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array(n);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

export function generateCustomScenarioDeck(options: CustomDeckOptions = {}): ScenarioCard[] {
  const activeCategories: ScenarioCategory[] =
    options.categories && options.categories.length > 0
      ? CATEGORY_WARM_UP_ORDER.filter((c) => options.categories!.includes(c))
      : [...CATEGORY_WARM_UP_ORDER];

  const activeCurrents: RithmCurrentId[] =
    options.currents && options.currents.length > 0
      ? CURRENTS_ORDER.filter((c) => options.currents!.includes(c))
      : [...CURRENTS_ORDER];

  const prng = createPrng(options.seed);

  // Build active seen list
  const activeSeenList: string[] = [];
  if (options.seed !== undefined) {
    if (options.excludeIds) {
      for (const id of options.excludeIds) {
        if (!activeSeenList.includes(id)) {
          activeSeenList.push(id);
        }
      }
    }
  } else {
    const recentSeen = getRecentlySeenScenarioIds();
    for (const id of recentSeen) {
      if (!activeSeenList.includes(id)) {
        activeSeenList.push(id);
      }
    }
    if (options.excludeIds) {
      for (const id of options.excludeIds) {
        const idx = activeSeenList.indexOf(id);
        if (idx !== -1) {
          activeSeenList.splice(idx, 1);
        }
        activeSeenList.push(id);
      }
    }
  }

  const poolCards = RAW_SCENARIOS.filter(
    (s) => activeCategories.includes(s.category) && activeCurrents.includes(s.currentId)
  );
  const totalMatching = poolCards.length;
  if (totalMatching === 0) {
    return [];
  }

  const targetCount = Math.min(options.count ?? totalMatching, totalMatching);
  if (targetCount <= 0) {
    return [];
  }

  const poolIdSet = new Set(poolCards.map((s) => s.id));
  const poolSeenList = activeSeenList.filter((id) => poolIdSet.has(id));
  const seenRankMap = new Map<string, number>();
  poolSeenList.forEach((id, idx) => {
    seenRankMap.set(id, idx);
  });

  const cooldown = Math.max(targetCount, Math.floor(totalMatching / 2));
  const allCardsHaveBeenSeen = poolSeenList.length >= totalMatching;

  function getCardCost(card: ScenarioCard, randomJitter: number = 0): number {
    if (options.excludeIds && options.excludeIds.includes(card.id)) {
      return 1e8;
    }
    const rank = seenRankMap.get(card.id);
    if (rank === undefined) {
      return 0 + randomJitter;
    }
    const seenDistance = poolSeenList.length - 1 - rank;
    if (!allCardsHaveBeenSeen) {
      const recency = Math.max(0, cooldown - seenDistance);
      return 1_000_000 + recency * 1000 + randomJitter;
    } else {
      if (seenDistance >= cooldown) {
        return 0 + randomJitter;
      }
      return 10_000 + (cooldown - seenDistance) * 1000 + randomJitter;
    }
  }

  // Group matching candidates into buckets by (category, currentId), shuffle, and sort by seen rank
  const availableBuckets = new Map<string, ScenarioCard[]>();

  for (const cat of activeCategories) {
    for (const cur of activeCurrents) {
      const key = `${cat}:${cur}`;
      const matching = poolCards.filter(
        (s) => s.category === cat && s.currentId === cur
      );
      const shuffled = shuffleArray(matching, prng);
      shuffled.sort((a, b) => getCardCost(a, 0) - getCardCost(b, 0));
      availableBuckets.set(key, shuffled);
    }
  }

  // Compute max cards available per category across active currents
  const maxCardsForCat = new Map<ScenarioCategory, number>();
  const allocatedPerCat = new Map<ScenarioCategory, number>();
  for (const cat of activeCategories) {
    let count = 0;
    for (const cur of activeCurrents) {
      count += availableBuckets.get(`${cat}:${cur}`)?.length ?? 0;
    }
    maxCardsForCat.set(cat, count);
    allocatedPerCat.set(cat, 0);
  }

  // Build category passes: each pass has at most 1 slot per category
  const categoryPasses: ScenarioCategory[][] = [];
  let totalSlotsAllocated = 0;
  let pass = 0;

  while (totalSlotsAllocated < targetCount) {
    const passOrder =
      pass === 0
        ? [
            ...activeCategories.slice(0, 2),
            ...shuffleArray(activeCategories.slice(2), prng),
          ]
        : shuffleArray(activeCategories, prng);

    const currentPass: ScenarioCategory[] = [];
    for (const cat of passOrder) {
      if (totalSlotsAllocated >= targetCount) {
        break;
      }
      if ((allocatedPerCat.get(cat) ?? 0) < (maxCardsForCat.get(cat) ?? 0)) {
        currentPass.push(cat);
        allocatedPerCat.set(cat, (allocatedPerCat.get(cat) ?? 0) + 1);
        totalSlotsAllocated++;
      }
    }

    if (currentPass.length === 0) {
      break;
    }
    categoryPasses.push(currentPass);
    pass++;
  }

  // Track global Current usage count to keep Currents balanced across the entire deck
  const currentUsageCount = new Map<RithmCurrentId, number>();
  for (const cur of activeCurrents) {
    currentUsageCount.set(cur, 0);
  }

  const selectedCards: ScenarioCard[] = [];

  for (const passCategories of categoryPasses) {
    // Determine balanced current slots for this pass
    const slotCurrents: RithmCurrentId[] = [];
    for (let s = 0; s < passCategories.length; s++) {
      const shuffledCurrents = shuffleArray(activeCurrents, prng);
      let bestCur = shuffledCurrents[0];
      let bestUsage =
        (currentUsageCount.get(bestCur) ?? 0) +
        slotCurrents.filter((c) => c === bestCur).length;

      for (let k = 1; k < shuffledCurrents.length; k++) {
        const cur = shuffledCurrents[k];
        const usage =
          (currentUsageCount.get(cur) ?? 0) +
          slotCurrents.filter((c) => c === cur).length;
        if (usage < bestUsage) {
          bestCur = cur;
          bestUsage = usage;
        }
      }
      slotCurrents.push(bestCur);
    }

    // Build cost matrix between passCategories and slotCurrents
    const costMatrix: number[][] = [];
    for (let i = 0; i < passCategories.length; i++) {
      const cat = passCategories[i];
      const row: number[] = [];
      for (let j = 0; j < slotCurrents.length; j++) {
        const cur = slotCurrents[j];
        const bucket = availableBuckets.get(`${cat}:${cur}`);
        if (!bucket || bucket.length === 0) {
          row.push(1e9);
        } else {
          row.push(getCardCost(bucket[0], prng() * 10));
        }
      }
      costMatrix.push(row);
    }

    const assignment = minCostAssignment(costMatrix);

    for (let i = 0; i < passCategories.length; i++) {
      const cat = passCategories[i];
      const cur = slotCurrents[assignment[i]];
      const bucket = availableBuckets.get(`${cat}:${cur}`);
      if (bucket && bucket.length > 0) {
        selectedCards.push(bucket.shift()!);
        currentUsageCount.set(cur, (currentUsageCount.get(cur) ?? 0) + 1);
      }
    }
  }

  // Safety fill if any slots remain unfilled
  if (selectedCards.length < targetCount) {
    for (const cat of activeCategories) {
      for (const cur of activeCurrents) {
        const bucket = availableBuckets.get(`${cat}:${cur}`);
        while (bucket && bucket.length > 0 && selectedCards.length < targetCount) {
          selectedCards.push(bucket.shift()!);
        }
      }
    }
  }

  // Pedagogical ordering & Interleaving
  const cardsByCategory = new Map<ScenarioCategory, ScenarioCard[]>();
  for (const card of selectedCards) {
    if (!cardsByCategory.has(card.category)) {
      cardsByCategory.set(card.category, []);
    }
    cardsByCategory.get(card.category)!.push(card);
  }

  const deck: ScenarioCard[] = [];
  let lastCategory: ScenarioCategory | null = null;
  const numToPlace = selectedCards.length;

  for (let i = 0; i < numToPlace; i++) {
    const remainingSlots = numToPlace - i;
    const criticalThreshold = Math.ceil(remainingSlots / 2);

    const availableCats = CATEGORY_WARM_UP_ORDER.filter(
      (cat) => (cardsByCategory.get(cat)?.length ?? 0) > 0
    );

    if (availableCats.length === 0) {
      break;
    }

    const criticalCat = availableCats.find(
      (cat) => (cardsByCategory.get(cat)?.length ?? 0) >= criticalThreshold
    );

    let chosenCategory: ScenarioCategory;

    if (criticalCat && criticalCat !== lastCategory) {
      chosenCategory = criticalCat;
    } else {
      const eligible = availableCats.filter((cat) => cat !== lastCategory);
      const candidates = eligible.length > 0 ? eligible : availableCats;

      if (i === 0 || i === 1) {
        // Lead with warmest available categories (life, community, ...)
        chosenCategory = candidates[0];
      } else {
        let maxCount = 0;
        for (const cat of candidates) {
          const count = cardsByCategory.get(cat)!.length;
          if (count > maxCount) {
            maxCount = count;
          }
        }
        const topCandidates = candidates.filter(
          (cat) => cardsByCategory.get(cat)!.length === maxCount
        );
        chosenCategory =
          topCandidates[Math.floor(prng() * topCandidates.length)];
      }
    }

    const card = cardsByCategory.get(chosenCategory)!.shift()!;
    deck.push(card);
    lastCategory = chosenCategory;
  }

  if (options.seed === undefined && deck.length > 0) {
    markScenariosSeen(deck.slice(0, Math.min(deck.length, 8)).map((s) => s.id));
  }

  return deck;
}

export const SPARK_8_CATEGORIES: ScenarioCategory[] = [
  'life',
  'community',
  'coworkers',
  'grantees',
];

export function getPresetScenarios(
  preset: DeckPresetId,
  customOrCategories?: ScenarioCategory[] | CustomDeckOptions
): ScenarioCard[] {
  switch (preset) {
    case 'spark-8':
      return generateCustomScenarioDeck({
        categories: SPARK_8_CATEGORIES,
        count: 8,
      });
    case 'current-01-focus':
      return generateCustomScenarioDeck({ currents: ['current-01'], count: 6 });
    case 'current-02-focus':
      return generateCustomScenarioDeck({ currents: ['current-02'], count: 6 });
    case 'current-03-focus':
      return generateCustomScenarioDeck({ currents: ['current-03'], count: 6 });
    case 'current-04-focus':
      return generateCustomScenarioDeck({ currents: ['current-04'], count: 6 });
    case 'full-20':
      return generateCustomScenarioDeck({ count: ALL_SCENARIOS.length });
    case 'custom': {
      if (!customOrCategories) {
        return generateCustomScenarioDeck({ count: ALL_SCENARIOS.length });
      }
      if (Array.isArray(customOrCategories)) {
        if (customOrCategories.length === 0) {
          return generateCustomScenarioDeck({ count: ALL_SCENARIOS.length });
        }
        return generateCustomScenarioDeck({ categories: customOrCategories });
      }
      return generateCustomScenarioDeck(customOrCategories);
    }
    default:
      return generateCustomScenarioDeck({ count: ALL_SCENARIOS.length });
  }
}
