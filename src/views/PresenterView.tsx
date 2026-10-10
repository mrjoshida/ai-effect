import React, { useEffect, useState } from 'react';
import { CurrentsWorkshop } from '../components/CurrentsWorkshop';
import { FramingSlides } from '../components/FramingSlides';
import { Pebble } from '../components/Pebble';
import { ResponseGraph } from '../components/ResponseGraph';
import { CATEGORY_META } from '../content/scenarios';
import {
  navigateToScenario,
  saveHostRoomState,
  setFramingSlideIndex,
  setRoomPhase,
  setWorkshopStage,
  toggleProposalEndorsement,
  triggerScenarioTwist,
  updateCurrentCommitment,
} from '../state/roomEngine';
import { buildJoinUrl, generateJoinQrSvg } from '../utils/qrCode';
import { HostRoomChannel } from '../utils/roomSync';
import { RoomState, ScenarioCard } from '../types/game';
import {
  CloseIcon,
  QrIcon,
  SparkIcon,
  UsersIcon,
  WaveIcon,
} from '../components/Icons';

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

      const activeSlide = room.framingSlideIndex ?? 0;

      if (e.code === 'Space') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          if (activeSlide < 2) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'voting'));
          }
        } else if (room.phase === 'currents_framing') {
          if (activeSlide < 4) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'currents_workshop'));
          }
        } else {
          advanceLogicalStep();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          if (activeSlide < 2) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'voting'));
          }
        } else if (room.phase === 'currents_framing') {
          if (activeSlide < 4) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'currents_workshop'));
          }
        } else {
          handleNextScenario();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          if (activeSlide > 0) {
            updateRoomState(setFramingSlideIndex(room, activeSlide - 1));
          } else {
            updateRoomState(setRoomPhase(room, 'lobby'));
          }
        } else if (room.phase === 'currents_framing') {
          if (activeSlide > 0) {
            updateRoomState(setFramingSlideIndex(room, activeSlide - 1));
          } else {
            updateRoomState(setRoomPhase(room, 'revealed'));
          }
        } else {
          handlePrevScenario();
        }
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        if (room.phase === 'revealed' && !twistActive) {
          const next = triggerScenarioTwist(room);
          updateRoomState(next);
        }
      } else if (e.code === 'KeyW') {
        e.preventDefault();
        const next = setRoomPhase(
          room,
          room.phase === 'currents_workshop' ? 'revealed' : 'currents_workshop'
        );
        updateRoomState(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room]);

  const advanceLogicalStep = () => {
    if (room.phase === 'lobby') {
      const next = setRoomPhase(room, 'opening_framing');
      updateRoomState(next);
    } else if (room.phase === 'voting') {
      const next = setRoomPhase(room, 'revealed');
      updateRoomState(next);
    } else if (room.phase === 'revealed' && !twistActive) {
      const next = triggerScenarioTwist(room);
      updateRoomState(next);
    } else if (room.phase === 'revealed' || room.phase === 'twist') {
      handleNextScenario();
    }
  };

  const handleNextScenario = () => {
    if (isLastCard) {
      const next = setRoomPhase(room, 'currents_framing');
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

  const categoryMeta = currentCard ? CATEGORY_META[currentCard.category] : undefined;
  const joinUrl = buildJoinUrl(room.code);

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
      {/* 1. Header */}
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
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Return to main menu"
          >
            <span>The AI Effect</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
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
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Show join QR code for latecomers"
            >
              <QrIcon size={14} /> Show QR
            </button>
          </div>
        </div>

        {/* Center: Stage Jump Pills */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-tray)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            gap: '0.2rem',
          }}
        >
          <button
            id="nav-framing-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'opening_framing'))}
            className={room.phase === 'opening_framing' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Framing
          </button>
          <button
            id="nav-scenarios-btn"
            onClick={() => {
              const nextPhase =
                room.phase === 'voting' || room.phase === 'revealed' || room.phase === 'twist'
                  ? room.phase
                  : 'voting';
              updateRoomState(setRoomPhase(room, nextPhase));
            }}
            className={
              room.phase === 'voting' || room.phase === 'revealed' || room.phase === 'twist'
                ? 'btn-primary'
                : 'btn-ghost'
            }
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Scenarios
          </button>
          <button
            id="nav-currents-framing-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'currents_framing'))}
            className={room.phase === 'currents_framing' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Currents Intro
          </button>
          <button
            id="open-workshop-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'currents_workshop'))}
            className={room.phase === 'currents_workshop' ? 'btn-primary' : 'btn-ghost'}
            style={{
              fontSize: '0.8rem',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <WaveIcon size={13} />
            <span>Workshop</span>
          </button>
        </div>

        {/* Right: Participants count & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
              backgroundColor: 'var(--bg-tray)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <UsersIcon size={14} />
            <span>{totalParticipants} joined</span>
          </span>

          <button
            onClick={onExit}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Exit session"
          >
            Exit
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
                    fontSize: '3.4rem',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-primary)',
                    lineHeight: 1,
                  }}
                >
                  {room.code}
                </span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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

              {/* Sandstone Pebble Well */}
              <div
                className="tray-sandstone"
                style={{
                  minHeight: '220px',
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
                        gap: '0.35rem',
                      }}
                      className="animate-pebble-drop"
                    >
                      <Pebble
                        variant={p.pebbleVariant}
                        stance="neutral"
                        size="md"
                        label={p.name.slice(0, 2).toUpperCase()}
                      />
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-secondary)',
                          maxWidth: '90px',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Begin Session Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  id="skip-framing-btn"
                  onClick={() => {
                    const next = setRoomPhase(room, 'voting');
                    updateRoomState(next);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.95rem 1.4rem',
                    fontSize: '0.95rem',
                  }}
                >
                  Skip to Scenario 1
                </button>
                <button
                  id="begin-session-btn"
                  onClick={() => {
                    const next = setRoomPhase(room, 'opening_framing');
                    updateRoomState(next);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '0.95rem 1.85rem',
                    fontSize: '1.05rem',
                    backgroundColor: 'var(--stance-support)',
                  }}
                >
                  Begin Session →
                </button>
              </div>
            </div>
          </div>
        ) : room.phase === 'opening_framing' ? (
          /* =================================================================
             OPENING FRAMING PHASE: Built-in 3-Slide Framing Deck
             ================================================================= */
          <FramingSlides
            mode="opening"
            room={room}
            onSelectSlide={(index) => {
              const next = setFramingSlideIndex(room, index);
              updateRoomState(next);
            }}
            onComplete={() => {
              const next = setRoomPhase(room, 'voting');
              updateRoomState(next);
            }}
            onBack={() => {
              const next = setRoomPhase(room, 'lobby');
              updateRoomState(next);
            }}
          />
        ) : room.phase === 'currents_framing' ? (
          /* =================================================================
             CURRENTS FRAMING PHASE: Built-in 5-Slide Current Deep-Dive Deck
             ================================================================= */
          <FramingSlides
            mode="currents"
            room={room}
            onSelectSlide={(index) => {
              const next = setFramingSlideIndex(room, index);
              updateRoomState(next);
            }}
            onComplete={() => {
              const next = setRoomPhase(room, 'currents_workshop');
              updateRoomState(next);
            }}
            onBack={() => {
              const next = setRoomPhase(room, 'revealed');
              updateRoomState(next);
            }}
          />
        ) : room.phase === 'currents_workshop' ? (
          /* =================================================================
             WORKSHOP PHASE: The Four Currents Offsite Synthesis
             ================================================================= */
          <CurrentsWorkshop
            room={room}
            onSetWorkshopStage={(stage) => {
              const next = setWorkshopStage(room, stage);
              updateRoomState(next);
            }}
            onToggleEndorsement={(proposalId) => {
              const next = toggleProposalEndorsement(room, 'host', proposalId);
              updateRoomState(next);
            }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stage Header: Category Pill, Card Counter, Prev Navigation */}
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

              <div>
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
                      <SparkIcon size={16} />
                      <span>What if?</span>
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
                  <h3 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
                    Pebbles are Being Placed...
                  </h3>
                  <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
                    Participants are reading the scenario on their phones and casting their stance: Supports, It Depends, or Erodes.
                  </p>
                </div>

                {/* Live Anonymous Pebble Tray */}
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
                      Waiting for initial votes from the room...
                    </span>
                  ) : (
                    currentRound &&
                    Object.values(currentRound.votes).map((vote, idx) => {
                      const participant = room.participants[vote.clientId];
                      return (
                        <Pebble
                          key={vote.clientId || idx}
                          variant={participant?.pebbleVariant ?? (idx % 5)}
                          stance="neutral"
                          size="md"
                          className="animate-pebble-drop"
                          label={participant ? participant.name.slice(0, 2).toUpperCase() : `P${idx + 1}`}
                          title={`${participant?.name || 'Voter'} placed their stone`}
                        />
                      );
                    })
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
              /* Response Graph & Compact Facilitator Discussion Bar */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 3 Stance Columns Graph */}
                <div className="card-tabletop">
                  <ResponseGraph
                    round={currentRound}
                    participants={room.participants}
                    showNotes={true}
                  />
                </div>

                {/* Compact Integrated Facilitator Discussion Bar */}
                {currentCard && (
                  <div
                    className="card-tabletop"
                    style={{
                      borderLeft: '4px solid var(--stance-support)',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--stance-support-text)',
                          }}
                        >
                          Facilitator Discussion Prompt
                        </span>
                        <h3 style={{ fontSize: '1.2rem', marginTop: '0.25rem', lineHeight: 1.35 }}>
                          {currentCard.discussionQuestion}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
                              padding: '0.7rem 1.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                            }}
                          >
                            <SparkIcon size={15} />
                            <span>What if?</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--stance-depends-text)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <SparkIcon size={15} />
                            <span>"What if?" Active</span>
                          </span>
                        )}

                        <button
                          id="advance-scenario-btn"
                          onClick={handleNextScenario}
                          className="btn-primary"
                          style={{ padding: '0.7rem 1.3rem' }}
                        >
                          {isLastCard ? 'Introduce The Four Currents →' : 'Next Scenario →'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Popover / Modal for Latecomer QR Code */}
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
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
              title="Close QR modal"
            >
              <CloseIcon size={16} />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
