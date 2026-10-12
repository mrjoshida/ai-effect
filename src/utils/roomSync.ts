import mqtt, { MqttClient } from 'mqtt';
import {
  ClientInboundMessage,
  RithmCurrentId,
  RoomState,
  Stance,
  SyncConnectionStatus,
  WorkshopProposalType,
} from '../types/game';

export interface HostRoomChannel {
  publishState: (state: RoomState) => void;
  getStatus: () => SyncConnectionStatus;
  destroy: () => void;
}

export interface ClientRoomChannel {
  sendJoin: (name?: string) => void;
  sendVote: (scenarioId: string, stance: Stance, note?: string) => void;
  sendProposal: (
    currentId: RithmCurrentId,
    proposalType: WorkshopProposalType | undefined,
    text: string
  ) => void;
  sendToggleEndorsement: (proposalId: string) => void;
  sendToggleGroupEndorsement: (groupId: string) => void;
  requestState: () => void;
  getStatus: () => SyncConnectionStatus;
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Layer 1: In-Memory Same-Page Event Bus (for same-window Preview Drawer & tests)
// ---------------------------------------------------------------------------

type StateListener = (state: RoomState) => void;
type InboundListener = (msg: ClientInboundMessage) => void;

interface RoomListeners {
  stateListeners: Set<StateListener>;
  inboundListeners: Set<InboundListener>;
  latestState?: RoomState;
}

const inMemoryBus = new Map<string, RoomListeners>();

function getOrCreateRoomBus(code: string): RoomListeners {
  let bus = inMemoryBus.get(code);
  if (!bus) {
    bus = {
      stateListeners: new Set(),
      inboundListeners: new Set(),
    };
    inMemoryBus.set(code, bus);
  }
  return bus;
}

const PRIMARY_MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
const FALLBACK_MQTT_BROKER = 'wss://broker.hivemq.com:8884/mqtt';

function isBrowserEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  // If running under Vitest / Node test runner without explicit live testing, keep local
  if (
    typeof process !== 'undefined' &&
    (process.env?.NODE_ENV === 'test' || process.env?.VITEST)
  ) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Host Channel Implementation
// ---------------------------------------------------------------------------

export function createHostChannel(
  code: string,
  initialState: RoomState,
  onInbound: (msg: ClientInboundMessage) => void,
  onStatusChange?: (status: SyncConnectionStatus) => void
): HostRoomChannel {
  const cleanCode = code.trim().toUpperCase();
  let currentStatus: SyncConnectionStatus = isBrowserEnvironment()
    ? 'connecting'
    : 'local_only';

  const updateStatus = (next: SyncConnectionStatus) => {
    if (currentStatus !== next) {
      currentStatus = next;
      onStatusChange?.(next);
    }
  };

  // Recent message deduplication cache
  const recentInboundIds = new Map<string, number>();
  const isDuplicateInbound = (msg: ClientInboundMessage): boolean => {
    const key = `${msg.clientId}:${msg.type}:${msg.timestamp}:${
      msg.type === 'vote'
        ? msg.scenarioId + ':' + msg.stance
        : msg.type === 'submit_proposal'
        ? msg.currentId + ':' + (msg.proposalType || 'general')
        : msg.type === 'toggle_endorsement'
        ? msg.proposalId
        : msg.type === 'toggle_group_endorsement'
        ? msg.groupId
        : ''
    }`;
    const now = Date.now();
    const prev = recentInboundIds.get(key);
    if (prev && now - prev < 8000) {
      return true;
    }
    recentInboundIds.set(key, now);
    if (recentInboundIds.size > 200) {
      // Purge old keys
      for (const [k, t] of recentInboundIds.entries()) {
        if (now - t > 10000) recentInboundIds.delete(k);
      }
    }
    return false;
  };

  const handleInboundSafe = (msg: ClientInboundMessage) => {
    if (isDuplicateInbound(msg)) return;
    onInbound(msg);
  };

  // Register in-memory bus
  const bus = getOrCreateRoomBus(cleanCode);
  bus.latestState = initialState;
  bus.inboundListeners.add(handleInboundSafe);

  // BroadcastChannel for cross-tab in same browser
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('ai-effect-v1-' + cleanCode);
      bc.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'INBOUND' && data.msg) {
          handleInboundSafe(data.msg as ClientInboundMessage);
        }
      };
    } catch {
      bc = null;
    }
  }

  // Layer 2: MQTT over WSS
  let mqttClient: MqttClient | null = null;
  const stateTopic = `rithm-ai-effect-v1/${cleanCode}/state`;
  const inboxTopic = `rithm-ai-effect-v1/${cleanCode}/inbox`;

  if (isBrowserEnvironment()) {
    try {
      const brokerUrl = PRIMARY_MQTT_BROKER;
      mqttClient = mqtt.connect(brokerUrl, {
        keepalive: 30,
        reconnectPeriod: 3000,
        connectTimeout: 7000,
        clientId: 'host_' + Math.random().toString(16).substring(2, 10),
      });

      mqttClient.on('connect', () => {
        updateStatus('connected');
        mqttClient?.subscribe(inboxTopic, { qos: 1 });
        // Publish retained state upon connect
        if (bus.latestState) {
          mqttClient?.publish(stateTopic, JSON.stringify(bus.latestState), {
            qos: 1,
            retain: true,
          });
        }
      });

      mqttClient.on('reconnect', () => {
        updateStatus('reconnecting');
      });

      mqttClient.on('offline', () => {
        updateStatus('local_only');
      });

      mqttClient.on('error', () => {
        // Fall back gracefully to local_only
        updateStatus('local_only');
      });

      mqttClient.on('message', (topic, payload) => {
        if (topic === inboxTopic) {
          try {
            const parsed = JSON.parse(payload.toString()) as ClientInboundMessage;
            handleInboundSafe(parsed);
          } catch {
            // Malformed message
          }
        }
      });
    } catch {
      updateStatus('local_only');
    }
  } else {
    updateStatus('local_only');
  }

  const publishState = (state: RoomState) => {
    bus.latestState = state;

    // 1. Notify in-memory listeners
    for (const listener of bus.stateListeners) {
      try {
        listener(state);
      } catch {
        // Ignore listener error
      }
    }

    // 2. BroadcastChannel
    if (bc) {
      try {
        bc.postMessage({ type: 'STATE', state });
      } catch {
        // Ignore broadcast error
      }
    }

    // 3. MQTT
    if (mqttClient && mqttClient.connected) {
      try {
        mqttClient.publish(stateTopic, JSON.stringify(state), {
          qos: 1,
          retain: true,
        });
      } catch {
        // Ignore MQTT publish error
      }
    }
  };

  const destroy = () => {
    bus.inboundListeners.delete(handleInboundSafe);
    if (bc) {
      try {
        bc.close();
      } catch {
        // Ignore
      }
      bc = null;
    }
    if (mqttClient) {
      try {
        mqttClient.end(true);
      } catch {
        // Ignore
      }
      mqttClient = null;
    }
  };

  // Broadcast initial state immediately
  publishState(initialState);

  return {
    publishState,
    getStatus: () => currentStatus,
    destroy,
  };
}

// ---------------------------------------------------------------------------
// Client Channel Implementation
// ---------------------------------------------------------------------------

export function createClientChannel(
  code: string,
  clientId: string,
  onStateUpdate: (state: RoomState) => void,
  onStatusChange?: (status: SyncConnectionStatus) => void
): ClientRoomChannel {
  const cleanCode = code.trim().toUpperCase();
  let currentStatus: SyncConnectionStatus = isBrowserEnvironment()
    ? 'connecting'
    : 'local_only';

  const updateStatus = (next: SyncConnectionStatus) => {
    if (currentStatus !== next) {
      currentStatus = next;
      onStatusChange?.(next);
    }
  };

  const pendingQueue: ClientInboundMessage[] = [];
  let lastJoinName: string | undefined = undefined;
  let hasJoined = false;
  let lastJoinResendAt = 0;

  let lastStateUpdatedAt = 0;
  const handleStateSafe = (state: RoomState) => {
    if (!state || state.code !== cleanCode) return;
    if (state.updatedAt < lastStateUpdatedAt) {
      return;
    }
    lastStateUpdatedAt = state.updatedAt;
    onStateUpdate(state);

    if (
      hasJoined &&
      state.participants &&
      !state.participants[clientId] &&
      Date.now() - lastJoinResendAt > 1500
    ) {
      lastJoinResendAt = Date.now();
      sendJoin(lastJoinName);
    }
  };

  // Register with in-memory bus
  const bus = getOrCreateRoomBus(cleanCode);
  bus.stateListeners.add(handleStateSafe);
  if (bus.latestState) {
    handleStateSafe(bus.latestState);
  }

  // BroadcastChannel for cross-tab in same browser
  let bc: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel('ai-effect-v1-' + cleanCode);
      bc.onmessage = (event) => {
        const data = event.data;
        if (data && data.type === 'STATE' && data.state) {
          handleStateSafe(data.state as RoomState);
        }
      };
    } catch {
      bc = null;
    }
  }

  // Layer 2: MQTT over WSS
  let mqttClient: MqttClient | null = null;
  const stateTopic = `rithm-ai-effect-v1/${cleanCode}/state`;
  const inboxTopic = `rithm-ai-effect-v1/${cleanCode}/inbox`;

  if (isBrowserEnvironment()) {
    try {
      const brokerUrl = PRIMARY_MQTT_BROKER;
      mqttClient = mqtt.connect(brokerUrl, {
        keepalive: 30,
        reconnectPeriod: 3000,
        connectTimeout: 7000,
        clientId: 'client_' + Math.random().toString(16).substring(2, 10),
      });

      mqttClient.on('connect', () => {
        updateStatus('connected');
        mqttClient?.subscribe(stateTopic, { qos: 1 });
        while (pendingQueue.length > 0) {
          const queuedMsg = pendingQueue.shift();
          if (queuedMsg) {
            try {
              mqttClient?.publish(inboxTopic, JSON.stringify(queuedMsg), { qos: 1 });
            } catch {
              // Ignore
            }
          }
        }
        if (hasJoined) {
          try {
            const reconnectJoin: ClientInboundMessage = {
              type: 'join',
              code: cleanCode,
              clientId,
              name: lastJoinName,
              timestamp: Date.now(),
            };
            mqttClient?.publish(inboxTopic, JSON.stringify(reconnectJoin), { qos: 1 });
          } catch {
            // Ignore
          }
        }
      });

      mqttClient.on('reconnect', () => {
        updateStatus('reconnecting');
      });

      mqttClient.on('offline', () => {
        updateStatus('local_only');
      });

      mqttClient.on('error', () => {
        updateStatus('local_only');
      });

      mqttClient.on('message', (topic, payload) => {
        if (topic === stateTopic) {
          try {
            const parsed = JSON.parse(payload.toString()) as RoomState;
            handleStateSafe(parsed);
          } catch {
            // Malformed message
          }
        }
      });
    } catch {
      updateStatus('local_only');
    }
  } else {
    updateStatus('local_only');
  }

  const sendInbound = (msg: ClientInboundMessage) => {
    // 1. Notify in-memory listeners
    for (const listener of bus.inboundListeners) {
      try {
        listener(msg);
      } catch {
        // Ignore listener error
      }
    }

    // 2. BroadcastChannel
    if (bc) {
      try {
        bc.postMessage({ type: 'INBOUND', msg });
      } catch {
        // Ignore
      }
    }

    // 3. MQTT
    if (mqttClient && mqttClient.connected) {
      try {
        mqttClient.publish(inboxTopic, JSON.stringify(msg), { qos: 1 });
      } catch {
        // Ignore
      }
    } else {
      pendingQueue.push(msg);
    }
  };

  const sendJoin = (name?: string) => {
    hasJoined = true;
    if (name !== undefined) lastJoinName = name;
    sendInbound({
      type: 'join',
      code: cleanCode,
      clientId,
      name,
      timestamp: Date.now(),
    });
  };

  const sendVote = (scenarioId: string, stance: Stance, note?: string) => {
    sendInbound({
      type: 'vote',
      code: cleanCode,
      clientId,
      scenarioId,
      stance,
      note,
      timestamp: Date.now(),
    });
  };

  const sendProposal = (
    currentId: RithmCurrentId,
    proposalType: WorkshopProposalType | undefined,
    text: string
  ) => {
    sendInbound({
      type: 'submit_proposal',
      code: cleanCode,
      clientId,
      currentId,
      proposalType: proposalType || 'general',
      text,
      timestamp: Date.now(),
    });
  };

  const sendToggleEndorsement = (proposalId: string) => {
    sendInbound({
      type: 'toggle_endorsement',
      code: cleanCode,
      clientId,
      proposalId,
      timestamp: Date.now(),
    });
  };

  const sendToggleGroupEndorsement = (groupId: string) => {
    sendInbound({
      type: 'toggle_group_endorsement',
      code: cleanCode,
      clientId,
      groupId,
      timestamp: Date.now(),
    });
  };

  const requestState = () => {
    sendInbound({
      type: 'request_state',
      code: cleanCode,
      clientId,
      timestamp: Date.now(),
    });
  };

  const destroy = () => {
    bus.stateListeners.delete(handleStateSafe);
    pendingQueue.length = 0;
    if (bc) {
      try {
        bc.close();
      } catch {
        // Ignore
      }
      bc = null;
    }
    if (mqttClient) {
      try {
        mqttClient.end(true);
      } catch {
        // Ignore
      }
      mqttClient = null;
    }
  };

  // Request state from host upon creation
  requestState();

  return {
    sendJoin,
    sendVote,
    sendProposal,
    sendToggleEndorsement,
    sendToggleGroupEndorsement,
    requestState,
    getStatus: () => currentStatus,
    destroy,
  };
}
