import React, { useState } from 'react';
import { Pebble } from '../components/Pebble';
import { RITHM_CURRENTS_LIST } from '../content/currents';
import { CATEGORY_LIST } from '../content/scenarios';
import { DeckPresetId, ScenarioCategory } from '../types/game';

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
  const [showCustomDeck, setShowCustomDeck] = useState(false);
  const [showCurrentsGuide, setShowCurrentsGuide] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ScenarioCategory[]>([
    'coworkers',
    'grantees',
    'community',
    'life',
  ]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (cleanCode.length >= 3) {
      onJoinRoom(cleanCode, joinName.trim() || undefined);
    }
  };

  const toggleCategory = (cat: ScenarioCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  return (
    <div
      className="landing-view"
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--currents-teal)',
            }}
          >
            An Offsite Card Game &amp; Reflection Studio
          </span>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <a
            href="https://www.therithmproject.org/the-ai-effect"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}
          >
            The Rithm Project ↗
          </a>
          <span style={{ color: 'var(--border-strong)' }}>•</span>
          <a
            href="https://aicurrents.therithmproject.org/"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)' }}
          >
            The Four Currents ↗
          </a>
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
          gap: '1.75rem',
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
              <span style={{ fontSize: '1.25rem' }}>📱</span>
              <h2 style={{ fontSize: '1.45rem' }}>Join a Session</h2>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
              Entering an offsite room on your phone or laptop? Enter the 4-character room code from the main screen.
            </p>

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                  4-Character Room Code
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
                  Your Name (Optional — or get a fun animal alias)
                </label>
                <input
                  id="join-name-input"
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="Leave blank for e.g. Curious Capybara"
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

          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontStyle: 'italic', textAlign: 'center' }}>
            Zero login or app install needed. Works instantly in any mobile browser.
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
              <span style={{ fontSize: '1.25rem' }}>🖥️</span>
              <h2 style={{ fontSize: '1.45rem' }}>Facilitate a Session</h2>
            </div>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginBottom: '1.25rem' }}>
              Project on the main room screen. Generates an instant high-contrast QR code for phones to scan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Primary 1-Click Button */}
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

              {/* Custom Domain Filter Toggle */}
              <div>
                <button
                  id="toggle-custom-deck-btn"
                  onClick={() => setShowCustomDeck(!showCustomDeck)}
                  className="btn-ghost"
                  style={{ fontSize: '0.84rem', padding: '0.4rem 0.2rem' }}
                >
                  {showCustomDeck ? '− Hide custom domain filter' : '+ Customize domain categories'}
                </button>

                {showCustomDeck && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      backgroundColor: 'var(--bg-tray)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-secondary)' }}>
                      Select Domains to Include:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      {CATEGORY_LIST.map((c) => {
                        const checked = selectedCategories.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(c.id)}
                            />
                            <span>{c.shortLabel}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      id="start-custom-btn"
                      onClick={() => onStartHost('custom', selectedCategories)}
                      className="btn-primary"
                      style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                    >
                      Start Custom Deck ({selectedCategories.length} domains)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
            <button
              id="open-currents-guide-btn"
              onClick={() => setShowCurrentsGuide(!showCurrentsGuide)}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.86rem', color: 'var(--currents-teal)' }}
            >
              🌊 {showCurrentsGuide ? 'Hide Four Currents Guide' : 'Explore The Four Currents Framework'}
            </button>
          </div>
        </div>
      </section>

      {/* Expandable Four Currents Guide */}
      {showCurrentsGuide && (
        <section
          className="card-tabletop"
          style={{
            borderLeft: '4px solid var(--currents-teal)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--currents-teal)',
                textTransform: 'uppercase',
              }}
            >
              The Conceptual Anchor
            </span>
            <h2 style={{ fontSize: '1.6rem', marginTop: '0.2rem', marginBottom: '0.35rem' }}>
              The Four Currents by The Rithm Project
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)' }}>
              Like rip currents in the ocean, these four dynamics quietly pull on human connection as AI adoption
              accelerates. Visit{' '}
              <a href="https://aicurrents.therithmproject.org/" target="_blank" rel="noreferrer">
                aicurrents.therithmproject.org
              </a>{' '}
              for the complete research framework.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {RITHM_CURRENTS_LIST.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--bg-tray)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: 'var(--currents-teal)',
                  }}
                >
                  {c.number}
                </span>
                <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{c.title}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', fontStyle: 'italic', margin: 0 }}>
                  "{c.subtitle}"
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.76rem' }}>
                    Read Research ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Always-visible Rithm Project Attribution Footer */}
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
            style={{ fontWeight: 600 }}
          >
            The AI Effect ↗
          </a>{' '}
          and{' '}
          <a
            href="https://aicurrents.therithmproject.org/"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600 }}
          >
            The Four Currents ↗
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
          <a href="https://aicurrents.therithmproject.org/current-04/" target="_blank" rel="noreferrer">
            aicurrents.therithmproject.org
          </a>
        </div>
      </footer>
    </div>
  );
};

