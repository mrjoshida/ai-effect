import React, { useState } from 'react';
import { computeCurrentsSynthesis, formatWorkshopMarkdown } from '../state/roomEngine';
import { RithmCurrentId, RoomState, WorkshopProposal, WorkshopStage } from '../types/game';
import { Pebble } from './Pebble';
import { CheckIcon, CopyIcon, ExternalLinkIcon, SparkIcon, WaveIcon } from './Icons';

export interface CurrentsWorkshopProps {
  room: RoomState;
  onSetWorkshopStage?: (stage: WorkshopStage) => void;
  onToggleEndorsement?: (proposalId: string) => void;
  onUpdateCommitment: (currentId: RithmCurrentId, text: string) => void;
  onBackToScenarios?: () => void;
}

export const CurrentsWorkshop: React.FC<CurrentsWorkshopProps> = ({
  room,
  onSetWorkshopStage,
  onToggleEndorsement,
  onUpdateCommitment,
  onBackToScenarios,
}) => {
  const [copied, setCopied] = useState(false);
  const stage: WorkshopStage = room.workshopStage || 'small_groups';
  const synthesis = computeCurrentsSynthesis(room);

  const handleCopyMarkdown = async () => {
    const md = formatWorkshopMarkdown(room);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = md;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const consensusBadgeClass = (type: string) => {
    switch (type) {
      case 'green_zone':
        return 'badge-consensus green_zone';
      case 'red_line':
        return 'badge-consensus red_line';
      case 'gray_zone':
        return 'badge-consensus gray_zone';
      default:
        return 'badge-consensus unplayed';
    }
  };

  const consensusLabel = (type: string) => {
    switch (type) {
      case 'green_zone':
        return 'Green Zone';
      case 'red_line':
        return 'Red Line';
      case 'gray_zone':
        return 'Split';
      default:
        return 'Unplayed';
    }
  };

  return (
    <div
      className="currents-workshop-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: 'var(--max-width-stage)',
        margin: '0 auto',
      }}
    >
      {/* Top Header & Stage Switcher */}
      <div
        className="card-tabletop"
        style={{
          borderLeft: '5px solid var(--currents-teal)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <WaveIcon size={16} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--currents-teal)',
              }}
            >
              The Four Currents Workshop
            </span>
          </div>
          <h2 style={{ fontSize: '1.55rem', margin: '0 0 0.25rem 0' }}>
            {stage === 'small_groups'
              ? 'Stage 1: Small-Group Table Sprints'
              : 'Stage 2: Large-Group Share & Ratify'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', margin: 0 }}>
            {stage === 'small_groups'
              ? 'Small groups pick a Current and submit proposals from phones: what we fiercely protect vs. routine work we delegate to AI.'
              : 'Review submitted proposals across the Four Currents. Endorse high-impact commitments to ratify our team charter.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Stage Switcher Pill Bar */}
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
              id="stage-small-groups-btn"
              onClick={() => onSetWorkshopStage?.('small_groups')}
              className={stage === 'small_groups' ? 'btn-primary' : 'btn-ghost'}
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              1. Small-Group Sprints
            </button>
            <button
              id="stage-large-group-btn"
              onClick={() => onSetWorkshopStage?.('large_group')}
              className={stage === 'large_group' ? 'btn-primary' : 'btn-ghost'}
              style={{
                fontSize: '0.82rem',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              2. Large-Group Share &amp; Vote
            </button>
          </div>

          {/* Copy Charter Markdown Button */}
          <button
            id="copy-workshop-md-btn"
            onClick={handleCopyMarkdown}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Copy synthesized commitments as markdown"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? 'Copied Charter!' : 'Copy Charter (Markdown)'}</span>
          </button>

          {onBackToScenarios && (
            <button
              id="back-to-scenarios-btn"
              onClick={onBackToScenarios}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
            >
              ← Scenarios
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Currents Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {synthesis.map((bucket) => {
          const current = bucket.current;
          const playedItems = bucket.items.filter((i) => i.tally.total > 0);
          const proposals: WorkshopProposal[] = bucket.proposals || [];

          // Highest endorsements threshold for ratification in large_group stage
          const maxEndorsements = proposals.reduce(
            (max, p) => Math.max(max, p.endorsements?.length || 0),
            0
          );

          return (
            <div
              key={current.id}
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderTop: '4px solid var(--currents-teal)',
                padding: '1.25rem 1rem',
                minHeight: '520px',
              }}
            >
              {/* Column Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--currents-teal)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {current.number}
                  </span>
                  <a
                    href={current.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.74rem', color: 'var(--currents-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <span>Guide</span>
                    <ExternalLinkIcon size={10} />
                  </a>
                </div>
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.2rem 0', lineHeight: 1.25 }}>
                  {current.title}
                </h3>
                <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--ink-secondary)', margin: 0 }}>
                  "{current.subtitle}"
                </p>
              </div>

              {/* Part 1 Room Flashback Strip */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
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
                  Part 1 Room Flashback ({playedItems.length})
                </span>

                {playedItems.length === 0 ? (
                  <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                    No cards played under this current yet.
                  </span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {playedItems.map((item) => (
                      <div
                        key={item.scenario.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.76rem',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--ink-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '150px',
                          }}
                          title={item.scenario.title}
                        >
                          {item.scenario.title}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                          <span className={consensusBadgeClass(item.consensusType)} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                            {consensusLabel(item.consensusType)}
                          </span>
                          {item.delta.shiftedCount > 0 && (
                            <span
                              style={{
                                color: 'var(--stance-depends-text)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem',
                                fontSize: '0.7rem',
                              }}
                              title={`${item.delta.shiftedCount} shifted on "What if?"`}
                            >
                              <SparkIcon size={10} />
                              <span>{item.delta.shiftedCount}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Proposals Stream */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    Table Proposals ({proposals.length})
                  </span>
                  {stage === 'large_group' && proposals.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--currents-teal)', fontWeight: 600 }}>
                      Sorted by Votes
                    </span>
                  )}
                </div>

                {proposals.length === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem 0.75rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--border-default)',
                      color: 'var(--ink-muted)',
                      fontSize: '0.8rem',
                      fontStyle: 'italic',
                    }}
                  >
                    {stage === 'small_groups'
                      ? 'Waiting for table proposals from participant phones...'
                      : 'No proposals submitted for this Current.'}
                  </div>
                ) : (
                  proposals.map((p) => {
                    const isProtect = p.type === 'protect';
                    const isRatified =
                      stage === 'large_group' &&
                      maxEndorsements > 0 &&
                      (p.endorsements?.length || 0) === maxEndorsements;

                    return (
                      <div
                        key={p.id}
                        className={`workshop-proposal-card ${isRatified ? 'ratified' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge-proposal ${isProtect ? 'protect' : 'automate'}`}>
                            {isProtect ? 'Protect & Build' : 'Automate for Time'}
                          </span>
                          {isRatified && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                color: 'var(--currents-teal)',
                                textTransform: 'uppercase',
                              }}
                            >
                              Ratified Norm
                            </span>
                          )}
                        </div>

                        <p
                          style={{
                            fontSize: '0.88rem',
                            color: 'var(--ink-primary)',
                            lineHeight: 1.4,
                            margin: 0,
                            fontWeight: 500,
                          }}
                        >
                          "{p.text}"
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '0.2rem',
                            fontSize: '0.76rem',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          <span style={{ fontStyle: 'italic' }}>— {p.authorName}</span>

                          {/* Endorsement Pebble Action */}
                          <button
                            id={`endorse-btn-${p.id}`}
                            onClick={() => onToggleEndorsement?.(p.id)}
                            className="btn-ghost"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.15rem 0.5rem',
                              backgroundColor: 'var(--bg-tray)',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.76rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                            }}
                            title="Place or toggle endorsement pebble"
                          >
                            <Pebble variant={1} stance="support" size="sm" />
                            <span>{p.endorsements?.length || 0}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Optional Facilitator Synthesis / Norm Note */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <label
                  htmlFor={`commitment-${current.id}`}
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-secondary)',
                  }}
                >
                  Facilitator Synthesis Note
                </label>
                <textarea
                  id={`commitment-${current.id}`}
                  value={room.currentCommitments[current.id] || ''}
                  onChange={(e) => onUpdateCommitment(current.id, e.target.value)}
                  placeholder="Record summary commitment..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.82rem',
                    color: 'var(--ink-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
