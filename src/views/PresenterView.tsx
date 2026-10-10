import React, { useEffect, useState } from 'react';
import { CurrentsWorkshop } from '../components/CurrentsWorkshop';
import { MobilePreviewDrawer } from '../components/MobilePreviewDrawer';
import { Pebble } from '../components/Pebble';
import { ResponseGraph } from '../components/ResponseGraph';
import { getCurrentMeta } from '../content/currents';
import { CATEGORY_LIST, CATEGORY_META } from '../content/scenarios';
import {
  addCustomScenario,
  navigateToScenario,
  saveHostRoomState,
  setRoomPhase,
  simulateTeamVotesForCurrentScenario,
  triggerScenarioTwist,
  updateCurrentCommitment,
} from '../state/roomEngine';
import { buildJoinUrl, generateJoinQrSvg } from '../utils/qrCode';
import { HostRoomChannel } from '../utils/roomSync';
import { RithmCurrentId, RoomState, ScenarioCard, ScenarioCategory } from '../types/game';

export interface PresenterViewProps {
  room: RoomState;
  channel: HostRoomChannel;
  onUpdateRoom: (room: RoomState) => void;
  onExit: () => void;
}

export const PresenterView: React.FC<PresenterViewProps> = ({
  room,
  channel,
  onUpdateRoom,
  onExit,
}) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom scenario form state
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<ScenarioCategory>('coworkers');
  const [customCurrentId, setCustomCurrentId] = useState<RithmCurrentId>('current-04');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customMobileSummary, setCustomMobileSummary] = useState('');
  const [customTwist, setCustomTwist] = useState('');
  const [customDiscussion, setCustomDiscussion] = useState('');

  // Generate QR code SVG whenever room code changes
  useEffect(() => {
    let active = true;
    const joinUrl = buildJoinUrl(room.code);
    generateJoinQrSvg(joinUrl).then((svg) => {
      if (active) setQrSvg(svg);
    });
    return () => {
      active = false;
    };
  }, [room.code]);

  // Synchronize room updates: save to storage and broadcast to channel
  const updateRoomState = (next: RoomState) => {
    saveHostRoomState(next);
    channel.publishState(next);
    onUpdateRoom(next);
  };

  const currentCard: ScenarioCard | undefined = room.scenarios[room.currentScenarioIndex];
  const currentRound = currentCard ? room.rounds[currentCard.id] : undefined;
  const totalCards = room.scenarios.length;
  const isLastCard = room.currentScenarioIndex === totalCards - 1;
  const participantsList = Object.values(room.participants);
  const totalParticipants = participantsList.length;

  const currentVotesCount = currentRound ? Object.keys(currentRound.votes).length : 0;
  const twistActive = room.phase === 'twist' || Boolean(currentRound?.twistTriggered);

  // Keyboard navigation & step advancement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        advanceLogicalStep();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (room.phase !== 'lobby' && room.phase !== 'currents_workshop') {
          handleNextScenario();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (room.phase !== 'lobby' && room.phase !== 'currents_workshop') {
          handlePrevScenario();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room]);

  const advanceLogicalStep = () => {
    if (room.phase === 'lobby') {
      const next = navigateToScenario(room, 0);
      updateRoomState(next);
    } else if (room.phase === 'voting') {
      const next = setRoomPhase(room, 'revealed');
      updateRoomState(next);
    } else if (room.phase === 'revealed') {
      if (!currentRound?.twistTriggered) {
        const next = triggerScenarioTwist(room);
        updateRoomState(next);
      } else {
        handleNextScenario();
      }
    } else if (room.phase === 'twist') {
      handleNextScenario();
    }
  };

  const handleNextScenario = () => {
    if (isLastCard) {
      const next = setRoomPhase(room, 'currents_workshop');
      updateRoomState(next);
    } else {
      const next = navigateToScenario(room, room.currentScenarioIndex + 1);
      updateRoomState(next);
    }
  };

  const handlePrevScenario = () => {
    if (room.currentScenarioIndex > 0) {
      const next = navigateToScenario(room, room.currentScenarioIndex - 1);
      updateRoomState(next);
    }
  };

  const handleSimulateVotes = () => {
    const next = simulateTeamVotesForCurrentScenario(room, 10);
    updateRoomState(next);
  };

  const handleCreateCustomScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customPrompt.trim()) return;

    const newCard: Omit<ScenarioCard, 'id'> = {
      title: customTitle.trim(),
      category: customCategory,
      currentId: customCurrentId,
      prompt: customPrompt.trim(),
      mobileSummary: customMobileSummary.trim() || customTitle.trim(),
      twist: customTwist.trim() || 'What if the context shifts unexpectedly?',
      discussionQuestion: customDiscussion.trim() || 'How does this shape human connection?',
    };

    const next = addCustomScenario(room, newCard);
    updateRoomState(next);
    setShowCustomModal(false);
    // Reset form
    setCustomTitle('');
    setCustomPrompt('');
    setCustomMobileSummary('');
    setCustomTwist('');
    setCustomDiscussion('');
  };

  const connectionStatus = channel.getStatus();
  const joinUrl = buildJoinUrl(room.code);
  const categoryMeta = currentCard ? CATEGORY_META[currentCard.category] : null;
  const currentMeta = currentCard ? getCurrentMeta(currentCard.currentId) : null;

  return (
    <div
      className="presenter-view"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* 1. Global Facilitator Top Bar */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: App Title & Room Code Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
            }}
            title="Return to main menu"
          >
            <span>The AI Effect</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                fontWeight: 700,
                backgroundColor: 'var(--bg-tray)',
                border: '1px solid var(--border-default)',
                padding: '0.3rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                letterSpacing: '0.08em',
                color: 'var(--ink-primary)',
              }}
            >
              CODE: {room.code}
            </span>

            <button
              id="toggle-qr-btn"
              onClick={() => setShowQrModal(true)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
              title="Show join QR code for latecomers"
            >
              📷 Show QR
            </button>
          </div>
        </div>

        {/* Right: Facilitator Controls & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Participant count */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
              backgroundColor: 'var(--bg-tray)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>👥</span>
            <span>{totalParticipants} {totalParticipants === 1 ? 'player' : 'players'}</span>
          </span>

          {/* Connection status pill */}
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: connectionStatus === 'connected' ? 'var(--stance-support-text)' : 'var(--stance-depends-text)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connectionStatus === 'connected' ? 'var(--stance-support-accent)' : 'var(--stance-depends-accent)',
              }}
            />
            <span>{connectionStatus === 'connected' ? 'Live Relay' : 'Local Only'}</span>
          </span>

          {/* Facilitator actions */}
          <button
            id="simulate-votes-btn"
            onClick={handleSimulateVotes}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Populate test votes from simulated team members"
          >
            🎲 Simulate Votes
          </button>

          <button
            id="toggle-mobile-preview-btn"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Open side-by-side mobile phone preview"
          >
            📱 Mobile Preview
          </button>

          <button
            id="add-custom-scenario-btn"
            onClick={() => setShowCustomModal(true)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Create a custom scenario card for this session"
          >
            + Custom Card
          </button>

          <button
            id="open-workshop-btn"
            onClick={() => {
              const next = setRoomPhase(room, 'currents_workshop');
              updateRoomState(next);
            }}
            className={room.phase === 'currents_workshop' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Open the Four Currents Workshop synthesis"
          >
            🌊 Currents Workshop
          </button>
        </div>
      </header>

      {/* 2. Main Presenter Stage */}
      <main style={{ flex: 1, padding: '2rem 1.75rem', maxWidth: 'var(--max-width-stage)', width: '100%', margin: '0 auto' }}>
        {room.phase === 'lobby' ? (
          /* =================================================================
             LOBBY PHASE: Giant QR Code, Join Code & Live Pebble Basin
             ================================================================= */
          <div
            className="lobby-stage"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.25fr',
              gap: '2.5rem',
              alignItems: 'center',
              minHeight: '70vh',
            }}
          >
            {/* Left: Giant QR Code & Short Code */}
            <div
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2.5rem 2rem',
                gap: '1.5rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--currents-teal)',
                }}
              >
                Scan with your phone to join
              </span>

              {/* High Contrast Inline SVG QR Code */}
              <div
                style={{
                  width: '260px',
                  height: '260px',
                  backgroundColor: '#FFFDF9',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Or enter room code at website
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '3.2rem',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-primary)',
                    lineHeight: 1,
                  }}
                >
                  {room.code}
                </span>
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.88rem', wordBreak: 'break-all', marginTop: '0.25rem' }}
                >
                  {joinUrl}
                </a>
              </div>
            </div>

            {/* Right: Live Sandstone Pebble Basin */}
            <div
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.75rem',
                minHeight: '440px',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '2rem' }}>The Workshop Table</h2>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--ink-secondary)',
                    }}
                  >
                    {totalParticipants} Joined
                  </span>
                </div>
                <p style={{ fontSize: '1rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                  Each participant receives a unique tactile river stone. As colleagues scan the QR code and take
                  their seat, their pebbles appear in the sand well below.
                </p>
              </div>

              {/* Sandstone Pebble Well */}
              <div
                className="tray-sandstone"
                style={{
                  minHeight: '190px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  alignItems: 'center',
                  alignContent: 'flex-start',
                }}
              >
                {totalParticipants === 0 ? (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-muted)',
                      gap: '0.5rem',
                      padding: '2rem 0',
                    }}
                  >
                    <Pebble variant={0} stance="neutral" size="md" className="animate-pulse" />
                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Waiting for participants to scan the QR code...
                    </span>
                  </div>
                ) : (
                  participantsList.map((p) => (
                    <div
                      key={p.clientId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Pebble
                        variant={p.pebbleVariant}
                        stance="neutral"
                        size="md"
                        label={p.name.slice(0, 2).toUpperCase()}
                        className="animate-pebble-drop"
                      />
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-sans)',
                          fontWeight: 600,
                          color: 'var(--ink-primary)',
                          maxWidth: '70px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Begin Session Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Press <kbd style={{ padding: '0.15rem 0.4rem', border: '1px solid var(--border-default)', borderRadius: '3px' }}>Space</kbd> to begin
                </span>
                <button
                  id="begin-session-btn"
                  onClick={advanceLogicalStep}
                  className="btn-primary"
                  style={{ padding: '0.9rem 1.6rem', fontSize: '1.05rem' }}
                >
                  Begin Scenario 1 →
                </button>
              </div>
            </div>
          </div>
        ) : room.phase === 'currents_workshop' ? (
          /* =================================================================
             WORKSHOP PHASE: The Four Currents Offsite Synthesis
             ================================================================= */
          <CurrentsWorkshop
            room={room}
            onUpdateCommitment={(cid, text) => {
              const next = updateCurrentCommitment(room, cid, text);
              updateRoomState(next);
            }}
            onBackToScenarios={() => {
              const next = setRoomPhase(room, 'revealed');
              updateRoomState(next);
            }}
          />
        ) : (
          /* =================================================================
             GAMEPLAY STAGE: Voting, Revealed & "What If?" Twist
             ================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Stage Header: Category Pill, Card Counter, Prev/Next Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {categoryMeta && (
                  <span
                    className="badge-category"
                    style={{
                      backgroundColor: categoryMeta.surfaceTint,
                      color: categoryMeta.accentColor,
                      border: `1px solid ${categoryMeta.accentColor}33`,
                    }}
                  >
                    {categoryMeta.label}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
                  Scenario {room.currentScenarioIndex + 1} of {totalCards}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  id="prev-scenario-btn"
                  onClick={handlePrevScenario}
                  disabled={room.currentScenarioIndex === 0}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    opacity: room.currentScenarioIndex === 0 ? 0.4 : 1,
                  }}
                  title="Previous scenario (Left Arrow)"
                >
                  ← Prev
                </button>

                <button
                  id="next-scenario-btn"
                  onClick={handleNextScenario}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  title="Next scenario (Right Arrow)"
                >
                  {isLastCard ? 'Workshop Finale →' : 'Next Scenario →'}
                </button>
              </div>
            </div>

            {/* Main Scenario Editorial Card */}
            {currentCard && (
              <div
                className="card-tabletop"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '4px solid var(--currents-teal)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h1 style={{ fontSize: '2.1rem', maxWidth: '850px', lineHeight: 1.2 }}>
                    {currentCard.title}
                  </h1>

                  {/* Revealed Current Badge */}
                  {(room.phase === 'revealed' || room.phase === 'twist') && currentMeta && (
                    <a
                      href={currentMeta.url}
                      target="_blank"
                      rel="noreferrer"
                      className="badge-current"
                      title={currentMeta.pullDescription}
                    >
                      <span>🌊</span>
                      <span>{currentMeta.number}: {currentMeta.title} ↗</span>
                    </a>
                  )}
                </div>

                {/* Scenario Prompt */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    lineHeight: 1.5,
                    color: 'var(--ink-primary)',
                    maxWidth: '960px',
                  }}
                >
                  {currentCard.prompt}
                </p>

                {/* What If Twist Card (Highlighted if active) */}
                {twistActive && (
                  <div className="twist-banner animate-pebble-drop" style={{ marginTop: '0.5rem' }}>
                    <div className="twist-banner-title">
                      <span>⚡</span>
                      <span>The "What If?" Context Shift</span>
                    </div>
                    <div className="twist-banner-body">
                      {currentCard.twist}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voting Phase Tray vs Revealed Response Graph */}
            {room.phase === 'voting' ? (
              <div
                className="card-tabletop"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '2.5rem',
                  gap: '1.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.45rem', marginBottom: '0.4rem' }}>
                    Voting in Progress
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--ink-secondary)' }}>
                    Cast your stance on your phone. You can hold or change your vote until revealed.
                  </p>
                </div>

                {/* Unrevealed Pebble Basin */}
                <div
                  className="tray-sandstone"
                  style={{
                    width: '100%',
                    maxWidth: '680px',
                    minHeight: '110px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentVotesCount === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                      Waiting for initial votes to land...
                    </span>
                  ) : (
                    Array.from({ length: currentVotesCount }).map((_, idx) => (
                      <Pebble
                        key={idx}
                        variant={idx % 5}
                        stance="neutral"
                        size="md"
                        label="?"
                        className="animate-pebble-drop"
                      />
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600 }}>
                    {currentVotesCount} of {Math.max(totalParticipants, currentVotesCount)} voted
                  </span>

                  <button
                    id="reveal-responses-btn"
                    onClick={() => {
                      const next = setRoomPhase(room, 'revealed');
                      updateRoomState(next);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.8rem 1.6rem', fontSize: '1rem' }}
                  >
                    Reveal Responses →
                  </button>
                </div>
              </div>
            ) : (
              /* Response Graph & Discussion Question */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 3 Stance Columns Graph */}
                <div className="card-tabletop">
                  <ResponseGraph
                    round={currentRound}
                    participants={room.participants}
                    showNotes={true}
                  />
                </div>

                {/* Facilitator Discussion Question & Actions */}
                {currentCard && (
                  <div
                    className="card-tabletop"
                    style={{
                      borderLeft: '5px solid var(--stance-support)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--stance-support)',
                        }}
                      >
                        Facilitator Discussion Prompt
                      </span>
                      <h3 style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>
                        {currentCard.discussionQuestion}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                      {!twistActive ? (
                        <button
                          id="trigger-twist-btn"
                          onClick={() => {
                            const next = triggerScenarioTwist(room);
                            updateRoomState(next);
                          }}
                          className="btn-primary"
                          style={{
                            backgroundColor: 'var(--stance-depends)',
                            padding: '0.75rem 1.4rem',
                          }}
                        >
                          ⚡ Reveal "What If?" Twist →
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--stance-depends-text)', fontWeight: 600 }}>
                          ⚡ "What If?" Twist Active — Voters can shift stances in real time!
                        </span>
                      )}

                      <button
                        id="advance-scenario-btn"
                        onClick={handleNextScenario}
                        className="btn-primary"
                        style={{ padding: '0.75rem 1.4rem' }}
                      >
                        {isLastCard ? 'Open Four Currents Workshop →' : 'Next Scenario →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Floating Mobile Preview Drawer */}
      <MobilePreviewDrawer
        room={room}
        isOpen={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
      />

      {/* 4. Popover / Modal for Latecomer QR Code */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(31, 28, 24, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQrModal(false);
          }}
        >
          <div
            className="card-tabletop"
            style={{
              maxWidth: '420px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1.25rem',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                fontSize: '1.1rem',
                color: 'var(--ink-muted)',
              }}
            >
              ✕
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--currents-teal)' }}>
              Join the Active Session
            </span>

            <div
              style={{
                width: '240px',
                height: '240px',
                backgroundColor: '#FFFDF9',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 800, letterSpacing: '0.15em' }}>
                {room.code}
              </span>
              <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>{joinUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Scenario Creation Modal */}
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(31, 28, 24, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCustomModal(false);
          }}
        >
          <div
            className="card-tabletop"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Add Custom Scenario Card</h2>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{ fontSize: '1.1rem', color: 'var(--ink-muted)' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomScenario} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Scenario Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. The Board Presentation Co-Pilot"
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Domain Category
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ScenarioCategory)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#FFFDF9',
                    }}
                  >
                    {CATEGORY_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                    Rithm Current
                  </label>
                  <select
                    value={customCurrentId}
                    onChange={(e) => setCustomCurrentId(e.target.value as RithmCurrentId)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#FFFDF9',
                    }}
                  >
                    <option value="current-01">Current 01: Our sense of trust</option>
                    <option value="current-02">Current 02: Relationships with AI</option>
                    <option value="current-03">Current 03: Our inner voice</option>
                    <option value="current-04">Current 04: Acting for us</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Mobile Summary (1 crisp dilemma sentence)
                </label>
                <input
                  type="text"
                  value={customMobileSummary}
                  onChange={(e) => setCustomMobileSummary(e.target.value)}
                  placeholder="e.g. Using AI to draft the board remarks on behalf of the foundation."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Full Prompt Narrative (Presenter Screen)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the real-world dilemma..."
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'var(--font-serif)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  "What If?" Twist (Context Modifier)
                </label>
                <textarea
                  value={customTwist}
                  onChange={(e) => setCustomTwist(e.target.value)}
                  placeholder="What if a key contextual condition changes?"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                  Facilitator Discussion Question
                </label>
                <input
                  type="text"
                  value={customDiscussion}
                  onChange={(e) => setCustomDiscussion(e.target.value)}
                  placeholder="e.g. Where does synthetic polish cross into inauthenticity?"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add to Active Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
