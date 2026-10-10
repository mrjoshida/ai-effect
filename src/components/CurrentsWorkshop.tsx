import React, { useState } from 'react';
import { computeCurrentsSynthesis, formatWorkshopMarkdown } from '../state/roomEngine';
import { RithmCurrentId, RoomState } from '../types/game';
import { CheckIcon, CopyIcon, ExternalLinkIcon, SparkIcon } from './Icons';

export interface CurrentsWorkshopProps {
  room: RoomState;
  onUpdateCommitment: (currentId: RithmCurrentId, text: string) => void;
  onBackToScenarios?: () => void;
}

export const CurrentsWorkshop: React.FC<CurrentsWorkshopProps> = ({
  room,
  onUpdateCommitment,
  onBackToScenarios,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedCurrentId, setSelectedCurrentId] = useState<RithmCurrentId | 'all'>('all');
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
        return 'Green Zone (Support)';
      case 'red_line':
        return 'Red Line (Erode)';
      case 'gray_zone':
        return 'Gray Zone (Split/Depends)';
      default:
        return 'Unplayed';
    }
  };

  const filteredSynthesis =
    selectedCurrentId === 'all'
      ? synthesis
      : synthesis.filter((b) => b.current.id === selectedCurrentId);

  return (
    <div
      className="currents-workshop-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        width: '100%',
        maxWidth: 'var(--max-width-stage)',
        margin: '0 auto',
        padding: '1.5rem',
      }}
    >
      {/* Header Banner */}
      <div
        className="card-tabletop"
        style={{
          borderLeft: '5px solid var(--currents-teal)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
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
              Culminating Offsite Synthesis
            </span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <a
              href="https://aicurrents.therithmproject.org/"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.82rem', color: 'var(--currents-teal)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <span>The Four Currents Framework</span>
              <ExternalLinkIcon size={12} />
            </a>
          </div>
          <h1 style={{ fontSize: '1.9rem', marginBottom: '0.5rem' }}>
            Flipping the Script: Navigating The Four Currents
          </h1>
          <p style={{ fontSize: '0.98rem', lineHeight: 1.5 }}>
            Rather than asking <em>"What else can we automate?"</em>, this workshop maps where your team must
            fiercely protect and build human connection. Review session dilemmas below and capture your team's
            shared commitments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {onBackToScenarios && (
            <button
              id="back-to-scenarios-btn"
              onClick={onBackToScenarios}
              className="btn-secondary"
            >
              ← Back to Cards
            </button>
          )}
          <button
            id="copy-workshop-markdown-btn"
            onClick={handleCopyMarkdown}
            className="btn-primary"
            style={{ minWidth: '180px', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? (
              <>
                <CheckIcon size={16} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <CopyIcon size={16} />
                <span>Copy Summary (Markdown)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter / Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setSelectedCurrentId('all')}
          className={selectedCurrentId === 'all' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.88rem', padding: '0.5rem 1rem' }}
        >
          All 4 Currents
        </button>
        {synthesis.map((b) => (
          <button
            key={b.current.id}
            onClick={() => setSelectedCurrentId(b.current.id)}
            className={selectedCurrentId === b.current.id ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.88rem', padding: '0.5rem 1rem' }}
          >
            {b.current.number}: {b.current.title}
          </button>
        ))}
      </div>

      {/* 4 Currents Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedCurrentId === 'all' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: '1.5rem',
        }}
      >
        {filteredSynthesis.map((bucket) => {
          const current = bucket.current;
          const playedItems = bucket.items.filter((i) => i.tally.total > 0);

          return (
            <div
              key={current.id}
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderTop: '4px solid var(--currents-teal)',
              }}
            >
              {/* Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
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
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>Current Guide</span>
                    <ExternalLinkIcon size={11} />
                  </a>
                </div>
                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.35rem' }}>{current.title}</h3>
                <p style={{ fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--ink-secondary)' }}>
                  "{current.subtitle}"
                </p>
              </div>

              {/* Pull description */}
              <div
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  color: 'var(--ink-secondary)',
                  borderLeft: '3px solid var(--currents-teal-border)',
                }}
              >
                <strong>The Rip-Current Pull:</strong> {current.pullDescription}
              </div>

              {/* Scenarios Tested Under This Current */}
              <div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-muted)',
                    display: 'block',
                    marginBottom: '0.5rem',
                  }}
                >
                  Scenarios Evaluated ({playedItems.length})
                </span>

                {playedItems.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                    No scenarios played for this current yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {playedItems.map((item) => (
                      <div
                        key={item.scenario.id}
                        style={{
                          backgroundColor: 'var(--bg-card-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.75rem',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                            {item.scenario.title}
                          </span>
                          <span className={consensusBadgeClass(item.consensusType)}>
                            {consensusLabel(item.consensusType)}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: '0.75rem',
                            fontSize: '0.78rem',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--ink-secondary)',
                          }}
                        >
                          <span style={{ color: 'var(--stance-support-text)' }}>
                            {item.tally.support} Support ({item.tally.supportPct}%)
                          </span>
                          <span>•</span>
                          <span style={{ color: 'var(--stance-depends-text)' }}>
                            {item.tally.depends} Depends ({item.tally.dependsPct}%)
                          </span>
                          <span>•</span>
                          <span style={{ color: 'var(--stance-erode-text)' }}>
                            {item.tally.erode} Erode ({item.tally.erodePct}%)
                          </span>
                        </div>

                        {item.delta.shiftedCount > 0 && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--stance-depends-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <SparkIcon size={12} />
                            <span>{item.delta.shiftedCount} shifted on "What If?" twist</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reflection Prompts */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: '0.84rem',
                  lineHeight: 1.4,
                  backgroundColor: 'var(--currents-teal-tint)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--currents-teal-border)',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--currents-teal)' }}>Flipping the Script:</strong>{' '}
                  <span style={{ color: 'var(--ink-primary)' }}>{current.philanthropyPrompt}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--currents-teal)' }}>Protecting Connection:</strong>{' '}
                  <span style={{ color: 'var(--ink-primary)' }}>{current.protectPrompt}</span>
                </div>
              </div>

              {/* Interactive Norms & Commitments Capture */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: 'auto' }}>
                <label
                  htmlFor={`commitment-${current.id}`}
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: 'var(--ink-primary)',
                  }}
                >
                  Our Team Norm / Commitment
                </label>
                <textarea
                  id={`commitment-${current.id}`}
                  value={room.currentCommitments[current.id] || ''}
                  onChange={(e) => onUpdateCommitment(current.id, e.target.value)}
                  placeholder={`What boundary or practice will our team adopt against ${current.number.toLowerCase()}? (e.g., "We will never use AI to summarize a 1:1 conversation without consent.")`}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.88rem',
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
