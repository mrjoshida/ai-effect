import React, { useEffect, useState } from 'react';
import { Pebble } from '../components/Pebble';
import { getCurrentMeta } from '../content/currents';
import { CATEGORY_META, STANCE_LIST, STANCE_META } from '../content/scenarios';
import { computeStanceTally, generateAlliterativeAnimalName } from '../state/roomEngine';
import { ClientRoomChannel } from '../utils/roomSync';
import {
  RithmCurrentId,
  RoomState,
  Stance,
  WorkshopProposal,
  WorkshopProposalType,
} from '../types/game';
import {
  CheckIcon,
  ExternalLinkIcon,
  PencilIcon,
  SparkIcon,
  WaveIcon,
} from '../components/Icons';

export interface ParticipantViewProps {
  room: RoomState | null;
  channel: ClientRoomChannel;
  clientId: string;
  initialName?: string;
  onExit?: () => void;
}

const WORKSHOP_CURRENTS: Array<{ id: RithmCurrentId; tabLabel: string; title: string }> = [
  { id: 'current-01', tabLabel: '01 Trust', title: 'Our sense of trust' },
  { id: 'current-02', tabLabel: '02 AI Relationships', title: 'Relationships with AI' },
  { id: 'current-03', tabLabel: '03 Inner Voice', title: 'Our inner voice' },
  { id: 'current-04', tabLabel: '04 Acting for Us', title: 'Acting for us' },
];

export const ParticipantView: React.FC<ParticipantViewProps> = ({
  room,
  channel,
  clientId,
  initialName = '',
  onExit,
}) => {
  const [userName, setUserName] = useState(
    initialName ||
      room?.participants[clientId]?.name ||
      generateAlliterativeAnimalName(clientId)
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [showFullScenario, setShowFullScenario] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  // Workshop Form State
  const [selectedWorkshopCurrent, setSelectedWorkshopCurrent] =
    useState<RithmCurrentId>('current-01');
  const [workshopProposalType, setWorkshopProposalType] =
    useState<WorkshopProposalType>('protect');
  const [workshopProposalText, setWorkshopProposalText] = useState('');
  const [proposalAddedToast, setProposalAddedToast] = useState(false);

  const participant = room?.participants[clientId];
  const pebbleVariant = participant?.pebbleVariant ?? 0;

  const currentScenario = room ? room.scenarios[room.currentScenarioIndex] : null;
  const currentRound = currentScenario && room ? room.rounds[currentScenario.id] : null;
  const myVote = currentRound?.votes[clientId];
  const activeStance = myVote?.currentStance;

  // Reset note state when switching scenarios, and sync from room vote if already saved on server
  useEffect(() => {
    const serverNote = myVote?.note?.trim() || '';
    if (serverNote) {
      setNoteText(serverNote);
      setShowNoteField(true);
      setIsNoteSaved(true);
      setIsEditingNote(false);
    } else {
      setNoteText('');
      setShowNoteField(false);
      setIsNoteSaved(false);
      setIsEditingNote(false);
    }
    setShowFullScenario(false);
  }, [room?.currentScenarioIndex, currentScenario?.id]);

  // Keep saved note synced if updated from server on the current card
  useEffect(() => {
    if (myVote?.note !== undefined && !isEditingNote) {
      const serverNote = myVote.note.trim();
      setNoteText(serverNote);
      setIsNoteSaved(Boolean(serverNote));
      if (serverNote) {
        setShowNoteField(true);
      }
    }
  }, [myVote?.note, isEditingNote]);

  const handleSaveName = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName =
      userName.trim() ||
      room?.participants[clientId]?.name ||
      generateAlliterativeAnimalName(clientId);
    setUserName(cleanName);
    setIsEditingName(false);
    channel.sendJoin(cleanName);
  };

  const handleVote = (stance: Stance) => {
    if (!currentScenario) return;
    const cleanNote = noteText.trim();
    if (cleanNote) {
      setIsNoteSaved(true);
      setIsEditingNote(false);
    }
    channel.sendVote(currentScenario.id, stance, cleanNote || undefined);
  };

  const handleSaveNote = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentScenario) return;
    const cleanNote = noteText.trim();
    if (!cleanNote) {
      setNoteText('');
      setIsNoteSaved(false);
      setIsEditingNote(false);
      setShowNoteField(false);
      if (activeStance) {
        channel.sendVote(currentScenario.id, activeStance, undefined);
      }
      return;
    }
    setNoteText(cleanNote);
    setIsNoteSaved(true);
    setIsEditingNote(false);
    if (activeStance) {
      channel.sendVote(currentScenario.id, activeStance, cleanNote);
    }
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = workshopProposalText.trim().slice(0, 140);
    if (!cleanText) return;
    channel.sendProposal(selectedWorkshopCurrent, workshopProposalType, cleanText);
    setWorkshopProposalText('');
    setProposalAddedToast(true);
    setTimeout(() => setProposalAddedToast(false), 2200);
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
  const categoryMeta = currentScenario ? CATEGORY_META[currentScenario.category] : null;

  // Workshop-specific calculations
  const playedScenariosForCurrent = room.scenarios.filter(
    (s) => s.currentId === selectedWorkshopCurrent
  );
  const currentProposals: WorkshopProposal[] = Object.values(
    room.workshopProposals || {}
  )
    .filter((p) => p.currentId === selectedWorkshopCurrent)
    .sort((a, b) => (b.endorsements?.length || 0) - (a.endorsements?.length || 0) || b.createdAt - a.createdAt);

  const selectedCurrentMeta = getCurrentMeta(selectedWorkshopCurrent);

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
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Click to change your name"
            >
              <span>{userName}</span>
              <PencilIcon size={12} style={{ color: 'var(--ink-muted)' }} />
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
              className="btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem', color: 'var(--ink-muted)' }}
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* 2. Main content area depending on phase */}
      {phase === 'lobby' ? (
        /* Lobby State: Waiting for Facilitator */
        <div
          className="card-tabletop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            gap: '1.25rem',
          }}
        >
          <Pebble
            variant={pebbleVariant}
            stance="neutral"
            size="lg"
            className="animate-pulse"
            label={userName.slice(0, 2).toUpperCase()}
          />
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>You're at the Table</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
              Welcome, <strong>{userName}</strong>! The facilitator will begin the first scenario shortly.
            </p>
          </div>
        </div>
      ) : phase === 'opening_framing' ? (
        /* =================================================================
           OPENING FRAMING COMPANION VIEW
           ================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card-tabletop"
            style={{
              padding: '1.25rem',
              borderTop: '4px solid var(--currents-teal)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--currents-teal)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Session Framing
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--ink-muted)',
                }}
              >
                Slide {((room?.framingSlideIndex ?? 0) + 1)} of 3
              </span>
            </div>

            {(room?.framingSlideIndex ?? 0) === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.25 }}>
                  AI: Capacity for What?
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.98rem',
                    fontStyle: 'italic',
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  "The more capable our technology becomes, the more valuable the human parts of our work become."
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                  <div
                    style={{
                      padding: '0.85rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--ink-muted)',
                        display: 'block',
                        marginBottom: '0.2rem',
                      }}
                    >
                      First-Order Efficiency
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                      Automate &amp; Understand
                    </strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                      Synthesizing information, analyzing portfolios, and moving data faster.
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '0.85rem',
                      backgroundColor: 'var(--currents-teal-tint)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--currents-teal-border)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--currents-teal)',
                        display: 'block',
                        marginBottom: '0.2rem',
                      }}
                    >
                      The Real Destination
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--currents-teal)' }}>
                      Meaningful Progress
                    </strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--ink-primary)', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                      Shifting our question from "how much activity?" to "how much lasting progress together?"
                    </p>
                  </div>
                </div>
              </div>
            ) : (room?.framingSlideIndex ?? 0) === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.25 }}>
                  The Protected Human Core
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', margin: 0 }}>
                  Four uniquely human strengths we never outsource to automated systems:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--stance-support)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--stance-support-text)' }}>
                      1. Empathy
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.35 }}>
                      Preserving genuine compassion. Empathy cannot be simulated or delegated.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--stance-depends)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--stance-depends-text)' }}>
                      2. Judgment
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.35 }}>
                      Ethical reasoning, creative breakthroughs, and philosophical trade-offs remain human.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--currents-teal)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--currents-teal)' }}>
                      3. Trust
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.35 }}>
                      Earning credibility through transparency, shared accountability, and vulnerability.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.7rem 0.85rem',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--stance-erode)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.88rem', color: 'var(--stance-erode-text)' }}>
                      4. Relationships
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', margin: '0.15rem 0 0 0', lineHeight: 1.35 }}>
                      Collaborative networks and mutual respect that must never be automated.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.25 }}>
                  Our Distinctive Role
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', margin: 0 }}>
                  Where technology gives back time, we reinvest it into four human catalyst roles:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: 'var(--ink-primary)' }}>1. Steward</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>
                      Disciplined choices with finite resources.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: 'var(--ink-primary)' }}>2. Connect</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>
                      Listening to those closest to the work.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: 'var(--ink-primary)' }}>3. Amplify</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>
                      Scaling what works and lifting voices.
                    </p>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <strong style={{ fontSize: '0.86rem', color: 'var(--ink-primary)' }}>4. Anticipate</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.35 }}>
                      Looking around corners together for tomorrow.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : phase === 'currents_framing' ? (
        /* =================================================================
           CURRENTS FRAMING COMPANION VIEW
           ================================================================= */
        (() => {
          const slideIdx = room?.framingSlideIndex ?? 0;
          if (slideIdx === 0) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  className="card-tabletop"
                  style={{
                    padding: '1.25rem',
                    borderTop: '4px solid var(--currents-teal)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <WaveIcon size={14} />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--currents-teal)',
                          textTransform: 'uppercase',
                        }}
                      >
                        The Four Currents
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      Overview
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.25 }}>
                    Beneath the Surface
                  </h2>
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.92rem',
                      fontStyle: 'italic',
                      color: 'var(--ink-secondary)',
                      lineHeight: 1.45,
                      margin: 0,
                    }}
                  >
                    "Like rip currents beneath the ocean surface, four invisible dynamics pull on human connection as AI accelerates."
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {WORKSHOP_CURRENTS.map((c) => {
                      const meta = getCurrentMeta(c.id);
                      return (
                        <div
                          key={c.id}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: 'var(--bg-tray)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--currents-teal)' }}>
                            {meta.number}
                          </span>
                          <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--ink-primary)', marginTop: '0.1rem' }}>
                            {meta.title}
                          </strong>
                          <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontStyle: 'italic', margin: '0.15rem 0 0 0' }}>
                            "{meta.subtitle}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // Slide 1..4: Current Detail + Connected Scenarios
          const targetCurrentId: RithmCurrentId =
            slideIdx === 1 ? 'current-01' : slideIdx === 2 ? 'current-02' : slideIdx === 3 ? 'current-03' : 'current-04';
          const meta = getCurrentMeta(targetCurrentId);
          const connectedScenarios = room ? room.scenarios.filter((s) => s.currentId === targetCurrentId) : [];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                className="card-tabletop"
                style={{
                  padding: '1.25rem',
                  borderTop: '4px solid var(--currents-teal)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <WaveIcon size={14} />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--currents-teal)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {meta.number}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                    Slide {slideIdx + 1} of 5
                  </span>
                </div>

                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.25rem 0', lineHeight: 1.25 }}>
                    {meta.title}
                  </h2>
                  <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--ink-secondary)', margin: 0 }}>
                    "{meta.subtitle}"
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-tray)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    fontSize: '0.82rem',
                    lineHeight: 1.45,
                    borderLeft: '3px solid var(--currents-teal)',
                  }}
                >
                  <strong style={{ color: 'var(--currents-teal)', display: 'block', marginBottom: '0.15rem' }}>
                    The Rip-Current Pull:
                  </strong>
                  {meta.pullDescription}
                </div>

                {connectedScenarios.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      Connected Scenarios from Part 1
                    </span>
                    {connectedScenarios.map((s) => {
                      const round = room ? room.rounds[s.id] : null;
                      const roundTally = round ? computeStanceTally(round.votes, false) : null;
                      return (
                        <div
                          key={s.id}
                          style={{
                            padding: '0.65rem 0.75rem',
                            backgroundColor: 'var(--bg-card-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.title}</span>
                            {roundTally && roundTally.total > 0 && (
                              <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                                {roundTally.support}S / {roundTally.depends}D / {roundTally.erode}E
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.35 }}>
                            {s.mobileSummary}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : phase === 'currents_workshop' ? (
        /* =================================================================
           INTERACTIVE CURRENTS WORKSHOP ON MOBILE
           ================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Workshop Header & Current Selector Tabs */}
          <div className="card-tabletop" style={{ padding: '1rem', borderLeft: '4px solid var(--currents-teal)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <WaveIcon size={14} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--currents-teal)',
                    textTransform: 'uppercase',
                  }}
                >
                  The Four Currents Workshop
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                {selectedCurrentMeta.title}
              </h3>
            </div>

            {/* Current Selector 4 Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.4rem',
              }}
            >
              {WORKSHOP_CURRENTS.map((c) => {
                const isSelected = selectedWorkshopCurrent === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedWorkshopCurrent(c.id)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.45rem 0.5rem',
                      textAlign: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.tabLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Part 1 Room Flashback: Scenarios played for this Current */}
          {playedScenariosForCurrent.length > 0 && (
            <div
              className="card-tabletop"
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-tray)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-muted)',
                }}
              >
                Part 1 Flashback for {selectedCurrentMeta.number}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {playedScenariosForCurrent.map((s) => {
                  const round = room.rounds[s.id];
                  const roundTally = round ? computeStanceTally(round.votes, false) : null;
                  const notes = round
                    ? Object.values(round.votes)
                        .map((v) => v.note?.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <div
                      key={s.id}
                      style={{
                        backgroundColor: '#FFFDF9',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.65rem',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.title}</span>
                        {roundTally && (
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                            {roundTally.support}S / {roundTally.depends}D / {roundTally.erode}E
                          </span>
                        )}
                      </div>

                      {notes.length > 0 && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--ink-secondary)', fontStyle: 'italic' }}>
                          "{notes[0]}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Table Proposal Form */}
          <div
            className="card-tabletop"
            style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--currents-teal)',
                }}
              >
                Submit a Proposal
              </span>
              {proposalAddedToast && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--stance-support-text)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <CheckIcon size={12} />
                  <span>Added to Board!</span>
                </span>
              )}
            </div>

            {/* 2-Way Proposal Type Toggle */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.4rem',
                backgroundColor: 'var(--bg-tray)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <button
                type="button"
                onClick={() => setWorkshopProposalType('protect')}
                className={workshopProposalType === 'protect' ? 'btn-primary' : 'btn-ghost'}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.5rem',
                  justifyContent: 'center',
                  backgroundColor: workshopProposalType === 'protect' ? 'var(--stance-support)' : 'transparent',
                  color: workshopProposalType === 'protect' ? '#FFFDF9' : 'var(--ink-secondary)',
                }}
              >
                Protect &amp; Build
              </button>
              <button
                type="button"
                onClick={() => setWorkshopProposalType('automate')}
                className={workshopProposalType === 'automate' ? 'btn-primary' : 'btn-ghost'}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.5rem',
                  justifyContent: 'center',
                  backgroundColor: workshopProposalType === 'automate' ? 'var(--currents-teal)' : 'transparent',
                  color: workshopProposalType === 'automate' ? '#FFFDF9' : 'var(--ink-secondary)',
                }}
              >
                Automate for Time
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)', margin: 0, fontStyle: 'italic' }}>
              {workshopProposalType === 'protect'
                ? 'Protect the human core: human rituals, empathy, and judgment we protect against AI erosion.'
                : 'Reinvest time: routine administration and synthesis we delegate to AI to unlock human connection.'}
            </p>

            <form onSubmit={handleProposalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <input
                id="workshop-proposal-input"
                type="text"
                value={workshopProposalText}
                onChange={(e) => setWorkshopProposalText(e.target.value)}
                maxLength={140}
                placeholder={
                  workshopProposalType === 'protect'
                    ? 'e.g. Always conduct grantee discovery visits in-person'
                    : 'e.g. Automate 990 tax filing data extraction'
                }
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: '#FFFDF9',
                }}
              />

              <button
                id="submit-proposal-btn"
                type="submit"
                className="btn-primary"
                style={{
                  padding: '0.65rem',
                  fontSize: '0.88rem',
                  backgroundColor:
                    workshopProposalType === 'protect'
                      ? 'var(--stance-support)'
                      : 'var(--currents-teal)',
                }}
              >
                Add to Board →
              </button>
            </form>
          </div>

          {/* Live Cards for This Current */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--ink-muted)',
              }}
            >
              Proposals on the Board ({currentProposals.length})
            </span>

            {currentProposals.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-default)',
                  color: 'var(--ink-muted)',
                  fontSize: '0.82rem',
                  fontStyle: 'italic',
                }}
              >
                No proposals added for {selectedCurrentMeta.number} yet. Be the first to add one above!
              </div>
            ) : (
              currentProposals.map((p) => {
                const hasEndorsed = (p.endorsements || []).includes(clientId);
                const isProtect = p.type === 'protect';

                return (
                  <div key={p.id} className="workshop-proposal-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge-proposal ${isProtect ? 'protect' : 'automate'}`}>
                        {isProtect ? 'Protect & Build' : 'Automate for Time'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                        {p.authorName}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--ink-primary)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
                      "{p.text}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                      <button
                        id={`endorse-proposal-${p.id}`}
                        onClick={() => channel.sendToggleEndorsement(p.id)}
                        className="btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.75rem',
                          fontSize: '0.78rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: hasEndorsed ? 'var(--stance-support-tint)' : 'var(--bg-tray)',
                          borderColor: hasEndorsed ? 'var(--stance-support-border)' : 'var(--border-default)',
                          color: hasEndorsed ? 'var(--stance-support-text)' : 'var(--ink-primary)',
                        }}
                      >
                        <Pebble variant={1} stance={hasEndorsed ? 'support' : 'neutral'} size="sm" />
                        <span>{p.endorsements?.length || 0}</span>
                        <span style={{ fontWeight: 600 }}>{hasEndorsed ? 'Endorsed' : 'Endorse'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
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
                <SparkIcon size={16} />
                <span>What if?</span>
              </div>
              <div className="twist-banner-body" style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>
                {currentScenario.twist}
              </div>
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
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckIcon size={12} /> Placed
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
                id="add-vote-note-btn"
                onClick={() => {
                  setShowNoteField(true);
                  setIsEditingNote(true);
                }}
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--ink-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
              >
                <span>+ Add a thought</span>
              </button>
            ) : isEditingNote || !isNoteSaved ? (
              <form
                onSubmit={handleSaveNote}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  backgroundColor: 'var(--bg-card)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    htmlFor="vote-note-input"
                    style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-secondary)' }}
                  >
                    Your 1-line thought for the room
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isNoteSaved) setShowNoteField(false);
                      setIsEditingNote(false);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ink-muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>

                <input
                  id="vote-note-input"
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Needs a trusted human chaperone in the loop"
                  style={{
                    padding: '0.5rem 0.65rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                  }}
                  autoFocus
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                    {100 - noteText.length} left
                  </span>
                  <button
                    id="save-vote-note-btn"
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Attach Note
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                    Your Attached Thought
                  </span>
                  <button
                    id="edit-vote-note-btn"
                    onClick={() => setIsEditingNote(true)}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--ink-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                    title="Edit your 1-line thought"
                  >
                    <span>Edit</span>
                    <PencilIcon size={12} />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--ink-primary)',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}
                >
                  "{noteText}"
                </div>
              </div>
            )}
          </div>

          {/* Revealed Room Insights & Compact Current Title Chip */}
          {isRevealed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
              {/* Room Bar */}
              {tally && tally.total > 0 && (
                <div className="card-tabletop" style={{ padding: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
