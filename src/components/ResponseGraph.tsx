import React from 'react';
import { STANCE_META, STANCE_LIST } from '../content/scenarios';
import { computeStanceTally, computeTwistShiftDelta } from '../state/roomEngine';
import { Participant, ScenarioRoundRecord, Stance } from '../types/game';
import { Pebble } from './Pebble';
import { SparkIcon } from './Icons';

export interface ResponseGraphProps {
  round?: ScenarioRoundRecord;
  participants: Record<string, Participant>;
  showNotes?: boolean;
}

export const ResponseGraph: React.FC<ResponseGraphProps> = ({
  round,
  participants,
  showNotes = true,
}) => {
  const votes = round?.votes || {};
  const isTwistActive = Boolean(round?.twistTriggered);
  const currentTally = computeStanceTally(votes, false);
  const initialTally = computeStanceTally(votes, true);
  const delta = round
    ? computeTwistShiftDelta(round, participants)
    : {
        initialTally,
        currentTally,
        netShift: { support: 0, depends: 0, erode: 0 },
        shiftedCount: 0,
        transitions: [],
      };

  // Group votes by stance
  const votesByStance: Record<
    Stance,
    Array<{ clientId: string; name: string; variant: number; shifted?: boolean; note?: string }>
  > = {
    support: [],
    depends: [],
    erode: [],
  };

  for (const [clientId, vote] of Object.entries(votes)) {
    const participant = participants[clientId];
    const name = participant?.name || 'Guest';
    const variant = participant?.pebbleVariant ?? 0;
    const currentStance = vote.currentStance;
    const shifted = vote.shiftedInTwist || vote.initialStance !== vote.currentStance;

    if (votesByStance[currentStance]) {
      votesByStance[currentStance].push({
        clientId,
        name,
        variant,
        shifted,
        note: vote.note,
      });
    }
  }

  const formatNetShift = (val: number) => {
    if (val > 0) return `+${val}`;
    if (val < 0) return `${val}`;
    return '0';
  };

  return (
    <div className="response-graph" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Proportional Stance Bar */}
      <div className="proportional-bar-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '0.4rem',
          }}
        >
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Room Response Distribution
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            {currentTally.total} {currentTally.total === 1 ? 'response' : 'responses'}
          </span>
        </div>

        <div className="proportional-bar-track">
          {currentTally.total === 0 ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-muted)',
                fontSize: '0.8rem',
                fontStyle: 'italic',
              }}
            >
              Waiting for initial responses...
            </div>
          ) : (
            <>
              {currentTally.supportPct > 0 && (
                <div
                  className="proportional-bar-segment support"
                  style={{ width: `${currentTally.supportPct}%` }}
                  title={`Supports Connection: ${currentTally.support} (${currentTally.supportPct}%)`}
                >
                  {currentTally.supportPct >= 12 && `${currentTally.supportPct}%`}
                </div>
              )}
              {currentTally.dependsPct > 0 && (
                <div
                  className="proportional-bar-segment depends"
                  style={{ width: `${currentTally.dependsPct}%` }}
                  title={`It Depends: ${currentTally.depends} (${currentTally.dependsPct}%)`}
                >
                  {currentTally.dependsPct >= 12 && `${currentTally.dependsPct}%`}
                </div>
              )}
              {currentTally.erodePct > 0 && (
                <div
                  className="proportional-bar-segment erode"
                  style={{ width: `${currentTally.erodePct}%` }}
                  title={`Erodes Connection: ${currentTally.erode} (${currentTally.erodePct}%)`}
                >
                  {currentTally.erodePct >= 12 && `${currentTally.erodePct}%`}
                </div>
              )}
            </>
          )}
        </div>

        <div className="proportional-bar-legend" style={{ marginTop: '0.35rem' }}>
          <div className="legend-item" style={{ color: 'var(--stance-support-text)' }}>
            <span className="legend-swatch support" />
            <span>Supports ({currentTally.support})</span>
          </div>
          <div className="legend-item" style={{ color: 'var(--stance-depends-text)' }}>
            <span className="legend-swatch depends" />
            <span>It Depends ({currentTally.depends})</span>
          </div>
          <div className="legend-item" style={{ color: 'var(--stance-erode-text)' }}>
            <span className="legend-swatch erode" />
            <span>Erodes ({currentTally.erode})</span>
          </div>
        </div>
      </div>

      {/* 2. Twist Shift Banner & Delta (when Twist Triggered) */}
      {isTwistActive && (
        <div
          className="twist-shift-delta-card"
          style={{
            backgroundColor: 'var(--stance-depends-tint)',
            border: '1.5px solid var(--stance-depends-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SparkIcon size={18} style={{ color: 'var(--stance-depends-accent)' }} />
              <strong style={{ color: 'var(--stance-depends-text)', fontSize: '0.95rem' }}>
                "What If?" Context Shift Impact
              </strong>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--stance-depends-text)',
                fontWeight: 600,
              }}
            >
              {delta.shiftedCount} {delta.shiftedCount === 1 ? 'participant shifted' : 'participants shifted'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--ink-secondary)',
            }}
          >
            <div>
              <strong>Supports:</strong> {initialTally.support} → {currentTally.support} ({formatNetShift(delta.netShift.support)})
            </div>
            <div>
              <strong>It Depends:</strong> {initialTally.depends} → {currentTally.depends} ({formatNetShift(delta.netShift.depends)})
            </div>
            <div>
              <strong>Erodes:</strong> {initialTally.erode} → {currentTally.erode} ({formatNetShift(delta.netShift.erode)})
            </div>
          </div>

          {delta.transitions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
              {delta.transitions.map((t, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: '#FFFDF9',
                    border: '1px solid var(--stance-depends-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.2rem 0.65rem',
                    fontSize: '0.78rem',
                    color: 'var(--ink-primary)',
                  }}
                >
                  <strong>{t.name}:</strong> {STANCE_META[t.from].shortLabel} →{' '}
                  <span style={{ fontWeight: 700, color: 'var(--stance-depends-text)' }}>
                    {STANCE_META[t.to].shortLabel}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Three Stance Columns with Pebble Clusters & Notes */}
      <div
        className="stance-columns-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        {STANCE_LIST.map((meta) => {
          const stanceKey = meta.id;
          const stanceVotes = votesByStance[stanceKey];
          const count = stanceVotes.length;
          const isSupport = stanceKey === 'support';
          const isDepends = stanceKey === 'depends';
          const borderColor = isSupport
            ? 'var(--stance-support-border)'
            : isDepends
            ? 'var(--stance-depends-border)'
            : 'var(--stance-erode-border)';
          const tintColor = isSupport
            ? 'var(--stance-support-tint)'
            : isDepends
            ? 'var(--stance-depends-tint)'
            : 'var(--stance-erode-tint)';
          const titleColor = isSupport
            ? 'var(--stance-support-text)'
            : isDepends
            ? 'var(--stance-depends-text)'
            : 'var(--stance-erode-text)';

          return (
            <div
              key={stanceKey}
              className={`stance-column ${stanceKey}`}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `1.5px solid ${borderColor}`,
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h4 style={{ color: titleColor, fontSize: '1.05rem', margin: 0 }}>
                    {meta.label}
                  </h4>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      backgroundColor: tintColor,
                      color: titleColor,
                      padding: '0.15rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    {count}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', margin: 0 }}>
                  {meta.subtitle}
                </p>
              </div>

              {/* Clustered Pebbles */}
              <div
                className="pebble-cluster-tray"
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  minHeight: '80px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  alignItems: 'center',
                  alignContent: 'flex-start',
                  boxShadow: 'inset 0 1px 3px rgba(31, 28, 24, 0.06)',
                }}
              >
                {count === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                    No pebbles placed yet
                  </span>
                ) : (
                  stanceVotes.map((v) => (
                    <Pebble
                      key={v.clientId}
                      variant={v.variant}
                      stance={stanceKey}
                      size="sm"
                      label={v.name.slice(0, 2).toUpperCase()}
                      title={`${v.name}${v.shifted ? ' (Shifted in twist)' : ''}${v.note ? `: "${v.note}"` : ''}`}
                      shifted={v.shifted}
                      className="animate-pebble-drop"
                    />
                  ))
                )}
              </div>

              {/* 1-Line Notes */}
              {showNotes && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', letterSpacing: '0.04em' }}>
                    Participant Notes
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {stanceVotes.filter((v) => Boolean(v.note)).length === 0 ? (
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                        No notes shared
                      </span>
                    ) : (
                      stanceVotes
                        .filter((v) => Boolean(v.note))
                        .map((v) => (
                          <div
                            key={v.clientId}
                            style={{
                              backgroundColor: 'var(--bg-card-subtle)',
                              borderLeft: `3px solid ${borderColor}`,
                              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              lineHeight: 1.35,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--ink-primary)' }}>
                              {v.name}:
                            </span>{' '}
                            <span style={{ color: 'var(--ink-secondary)', fontStyle: 'italic' }}>
                              "{v.note}"
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
