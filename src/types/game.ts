export type Stance = 'support' | 'depends' | 'erode';

export type ScenarioCategory =
  | 'coworkers'
  | 'grantees'
  | 'community'
  | 'life'
  | 'mentorship'
  | 'caregiving'
  | 'leadership'
  | 'creative';

export type RithmCurrentId = 'current-01' | 'current-02' | 'current-03' | 'current-04';

export type RoomPhase =
  | 'lobby'
  | 'opening_framing'
  | 'voting'
  | 'revealed'
  | 'twist'
  | 'currents_framing'
  | 'currents_workshop';

export type DeckPresetId =
  | 'spark-8'
  | 'current-01-focus'
  | 'current-02-focus'
  | 'current-03-focus'
  | 'current-04-focus'
  | 'full-20'
  | 'custom';

export interface CustomDeckOptions {
  categories?: ScenarioCategory[];
  currents?: RithmCurrentId[];
  count?: number;
  seed?: string | number;
}

export interface CategoryMeta {
  id: ScenarioCategory;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  surfaceTint: string;
}

export interface StanceMeta {
  id: Stance;
  label: string;
  shortLabel: string;
  subtitle: string;
  description: string;
}

export interface RithmCurrentMeta {
  id: RithmCurrentId;
  number: string;          // e.g. "Current 01"
  title: string;           // e.g. "Our sense of trust"
  subtitle: string;        // 1-line essence
  url: string;             // e.g. "https://aicurrents.therithmproject.org/current-01/"
  pullDescription: string; // How this invisible rip current pulls on relationships
  philanthropyPrompt: string; // Offsite workshop prompt for flipping the script
  protectPrompt: string;   // Concrete question on what to keep human vs automate
}

export interface ScenarioCard {
  id: string;
  category: ScenarioCategory;
  currentId: RithmCurrentId;
  title: string;
  mobileSummary: string;   // Crisp 1-sentence dilemma anchor for eyes-up mobile view
  prompt: string;          // Full narrative for Presenter View
  twist: string;           // "What If?" contextual modifier
  discussionQuestion: string;
}

export interface Participant {
  clientId: string;
  name: string;
  pebbleVariant: number;   // 0..4 for organic river-stone shape variation
  joinedAt: number;
  lastSeenAt: number;
}

export interface ParticipantVote {
  clientId: string;
  initialStance: Stance;
  currentStance: Stance;   // Matches initialStance until shifted during 'twist' phase
  note?: string;
  updatedAt: number;
  shiftedInTwist?: boolean;
}

export interface ScenarioRoundRecord {
  scenarioId: string;
  twistTriggered: boolean;
  votes: Record<string, ParticipantVote>;
}

export type WorkshopStage = 'small_groups' | 'large_group';

export type WorkshopProposalType = 'general' | 'protect' | 'automate';

export type WorkshopGroupingStatus = 'idle' | 'grouping' | 'grouped' | 'unavailable';

export interface WorkshopIdeaGroup {
  id: string;
  currentId?: RithmCurrentId;
  themeTitle: string;
  proposalIds: string[];
  endorsements: string[]; // clientIds who +1'd this affinity group
  createdAt: number;
}

export interface WorkshopProposal {
  id: string;
  currentId: RithmCurrentId;
  clientId: string;
  authorName: string;
  type: WorkshopProposalType;
  text: string;
  endorsements: string[]; // clientIds who placed an endorsement pebble on this proposal
  createdAt: number;
}

export interface RoomState {
  code: string;
  createdAt: number;
  updatedAt: number;
  phase: RoomPhase;
  currentScenarioIndex: number;
  scenarios: ScenarioCard[];
  participants: Record<string, Participant>;
  rounds: Record<string, ScenarioRoundRecord>;
  currentCommitments: Record<RithmCurrentId, string>; // Facilitator-captured team norms per Current
  framingSlideIndex?: number;
  workshopStage?: WorkshopStage;
  workshopProposals?: Record<string, WorkshopProposal>;
  workshopIdeaGroups?: Record<string, WorkshopIdeaGroup>;
  workshopGroupingStatus?: WorkshopGroupingStatus;
}

export interface StanceTally {
  support: number;
  depends: number;
  erode: number;
  total: number;
  supportPct: number;
  dependsPct: number;
  erodePct: number;
}

export interface TwistShiftDelta {
  initialTally: StanceTally;
  currentTally: StanceTally;
  netShift: {
    support: number;
    depends: number;
    erode: number;
  };
  shiftedCount: number;
  transitions: Array<{
    clientId: string;
    name: string;
    from: Stance;
    to: Stance;
  }>;
}

export interface ScenarioSummaryItem {
  scenario: ScenarioCard;
  round: ScenarioRoundRecord;
  tally: StanceTally;
  delta: TwistShiftDelta;
  consensusType: 'green_zone' | 'red_line' | 'gray_zone' | 'unplayed';
}

export interface CurrentsSynthesisBucket {
  current: RithmCurrentMeta;
  items: ScenarioSummaryItem[];
  dominantStance: Stance | 'mixed';
  commitmentText: string;
  proposals: WorkshopProposal[];
  ideaGroups?: WorkshopIdeaGroup[];
}

export type ClientInboundMessage =
  | {
      type: 'join';
      code: string;
      clientId: string;
      name?: string;
      timestamp: number;
    }
  | {
      type: 'vote';
      code: string;
      clientId: string;
      scenarioId: string;
      stance: Stance;
      note?: string;
      timestamp: number;
    }
  | {
      type: 'submit_proposal';
      code: string;
      clientId: string;
      currentId: RithmCurrentId;
      proposalType?: WorkshopProposalType;
      text: string;
      timestamp: number;
    }
  | {
      type: 'toggle_endorsement';
      code: string;
      clientId: string;
      proposalId: string;
      timestamp: number;
    }
  | {
      type: 'toggle_group_endorsement';
      code: string;
      clientId: string;
      groupId: string;
      timestamp: number;
    }
  | {
      type: 'request_state';
      code: string;
      clientId: string;
      timestamp: number;
    };

export type SyncConnectionStatus = 'connected' | 'local_only' | 'connecting' | 'reconnecting';

