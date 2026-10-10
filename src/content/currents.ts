import { RithmCurrentId, RithmCurrentMeta } from '../types/game';

export const RITHM_CURRENTS: Record<RithmCurrentId, RithmCurrentMeta> = {
  'current-01': {
    id: 'current-01',
    number: 'Current 01',
    title: 'Our sense of trust',
    subtitle: 'When AI enters human exchanges, can we still tell what is genuine care versus synthetic polish?',
    url: 'https://aicurrents.therithmproject.org/current-01/',
    pullDescription:
      'As generative AI makes polished prose, instant praise, and automated outreach effortless, the surface of our communication sparkles while the underlying bedrock of trust erodes. When every email, recommendation, or decline note sounds impeccably warm, we stop believing that warmth reflects actual human care.',
    philanthropyPrompt:
      'As AI automates more of our routine correspondence and grant reporting, where must we fiercely insist on unfiltered, authentic, and vulnerable human expression?',
    protectPrompt:
      'What messages, acknowledgments, and feedback in our relationships must always remain humanly crafted and deeply personal?',
  },
  'current-02': {
    id: 'current-02',
    number: 'Current 02',
    title: 'Relationships with AI',
    subtitle: 'Turning to frictionless AI companions, coaches, or personas instead of leaning into messy human relationships.',
    url: 'https://aicurrents.therithmproject.org/current-02/',
    pullDescription:
      'Human relationships are unpredictable, vulnerable, and demanding. AI interlocutors—always attentive, endlessly patient, and non-judgmental—offer the illusion of companionship and advice without the friction. Over time, turning to AI personas for sounding boards or comfort dulls our tolerance for the awkward, beautiful work of human connection.',
    philanthropyPrompt:
      'How do we ensure that internal AI sounding boards, coaching tools, and onboarding bots act as on-ramps to human collaboration rather than substitutes for peer vulnerability?',
    protectPrompt:
      'Where in our team and community culture do we need to protect space for messy, unscripted human conflict and spontaneous peer check-ins?',
  },
  'current-03': {
    id: 'current-03',
    number: 'Current 03',
    title: 'Our inner voice',
    subtitle: 'Handing over our own reflection, discernment, and personal expression before wrestling with the thoughts ourselves.',
    url: 'https://aicurrents.therithmproject.org/current-03/',
    pullDescription:
      'Thinking is hard, slow work. When we reflexively ask AI to summarize long memos, draft first thoughts, or synthesize complex community narratives, we surrender the cognitive wrestling where genuine insight and empathy form. We trade the distinct timbre of our inner voice for a sanitized, consensus-driven average.',
    philanthropyPrompt:
      'Before we let algorithms synthesize grantee applications, qualitative interviews, or strategic memos, what intellectual and emotional wrestling must we do ourselves?',
    protectPrompt:
      'What rituals of listening, reading, and personal reflection will we safeguard so our team never outsources its moral discernment?',
  },
  'current-04': {
    id: 'current-04',
    number: 'Current 04',
    title: 'Acting for us',
    subtitle: 'Letting AI agents step in, represent us, filter people, or mediate on our behalf in the relational world.',
    url: 'https://aicurrents.therithmproject.org/current-04/',
    pullDescription:
      'As autonomous AI agents schedule our meetings, attend calls in our place, screen inbound applicants, and mediate interpersonal conflicts, we step back from direct relational contact. When an agent acts as our proxy, we lose the subtle social cues, hesitation, and serendipitous solidarity that only arise when people show up in person.',
    philanthropyPrompt:
      'As agentic AI capabilities scale across our operations, where do we draw a bright line that insists a human being must show up in the room?',
    protectPrompt:
      'Which decisions, negotiations, and relational thresholds must never be delegated to an algorithmic proxy or automated filter?',
  },
};

export const RITHM_CURRENTS_LIST: RithmCurrentMeta[] = [
  RITHM_CURRENTS['current-01'],
  RITHM_CURRENTS['current-02'],
  RITHM_CURRENTS['current-03'],
  RITHM_CURRENTS['current-04'],
];

export function getCurrentMeta(id: RithmCurrentId): RithmCurrentMeta {
  return RITHM_CURRENTS[id] || RITHM_CURRENTS['current-01'];
}
