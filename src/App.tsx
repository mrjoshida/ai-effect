import React, { useEffect, useState } from 'react';
import { getPresetScenarios } from './content/scenarios';
import {
  applyInboundMessage,
  createRoomState,
  getOrCreateClientId,
  loadHostRoomState,
  saveHostRoomState,
} from './state/roomEngine';
import {
  createClientChannel,
  createHostChannel,
  ClientRoomChannel,
  HostRoomChannel,
} from './utils/roomSync';
import { LandingView } from './views/LandingView';
import { ParticipantView } from './views/ParticipantView';
import { PresenterView } from './views/PresenterView';
import {
  ClientInboundMessage,
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

    const urlParams = new URLSearchParams(window.location.search);
    let codeParam = urlParams.get('code') || '';

    if (!codeParam && window.location.hash) {
      const hash = window.location.hash;
      const match = hash.match(/#(?:join\/|join\?code=)?([A-Za-z0-9]{3,6})/);
      if (match) {
        codeParam = match[1];
      }
    }

    if (codeParam) {
      const clean = codeParam.trim().toUpperCase();
      setInitialCodeFromUrl(clean);
      handleJoinRoom(clean);
      return;
    }

    const hostParam = urlParams.get('host');
    if (hostParam) {
      const cleanHost = hostParam.trim().toUpperCase();
      const existing = loadHostRoomState(cleanHost);
      if (existing) {
        resumeHost(existing);
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
    selectedCategories?: ScenarioCategory[]
  ) => {
    // Clean up any prior channels
    hostChannel?.destroy();
    participantChannel?.destroy();

    const deck = getPresetScenarios(preset, selectedCategories);
    const newRoom = createRoomState(deck);
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
      const newUrl = `${window.location.pathname}?host=${newRoom.code}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // Join as Participant
  const handleJoinRoom = (code: string, name?: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Clean up any prior channels
    hostChannel?.destroy();
    participantChannel?.destroy();

    setParticipantCode(cleanCode);
    if (name) setParticipantName(name);

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

    channel.sendJoin(name);
    setParticipantChannel(channel);
    setMode('participant');

    // Update URL query param cleanly without reloading
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const newUrl = `${window.location.pathname}?code=${cleanCode}`;
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
