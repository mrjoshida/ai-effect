import { beforeEach, describe, expect, it } from 'vitest';
import { PHILANTHROPY_SCENARIOS } from '../src/content/scenarios';
import {
  ALLITERATIVE_ANIMAL_NAMES,
  ROOM_CODE_ALPHABET,
  addCustomScenario,
  applyInboundMessage,
  clearHostStorageForTesting,
  computeCurrentsSynthesis,
  computeStanceTally,
  computeTwistShiftDelta,
  createRoomState,
  formatWorkshopMarkdown,
  generateAlliterativeAnimalName,
  generateRoomCode,
  getOrCreateClientId,
  joinParticipant,
  loadHostRoomState,
  navigateToScenario,
  recordParticipantVote,
  saveHostRoomState,
  setRoomPhase,
  setWorkshopStage,
  simulateTeamVotesForCurrentScenario,
  submitWorkshopProposal,
  toggleProposalEndorsement,
  triggerScenarioTwist,
  updateCurrentCommitment,
} from '../src/state/roomEngine';
import { ClientInboundMessage, RoomState, ScenarioCard } from '../src/types/game';

describe('Room Engine State Machine & Analytics', () => {
  beforeEach(() => {
    clearHostStorageForTesting();
  });

  describe('Room Code & Client ID Generation', () => {
    it('generates 4-character codes using only unambiguous alphabet (no 0/O, 1/I)', () => {
      for (let i = 0; i < 20; i++) {
        const code = generateRoomCode();
        expect(code).toHaveLength(4);
        for (const char of code) {
          expect(ROOM_CODE_ALPHABET).toContain(char);
          expect(['0', 'O', '1', 'I']).not.toContain(char);
        }
      }
    });

    it('generates or retrieves a persistent client ID', () => {
      const id1 = getOrCreateClientId();
      expect(id1).toMatch(/^c_[a-z0-9]+/);
      const id2 = getOrCreateClientId();
      expect(id2).toBe(id1);
    });
  });

  describe('Room Creation & Host Storage', () => {
    it('creates initial room in lobby phase with all 4 current commitments initialized', () => {
      const room = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 3), 'TEST');
      expect(room.code).toBe('TEST');
      expect(room.phase).toBe('lobby');
      expect(room.currentScenarioIndex).toBe(0);
      expect(room.scenarios).toHaveLength(3);
      expect(room.participants).toEqual({});
      expect(room.rounds).toEqual({});
      expect(room.currentCommitments).toEqual({
        'current-01': '',
        'current-02': '',
        'current-03': '',
        'current-04': '',
      });
    });

    it('persists and retrieves room state from host storage', () => {
      const room = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 2), 'SAVE');
      saveHostRoomState(room);

      const loaded = loadHostRoomState('SAVE');
      expect(loaded).not.toBeNull();
      expect(loaded?.code).toBe('SAVE');
      expect(loaded?.scenarios).toHaveLength(2);

      const notFound = loadHostRoomState('NONEXISTENT');
      expect(notFound).toBeNull();
    });
  });

  describe('Participant Management', () => {
    it('joins new participants with pebbleVariant cycling 0..4 and assigns alliterative animal name when unnamed', () => {
      let room = createRoomState();
      room = joinParticipant(room, 'client-1', 'Alice');
      room = joinParticipant(room, 'client-2', 'Bob');
      room = joinParticipant(room, 'client-3');

      expect(room.participants['client-1'].name).toBe('Alice');
      expect(room.participants['client-1'].pebbleVariant).toBe(0);
      expect(room.participants['client-2'].name).toBe('Bob');
      expect(room.participants['client-2'].pebbleVariant).toBe(1);

      const p3Name = room.participants['client-3'].name;
      expect(p3Name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(ALLITERATIVE_ANIMAL_NAMES).toContain(p3Name);
      expect(room.participants['client-3'].pebbleVariant).toBe(2);
    });

    it('assigns distinct alliterative animal names to multiple unnamed participants in the same room', () => {
      let room = createRoomState();
      for (let i = 0; i < 10; i++) {
        room = joinParticipant(room, `guest-${i}`);
      }

      const names = Object.values(room.participants).map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(10);
      for (const name of names) {
        expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
        expect(ALLITERATIVE_ANIMAL_NAMES).toContain(name);
      }
    });

    it('generates deterministic alliterative animal name for same seed and steps forward when taken', () => {
      const name1 = generateAlliterativeAnimalName('seed-alpha');
      const name2 = generateAlliterativeAnimalName('seed-alpha');
      expect(name1).toBe(name2);

      const name3 = generateAlliterativeAnimalName('seed-alpha', [name1]);
      expect(name3).not.toBe(name1);
      expect(ALLITERATIVE_ANIMAL_NAMES).toContain(name3);
    });

    it('updates lastSeenAt and name when existing participant rejoins', () => {
      let room = createRoomState();
      room = joinParticipant(room, 'client-1', 'Alice');
      const initialJoinedAt = room.participants['client-1'].joinedAt;

      room = joinParticipant(room, 'client-1', 'Alice Renamed');
      expect(room.participants['client-1'].name).toBe('Alice Renamed');
      expect(room.participants['client-1'].joinedAt).toBe(initialJoinedAt);
      expect(Object.keys(room.participants)).toHaveLength(1);
    });
  });

  describe('Voting & "What If?" Twist Shifts', () => {
    it('records initial vote matching initialStance and currentStance', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'voting');
      room = recordParticipantVote(room, 'c1', 'cw-kudos', 'support', 'Great idea');

      const round = room.rounds['cw-kudos'];
      expect(round).toBeDefined();
      expect(round.votes['c1']).toBeDefined();
      expect(round.votes['c1'].initialStance).toBe('support');
      expect(round.votes['c1'].currentStance).toBe('support');
      expect(round.votes['c1'].shiftedInTwist).toBe(false);
      expect(round.votes['c1'].note).toBe('Great idea');
    });

    it('preserves initialStance and marks shiftedInTwist when participant shifts in twist phase', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'voting');
      room = recordParticipantVote(room, 'c1', 'cw-kudos', 'support', 'Initial note');

      // Trigger twist
      room = triggerScenarioTwist(room);
      expect(room.phase).toBe('twist');
      expect(room.rounds['cw-kudos'].twistTriggered).toBe(true);

      // Participant shifts from support to depends
      room = recordParticipantVote(room, 'c1', 'cw-kudos', 'depends', 'Shifted note');

      const vote = room.rounds['cw-kudos'].votes['c1'];
      expect(vote.initialStance).toBe('support');
      expect(vote.currentStance).toBe('depends');
      expect(vote.shiftedInTwist).toBe(true);
      expect(vote.note).toBe('Shifted note');
    });

    it('marks shiftedInTwist: false if participant reaffirms same stance in twist phase', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'voting');
      room = recordParticipantVote(room, 'c1', 'cw-kudos', 'support');

      room = triggerScenarioTwist(room);
      room = recordParticipantVote(room, 'c1', 'cw-kudos', 'support');

      const vote = room.rounds['cw-kudos'].votes['c1'];
      expect(vote.initialStance).toBe('support');
      expect(vote.currentStance).toBe('support');
      expect(vote.shiftedInTwist).toBe(false);
    });

    it('handles late voter voting for the first time during twist phase', () => {
      let room = createRoomState();
      room = triggerScenarioTwist(room);
      room = recordParticipantVote(room, 'late-voter', 'cw-kudos', 'erode');

      const vote = room.rounds['cw-kudos'].votes['late-voter'];
      expect(vote.initialStance).toBe('erode');
      expect(vote.currentStance).toBe('erode');
      expect(vote.shiftedInTwist).toBe(false);
    });
  });

  describe('Phase, Navigation & Custom Scenarios', () => {
    it('navigates to next scenario and resets phase to voting', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'revealed');
      room = navigateToScenario(room, 2);

      expect(room.currentScenarioIndex).toBe(2);
      expect(room.phase).toBe('voting');
    });

    it('clamps navigation index within bounds', () => {
      let room = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 3));
      room = navigateToScenario(room, 100);
      expect(room.currentScenarioIndex).toBe(2);

      room = navigateToScenario(room, -5);
      expect(room.currentScenarioIndex).toBe(0);
    });

    it('allows adding custom scenarios to the room deck', () => {
      let room = createRoomState();
      const initialCount = room.scenarios.length;

      room = addCustomScenario(room, {
        category: 'coworkers',
        currentId: 'current-04',
        title: 'Custom Dilemma',
        mobileSummary: 'A custom dilemma test.',
        prompt: 'Full prompt for custom dilemma.',
        twist: 'Custom twist.',
        discussionQuestion: 'Custom question?',
      });

      expect(room.scenarios).toHaveLength(initialCount + 1);
      const added = room.scenarios[room.scenarios.length - 1];
      expect(added.id).toMatch(/^custom-/);
      expect(added.title).toBe('Custom Dilemma');
    });

    it('updates current commitment text', () => {
      let room = createRoomState();
      room = updateCurrentCommitment(
        room,
        'current-04',
        'Always require human signoff for outbound grantee feedback'
      );
      expect(room.currentCommitments['current-04']).toBe(
        'Always require human signoff for outbound grantee feedback'
      );
    });
  });

  describe('Inbound Message Dispatcher', () => {
    it('applies join, vote, and request_state inbound messages', () => {
      let room = createRoomState();

      const joinMsg: ClientInboundMessage = {
        type: 'join',
        code: room.code,
        clientId: 'c100',
        name: 'Carlos',
        timestamp: Date.now(),
      };
      room = applyInboundMessage(room, joinMsg);
      expect(room.participants['c100'].name).toBe('Carlos');

      const voteMsg: ClientInboundMessage = {
        type: 'vote',
        code: room.code,
        clientId: 'c100',
        scenarioId: room.scenarios[0].id,
        stance: 'depends',
        note: 'Context matters',
        timestamp: Date.now(),
      };
      room = applyInboundMessage(room, voteMsg);
      expect(room.rounds[room.scenarios[0].id].votes['c100'].currentStance).toBe(
        'depends'
      );

      const requestMsg: ClientInboundMessage = {
        type: 'request_state',
        code: room.code,
        clientId: 'c100',
        timestamp: Date.now(),
      };
      const roomAfterRequest = applyInboundMessage(room, requestMsg);
      expect(roomAfterRequest).toBeDefined();
    });
  });

  describe('Simulate Team Votes & Twist Migration', () => {
    it('generates 10 realistic philanthropy participants with varied stances and notes', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'voting');
      room = simulateTeamVotesForCurrentScenario(room, 10);

      const currentScenario = room.scenarios[0];
      const round = room.rounds[currentScenario.id];
      expect(round).toBeDefined();

      const votes = Object.values(round.votes);
      expect(votes).toHaveLength(10);

      // Verify varied stances
      const tally = computeStanceTally(round.votes);
      expect(tally.support).toBeGreaterThan(0);
      expect(tally.depends).toBeGreaterThan(0);
      expect(tally.erode).toBeGreaterThan(0);
      expect(tally.total).toBe(10);

      // Verify realistic notes were generated for at least 4 participants
      const notes = votes.filter((v) => v.note && v.note.length > 10);
      expect(notes.length).toBeGreaterThanOrEqual(4);

      // Verify participant names exist
      expect(room.participants['sim-maya'].name).toBe('Maya');
      expect(room.participants['sim-devon'].name).toBe('Devon');
    });

    it('shifts 3 participants when called in twist phase to demonstrate migration', () => {
      let room = createRoomState();
      room = setRoomPhase(room, 'voting');
      // Step 1: Initial simulation
      room = simulateTeamVotesForCurrentScenario(room, 10);

      const currentScenario = room.scenarios[0];
      const initialTally = computeStanceTally(room.rounds[currentScenario.id].votes);

      // Step 2: Trigger twist and re-run simulation
      room = triggerScenarioTwist(room);
      room = simulateTeamVotesForCurrentScenario(room, 10);

      const roundAfterTwist = room.rounds[currentScenario.id];
      const delta = computeTwistShiftDelta(roundAfterTwist, room.participants);

      expect(delta.shiftedCount).toBe(3);
      expect(delta.transitions).toHaveLength(3);

      for (const transition of delta.transitions) {
        expect(transition.from).not.toBe(transition.to);
        expect(transition.name).toBeTruthy();
      }

      // Initial tally is preserved
      expect(delta.initialTally.total).toBe(10);
      expect(delta.currentTally.total).toBe(10);
      expect(delta.initialTally.support).toBe(initialTally.support);
    });
  });

  describe('Stance Tally, Twist Delta & Currents Synthesis', () => {
    it('computes exact stance tally counts and rounded percentages', () => {
      const votes = {
        c1: { clientId: 'c1', initialStance: 'support', currentStance: 'support', updatedAt: 1 },
        c2: { clientId: 'c2', initialStance: 'support', currentStance: 'support', updatedAt: 1 },
        c3: { clientId: 'c3', initialStance: 'depends', currentStance: 'depends', updatedAt: 1 },
        c4: { clientId: 'c4', initialStance: 'erode', currentStance: 'erode', updatedAt: 1 },
      } as Record<string, any>;

      const tally = computeStanceTally(votes);
      expect(tally.total).toBe(4);
      expect(tally.support).toBe(2);
      expect(tally.depends).toBe(1);
      expect(tally.erode).toBe(1);
      expect(tally.supportPct).toBe(50);
      expect(tally.dependsPct).toBe(25);
      expect(tally.erodePct).toBe(25);
    });

    it('synthesizes workshop data across all 4 Currents', () => {
      let room = createRoomState();
      // Vote on scenario 0 (cw-kudos, current-01)
      room = recordParticipantVote(room, 'c1', room.scenarios[0].id, 'support');
      room = recordParticipantVote(room, 'c2', room.scenarios[0].id, 'support');
      room = updateCurrentCommitment(room, 'current-01', 'Protect authentic praise');

      const synthesis = computeCurrentsSynthesis(room);
      expect(synthesis).toHaveLength(4);

      const current1Bucket = synthesis.find((b) => b.current.id === 'current-01');
      expect(current1Bucket).toBeDefined();
      expect(current1Bucket?.commitmentText).toBe('Protect authentic praise');
      expect(current1Bucket?.dominantStance).toBe('support');

      const item = current1Bucket?.items.find((i) => i.scenario.id === room.scenarios[0].id);
      expect(item?.consensusType).toBe('green_zone'); // 100% support
    });

    it('generates rich workshop markdown export', () => {
      let room = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 4), 'RPT');
      room = recordParticipantVote(room, 'c1', room.scenarios[0].id, 'support');
      room = recordParticipantVote(room, 'c2', room.scenarios[0].id, 'erode');
      room = updateCurrentCommitment(room, 'current-01', 'Never automate heartfelt praise');

      const md = formatWorkshopMarkdown(room);
      expect(md).toContain('# The AI Effect — Workshop Takeaways & Commitments');
      expect(md).toContain('`RPT`');
      expect(md).toContain('Current 01: Our sense of trust');
      expect(md).toContain('Never automate heartfelt praise');
      expect(md).toContain('Flipping the Script');
      expect(md).toContain('Protecting Connection');
    });
  });

  describe('Multi-User Currents Workshop State & Proposals', () => {
    it('initializes workshopStage to small_groups and workshopProposals to empty record', () => {
      const room = createRoomState();
      expect(room.workshopStage).toBe('small_groups');
      expect(room.workshopProposals).toEqual({});
    });

    it('updates workshopStage with setWorkshopStage', () => {
      let room = createRoomState();
      room = setWorkshopStage(room, 'large_group');
      expect(room.workshopStage).toBe('large_group');
    });

    it('submits a proposal, trimming text and assigning authorName and id', () => {
      let room = createRoomState();
      room = joinParticipant(room, 'c1', 'Curious Capybara');
      room = submitWorkshopProposal(
        room,
        'c1',
        'current-01',
        'protect',
        '  Never use AI to draft peer recognition notes  '
      );

      const proposals = Object.values(room.workshopProposals || {});
      expect(proposals).toHaveLength(1);
      const prop = proposals[0];
      expect(prop.id).toMatch(/^wp_/);
      expect(prop.text).toBe('Never use AI to draft peer recognition notes');
      expect(prop.currentId).toBe('current-01');
      expect(prop.type).toBe('protect');
      expect(prop.clientId).toBe('c1');
      expect(prop.authorName).toBe('Curious Capybara');
      expect(prop.endorsements).toEqual([]);
    });

    it('caps proposal text at 140 characters and ignores empty text', () => {
      let room = createRoomState();
      const longText = 'a'.repeat(200);
      room = submitWorkshopProposal(room, 'c1', 'current-02', 'automate', longText);

      const proposals = Object.values(room.workshopProposals || {});
      expect(proposals).toHaveLength(1);
      expect(proposals[0].text).toHaveLength(140);

      // Empty submission returns room unchanged
      const roomBefore = room;
      const roomAfter = submitWorkshopProposal(room, 'c1', 'current-02', 'automate', '   ');
      expect(roomAfter).toBe(roomBefore);
    });

    it('toggles proposal endorsements on and off', () => {
      let room = createRoomState();
      room = submitWorkshopProposal(room, 'c1', 'current-03', 'protect', 'Read original quotes');
      const propId = Object.keys(room.workshopProposals || {})[0];

      // Endorse
      room = toggleProposalEndorsement(room, 'c2', propId);
      expect(room.workshopProposals?.[propId].endorsements).toContain('c2');

      // Toggle off
      room = toggleProposalEndorsement(room, 'c2', propId);
      expect(room.workshopProposals?.[propId].endorsements).not.toContain('c2');

      // Toggle non-existent proposal returns room unchanged
      const roomSame = toggleProposalEndorsement(room, 'c2', 'non-existent');
      expect(roomSame).toBe(room);
    });

    it('handles submit_proposal and toggle_endorsement via applyInboundMessage', () => {
      let room = createRoomState();
      room = applyInboundMessage(room, {
        type: 'submit_proposal',
        code: room.code,
        clientId: 'c1',
        currentId: 'current-04',
        proposalType: 'automate',
        text: 'Automate calendar scheduling',
        timestamp: Date.now(),
      });

      const propId = Object.keys(room.workshopProposals || {})[0];
      expect(propId).toBeDefined();
      expect(room.workshopProposals?.[propId].text).toBe('Automate calendar scheduling');

      room = applyInboundMessage(room, {
        type: 'toggle_endorsement',
        code: room.code,
        clientId: 'c2',
        proposalId: propId,
        timestamp: Date.now(),
      });

      expect(room.workshopProposals?.[propId].endorsements).toContain('c2');
    });

    it('sorts proposals by endorsement count descending and createdAt ascending in synthesis', () => {
      let room = createRoomState();
      // Add three proposals to current-01
      room = submitWorkshopProposal(room, 'c1', 'current-01', 'protect', 'Proposal A (0 endorsements)');
      const propAId = Object.keys(room.workshopProposals || {})[0];

      room = submitWorkshopProposal(room, 'c2', 'current-01', 'automate', 'Proposal B (2 endorsements)');
      const propBId = Object.keys(room.workshopProposals || {})[1];

      room = submitWorkshopProposal(room, 'c3', 'current-01', 'protect', 'Proposal C (1 endorsement)');
      const propCId = Object.keys(room.workshopProposals || {})[2];

      room = toggleProposalEndorsement(room, 'v1', propBId);
      room = toggleProposalEndorsement(room, 'v2', propBId);
      room = toggleProposalEndorsement(room, 'v1', propCId);

      const synthesis = computeCurrentsSynthesis(room);
      const c1Bucket = synthesis.find((b) => b.current.id === 'current-01');
      expect(c1Bucket).toBeDefined();
      expect(c1Bucket?.proposals).toHaveLength(3);
      expect(c1Bucket?.proposals[0].id).toBe(propBId);
      expect(c1Bucket?.proposals[1].id).toBe(propCId);
      expect(c1Bucket?.proposals[2].id).toBe(propAId);
    });

    it('formats submitted proposals into markdown export grouped by protect and automate', () => {
      let room = createRoomState();
      room = joinParticipant(room, 'c1', 'Curious Capybara');
      room = joinParticipant(room, 'c2', 'Dapper Dolphin');
      room = submitWorkshopProposal(
        room,
        'c1',
        'current-01',
        'protect',
        'Never use AI to draft peer recognition notes'
      );
      const propId = Object.keys(room.workshopProposals || {})[0];
      room = toggleProposalEndorsement(room, 'c2', propId);

      room = submitWorkshopProposal(
        room,
        'c2',
        'current-01',
        'automate',
        'Draft calendar coordination emails'
      );

      const md = formatWorkshopMarkdown(room);
      expect(md).toContain('#### Team Proposals & Priorities');
      expect(md).toContain('##### Protect & Build (Human Rituals & Red Lines)');
      expect(md).toContain('- **[+1]** Never use AI to draft peer recognition notes *(Curious Capybara)*');
      expect(md).toContain('##### Automate for Time (Gladly Delegate)');
      expect(md).toContain('- **[+0]** Draft calendar coordination emails *(Dapper Dolphin)*');
    });
  });
});
