import React, { useState } from 'react';
import { Pebble } from '../components/Pebble';
import { DeckPresetId, ScenarioCategory } from '../types/game';
import { ExternalLinkIcon, PhoneIcon, ScreenIcon } from '../components/Icons';

export interface LandingViewProps {
  onJoinRoom: (code: string, name?: string) => void;
  onStartHost: (preset: DeckPresetId, selectedCategories?: ScenarioCategory[]) => void;
  initialCode?: string;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onJoinRoom,
  onStartHost,
  initialCode = '',
}) => {
  const [joinCode, setJoinCode] = useState(initialCode.toUpperCase());
  const [joinName, setJoinName] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length >= 3) {
      onJoinRoom(cleanCode, joinName.trim() || undefined);
    }
  };

  return (
    <div
      className="landing-view"
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem',
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Pebble variant={0} stance="support" size="sm" />
          <Pebble variant={1} stance="depends" size="md" />
          <Pebble variant={2} stance="erode" size="sm" />
        </div>

        <h1 style={{ fontSize: '2.8rem', maxWidth: '820px', lineHeight: 1.15 }}>
          The AI Effect — Philanthropy &amp; Human Connection
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--ink-secondary)', maxWidth: '720px', lineHeight: 1.5 }}>
          As artificial intelligence automates more workflows in grantmaking and social impact, where must we
          fiercely protect, invest in, and build genuine human relationships?
        </p>
      </section>

      {/* Two Paths Grid: Join vs Facilitate */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        {/* Path 1: Join a Session */}
        <div
          className="card-tabletop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.5rem',
            borderTop: '4px solid var(--stance-support-accent)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <PhoneIcon size={20} style={{ color: 'var(--stance-support-accent)' }} />
              <h2 style={{ fontSize: '1.45rem' }}>Join a Session</h2>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
              Entering an offsite room on your phone or laptop? Enter the room code from the main screen.
            </p>

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label
                  htmlFor="join-code-input"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Room Code
                </label>
                <input
                  id="join-code-input"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="e.g. WARM"
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="join-name-input"
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Your Name (Optional)
                </label>
                <input
                  id="join-name-input"
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="e.g. Curious Capybara"
                  maxLength={24}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    fontSize: '0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              <button
                id="join-room-btn"
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  backgroundColor: 'var(--stance-support)',
                }}
              >
                Join Room →
              </button>
            </form>
          </div>
        </div>

        {/* Path 2: Facilitate a Session */}
        <div
          className="card-tabletop"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            borderTop: '4px solid var(--currents-teal)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ScreenIcon size={20} style={{ color: 'var(--currents-teal)' }} />
              <h2 style={{ fontSize: '1.45rem' }}>Facilitate a Session</h2>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem' }}>
              Project on the main room screen. Generates an instant high-contrast QR code for phones to scan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Preset 1: 8-Card Spark */}
              <button
                id="start-spark-btn"
                onClick={() => onStartHost('spark-8')}
                className="btn-primary"
                style={{
                  padding: '0.95rem 1.25rem',
                  fontSize: '1.02rem',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Start 8-Card Spark Session</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>~25 min • 2 cards per domain • balanced currents</div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>→</span>
              </button>

              {/* Preset 2: Current 04 Focus */}
              <button
                id="start-current04-btn"
                onClick={() => onStartHost('current-04-focus')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.8rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Current 04 Focus: Acting for Us</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>Spotlights agentic proxies &amp; automated mediators</div>
                </div>
                <span style={{ color: 'var(--ink-muted)' }}>→</span>
              </button>

              {/* Preset 3: Full 20-Card Deck */}
              <button
                id="start-full-btn"
                onClick={() => onStartHost('full-20')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.8rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Full 20-Card Philanthropy Deck</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>Comprehensive library across coworkers, grantees &amp; community</div>
                </div>
                <span style={{ color: 'var(--ink-muted)' }}>→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Attribution Footer */}
      <footer
        style={{
          marginTop: '0.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.45rem',
          color: 'var(--ink-muted)',
          fontSize: '0.84rem',
          lineHeight: 1.5,
        }}
      >
        <div>
          Adapted for philanthropy &amp; social-impact teams from{' '}
          <a
            href="https://www.therithmproject.org/the-ai-effect"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>The AI Effect</span>
            <ExternalLinkIcon size={11} />
          </a>{' '}
          and{' '}
          <a
            href="https://aicurrents.therithmproject.org/"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>The Four Currents</span>
            <ExternalLinkIcon size={11} />
          </a>{' '}
          by{' '}
          <a
            href="https://www.therithmproject.org/"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600 }}
          >
            The Rithm Project
          </a>{' '}
          (Alison Lee, PhD, Michelle Culver, and Rob Strain).
        </div>
        <div style={{ fontSize: '0.78rem' }}>
          Explore the original card game, research reports, and relational AI resources at{' '}
          <a href="https://www.therithmproject.org/the-ai-effect" target="_blank" rel="noreferrer">
            therithmproject.org/the-ai-effect
          </a>{' '}
          •{' '}
          <a href="https://aicurrents.therithmproject.org/" target="_blank" rel="noreferrer">
            aicurrents.therithmproject.org
          </a>
        </div>
      </footer>
    </div>
  );
};
