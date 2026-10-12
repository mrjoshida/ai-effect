import React, { useState } from 'react';
import { computeCurrentsSynthesis, formatWorkshopMarkdown } from '../state/roomEngine';
import {
  RithmCurrentId,
  RoomState,
  WorkshopIdeaGroup,
  WorkshopProposal,
  WorkshopStage,
} from '../types/game';
import { Pebble } from './Pebble';
import { CheckIcon, CopyIcon, ExternalLinkIcon, SparkIcon } from './Icons';

export interface CurrentsWorkshopProps {
  room: RoomState;
  onSetWorkshopStage?: (stage: WorkshopStage) => void;
  onToggleEndorsement?: (proposalId: string) => void;
  onToggleGroupEndorsement?: (groupId: string) => void;
  onUpdateCommitment: (currentId: RithmCurrentId, text: string) => void;
  onBackToScenarios?: () => void;
}

export const CurrentsWorkshop: React.FC<CurrentsWorkshopProps> = ({
  room,
  onSetWorkshopStage,
  onToggleEndorsement,
  onToggleGroupEndorsement,
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

  const hasAiGroups =
    room.workshopGroupingStatus === 'grouped' &&
    Object.keys(room.workshopIdeaGroups || {}).length > 0;

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
        <div style={{ maxWidth: '760px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--currents-teal)',
              }}
            >
              The Four Currents Brainstorm
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0' }}>
            {stage === 'small_groups'
              ? 'Stage 1: Group Brainstorm'
              : 'Stage 2: Full-Group Share & Vote'}
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--ink-secondary)', margin: 0, maxWidth: '760px' }}>
            {stage === 'small_groups'
              ? 'Small groups pick a Current and share ideas from their phones for how we could navigate it in our work and relationships.'
              : 'Review ideas across all Four Currents and +1 the ones that resonate most.'}
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
                fontSize: '0.9rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              1. Group Brainstorm
            </button>
            <button
              id="stage-large-group-btn"
              onClick={() => onSetWorkshopStage?.('large_group')}
              className={stage === 'large_group' ? 'btn-primary' : 'btn-ghost'}
              style={{
                fontSize: '0.9rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              2. Share &amp; Vote
            </button>
          </div>

          {/* Copy Takeaways Button */}
          <button
            id="copy-workshop-md-btn"
            onClick={handleCopyMarkdown}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Copy synthesized takeaways as markdown"
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            <span>{copied ? 'Copied Takeaways!' : 'Copy Takeaways'}</span>
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

      {/* Visual Indicator While AI Is Grouping */}
      {stage === 'large_group' && room.workshopGroupingStatus === 'grouping' && (
        <div
          id="ai-grouping-indicator"
          className="card-tabletop animate-pebble-drop"
          style={{
            padding: '1.25rem 1.5rem',
            borderLeft: '5px solid var(--currents-teal)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            backgroundColor: 'var(--currents-teal-tint)',
            border: '1px solid var(--currents-teal-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="animate-pulse" style={{ display: 'inline-flex' }}>
              <Pebble variant={0} stance="support" size="md" />
            </span>
            <span className="animate-pulse" style={{ display: 'inline-flex', animationDelay: '150ms' }}>
              <Pebble variant={1} stance="neutral" size="sm" />
            </span>
            <SparkIcon size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: '0 0 0.2rem 0', color: 'var(--currents-teal)' }}>
              Grouping Similar Ideas...
            </h3>
            <p style={{ fontSize: '0.98rem', color: 'var(--ink-secondary)', margin: 0 }}>
              Synthesizing overlapping ideas into shared themes across the Four Currents while keeping every original note intact...
            </p>
          </div>
        </div>
      )}

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
          const proposals: WorkshopProposal[] = bucket.proposals || [];
          const groups: WorkshopIdeaGroup[] = bucket.ideaGroups || [];

          const maxGroupVotes = groups.reduce(
            (max, g) => Math.max(max, g.endorsements?.length || 0),
            0
          );

          const maxProposalVotes = proposals.reduce(
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
                      fontSize: '0.86rem',
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
                <h3 style={{ fontSize: '1.32rem', margin: '0 0 0.2rem 0', lineHeight: 1.25 }}>
                  {current.title}
                </h3>
              </div>

              {/* Ideas Stream in Each Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                {stage === 'small_groups' ? (
                  /* =========================================================
                     STAGE 1: Small Groups Idea Generation (No voting)
                     ========================================================= */
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Ideas ({proposals.length})
                      </span>
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
                          fontSize: '0.92rem',
                          fontStyle: 'italic',
                        }}
                      >
                        Waiting for ideas from participant phones...
                      </div>
                    ) : (
                      proposals.map((p) => {
                        const showBadge = p.type === 'protect' || p.type === 'automate';
                        return (
                          <div key={p.id} className="workshop-proposal-card">
                            {showBadge && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                <span className={`badge-proposal ${p.type === 'protect' ? 'protect' : 'automate'}`}>
                                  {p.type === 'protect' ? 'Protect & Build' : 'Automate for Time'}
                                </span>
                              </div>
                            )}

                            <p
                              style={{
                                fontSize: '1.04rem',
                                color: 'var(--ink-primary)',
                                lineHeight: 1.45,
                                margin: 0,
                                fontWeight: 500,
                              }}
                            >
                              "{p.text}"
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                marginTop: '0.25rem',
                                fontSize: '0.86rem',
                                color: 'var(--ink-secondary)',
                                fontStyle: 'italic',
                              }}
                            >
                              — {p.authorName}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                ) : (
                  /* =========================================================
                     STAGE 2: Large Group Share & Vote
                     ========================================================= */
                  hasAiGroups ? (
                    /* Case A: AI Affinity Groups Active */
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          Idea Themes ({groups.length})
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--currents-teal)', fontWeight: 600 }}>
                          Sorted by +1s
                        </span>
                      </div>

                      {groups.length === 0 ? (
                        <div
                          style={{
                            padding: '1.25rem 0.75rem',
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-card-subtle)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px dashed var(--border-default)',
                            color: 'var(--ink-muted)',
                            fontSize: '0.92rem',
                            fontStyle: 'italic',
                          }}
                        >
                          No idea themes for this Current.
                        </div>
                      ) : (
                        groups.map((group) => {
                          const memberProposals = group.proposalIds
                            .map((id) => room.workshopProposals?.[id])
                            .filter(Boolean) as WorkshopProposal[];
                          const isTop =
                            maxGroupVotes > 0 &&
                            (group.endorsements?.length || 0) === maxGroupVotes;

                          const showVerbatimList =
                            memberProposals.length > 1 ||
                            (memberProposals[0] && memberProposals[0].text !== group.themeTitle);

                          return (
                            <div
                              key={group.id}
                              className={`workshop-proposal-card ${isTop ? 'ratified' : ''}`}
                              style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
                            >
                              {/* Top Badge Row */}
                              {memberProposals.length > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span
                                    style={{
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: 'var(--radius-full)',
                                      backgroundColor: 'var(--bg-tray)',
                                      color: 'var(--ink-secondary)',
                                      border: '1px solid var(--border-default)',
                                    }}
                                  >
                                    {memberProposals.length} related ideas
                                  </span>
                                </div>
                              )}

                              {/* Main Theme Title */}
                              <h4
                                style={{
                                  fontSize: '1.1rem',
                                  margin: '0.1rem 0',
                                  color: 'var(--ink-primary)',
                                  fontWeight: 600,
                                  lineHeight: 1.35,
                                }}
                              >
                                {group.themeTitle}
                              </h4>

                              {/* Nested Verbatim Sub-Ideas */}
                              {showVerbatimList ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.45rem',
                                    backgroundColor: 'var(--bg-tray)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.55rem 0.7rem',
                                    marginTop: '0.15rem',
                                    fontSize: '0.92rem',
                                    lineHeight: 1.4,
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                >
                                  {memberProposals.map((mp) => (
                                    <div key={mp.id} style={{ color: 'var(--ink-secondary)', lineHeight: 1.4 }}>
                                      "{mp.text}" <span style={{ fontStyle: 'italic', color: 'var(--ink-muted)' }}>— {mp.authorName}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                memberProposals[0] && (
                                  <div style={{ fontSize: '0.86rem', color: 'var(--ink-secondary)', fontStyle: 'italic' }}>
                                    — {memberProposals[0].authorName}
                                  </div>
                                )
                              )}

                              {/* Bottom Row: +1 Vote Button */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                                <button
                                  id={`endorse-group-btn-${group.id}`}
                                  onClick={() => onToggleGroupEndorsement?.(group.id)}
                                  className="btn-ghost"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.25rem 0.7rem',
                                    backgroundColor: 'var(--bg-tray)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.88rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    border: '1px solid var(--border-default)',
                                  }}
                                  title="Vote +1 on this idea theme"
                                >
                                  <Pebble variant={1} stance="support" size="sm" />
                                  <span>+1 • {group.endorsements?.length || 0}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  ) : (
                    /* Case B: AI Unavailable -> Voting Directly on Proposals */
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: 'var(--ink-muted)',
                          }}
                        >
                          Ideas ({proposals.length})
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--currents-teal)', fontWeight: 600 }}>
                          Sorted by +1s
                        </span>
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
                            fontSize: '0.92rem',
                            fontStyle: 'italic',
                          }}
                        >
                          No ideas submitted for this Current.
                        </div>
                      ) : (
                        proposals.map((p) => {
                          const isTop =
                            maxProposalVotes > 0 &&
                            (p.endorsements?.length || 0) === maxProposalVotes;
                          const showBadge = p.type === 'protect' || p.type === 'automate';

                          return (
                            <div
                              key={p.id}
                              className={`workshop-proposal-card ${isTop ? 'ratified' : ''}`}
                            >
                              {showBadge && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className={`badge-proposal ${p.type === 'protect' ? 'protect' : 'automate'}`}>
                                    {p.type === 'protect' ? 'Protect & Build' : 'Automate for Time'}
                                  </span>
                                </div>
                              )}

                              <p
                                style={{
                                  fontSize: '1.04rem',
                                  color: 'var(--ink-primary)',
                                  lineHeight: 1.45,
                                  margin: '0.2rem 0',
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
                                  marginTop: '0.25rem',
                                  fontSize: '0.86rem',
                                  color: 'var(--ink-secondary)',
                                }}
                              >
                                <span style={{ fontStyle: 'italic' }}>— {p.authorName}</span>

                                <button
                                  id={`endorse-btn-${p.id}`}
                                  onClick={() => onToggleEndorsement?.(p.id)}
                                  className="btn-ghost"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.25rem 0.7rem',
                                    backgroundColor: 'var(--bg-tray)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.88rem',
                                    fontFamily: 'var(--font-mono)',
                                    fontWeight: 700,
                                    border: '1px solid var(--border-default)',
                                  }}
                                  title="Vote +1 on this idea"
                                >
                                  <Pebble variant={1} stance="support" size="sm" />
                                  <span>+1 • {p.endorsements?.length || 0}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  )
                )}
              </div>

              {/* Facilitator Synthesis / Takeaway Note */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <label
                  htmlFor={`commitment-${current.id}`}
                  style={{
                    fontSize: '0.8rem',
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
                    fontSize: '0.94rem',
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
