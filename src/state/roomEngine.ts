import { RITHM_CURRENTS_LIST } from '../content/currents';
import { PHILANTHROPY_SCENARIOS } from '../content/scenarios';
import {
  ClientInboundMessage,
  CurrentsSynthesisBucket,
  Participant,
  ParticipantVote,
  RithmCurrentId,
  RoomPhase,
  RoomState,
  ScenarioCard,
  ScenarioRoundRecord,
  ScenarioSummaryItem,
  Stance,
  StanceTally,
  TwistShiftDelta,
  WorkshopGroupingStatus,
  WorkshopIdeaGroup,
  WorkshopProposal,
  WorkshopProposalType,
  WorkshopStage,
} from '../types/game';

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const ALLITERATIVE_ANIMAL_NAMES: readonly string[] = [
  'Ambling Alpaca',
  'Breezy Badger',
  'Clever Crane',
  'Curious Capybara',
  'Dapper Dolphin',
  'Earnest Egret',
  'Friendly Fox',
  'Gentle Gecko',
  'Happy Hedgehog',
  'Inventive Ibis',
  'Jolly Jackrabbit',
  'Kindly Koala',
  'Lively Lynx',
  'Mellow Marmot',
  'Merry Manatee',
  'Nimble Narwhal',
  'Optimistic Otter',
  'Patient Pangolin',
  'Plucky Puffin',
  'Quirky Quokka',
  'Radiant Robin',
  'Spirited Starling',
  'Sunny Salamander',
  'Thoughtful Tortoise',
  'Tranquil Trout',
  'Upbeat Urchin',
  'Vibrant Vole',
  'Wandering Wren',
  'Warm Walrus',
  'Whimsical Whale',
  'Wise Wombat',
  'Zesty Zebra',
];

export function generateAlliterativeAnimalName(
  seed?: string | number,
  existingNames: string[] = []
): string {
  const total = ALLITERATIVE_ANIMAL_NAMES.length;
  let baseIndex = 0;

  if (typeof seed === 'number') {
    baseIndex = Math.abs(Math.floor(seed)) % total;
  } else if (typeof seed === 'string' && seed.length > 0) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    baseIndex = Math.abs(hash) % total;
  } else {
    baseIndex = Math.floor(Math.random() * total);
  }

  const existingLower = new Set(
    existingNames.map((n) => n.trim().toLowerCase())
  );

  for (let offset = 0; offset < total; offset++) {
    const candidate = ALLITERATIVE_ANIMAL_NAMES[(baseIndex + offset) % total];
    if (!existingLower.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  const fallback = ALLITERATIVE_ANIMAL_NAMES[baseIndex];
  return `${fallback} ${existingNames.length + 1}`;
}

const inMemoryStorage = new Map<string, string>();

interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem?: (key: string) => void;
  clear?: () => void;
}

function getStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return {
    getItem: (key: string) => inMemoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      inMemoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      inMemoryStorage.delete(key);
    },
    clear: () => {
      inMemoryStorage.clear();
    },
  };
}

export function clearHostStorageForTesting(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
  }
  inMemoryStorage.clear();
}

export function generateRoomCode(length: number = 4): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    result += ROOM_CODE_ALPHABET[idx];
  }
  return result;
}

export function getOrCreateClientId(): string {
  const storage = getStorage();
  try {
    const existing = storage.getItem('ai-effect-client-id');
    if (existing) {
      return existing;
    }
  } catch {
    // Ignore storage read errors
  }

  const newId =
    'c_' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36);

  try {
    storage.setItem('ai-effect-client-id', newId);
  } catch {
    // Ignore storage write errors (e.g. private browsing quota)
  }

  return newId;
}

export function createRoomState(
  scenarios: ScenarioCard[] = [],
  customCode?: string
): RoomState {
  const code = (customCode || generateRoomCode(4)).toUpperCase();
  const now = Date.now();
  const deck = scenarios.length > 0 ? scenarios : PHILANTHROPY_SCENARIOS;

  return {
    code,
    createdAt: now,
    updatedAt: now,
    phase: 'lobby',
    currentScenarioIndex: 0,
    scenarios: deck,
    participants: {},
    rounds: {},
    currentCommitments: {
      'current-01': '',
      'current-02': '',
      'current-03': '',
      'current-04': '',
    },
    framingSlideIndex: 0,
    workshopStage: 'small_groups',
    workshopProposals: {},
    workshopIdeaGroups: {},
    workshopGroupingStatus: 'idle',
  };
}

export function saveHostRoomState(room: RoomState): void {
  const storage = getStorage();
  try {
    storage.setItem(
      'ai-effect-host-room-' + room.code.toUpperCase(),
      JSON.stringify(room)
    );
  } catch {
    // Ignore quota/storage errors
  }
}

export function loadHostRoomState(code: string): RoomState | null {
  const storage = getStorage();
  try {
    const data = storage.getItem(
      'ai-effect-host-room-' + code.toUpperCase()
    );
    if (!data) return null;
    return JSON.parse(data) as RoomState;
  } catch {
    return null;
  }
}

export function joinParticipant(
  room: RoomState,
  clientId: string,
  name?: string
): RoomState {
  const now = Date.now();
  const existing = room.participants[clientId];

  if (existing) {
    const updatedParticipant: Participant = {
      ...existing,
      name: name?.trim() || existing.name,
      lastSeenAt: now,
    };
    return {
      ...room,
      updatedAt: now,
      participants: {
        ...room.participants,
        [clientId]: updatedParticipant,
      },
    };
  }

  const existingCount = Object.keys(room.participants).length;
  const existingNames = Object.values(room.participants).map((p) => p.name);
  const assignedName =
    name?.trim() || generateAlliterativeAnimalName(clientId, existingNames);

  const newParticipant: Participant = {
    clientId,
    name: assignedName,
    pebbleVariant: existingCount % 5,
    joinedAt: now,
    lastSeenAt: now,
  };

  return {
    ...room,
    updatedAt: now,
    participants: {
      ...room.participants,
      [clientId]: newParticipant,
    },
  };
}

export function recordParticipantVote(
  room: RoomState,
  clientId: string,
  scenarioId: string,
  stance: Stance,
  note?: string
): RoomState {
  const now = Date.now();

  // Ensure participant exists
  let updatedRoom = room;
  if (!updatedRoom.participants[clientId]) {
    updatedRoom = joinParticipant(updatedRoom, clientId);
  } else {
    // Touch lastSeenAt
    updatedRoom = {
      ...updatedRoom,
      participants: {
        ...updatedRoom.participants,
        [clientId]: {
          ...updatedRoom.participants[clientId],
          lastSeenAt: now,
        },
      },
    };
  }

  const currentRound = updatedRoom.rounds[scenarioId] || {
    scenarioId,
    twistTriggered: updatedRoom.phase === 'twist',
    votes: {},
  };

  const existingVote = currentRound.votes[clientId];
  const isTwistActive =
    updatedRoom.phase === 'twist' || currentRound.twistTriggered;

  let newVote: ParticipantVote;

  if (isTwistActive && existingVote) {
    newVote = {
      clientId,
      initialStance: existingVote.initialStance,
      currentStance: stance,
      note: note !== undefined ? note : existingVote.note,
      updatedAt: now,
      shiftedInTwist: existingVote.initialStance !== stance,
    };
  } else if (existingVote) {
    newVote = {
      clientId,
      initialStance: stance,
      currentStance: stance,
      note: note !== undefined ? note : existingVote.note,
      updatedAt: now,
      shiftedInTwist: false,
    };
  } else {
    newVote = {
      clientId,
      initialStance: stance,
      currentStance: stance,
      note,
      updatedAt: now,
      shiftedInTwist: false,
    };
  }

  const updatedRound: ScenarioRoundRecord = {
    ...currentRound,
    twistTriggered: isTwistActive,
    votes: {
      ...currentRound.votes,
      [clientId]: newVote,
    },
  };

  return {
    ...updatedRoom,
    updatedAt: now,
    rounds: {
      ...updatedRoom.rounds,
      [scenarioId]: updatedRound,
    },
  };
}

export function setRoomPhase(room: RoomState, phase: RoomPhase): RoomState {
  const now = Date.now();
  const currentCard = room.scenarios[room.currentScenarioIndex];

  let rounds = room.rounds;
  if (phase === 'twist' && currentCard) {
    const existingRound = rounds[currentCard.id] || {
      scenarioId: currentCard.id,
      twistTriggered: true,
      votes: {},
    };
    rounds = {
      ...rounds,
      [currentCard.id]: {
        ...existingRound,
        twistTriggered: true,
      },
    };
  }

  const framingSlideIndex =
    phase === 'opening_framing' || phase === 'currents_framing'
      ? 0
      : room.framingSlideIndex ?? 0;

  return {
    ...room,
    phase,
    rounds,
    framingSlideIndex,
    updatedAt: now,
  };
}

export function setFramingSlideIndex(room: RoomState, index: number): RoomState {
  return {
    ...room,
    framingSlideIndex: Math.max(0, index),
    updatedAt: Date.now(),
  };
}

export function triggerScenarioTwist(room: RoomState): RoomState {
  return setRoomPhase(room, 'twist');
}

export function navigateToScenario(room: RoomState, index: number): RoomState {
  const clampedIndex = Math.max(0, Math.min(index, room.scenarios.length - 1));
  const card = room.scenarios[clampedIndex];
  const now = Date.now();

  let rounds = room.rounds;
  if (card && !rounds[card.id]) {
    rounds = {
      ...rounds,
      [card.id]: {
        scenarioId: card.id,
        twistTriggered: false,
        votes: {},
      },
    };
  }

  return {
    ...room,
    currentScenarioIndex: clampedIndex,
    phase: 'voting',
    rounds,
    updatedAt: now,
  };
}

export function addCustomScenario(
  room: RoomState,
  card: Omit<ScenarioCard, 'id'>
): RoomState {
  const now = Date.now();
  const id = `custom-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const fullCard: ScenarioCard = { ...card, id };

  return {
    ...room,
    scenarios: [...room.scenarios, fullCard],
    updatedAt: now,
  };
}

export function updateCurrentCommitment(
  room: RoomState,
  currentId: RithmCurrentId,
  text: string
): RoomState {
  return {
    ...room,
    currentCommitments: {
      ...room.currentCommitments,
      [currentId]: text,
    },
    updatedAt: Date.now(),
  };
}

export function setWorkshopStage(
  room: RoomState,
  stage: WorkshopStage
): RoomState {
  return {
    ...room,
    workshopStage: stage,
    updatedAt: Date.now(),
  };
}

export function submitWorkshopProposal(
  room: RoomState,
  clientId: string,
  currentId: RithmCurrentId,
  proposalType: WorkshopProposalType = 'general',
  text: string
): RoomState {
  const cleanText = text.trim().slice(0, 140);
  if (!cleanText) {
    return room;
  }

  let updatedRoom = room;
  if (!updatedRoom.participants[clientId]) {
    updatedRoom = joinParticipant(updatedRoom, clientId);
  }

  const now = Date.now();
  const id =
    'wp_' +
    Math.random().toString(36).substring(2, 9) +
    now.toString(36);

  const proposal: WorkshopProposal = {
    id,
    currentId,
    clientId,
    authorName: updatedRoom.participants[clientId].name,
    type: proposalType || 'general',
    text: cleanText,
    endorsements: [],
    createdAt: now,
  };

  let nextIdeaGroups = updatedRoom.workshopIdeaGroups;
  if (nextIdeaGroups && updatedRoom.workshopGroupingStatus === 'grouped') {
    const groupId = `wig_${currentId}_${id}`;
    nextIdeaGroups = {
      ...nextIdeaGroups,
      [groupId]: {
        id: groupId,
        currentId,
        themeTitle: cleanText,
        proposalIds: [id],
        endorsements: [],
        createdAt: now,
      },
    };
  }

  return {
    ...updatedRoom,
    workshopProposals: {
      ...(updatedRoom.workshopProposals || {}),
      [id]: proposal,
    },
    workshopIdeaGroups: nextIdeaGroups,
    updatedAt: now,
  };
}

export function setWorkshopGroupingStatus(
  room: RoomState,
  status: WorkshopGroupingStatus
): RoomState {
  return {
    ...room,
    workshopGroupingStatus: status,
    updatedAt: Date.now(),
  };
}

export function setWorkshopIdeaGroups(
  room: RoomState,
  groups: WorkshopIdeaGroup[],
  status: WorkshopGroupingStatus = 'grouped'
): RoomState {
  const existingGroups = room.workshopIdeaGroups || {};
  const existingById = new Map<string, string[]>();
  const existingByContent = new Map<string, string[]>();

  for (const eg of Object.values(existingGroups)) {
    if (eg.endorsements && eg.endorsements.length > 0) {
      existingById.set(eg.id, eg.endorsements);
      const contentKey = `${eg.currentId}:${[...eg.proposalIds].sort().join(',')}`;
      existingByContent.set(contentKey, eg.endorsements);
    }
  }

  const nextGroups: Record<string, WorkshopIdeaGroup> = {};

  for (const group of groups) {
    const contentKey = `${group.currentId}:${[...group.proposalIds].sort().join(',')}`;
    const preservedEndorsements =
      existingById.get(group.id) || existingByContent.get(contentKey) || [];

    const mergedEndorsements = Array.from(
      new Set([...(group.endorsements || []), ...preservedEndorsements])
    );

    nextGroups[group.id] = {
      ...group,
      endorsements: mergedEndorsements,
    };
  }

  // Cover any proposals in room.workshopProposals that were omitted or submitted during grouping
  if (status === 'grouped') {
    const coveredProposalIds = new Set<string>();
    for (const g of Object.values(nextGroups)) {
      for (const pid of g.proposalIds) {
        coveredProposalIds.add(pid);
      }
    }
    for (const proposal of Object.values(room.workshopProposals || {})) {
      if (!coveredProposalIds.has(proposal.id)) {
        const fallbackGroupId = `wig_${proposal.currentId}_${proposal.id}`;
        const preserved = existingById.get(fallbackGroupId) || [];
        nextGroups[fallbackGroupId] = {
          id: fallbackGroupId,
          currentId: proposal.currentId,
          themeTitle:
            proposal.text.length <= 65
              ? proposal.text
              : proposal.text.slice(0, 62) + '...',
          proposalIds: [proposal.id],
          endorsements: preserved,
          createdAt: proposal.createdAt || Date.now(),
        };
      }
    }
  }

  return {
    ...room,
    workshopIdeaGroups: nextGroups,
    workshopGroupingStatus: status,
    updatedAt: Date.now(),
  };
}

export function toggleProposalEndorsement(
  room: RoomState,
  clientId: string,
  proposalId: string
): RoomState {
  const proposals = room.workshopProposals || {};
  const proposal = proposals[proposalId];
  if (!proposal) {
    return room;
  }

  let updatedRoom = room;
  if (!updatedRoom.participants[clientId]) {
    updatedRoom = joinParticipant(updatedRoom, clientId);
  }

  const endorsements = proposal.endorsements || [];
  const hasEndorsed = endorsements.includes(clientId);
  const nextEndorsements = hasEndorsed
    ? endorsements.filter((id) => id !== clientId)
    : [...endorsements, clientId];

  const now = Date.now();
  const updatedProposal: WorkshopProposal = {
    ...proposal,
    endorsements: nextEndorsements,
  };

  return {
    ...updatedRoom,
    workshopProposals: {
      ...proposals,
      [proposalId]: updatedProposal,
    },
    updatedAt: now,
  };
}

export function toggleGroupEndorsement(
  room: RoomState,
  clientId: string,
  groupId: string
): RoomState {
  const groups = room.workshopIdeaGroups || {};
  const group = groups[groupId];
  if (!group) {
    return room;
  }

  let updatedRoom = room;
  if (!updatedRoom.participants[clientId]) {
    updatedRoom = joinParticipant(updatedRoom, clientId);
  }

  const endorsements = group.endorsements || [];
  const hasEndorsed = endorsements.includes(clientId);
  const nextEndorsements = hasEndorsed
    ? endorsements.filter((id) => id !== clientId)
    : [...endorsements, clientId];

  const now = Date.now();
  const updatedGroup: WorkshopIdeaGroup = {
    ...group,
    endorsements: nextEndorsements,
  };

  return {
    ...updatedRoom,
    workshopIdeaGroups: {
      ...groups,
      [groupId]: updatedGroup,
    },
    updatedAt: now,
  };
}

export function applyInboundMessage(
  room: RoomState,
  msg: ClientInboundMessage
): RoomState {
  switch (msg.type) {
    case 'join':
      return joinParticipant(room, msg.clientId, msg.name);
    case 'vote':
      return recordParticipantVote(
        room,
        msg.clientId,
        msg.scenarioId,
        msg.stance,
        msg.note
      );
    case 'submit_proposal':
      return submitWorkshopProposal(
        room,
        msg.clientId,
        msg.currentId,
        msg.proposalType || 'general',
        msg.text
      );
    case 'toggle_endorsement':
      return toggleProposalEndorsement(
        room,
        msg.clientId,
        msg.proposalId
      );
    case 'toggle_group_endorsement':
      return toggleGroupEndorsement(
        room,
        msg.clientId,
        msg.groupId
      );
    case 'request_state':
      if (room.participants[msg.clientId]) {
        return {
          ...room,
          updatedAt: Date.now(),
          participants: {
            ...room.participants,
            [msg.clientId]: {
              ...room.participants[msg.clientId],
              lastSeenAt: Date.now(),
            },
          },
        };
      }
      return room;
    default:
      return room;
  }
}

const SIMULATED_TEAM = [
  { name: 'Maya', defaultStance: 'support' as Stance, note: 'Speed helps, but only if the relationship was already solid.' },
  { name: 'Devon', defaultStance: 'support' as Stance, note: undefined },
  { name: 'Elena', defaultStance: 'depends' as Stance, note: 'Worried this sets an expectation that we are always on-call.' },
  { name: 'Marcus', defaultStance: 'depends' as Stance, note: 'Hinges entirely on transparency and who controls the prompt.' },
  { name: 'Priya', defaultStance: 'erode' as Stance, note: 'Replaces genuine peer attention with synthetic polish.' },
  { name: 'Sam', defaultStance: 'erode' as Stance, note: undefined },
  { name: 'Lin', defaultStance: 'support' as Stance, note: 'Great for removing repetitive grunt work so we can focus on listening.' },
  { name: 'Tomas', defaultStance: 'depends' as Stance, note: undefined },
  { name: 'Nadia', defaultStance: 'support' as Stance, note: undefined },
  { name: 'Jordan', defaultStance: 'erode' as Stance, note: 'Creates an emotional buffer that keeps us from real vulnerability.' },
];

export function simulateTeamVotesForCurrentScenario(
  room: RoomState,
  count: number = 10
): RoomState {
  const currentCard = room.scenarios[room.currentScenarioIndex];
  if (!currentCard) return room;

  const targetCount = Math.min(count, SIMULATED_TEAM.length);
  const teamSlice = SIMULATED_TEAM.slice(0, targetCount);

  let updatedRoom = room;
  const isTwist =
    updatedRoom.phase === 'twist' ||
    Boolean(updatedRoom.rounds[currentCard.id]?.twistTriggered);

  // First, ensure all simulated team members exist as participants
  for (let i = 0; i < teamSlice.length; i++) {
    const member = teamSlice[i];
    const clientId = `sim-${member.name.toLowerCase()}`;
    if (!updatedRoom.participants[clientId]) {
      updatedRoom = joinParticipant(updatedRoom, clientId, member.name);
    }
  }

  const existingRound = updatedRoom.rounds[currentCard.id];
  const hasExistingVotes =
    existingRound &&
    teamSlice.some((m) => existingRound.votes[`sim-${m.name.toLowerCase()}`]);

  if (isTwist) {
    // If no existing votes were present before entering twist, seed them first
    if (!hasExistingVotes) {
      for (let i = 0; i < teamSlice.length; i++) {
        const member = teamSlice[i];
        const clientId = `sim-${member.name.toLowerCase()}`;
        updatedRoom = recordParticipantVote(
          updatedRoom,
          clientId,
          currentCard.id,
          member.defaultStance,
          member.note
        );
      }
    }

    // Now shift 3 participants' stances to demonstrate the Before -> After migration
    const shiftPlan = [
      {
        idx: 0, // Maya (was support -> depends)
        newStance: 'depends' as Stance,
        twistNote: 'The twist completely changes my take on whether this stays healthy.',
      },
      {
        idx: 2, // Elena (was depends -> erode)
        newStance: 'erode' as Stance,
        twistNote: 'Once that context shifts, it erodes trust entirely.',
      },
      {
        idx: 6, // Lin (was support -> depends)
        newStance: 'depends' as Stance,
        twistNote: 'Now I am much more hesitant about the relational fallout.',
      },
    ];

    for (const shift of shiftPlan) {
      if (shift.idx < teamSlice.length) {
        const member = teamSlice[shift.idx];
        const clientId = `sim-${member.name.toLowerCase()}`;
        updatedRoom = recordParticipantVote(
          updatedRoom,
          clientId,
          currentCard.id,
          shift.newStance,
          shift.twistNote
        );
      }
    }
  } else {
    // Standard initial voting
    for (let i = 0; i < teamSlice.length; i++) {
      const member = teamSlice[i];
      const clientId = `sim-${member.name.toLowerCase()}`;
      updatedRoom = recordParticipantVote(
        updatedRoom,
        clientId,
        currentCard.id,
        member.defaultStance,
        member.note
      );
    }
  }

  return updatedRoom;
}

export function computeStanceTally(
  votes: Record<string, ParticipantVote>,
  useInitial: boolean = false
): StanceTally {
  let support = 0;
  let depends = 0;
  let erode = 0;

  for (const vote of Object.values(votes)) {
    const stance = useInitial ? vote.initialStance : vote.currentStance;
    if (stance === 'support') support++;
    else if (stance === 'depends') depends++;
    else if (stance === 'erode') erode++;
  }

  const total = support + depends + erode;

  return {
    support,
    depends,
    erode,
    total,
    supportPct: total > 0 ? Math.round((support / total) * 100) : 0,
    dependsPct: total > 0 ? Math.round((depends / total) * 100) : 0,
    erodePct: total > 0 ? Math.round((erode / total) * 100) : 0,
  };
}

export function computeTwistShiftDelta(
  round: ScenarioRoundRecord,
  participants: Record<string, Participant>
): TwistShiftDelta {
  const initialTally = computeStanceTally(round.votes, true);
  const currentTally = computeStanceTally(round.votes, false);

  const netShift = {
    support: currentTally.support - initialTally.support,
    depends: currentTally.depends - initialTally.depends,
    erode: currentTally.erode - initialTally.erode,
  };

  const transitions: TwistShiftDelta['transitions'] = [];

  for (const vote of Object.values(round.votes)) {
    if (vote.initialStance !== vote.currentStance) {
      transitions.push({
        clientId: vote.clientId,
        name: participants[vote.clientId]?.name || 'Participant',
        from: vote.initialStance,
        to: vote.currentStance,
      });
    }
  }

  return {
    initialTally,
    currentTally,
    netShift,
    shiftedCount: transitions.length,
    transitions,
  };
}

export function computeCurrentsSynthesis(
  room: RoomState
): CurrentsSynthesisBucket[] {
  const allProposals = Object.values(room.workshopProposals || {});
  const allIdeaGroups = Object.values(room.workshopIdeaGroups || {});

  return RITHM_CURRENTS_LIST.map((currentMeta) => {
    const scenariosForCurrent = room.scenarios.filter(
      (s) => s.currentId === currentMeta.id
    );

    const items: ScenarioSummaryItem[] = scenariosForCurrent.map((scenario) => {
      const round = room.rounds[scenario.id] || {
        scenarioId: scenario.id,
        twistTriggered: false,
        votes: {},
      };
      const tally = computeStanceTally(round.votes, false);
      const delta = computeTwistShiftDelta(round, room.participants);

      let consensusType: ScenarioSummaryItem['consensusType'] = 'unplayed';
      if (tally.total > 0) {
        if (tally.supportPct >= 60) {
          consensusType = 'green_zone';
        } else if (tally.erodePct >= 60) {
          consensusType = 'red_line';
        } else {
          consensusType = 'gray_zone';
        }
      }

      return {
        scenario,
        round,
        tally,
        delta,
        consensusType,
      };
    });

    const playedItems = items.filter((item) => item.tally.total > 0);
    let totalSupport = 0;
    let totalDepends = 0;
    let totalErode = 0;

    for (const item of playedItems) {
      totalSupport += item.tally.support;
      totalDepends += item.tally.depends;
      totalErode += item.tally.erode;
    }

    let dominantStance: Stance | 'mixed' = 'mixed';
    if (playedItems.length > 0) {
      if (totalSupport > totalDepends && totalSupport > totalErode) {
        dominantStance = 'support';
      } else if (totalErode > totalSupport && totalErode > totalDepends) {
        dominantStance = 'erode';
      } else if (totalDepends > totalSupport && totalDepends > totalErode) {
        dominantStance = 'depends';
      } else {
        dominantStance = 'mixed';
      }
    }

    const currentProposals = allProposals
      .filter((p) => p.currentId === currentMeta.id)
      .sort((a, b) => {
        const diff = (b.endorsements?.length || 0) - (a.endorsements?.length || 0);
        if (diff !== 0) return diff;
        return a.createdAt - b.createdAt;
      });

    const currentIdeaGroups = allIdeaGroups
      .filter((g) => g.currentId === currentMeta.id)
      .sort((a, b) => {
        const diff = (b.endorsements?.length || 0) - (a.endorsements?.length || 0);
        if (diff !== 0) return diff;
        return a.createdAt - b.createdAt;
      });

    return {
      current: currentMeta,
      items,
      dominantStance,
      commitmentText: room.currentCommitments[currentMeta.id] || '',
      proposals: currentProposals,
      ideaGroups: currentIdeaGroups,
    };
  });
}

export function formatWorkshopMarkdown(room: RoomState): string {
  const synthesis = computeCurrentsSynthesis(room);
  const totalParticipants = Object.keys(room.participants).length;
  const playedScenarios = room.scenarios.filter(
    (s) => (room.rounds[s.id]?.votes && Object.keys(room.rounds[s.id].votes).length > 0)
  );

  const lines: string[] = [];

  lines.push('# The AI Effect — Workshop Takeaways & Commitments');
  lines.push('');
  lines.push(`- **Room Code:** \`${room.code}\``);
  lines.push(`- **Date:** ${new Date(room.updatedAt).toLocaleDateString()}`);
  lines.push(`- **Participants:** ${totalParticipants}`);
  lines.push(`- **Scenarios Played:** ${playedScenarios.length} of ${room.scenarios.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Executive Summary: Where Our Boundaries Lie');
  lines.push('');

  const greenZones: string[] = [];
  const redLines: string[] = [];
  const grayZones: string[] = [];

  for (const bucket of synthesis) {
    for (const item of bucket.items) {
      if (item.consensusType === 'green_zone') {
        greenZones.push(`- **${item.scenario.title}** (${bucket.current.number}): ${item.tally.supportPct}% Support`);
      } else if (item.consensusType === 'red_line') {
        redLines.push(`- **${item.scenario.title}** (${bucket.current.number}): ${item.tally.erodePct}% Erode`);
      } else if (item.consensusType === 'gray_zone') {
        grayZones.push(`- **${item.scenario.title}** (${bucket.current.number}): Split — ${item.tally.supportPct}% Support / ${item.tally.dependsPct}% Depends / ${item.tally.erodePct}% Erode`);
      }
    }
  }

  lines.push('### Green Zones (Where AI Supports Connection)');
  if (greenZones.length > 0) {
    lines.push(...greenZones);
  } else {
    lines.push('_No unanimous green zones recorded in this session._');
  }
  lines.push('');

  lines.push('### Red Lines (Where AI Erodes Connection)');
  if (redLines.length > 0) {
    lines.push(...redLines);
  } else {
    lines.push('_No unanimous red lines recorded in this session._');
  }
  lines.push('');

  lines.push('### Gray Zones (High Debate & Context-Dependent)');
  if (grayZones.length > 0) {
    lines.push(...grayZones);
  } else {
    lines.push('_No split decisions recorded._');
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Navigating The Four Currents');
  lines.push('');

  for (const bucket of synthesis) {
    lines.push(`### ${bucket.current.number}: ${bucket.current.title}`);
    lines.push(`*${bucket.current.subtitle}*`);
    lines.push('');
    lines.push(`> ${bucket.current.pullDescription}`);
    lines.push('');

    // Proposals / Ideas section
    if (bucket.ideaGroups && bucket.ideaGroups.length > 0) {
      lines.push('#### Brainstorm Ideas & Themes');
      lines.push('');
      const proposalMap = room.workshopProposals || {};
      for (const group of bucket.ideaGroups) {
        const count = group.endorsements?.length || 0;
        lines.push(`- **[+${count}] ${group.themeTitle}**`);
        for (const pid of group.proposalIds) {
          const p = proposalMap[pid];
          if (p) {
            lines.push(`  - "${p.text}" *(${p.authorName})*`);
          }
        }
      }
      lines.push('');
    } else if (bucket.proposals.some((p) => p.type === 'protect' || p.type === 'automate')) {
      const protectProposals = bucket.proposals.filter((p) => p.type === 'protect');
      const automateProposals = bucket.proposals.filter((p) => p.type === 'automate');
      lines.push('#### Team Proposals & Priorities');
      lines.push('');
      lines.push('##### Protect & Build (Human Rituals & Red Lines)');
      if (protectProposals.length > 0) {
        for (const p of protectProposals) {
          const count = p.endorsements?.length || 0;
          lines.push(`- **[+${count}]** ${p.text} *(${p.authorName})*`);
        }
      } else {
        lines.push('_No protect proposals submitted yet._');
      }
      lines.push('');
      lines.push('##### Automate for Time (Gladly Delegate)');
      if (automateProposals.length > 0) {
        for (const p of automateProposals) {
          const count = p.endorsements?.length || 0;
          lines.push(`- **[+${count}]** ${p.text} *(${p.authorName})*`);
        }
      } else {
        lines.push('_No automate proposals submitted yet._');
      }
      lines.push('');
    } else if (bucket.proposals.length > 0) {
      lines.push('#### Team Ideas & Priorities');
      lines.push('');
      for (const p of bucket.proposals) {
        const count = p.endorsements?.length || 0;
        lines.push(`- **[+${count}]** ${p.text} *(${p.authorName})*`);
      }
      lines.push('');
    }

    lines.push('#### Team Norm / Commitment');
    if (bucket.commitmentText.trim()) {
      lines.push(`> **"${bucket.commitmentText.trim()}"**`);
    } else {
      lines.push('_No specific team commitment captured for this current yet._');
    }
    lines.push('');
    lines.push('#### Workshop Prompts');
    lines.push(`- **Flipping the Script:** ${bucket.current.philanthropyPrompt}`);
    lines.push(`- **Protecting Connection:** ${bucket.current.protectPrompt}`);
    lines.push('');

    const playedInBucket = bucket.items.filter((i) => i.tally.total > 0);
    if (playedInBucket.length > 0) {
      lines.push('#### Scenarios Evaluated Under This Current');
      for (const item of playedInBucket) {
        lines.push(`- **${item.scenario.title}** (\`${item.scenario.category}\`)`);
        lines.push(`  - Consensus: **${item.consensusType.replace('_', ' ').toUpperCase()}**`);
        lines.push(`  - Votes: ${item.tally.support} Supports (${item.tally.supportPct}%) | ${item.tally.depends} Depends (${item.tally.dependsPct}%) | ${item.tally.erode} Erodes (${item.tally.erodePct}%)`);
        if (item.delta.shiftedCount > 0) {
          lines.push(`  - **Twist Shift:** ${item.delta.shiftedCount} participant(s) shifted stance under the "What If?" twist.`);
        }
      }
      lines.push('');
    }
    lines.push('');
  }

  return lines.join('\n');
}
