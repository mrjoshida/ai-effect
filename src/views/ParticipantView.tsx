import React, { useEffect, useState } from 'react';
import { Pebble } from '../components/Pebble';
import { getCurrentMeta } from '../content/currents';
import { CATEGORY_META, STANCE_LIST, STANCE_META } from '../content/scenarios';
import { computeStanceTally } from '../state/roomEngine';
import { ClientRoomChannel } from '../utils/roomSync';
import { RithmCurrentId, RoomState, Stance } from '../types/game';

export interface ParticipantViewProps {
  room: RoomState | null;
  channel: ClientRoomChannel;
  clientId: string;
  initialName?: string;
  onExit?: () => void;
}

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  room,
  channel,
  clientId,
  initialName = '',
  onExit,
}) => {
  const [userName, setUserName] = useState(initialName);
  const [isEditingName, setIsEditingName] = useState(!initialName);
  const [showFullScenario, setShowFullScenario] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  // Sync initial name or participant name if present in room
  useEffect(() => {
    if (room && room.participants[clientId]?.name) {
      setUserName(room.participants[clientId].name);
      setIsEditingName(false);
    }
  }, [room, clientId]);

  const participant = room?.participants[clientId];
  const pebbleVariant = participant?.pebbleVariant ?? 0;
  const currentScenario =
    room && room.scenarios[room.currentScenarioIndex] ? room.scenarios[room.currentScenarioIndex] : null;
  const currentRound = currentScenario && room ? room.rounds[currentScenario.id] : undefined;
  const myVote = currentRound?.votes[clientId];
  const activeStance = myVote?.currentStance;

  // Sync note from current vote if present (and reset when switching scenarios)
  useEffect(() => {
    if (myVote?.note !== undefined) {
      setNoteText(myVote.note);
      if (myVote.note) {
        setShowNoteField(true);
      }
    } else {
      setNoteText('');
      setShowNoteField(false);
    }
    // Reset full scenario collapse on card change
    setShowFullScenario(false);
  }, [room?.currentScenarioIndex, currentScenario?.id, myVote?.note]);

  const handleSaveName = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = userName.trim() || 'Guest';
    setUserName(cleanName);
    setIsEditingName(false);
    channel.sendJoin(cleanName);
  };

  const handleVote = (stance: Stance) => {
    if (!currentScenario) return;
    channel.sendVote(currentScenario.id, stance, noteText.trim() || undefined);
  };

  const handleSaveNote = () => {
    if (!currentScenario || !activeStance) return;
    channel.sendVote(currentScenario.id, activeStance, noteText.trim() || undefined);
  };

  if (!room) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: 'var(--max-width-mobile)',
          margin: '0 auto',
        }}
      >
        <Pebble variant={0} stance="neutral" size="lg" className="animate-pulse" />
        <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Connecting to Workshop...</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
          Syncing with room session. Make sure your internet connection is active.
        </p>
      </div>
    );
  }

  const phase = room.phase;
  const totalScenarios = room.scenarios.length;
  const currentIndex = room.currentScenarioIndex + 1;
  const isTwist = phase === 'twist';
  const isRevealed = phase === 'revealed' || phase === 'twist';
  const tally = currentRound ? computeStanceTally(currentRound.votes, false) : null;
  const currentMeta = currentScenario ? getCurrentMeta(currentScenario.currentId) : null;
  const categoryMeta = currentScenario ? CATEGORY_META[currentScenario.category] : null;

  return (
    <div
      className="participant-view"
      style={{
        maxWidth: 'var(--max-width-mobile)',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '1rem',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* 1. Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.75rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Pebble
            variant={pebbleVariant}
            stance={activeStance || 'neutral'}
            size="sm"
            label={userName.slice(0, 2).toUpperCase() || 'ME'}
          />
          {isEditingName ? (
            <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '0.3rem' }}>
              <input
                id="participant-name-input"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                autoFocus
                maxLength={20}
                style={{
                  width: '100px',
                  padding: '0.2rem 0.4rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                }}
              />
              <button
                id="save-name-btn"
                type="submit"
                className="btn-primary"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
              >
                Save
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: 'var(--ink-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="Click to change your name"
            >
              <span>{userName || 'Guest'}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>✎</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: 'var(--bg-tray)',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--ink-secondary)',
            }}
          >
            {room.code}
          </span>
          {onExit && (
            <button
              onClick={onExit}
              style={{
                fontSize: '0.8rem',
                color: 'var(--ink-muted)',
                padding: '0.2rem 0.4rem',
              }}
              title="Exit room"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* 2. State-specific views */}
      {phase === 'lobby' ? (
        /* Lobby State */
        <div
          className="card-tabletop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            gap: '1.25rem',
            margin: 'auto 0',
          }}
        >
          <Pebble
            variant={pebbleVariant}
            stance="neutral"
            size="lg"
            className="animate-pebble-drop"
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              You're at the table!
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              Welcome, <strong>{userName || 'friend'}</strong>. Waiting for the facilitator to draw the first card on the main screen.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-tray)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
              border: '1px solid var(--border-subtle)',
              width: '100%',
            }}
          >
            Keep your phone awake. As cards are revealed, you will cast your vote and explore how AI touches human connection.
          </div>
        </div>
      ) : phase === 'currents_workshop' ? (
        /* Workshop State */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div className="card-tabletop" style={{ borderLeft: '4px solid var(--currents-teal)' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--currents-teal)',
                textTransform: 'uppercase',
              }}
            >
              Offsite Debrief
            </span>
            <h2 style={{ fontSize: '1.35rem', marginTop: '0.25rem', marginBottom: '0.4rem' }}>
              Navigating The Four Currents
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
              Follow along on the main screen as the team synthesizes our boundaries and captures shared commitments.
            </p>
          </div>

          {/* 4 Currents Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(['current-01', 'current-02', 'current-03', 'current-04'] as RithmCurrentId[]).map((cid) => {
              const meta = getCurrentMeta(cid);
              const commitment = room.currentCommitments[cid];

              return (
                <div
                  key={cid}
                  className="card-tabletop"
                  style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--currents-teal)' }}>
                      {meta.number}
                    </span>
                    <a href={meta.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem' }}>
                      Guide ↗
                    </a>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{meta.title}</h4>
                  <p style={{ fontSize: '0.82rem', fontStyle: 'italic', margin: 0 }}>
                    "{meta.subtitle}"
                  </p>
                  {commitment && (
                    <div
                      style={{
                        backgroundColor: 'var(--currents-teal-tint)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.82rem',
                        borderLeft: '3px solid var(--currents-teal)',
                        marginTop: '0.3rem',
                      }}
                    >
                      <strong>Team Norm:</strong> "{commitment}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Active Voting / Revealed / Twist State */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card counter & Category */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {categoryMeta && (
              <span
                className="badge-category"
                style={{
                  backgroundColor: categoryMeta.surfaceTint,
                  color: categoryMeta.accentColor,
                  border: `1px solid ${categoryMeta.accentColor}33`,
                }}
              >
                {categoryMeta.shortLabel}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Card {currentIndex} of {totalScenarios}
            </span>
          </div>

          {/* Scenario Dilemma (Eyes-Up Anchor) */}
          {currentScenario && (
            <div className="card-tabletop" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{currentScenario.title}</h3>
              <p style={{ fontSize: '0.94rem', lineHeight: 1.45, color: 'var(--ink-primary)', fontWeight: 500 }}>
                {currentScenario.mobileSummary}
              </p>

              <div>
                <button
                  id="read-full-scenario-btn"
                  onClick={() => setShowFullScenario(!showFullScenario)}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--currents-teal)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{showFullScenario ? 'Hide full scenario' : 'Read full scenario'}</span>
                  <span>{showFullScenario ? '▲' : '▼'}</span>
                </button>

                {showFullScenario && (
                  <div
                    style={{
                      marginTop: '0.6rem',
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.86rem',
                      lineHeight: 1.45,
                      color: 'var(--ink-secondary)',
                      fontFamily: 'var(--font-serif)',
                    }}
                  >
                    {currentScenario.prompt}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* "What If?" Twist Alert Banner */}
          {isTwist && currentScenario && (
            <div className="twist-banner animate-pebble-drop">
              <div className="twist-banner-title">
                <span>⚡</span>
                <span>Context Shift ("What If?")</span>
              </div>
              <div className="twist-banner-body" style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>
                {currentScenario.twist}
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--stance-depends-text)', fontWeight: 600, margin: 0 }}>
                Does your stance hold, or does it shift? Tap a card below to update your vote!
              </p>
            </div>
          )}

          {/* Stance Voting Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {STANCE_LIST.map((meta) => {
              const stanceId = meta.id;
              const isSelected = activeStance === stanceId;
              const buttonId =
                stanceId === 'support'
                  ? 'vote-support-btn'
                  : stanceId === 'depends'
                  ? 'vote-depends-btn'
                  : 'vote-erode-btn';

              return (
                <button
                  key={stanceId}
                  id={buttonId}
                  onClick={() => handleVote(stanceId)}
                  className={`stance-card-btn ${stanceId} ${isSelected ? 'active' : ''}`}
                  aria-pressed={isSelected}
                >
                  <div className="stance-header-row">
                    <span className="stance-title">{meta.label}</span>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        ✓ Placed
                      </span>
                    )}
                  </div>
                  <span className="stance-subtitle">{meta.subtitle}</span>
                </button>
              );
            })}
          </div>

          {/* Optional 1-line note field */}
          <div style={{ marginTop: '0.25rem' }}>
            {!showNoteField ? (
              <button
                onClick={() => setShowNoteField(true)}
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>+ Add a 1-line thought for the room (optional)</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  backgroundColor: 'var(--bg-card)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    htmlFor="vote-note-input"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-secondary)' }}
                  >
                    1-Line Thought for the Room:
                  </label>
                  <button
                    onClick={() => setShowNoteField(false)}
                    style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    id="vote-note-input"
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Why this stance? (optional)"
                    maxLength={140}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    id="save-vote-note-btn"
                    onClick={handleSaveNote}
                    className="btn-primary"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    Share
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Revealed Room Insights & The Current (when revealed or twist) */}
          {isRevealed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {/* Room Bar */}
              {tally && tally.total > 0 && (
                <div className="card-tabletop" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                      Room Responses ({tally.total})
                    </span>
                  </div>
                  <div className="proportional-bar-track" style={{ height: '16px' }}>
                    {tally.supportPct > 0 && (
                      <div className="proportional-bar-segment support" style={{ width: `${tally.supportPct}%` }}>
                        {tally.supportPct >= 15 && `${tally.supportPct}%`}
                      </div>
                    )}
                    {tally.dependsPct > 0 && (
                      <div className="proportional-bar-segment depends" style={{ width: `${tally.dependsPct}%` }}>
                        {tally.dependsPct >= 15 && `${tally.dependsPct}%`}
                      </div>
                    )}
                    {tally.erodePct > 0 && (
                      <div className="proportional-bar-segment erode" style={{ width: `${tally.erodePct}%` }}>
                        {tally.erodePct >= 15 && `${tally.erodePct}%`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rithm Current Insight Card */}
              {currentMeta && (
                <div
                  className="card-tabletop"
                  style={{
                    padding: '1rem',
                    borderLeft: '4px solid var(--currents-teal)',
                    backgroundColor: 'var(--currents-teal-tint)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--currents-teal)' }}>
                      {currentMeta.number}
                    </span>
                    <a href={currentMeta.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem' }}>
                      Learn More ↗
                    </a>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', margin: 0, marginBottom: '0.25rem' }}>
                    {currentMeta.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {currentMeta.pullDescription}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
