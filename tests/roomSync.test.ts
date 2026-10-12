import { afterEach, describe, expect, it, vi } from 'vitest';
import { PHILANTHROPY_SCENARIOS } from '../src/content/scenarios';
import {
  applyInboundMessage,
  createRoomState,
  joinParticipant,
  navigateToScenario,
  recordParticipantVote,
  setWorkshopIdeaGroups,
} from '../src/state/roomEngine';
import { ClientInboundMessage, RoomState } from '../src/types/game';
import { buildJoinUrl, generateJoinQrSvg } from '../src/utils/qrCode';
import {
  ClientRoomChannel,
  HostRoomChannel,
  createClientChannel,
  createHostChannel,
} from '../src/utils/roomSync';

describe('Room Synchronization & QR Code', () => {
  const activeChannels: Array<HostRoomChannel | ClientRoomChannel> = [];

  afterEach(() => {
    while (activeChannels.length > 0) {
      const ch = activeChannels.pop();
      try {
        ch?.destroy();
      } catch {
        // ignore
      }
    }
  });

  describe('QR Code Generation & Join URL', () => {
    it('builds clean join URL preserving room code', () => {
      const url = buildJoinUrl('warm');
      expect(url).toContain('code=WARM');
    });

    it('generates valid inline SVG for QR code', async () => {
      const url = 'https://example.com/ai-effect/?code=WARM';
      const svg = await generateJoinQrSvg(url);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('#1F1C18'); // Custom dark color
    });
  });

  describe('Host and Client Channel Synchronization', () => {
    it('syncs initial state from Host to Client upon client connection', () => {
      const code = 'SYNC1';
      const initialState = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 2), code);

      const hostInbound = vi.fn();
      const hostChannel = createHostChannel(code, initialState, hostInbound);
      activeChannels.push(hostChannel);

      const clientStateUpdates: RoomState[] = [];
      const clientChannel = createClientChannel(
        code,
        'client-a',
        (state) => clientStateUpdates.push(state)
      );
      activeChannels.push(clientChannel);

      expect(clientStateUpdates.length).toBeGreaterThan(0);
      const received = clientStateUpdates[clientStateUpdates.length - 1];
      expect(received.code).toBe(code);
      expect(received.scenarios).toHaveLength(2);
    });

    it('relays sendJoin from Client to Host', () => {
      const code = 'SYNC2';
      const initialState = createRoomState([], code);

      const receivedMessages: ClientInboundMessage[] = [];
      const hostChannel = createHostChannel(code, initialState, (msg) => {
        receivedMessages.push(msg);
      });
      activeChannels.push(hostChannel);

      const clientChannel = createClientChannel(code, 'client-b', () => {});
      activeChannels.push(clientChannel);

      clientChannel.sendJoin('Taylor');

      expect(receivedMessages.length).toBeGreaterThan(0);
      const receivedMsg = receivedMessages[receivedMessages.length - 1];
      expect(receivedMsg.type).toBe('join');
      expect(receivedMsg.clientId).toBe('client-b');
      if (receivedMsg.type === 'join') {
        expect(receivedMsg.name).toBe('Taylor');
      }
    });

    it('relays sendVote from Client to Host', () => {
      const code = 'SYNC3';
      const initialState = createRoomState([], code);

      const receivedVotes: ClientInboundMessage[] = [];
      const hostChannel = createHostChannel(code, initialState, (msg) => {
        if (msg.type === 'vote') {
          receivedVotes.push(msg);
        }
      });
      activeChannels.push(hostChannel);

      const clientChannel = createClientChannel(code, 'client-c', () => {});
      activeChannels.push(clientChannel);

      clientChannel.sendVote('cw-kudos', 'support', 'Essential for morale');

      expect(receivedVotes.length).toBeGreaterThan(0);
      const receivedVote = receivedVotes[receivedVotes.length - 1];
      expect(receivedVote.type).toBe('vote');
      if (receivedVote.type === 'vote') {
        expect(receivedVote.scenarioId).toBe('cw-kudos');
        expect(receivedVote.stance).toBe('support');
        expect(receivedVote.note).toBe('Essential for morale');
      }
    });

    it('pushes updated state from Host to multiple connected Clients', () => {
      const code = 'SYNC4';
      let state = createRoomState([], code);

      const hostChannel = createHostChannel(code, state, () => {});
      activeChannels.push(hostChannel);

      const client1States: RoomState[] = [];
      const client2States: RoomState[] = [];

      const client1 = createClientChannel(code, 'c1', (s) => client1States.push(s));
      const client2 = createClientChannel(code, 'c2', (s) => client2States.push(s));
      activeChannels.push(client1, client2);

      // Host records a vote and publishes state
      state = joinParticipant(state, 'c1', 'Client One');
      state = recordParticipantVote(state, 'c1', state.scenarios[0].id, 'depends');
      hostChannel.publishState(state);

      const latest1 = client1States[client1States.length - 1];
      const latest2 = client2States[client2States.length - 1];

      expect(latest1.rounds[state.scenarios[0].id]?.votes['c1']?.currentStance).toBe(
        'depends'
      );
      expect(latest2.rounds[state.scenarios[0].id]?.votes['c1']?.currentStance).toBe(
        'depends'
      );
    });

    it('isolates rooms with different room codes', () => {
      const codeRoom1 = 'ROOM1';
      const codeRoom2 = 'ROOM2';

      const state1 = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 1), codeRoom1);
      const state2 = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 3), codeRoom2);

      const host1 = createHostChannel(codeRoom1, state1, () => {});
      const host2 = createHostChannel(codeRoom2, state2, () => {});
      activeChannels.push(host1, host2);

      const client1States: RoomState[] = [];
      const client1 = createClientChannel(codeRoom1, 'c-room1', (s) =>
        client1States.push(s)
      );
      activeChannels.push(client1);

      // Only state for ROOM1 should be received by client1
      for (const s of client1States) {
        expect(s.code).toBe(codeRoom1);
      }
    });

    it('provides valid sync connection status', () => {
      const code = 'STATUS1';
      const host = createHostChannel(code, createRoomState([], code), () => {});
      const client = createClientChannel(code, 'c-status', () => {});
      activeChannels.push(host, client);

      const validStatuses = ['connected', 'local_only', 'connecting', 'reconnecting'];
      expect(validStatuses).toContain(host.getStatus());
      expect(validStatuses).toContain(client.getStatus());
    });

    it('stops receiving updates after destroy() is invoked', () => {
      const code = 'DESTROY1';
      let state = createRoomState([], code);
      const host = createHostChannel(code, state, () => {});
      activeChannels.push(host);

      const received: RoomState[] = [];
      const client = createClientChannel(code, 'c-destroy', (s) => received.push(s));

      const countBefore = received.length;
      client.destroy();

      state = recordParticipantVote(state, 'dummy', state.scenarios[0].id, 'erode');
      host.publishState(state);

      expect(received.length).toBe(countBefore);
    });

    it('updates Host and Client in lockstep when MobilePreviewDrawer sends a vote', () => {
      const code = 'LOCKSTEP';
      let hostRoomState = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 3), code);

      let hostChannel: HostRoomChannel;
      hostChannel = createHostChannel(code, hostRoomState, (inboundMsg) => {
        hostRoomState = applyInboundMessage(hostRoomState, inboundMsg);
        hostChannel.publishState(hostRoomState);
      });
      activeChannels.push(hostChannel);

      let clientRoomState: RoomState | undefined = undefined;
      const previewClientId = 'preview_' + code.toLowerCase();
      const clientChannel = createClientChannel(
        code,
        previewClientId,
        (updated) => {
          clientRoomState = updated;
        }
      );
      activeChannels.push(clientChannel);

      const getClientState = (): RoomState => {
        expect(clientRoomState).toBeDefined();
        return clientRoomState!;
      };

      // Verify client initial state is present
      expect(getClientState().code).toBe(code);

      // Client joins
      clientChannel.sendJoin('Demo Voter');
      expect(hostRoomState.participants[previewClientId]?.name).toBe('Demo Voter');
      expect(getClientState().participants[previewClientId]?.name).toBe('Demo Voter');

      // Client votes on the active scenario
      const activeScenarioId = hostRoomState.scenarios[0].id;
      clientChannel.sendVote(activeScenarioId, 'support', 'Testing lockstep vote');

      // Assert that both Host and Client have the exact same vote recorded in lockstep
      const hostVote = hostRoomState.rounds[activeScenarioId]?.votes[previewClientId];
      const clientVote = getClientState().rounds[activeScenarioId]?.votes[previewClientId];

      expect(hostVote).toBeDefined();
      expect(hostVote?.currentStance).toBe('support');
      expect(hostVote?.note).toBe('Testing lockstep vote');

      expect(clientVote).toBeDefined();
      expect(clientVote?.currentStance).toBe('support');
      expect(clientVote?.note).toBe('Testing lockstep vote');

      // Host advances to next scenario
      hostRoomState = navigateToScenario(hostRoomState, 1);
      hostChannel.publishState(hostRoomState);

      expect(getClientState().currentScenarioIndex).toBe(1);
      const nextScenarioId = hostRoomState.scenarios[1].id;
      // New scenario has no votes yet
      expect(getClientState().rounds[nextScenarioId]?.votes[previewClientId]).toBeUndefined();
    });

    it('relays sendProposal and sendToggleEndorsement between Client and Host', () => {
      const code = 'PROPOSAL_SYNC';
      let hostRoomState = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 2), code);

      let hostChannel: HostRoomChannel;
      hostChannel = createHostChannel(code, hostRoomState, (inboundMsg) => {
        hostRoomState = applyInboundMessage(hostRoomState, inboundMsg);
        hostChannel.publishState(hostRoomState);
      });
      activeChannels.push(hostChannel);

      let clientRoomState: RoomState | undefined = undefined;
      const clientChannel = createClientChannel(
        code,
        'client-props',
        (updated) => {
          clientRoomState = updated;
        }
      );
      activeChannels.push(clientChannel);

      // Join client
      clientChannel.sendJoin('Kindly Koala');

      // Submit proposal
      clientChannel.sendProposal(
        'current-01',
        'protect',
        'Handwrite milestone congratulations'
      );

      expect(clientRoomState).toBeDefined();
      const proposals = Object.values(clientRoomState!.workshopProposals || {});
      expect(proposals).toHaveLength(1);
      const prop = proposals[0];
      expect(prop.text).toBe('Handwrite milestone congratulations');
      expect(prop.type).toBe('protect');
      expect(prop.currentId).toBe('current-01');
      expect(prop.endorsements).toEqual([]);

      // Second client endorses proposal
      let client2State: RoomState | undefined = undefined;
      const client2 = createClientChannel(code, 'client-endorser', (updated) => {
        client2State = updated;
      });
      activeChannels.push(client2);

      client2.sendToggleEndorsement(prop.id);

      expect(client2State).toBeDefined();
      expect(client2State!.workshopProposals?.[prop.id].endorsements).toContain('client-endorser');
      expect(clientRoomState!.workshopProposals?.[prop.id].endorsements).toContain('client-endorser');
      expect(hostRoomState.workshopProposals?.[prop.id].endorsements).toContain('client-endorser');
    });

    it('propagates participant presence and group endorsements via sendJoin and sendToggleGroupEndorsement', () => {
      const code = 'GROUP_SYNC';
      let hostRoomState = createRoomState(PHILANTHROPY_SCENARIOS.slice(0, 2), code);

      let hostChannel: HostRoomChannel;
      hostChannel = createHostChannel(code, hostRoomState, (inboundMsg) => {
        hostRoomState = applyInboundMessage(hostRoomState, inboundMsg);
        hostChannel.publishState(hostRoomState);
      });
      activeChannels.push(hostChannel);

      let client1State: RoomState | undefined = undefined;
      const client1 = createClientChannel(code, 'c-group-1', (s) => {
        client1State = s;
      });
      activeChannels.push(client1);

      let client2State: RoomState | undefined = undefined;
      const client2 = createClientChannel(code, 'c-group-2', (s) => {
        client2State = s;
      });
      activeChannels.push(client2);

      const getClient1 = (): RoomState => {
        expect(client1State).toBeDefined();
        return client1State!;
      };
      const getClient2 = (): RoomState => {
        expect(client2State).toBeDefined();
        return client2State!;
      };

      // Client 1 sends join
      client1.sendJoin('Joyful Jaguar');
      expect(hostRoomState.participants['c-group-1']?.name).toBe('Joyful Jaguar');
      expect(getClient1().participants?.['c-group-1']?.name).toBe('Joyful Jaguar');
      expect(getClient2().participants?.['c-group-1']?.name).toBe('Joyful Jaguar');

      // Host sets up a group
      const sampleGroupId = 'wig_current-01_99';
      hostRoomState = setWorkshopIdeaGroups(
        hostRoomState,
        [
          {
            id: sampleGroupId,
            currentId: 'current-01',
            themeTitle: 'Shared Recognition',
            proposalIds: [],
            endorsements: [],
            createdAt: Date.now(),
          },
        ],
        'grouped'
      );
      hostChannel.publishState(hostRoomState);

      expect(getClient1().workshopIdeaGroups?.[sampleGroupId]).toBeDefined();

      // Client 2 toggles endorsement on group
      client2.sendToggleGroupEndorsement(sampleGroupId);

      expect(hostRoomState.workshopIdeaGroups?.[sampleGroupId].endorsements).toContain('c-group-2');
      expect(getClient1().workshopIdeaGroups?.[sampleGroupId]?.endorsements).toContain('c-group-2');
      expect(getClient2().workshopIdeaGroups?.[sampleGroupId]?.endorsements).toContain('c-group-2');
    });
  });
});
