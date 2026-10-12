import React from 'react';
import { CATEGORY_META } from '../content/scenarios';
import { computeCurrentsSynthesis } from '../state/roomEngine';
import { RoomState } from '../types/game';
import { ExternalLinkIcon, SparkIcon, WaveIcon } from './Icons';

export interface FramingSlidesProps {
  mode: 'opening' | 'currents';
  room: RoomState;
  onSelectSlide: (index: number) => void;
  onComplete: () => void;
  onBack?: () => void;
}

export const FramingSlides: React.FC<FramingSlidesProps> = ({
  mode,
  room,
  onSelectSlide,
  onComplete,
  onBack,
}) => {
  const activeSlide = room.framingSlideIndex ?? 0;
  const synthesis = computeCurrentsSynthesis(room);

  // ---------------------------------------------------------------------------
  // MODE: OPENING FRAMING (1 Slide)
  // ---------------------------------------------------------------------------
  if (mode === 'opening') {
    const totalSlides = 1;

    return (
      <div
        className="framing-slides-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          width: '100%',
          maxWidth: 'var(--max-width-stage)',
          margin: '0 auto',
        }}
      >
        {/* Navigation Bar */}
        <div
          className="card-tabletop"
          style={{
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--currents-teal)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Session Framing
            </span>
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="prev-slide-btn"
              onClick={() => onBack?.()}
              className="btn-secondary"
              style={{ fontSize: '0.92rem', padding: '0.45rem 1.1rem' }}
            >
              ← Lobby
            </button>
            <button
              id="complete-framing-btn"
              onClick={onComplete}
              className="btn-primary"
              style={{
                fontSize: '0.92rem',
                padding: '0.45rem 1.1rem',
                backgroundColor: 'var(--stance-support)',
              }}
            >
              Start Scenario 1 →
            </button>
          </div>
        </div>

        {/* Single Focused Slide */}
        <div
          className="card-tabletop animate-pebble-drop"
          style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            borderTop: '5px solid var(--stance-support)',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.92rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--stance-support-text)',
              }}
            >
              Session Framing
            </span>
            <h1 style={{ fontSize: '2.65rem', margin: '0.4rem 0 0.8rem 0', lineHeight: 1.2 }}>
              AI and Our Human Relationships
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.32rem',
                color: 'var(--ink-secondary)',
                lineHeight: 1.55,
                maxWidth: '1040px',
                margin: 0,
              }}
            >
              AI is changing how quickly we work—but the deeper question is how it shapes the way we relate to one another. In this session, we'll dig deep into the impact of AI on our human relationships: where it supports connection, where it quietly erodes it, and how we protect what matters most.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1.75rem',
                borderLeft: '4px solid var(--stance-support)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.32rem', margin: '0 0 0.45rem 0', color: 'var(--stance-support-text)' }}>
                1. Empathy — Genuine Human Presence
              </h3>
              <p style={{ fontSize: '1.06rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                Showing up for one another with real compassion and care. Empathy cannot be simulated or outsourced to automated systems.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1.75rem',
                borderLeft: '4px solid var(--stance-depends)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.32rem', margin: '0 0 0.45rem 0', color: 'var(--stance-depends-text)' }}>
                2. Judgment — Ethical &amp; Contextual Discernment
              </h3>
              <p style={{ fontSize: '1.06rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                Working through complex ethical trade-offs, creative choices, and human nuance together rather than defaulting to an algorithm.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1.75rem',
                borderLeft: '4px solid var(--currents-teal)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.32rem', margin: '0 0 0.45rem 0', color: 'var(--currents-teal)' }}>
                3. Trust — Earned Credibility
              </h3>
              <p style={{ fontSize: '1.06rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                Building and maintaining trust with colleagues, partners, and communities through honesty, transparency, and vulnerability.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem 1.75rem',
                borderLeft: '4px solid var(--stance-erode)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <h3 style={{ fontSize: '1.32rem', margin: '0 0 0.45rem 0', color: 'var(--stance-erode-text)' }}>
                4. Relationships — Interpersonal Bonds
              </h3>
              <p style={{ fontSize: '1.06rem', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
                Nurturing the mutual respect, shared experiences, and human connections at the heart of our work and lives.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              id="start-scenario-1-bottom-btn"
              onClick={onComplete}
              className="btn-primary"
              style={{
                fontSize: '1.05rem',
                padding: '0.75rem 1.65rem',
                backgroundColor: 'var(--stance-support)',
              }}
            >
              Start Scenario 1 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MODE: CURRENTS FRAMING (5 Slides)
  // ---------------------------------------------------------------------------
  const totalSlides = 5;
  const currentsSlideLabels = [
    'The 4 Currents',
    'Current 01: Trust',
    'Current 02: Relationships',
    'Current 03: Inner Voice',
    'Current 04: Acting for Us',
  ];

  return (
    <div
      className="framing-slides-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: 'var(--max-width-stage)',
        margin: '0 auto',
      }}
    >
      {/* Navigation Bar */}
      <div
        className="card-tabletop"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <WaveIcon size={16} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--currents-teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            The Four Currents Reveal
          </span>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <span style={{ fontSize: '0.84rem', color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)' }}>
            Slide {activeSlide + 1} of {totalSlides}
          </span>
        </div>

        {/* Slide Pill Tabs */}
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
          {currentsSlideLabels.map((label, idx) => (
            <button
              key={idx}
              id={`currents-slide-tab-${idx}`}
              onClick={() => onSelectSlide(idx)}
              className={activeSlide === idx ? 'btn-primary' : 'btn-ghost'}
              style={{
                fontSize: '0.86rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stepper Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            id="prev-slide-btn"
            onClick={() => {
              if (activeSlide > 0) onSelectSlide(activeSlide - 1);
              else onBack?.();
            }}
            className="btn-secondary"
            style={{ fontSize: '0.92rem', padding: '0.45rem 1.1rem' }}
          >
            ← Prev
          </button>
          {activeSlide < totalSlides - 1 ? (
            <button
              id="next-slide-btn"
              onClick={() => onSelectSlide(activeSlide + 1)}
              className="btn-primary"
              style={{ fontSize: '0.92rem', padding: '0.45rem 1.1rem' }}
            >
              Next →
            </button>
          ) : (
            <button
              id="complete-framing-btn"
              onClick={onComplete}
              className="btn-primary"
              style={{
                fontSize: '0.92rem',
                padding: '0.45rem 1.1rem',
                backgroundColor: 'var(--currents-teal)',
              }}
            >
              Start Brainstorm →
            </button>
          )}
        </div>
      </div>

      {/* Slide 0: Beneath the Surface: The Four Currents */}
      {activeSlide === 0 && (
        <div
          className="card-tabletop animate-pebble-drop"
          style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            borderTop: '5px solid var(--currents-teal)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--currents-teal)',
                }}
              >
                Part 2 • The Rithm Project Framework
              </span>
              <span style={{ color: 'var(--border-strong)' }}>•</span>
              <a
                href="https://aicurrents.therithmproject.org/"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: 'var(--currents-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
              >
                <span>aicurrents.therithmproject.org</span>
                <ExternalLinkIcon size={11} />
              </a>
            </div>
            <h1 style={{ fontSize: '2.65rem', margin: '0.2rem 0 0.8rem 0', lineHeight: 1.2 }}>
              The Four Currents
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.32rem',
                fontStyle: 'italic',
                color: 'var(--ink-secondary)',
                lineHeight: 1.55,
                maxWidth: '1040px',
                margin: 0,
              }}
            >
              "The tensions we just debated across those scenarios aren't isolated. Like rip currents
              beneath the surface of the ocean, four invisible dynamics quietly pull on human connection
              as AI adoption accelerates."
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {synthesis.map((bucket, idx) => (
              <div
                key={bucket.current.id}
                onClick={() => onSelectSlide(idx + 1)}
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.85rem 1.6rem',
                  minHeight: '190px',
                  border: '1.5px solid var(--border-default)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--currents-teal)',
                    textTransform: 'uppercase',
                  }}
                >
                  {bucket.current.number}
                </span>
                <h3 style={{ fontSize: '1.45rem', margin: 0, color: 'var(--ink-primary)', lineHeight: 1.25 }}>
                  {bucket.current.title}
                </h3>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', fontSize: '0.92rem', color: 'var(--currents-teal)', fontWeight: 600 }}>
                  Explore Current →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slides 1–4: One Slide per Current with Related Scenarios */}
      {activeSlide >= 1 && activeSlide <= 4 && (() => {
        const bucket = synthesis[activeSlide - 1];
        if (!bucket) return null;
        const current = bucket.current;
        const items = bucket.items;
        const playedItems = items.filter((i) => i.tally.total > 0);
        const visibleItems = playedItems.length > 0 ? playedItems : items.slice(0, 3);

        return (
          <div
            className="card-tabletop animate-pebble-drop"
            style={{
              padding: '2rem 2.25rem',
              display: 'grid',
              gridTemplateColumns: '1.1fr 1.35fr',
              gap: '2rem',
              borderTop: '5px solid var(--currents-teal)',
            }}
          >
            {/* Left Column: Current Profile & Rip-Current Dynamics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--currents-teal)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {current.number}
                  </span>
                  <a
                    href={current.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.76rem', color: 'var(--currents-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <span>aicurrents.therithmproject.org</span>
                    <ExternalLinkIcon size={10} />
                  </a>
                </div>
                <h2 style={{ fontSize: '2.15rem', margin: '0 0 0.35rem 0', lineHeight: 1.2 }}>
                  {current.title}
                </h2>
                <p style={{ fontSize: '1.12rem', fontStyle: 'italic', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.45 }}>
                  "{current.subtitle}"
                </p>
              </div>

              {/* The Rip-Current Pull */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem 1.35rem',
                  fontSize: '1.04rem',
                  lineHeight: 1.55,
                  color: 'var(--ink-primary)',
                  borderLeft: '4px solid var(--currents-teal)',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--currents-teal)' }}>
                  The Rip-Current Pull:
                </strong>
                {current.pullDescription}
              </div>

              {/* Flipping the Script Prompts */}
              <div
                style={{
                  backgroundColor: 'var(--currents-teal-tint)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem 1.35rem',
                  border: '1px solid var(--currents-teal-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '1.02rem',
                  lineHeight: 1.5,
                }}
              >
                <div>
                  <strong style={{ color: 'var(--currents-teal)' }}>Flipping the Script:</strong>{' '}
                  <span>{current.philanthropyPrompt}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--currents-teal)' }}>Protecting Connection:</strong>{' '}
                  <span>{current.protectPrompt}</span>
                </div>
              </div>
            </div>

            {/* Right Column: How This Current Showed Up in Our Scenarios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                  Related Scenarios
                </h3>
                <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                  {playedItems.length > 0
                    ? `${playedItems.length} played (${items.length} in deck)`
                    : `${items.length} ${items.length === 1 ? 'scenario' : 'scenarios'} in deck`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                {visibleItems.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-muted)', fontStyle: 'italic', backgroundColor: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
                    No scenarios from the active deck were mapped to this current.
                  </div>
                ) : (
                  visibleItems.map((item) => {
                    const played = item.tally.total > 0;
                    const roundVotes = item.round?.votes ? Object.values(item.round.votes) : [];
                    const participantNotes = roundVotes
                      .map((v) => ({ name: room.participants[v.clientId]?.name || 'Participant', note: v.note?.trim() }))
                      .filter((v): v is { name: string; note: string } => Boolean(v.note))
                      .slice(0, 2);

                    const consensusClass =
                      item.consensusType === 'green_zone'
                        ? 'green_zone'
                        : item.consensusType === 'red_line'
                        ? 'red_line'
                        : 'gray_zone';

                    const consensusText =
                      item.consensusType === 'green_zone'
                        ? 'Green Zone'
                        : item.consensusType === 'red_line'
                        ? 'Red Line'
                        : item.consensusType === 'gray_zone'
                        ? 'Split / Gray Zone'
                        : 'Unplayed';

                    return (
                      <div
                        key={item.scenario.id}
                        style={{
                          backgroundColor: 'var(--bg-card-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 1rem',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div>
                            <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                              {CATEGORY_META[item.scenario.category]?.shortLabel || item.scenario.category}
                            </span>
                            <h4 style={{ fontSize: '1.15rem', margin: '0.1rem 0 0 0' }}>
                              {item.scenario.title}
                            </h4>
                          </div>

                          {played && (
                            <span className={`badge-consensus ${consensusClass}`} style={{ fontSize: '0.7rem' }}>
                              {consensusText}
                            </span>
                          )}
                        </div>

                        <p style={{ fontSize: '0.98rem', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.45 }}>
                          {item.scenario.mobileSummary}
                        </p>

                        {/* Room Voting Results if played */}
                        {played && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <div className="proportional-bar-track" style={{ height: '12px' }}>
                              {item.tally.supportPct > 0 && (
                                <div className="proportional-bar-segment support" style={{ width: `${item.tally.supportPct}%` }} />
                              )}
                              {item.tally.dependsPct > 0 && (
                                <div className="proportional-bar-segment depends" style={{ width: `${item.tally.dependsPct}%` }} />
                              )}
                              {item.tally.erodePct > 0 && (
                                <div className="proportional-bar-segment erode" style={{ width: `${item.tally.erodePct}%` }} />
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                              <span style={{ color: 'var(--ink-muted)' }}>
                                {item.tally.support}S • {item.tally.depends}D • {item.tally.erode}E ({item.tally.total} votes)
                              </span>
                              {item.delta.shiftedCount > 0 && (
                                <span style={{ color: 'var(--stance-depends-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <SparkIcon size={10} />
                                  <span>{item.delta.shiftedCount} shifted on "What if?"</span>
                                </span>
                              )}
                            </div>

                            {/* Participant Notes */}
                            {participantNotes.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                                {participantNotes.map((pn, nIdx) => (
                                  <div
                                    key={nIdx}
                                    style={{
                                      fontSize: '0.92rem',
                                      color: 'var(--ink-secondary)',
                                      fontStyle: 'italic',
                                      backgroundColor: '#FFFDF9',
                                      padding: '0.4rem 0.65rem',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-subtle)',
                                    }}
                                  >
                                    <strong style={{ fontStyle: 'normal' }}>{pn.name}:</strong> "{pn.note}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
