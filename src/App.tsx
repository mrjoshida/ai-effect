import React, { useEffect, useState } from 'react';
import { getPresetScenarios } from './content/scenarios';
import {
  applyInboundMessage,
  createRoomState,
  generateAlliterativeAnimalName,
  getOrCreateClientId,
  isReservedRoomCode,
  loadHostRoomState,
  sanitizeCustomRoomCode,
  saveHostRoomState,
} from './state/roomEngine';
import { detectCapabilities } from './utils/capabilities';
import {
  createClientChannel,
  createHostChannel,
  ClientRoomChannel,
  HostRoomChannel,
} from './utils/roomSync';
import { getConfiguredAiKey } from './utils/ideaGrouping';
import { LandingView } from './views/LandingView';
import { ParticipantView } from './views/ParticipantView';
import { PresenterView } from './views/PresenterView';
import {
  ClientInboundMessage,
  CustomDeckOptions,
  DeckPresetId,
  RoomState,
  ScenarioCategory,
} from './types/game';

type AppMode = 'landing' | 'presenter' | 'participant';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('landing');
  const [initialCodeFromUrl, setInitialCodeFromUrl] = useState<string>('');

  // Host state
  const [hostRoom, setHostRoom] = useState<RoomState | null>(null);
  const [hostChannel, setHostChannel] = useState<HostRoomChannel | null>(null);

  // Participant state
  const [participantCode, setParticipantCode] = useState<string>('');
  const [participantName, setParticipantName] = useState<string>('');
  const [participantRoom, setParticipantRoom] = useState<RoomState | null>(null);
  const [participantChannel, setParticipantChannel] = useState<ClientRoomChannel | null>(null);
  const [clientId] = useState<string>(() => getOrCreateClientId());

  // Detect URL parameter ?code=XXXX or #join/XXXX
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Warm capabilities cache on boot
    detectCapabilities();

    // Immediately persist and clean any facilitator AI key in URL hash
    getConfiguredAiKey();

    const urlParams = new URLSearchParams(window.location.search);
    let codeParam = urlParams.get('code') || '';

    if (!codeParam && window.location.hash) {
      const hash = window.location.hash;
      const match = hash.match(/#(?:join\/|join\?code=)?([A-Za-z0-9-]{2,12})/);
      if (match && !isReservedRoomCode(match[1])) {
        codeParam = match[1];
      }
    }

    if (!codeParam && window.location.pathname && window.location.pathname !== '/') {
      const pathMatch = window.location.pathname.match(
        /^(?:\/ai-effect)?\/(?:join\/)?([A-Za-z0-9-]{2,12})\/?$/
      );
      if (
        pathMatch &&
        pathMatch[1] &&
        !pathMatch[1].includes('.') &&
        !isReservedRoomCode(pathMatch[1])
      ) {
        codeParam = pathMatch[1];
        if (window.history && window.history.replaceState) {
          window.history.replaceState(
            null,
            '',
            `/?code=${encodeURIComponent(codeParam.toUpperCase())}`
          );
        }
      }
    }

    if (codeParam) {
      const clean = sanitizeCustomRoomCode(codeParam);
      if (clean) {
        setInitialCodeFromUrl(clean);
        handleJoinRoom(clean);
        return;
      }
    }

    const hostParam = urlParams.get('host');
    if (hostParam) {
      const cleanHost = sanitizeCustomRoomCode(hostParam);
      if (cleanHost) {
        const existing = loadHostRoomState(cleanHost);
        if (existing) {
          resumeHost(existing);
        } else {
          const presetParam = (urlParams.get('preset') as DeckPresetId) || 'spark-8';
          handleStartHost(presetParam, undefined, cleanHost);
        }
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hostChannel?.destroy();
      participantChannel?.destroy();
    };
  }, [hostChannel, participantChannel]);

  // Resume an existing host session (e.g. on page refresh)
  const resumeHost = (existingRoom: RoomState) => {
    hostChannel?.destroy();
    participantChannel?.destroy();

    const channel = createHostChannel(
      existingRoom.code,
      existingRoom,
      (inboundMsg: ClientInboundMessage) => {
        setHostRoom((prev) => {
          if (!prev) return null;
          const next = applyInboundMessage(prev, inboundMsg);
          saveHostRoomState(next);
          channel.publishState(next);
          return next;
        });
      }
    );

    setHostRoom(existingRoom);
    setHostChannel(channel);
    setMode('presenter');
  };

  // Start Facilitating (Host)
  const handleStartHost = (
    preset: DeckPresetId,
    customOrCategories?: ScenarioCategory[] | CustomDeckOptions,
    customCode?: string
  ) => {
    // Clean up any prior channels
    hostChannel?.destroy();
    participantChannel?.destroy();

    const cleanCustomCode = customCode
      ? customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
      : undefined;

    const deck = getPresetScenarios(preset, customOrCategories);
    const newRoom = createRoomState(deck, cleanCustomCode || undefined);
    saveHostRoomState(newRoom);

    // Create host channel
    const channel = createHostChannel(
      newRoom.code,
      newRoom,
      (inboundMsg: ClientInboundMessage) => {
        setHostRoom((prev) => {
          if (!prev) return null;
          const next = applyInboundMessage(prev, inboundMsg);
          saveHostRoomState(next);
          channel.publishState(next);
          return next;
        });
      }
    );

    setHostRoom(newRoom);
    setHostChannel(channel);
    setMode('presenter');

    // Update URL query param so refresh restores host session seamlessly
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newUrl = `${window.location.pathname}?host=${encodeURIComponent(newRoom.code)}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Allow facilitator to change the room code live inside PresenterView
  const handleChangeHostCode = (nextCodeRaw: string) => {
    if (!hostRoom) return;
    const cleanCode = nextCodeRaw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
    if (!cleanCode || cleanCode === hostRoom.code) return;

    hostChannel?.destroy();

    const updatedRoom: RoomState = {
      ...hostRoom,
      code: cleanCode,
      updatedAt: Date.now(),
    };
    saveHostRoomState(updatedRoom);

    const channel = createHostChannel(
      cleanCode,
      updatedRoom,
      (inboundMsg: ClientInboundMessage) => {
        setHostRoom((prev) => {
          if (!prev) return null;
          const next = applyInboundMessage(prev, inboundMsg);
          saveHostRoomState(next);
          channel.publishState(next);
          return next;
        });
      }
    );

    setHostRoom(updatedRoom);
    setHostChannel(channel);

    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newUrl = `${window.location.pathname}?host=${encodeURIComponent(cleanCode)}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Join as Participant
  const handleJoinRoom = (code: string, name?: string) => {
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12);
    if (!cleanCode) return;

    // Clean up any prior channels
    hostChannel?.destroy();
    participantChannel?.destroy();

    const resolvedName = (name && name.trim()) || generateAlliterativeAnimalName(clientId);

    setParticipantCode(cleanCode);
    setParticipantName(resolvedName);

    // If host state is stored locally for this code (e.g. testing in same browser), load it initially
    const localHost = loadHostRoomState(cleanCode);
    if (localHost) {
      setParticipantRoom(localHost);
    }

    const channel = createClientChannel(
      cleanCode,
      clientId,
      (updatedState) => {
        setParticipantRoom(updatedState);
      }
    );

    channel.sendJoin(resolvedName);
    setParticipantChannel(channel);
    setMode('participant');

    // Update URL query param cleanly without reloading
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newUrl = `${window.location.pathname}?code=${encodeURIComponent(cleanCode)}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Return to landing page
  const handleExitToLanding = () => {
    hostChannel?.destroy();
    setHostChannel(null);
    setHostRoom(null);

    participantChannel?.destroy();
    setParticipantChannel(null);
    setParticipantRoom(null);
    setParticipantCode('');

    setMode('landing');

    // Remove ?code= from URL
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="app-root">
      {mode === 'landing' && (
        <LandingView
          onJoinRoom={handleJoinRoom}
          onStartHost={handleStartHost}
          initialCode={initialCodeFromUrl}
        />
      )}

      {mode === 'presenter' && hostRoom && hostChannel && (
        <PresenterView
          room={hostRoom}
          channel={hostChannel}
          onUpdateRoom={(updated) => setHostRoom(updated)}
          onChangeRoomCode={handleChangeHostCode}
          onExit={handleExitToLanding}
        />
      )}

      {mode === 'participant' && participantChannel && (
        <ParticipantView
          room={participantRoom}
          channel={participantChannel}
          clientId={clientId}
          initialName={participantName}
          onExit={handleExitToLanding}
        />
      )}
    </div>
  );
};
