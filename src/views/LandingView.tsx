import React, { useEffect, useMemo, useState } from 'react';
import { Pebble } from '../components/Pebble';
import { CustomDeckOptions, DeckPresetId, RithmCurrentId, ScenarioCategory } from '../types/game';
import { PhoneIcon, ScreenIcon, SlidersIcon } from '../components/Icons';
import { CATEGORY_LIST, getMatchingScenariosPool } from '../content/scenarios';

export interface LandingViewProps {
  onJoinRoom: (code: string, name?: string) => void;
  onStartHost: (
    preset: DeckPresetId,
    customOrCategories?: ScenarioCategory[] | CustomDeckOptions,
    customCode?: string
  ) => void;
  initialCode?: string;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onJoinRoom,
  onStartHost,
  initialCode = '',
}) => {
  const [joinCode, setJoinCode] = useState(initialCode.toUpperCase());
  const [joinName, setJoinName] = useState('');
  const [hostCustomCode, setHostCustomCode] = useState('');

  // Custom Builder State
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ScenarioCategory[]>(() =>
    CATEGORY_LIST.map((c) => c.id)
  );
  const [selectedCurrents, setSelectedCurrents] = useState<RithmCurrentId[]>([
    'current-01',
    'current-02',
    'current-03',
    'current-04',
  ]);
  const [customCount, setCustomCount] = useState<number | 'all'>(8);

  const CURRENTS_SHORT: Array<{ id: RithmCurrentId; label: string }> = [
    { id: 'current-01', label: '01 Trust' },
    { id: 'current-02', label: '02 AI Relationships' },
    { id: 'current-03', label: '03 Inner Voice' },
    { id: 'current-04', label: '04 Acting for Us' },
  ];

  const categoryPresets: Array<{ label: string; categories: ScenarioCategory[] }> = [
    {
      label: 'All (8)',
      categories: CATEGORY_LIST.map((c) => c.id),
    },
    {
      label: 'Philanthropy & Impact',
      categories: ['life', 'community', 'coworkers', 'grantees'],
    },
    {
      label: 'Workplace & Leadership',
      categories: ['coworkers', 'leadership', 'creative', 'life'],
    },
    {
      label: 'Learning & Care',
      categories: ['mentorship', 'caregiving', 'community', 'life'],
    },
  ];

  const countOptions: Array<number | 'all'> = [4, 6, 8, 10, 12, 16, 'all'];

  const matchingPool = useMemo(() => {
    return getMatchingScenariosPool({
      categories: selectedCategories,
      currents: selectedCurrents,
    });
  }, [selectedCategories, selectedCurrents]);

  const effectiveCount =
    customCount === 'all'
      ? matchingPool.length
      : Math.min(customCount, matchingPool.length);

  const toggleCategory = (catId: ScenarioCategory) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== catId));
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const toggleCurrent = (curId: RithmCurrentId) => {
    if (selectedCurrents.includes(curId)) {
      if (selectedCurrents.length > 1) {
        setSelectedCurrents(selectedCurrents.filter((c) => c !== curId));
      }
    } else {
      setSelectedCurrents([...selectedCurrents, curId]);
    }
  };

  // Ensure customCount stays clamped to matchingPool size when pool shrinks
  useEffect(() => {
    if (typeof customCount === 'number' && customCount > matchingPool.length) {
      setCustomCount(matchingPool.length);
    }
  }, [matchingPool.length, customCount]);

  const handleDecCount = () => {
    const currentVal = effectiveCount;
    const nextVal = Math.max(1, currentVal - 1);
    setCustomCount(nextVal);
  };

  const handleIncCount = () => {
    const currentVal = effectiveCount;
    const nextVal = Math.min(matchingPool.length, currentVal + 1);
    setCustomCount(nextVal);
  };

  const handleLaunchCustom = () => {
    const cleanCustom = hostCustomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    onStartHost(
      'custom',
      {
        categories: selectedCategories,
        currents: selectedCurrents,
        count: effectiveCount,
      },
      cleanCustom || undefined
    );
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (cleanCode.length >= 2) {
      onJoinRoom(cleanCode, joinName.trim() || undefined);
    }
  };

  const launchHostWithPreset = (preset: DeckPresetId) => {
    const cleanCustom = hostCustomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    onStartHost(preset, undefined, cleanCustom || undefined);
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
          The AI Effect
        </h1>
        <h2 style={{ fontSize: '2rem', maxWidth: '820px', lineHeight: 1.15 }}>
          Philanthropy &amp; Human Connection
        </h2>

        <p style={{ fontSize: '1.15rem', color: 'var(--ink-secondary)', maxWidth: '720px', lineHeight: 1.5 }}>
          As we work to automate more workflows in grantmaking and social impact with AI, the hard question moves 
          from where <em>could</em> we use AI to where <em>must</em> we 
          work to build, protect, and invest in genuine human connection?
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
              Enter the room code on your phone or scan the presenter's QR code.
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
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12))
                  }
                  placeholder="e.g. WARM"
                  maxLength={12}
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
            <p style={{ fontSize: '0.92rem', color: 'var(--ink-secondary)', marginBottom: '1rem' }}>
              Project or screenshare the slides and scenarios.
            </p>

            {/* Optional Custom Room Code for pre-made shortlinks */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="host-custom-code-input"
                style={{
                  display: 'block',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-muted)',
                  marginBottom: '0.3rem',
                }}
              >
                Custom Room Code (Optional)
              </label>
              <input
                id="host-custom-code-input"
                type="text"
                value={hostCustomCode}
                onChange={(e) =>
                  setHostCustomCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
                  )
                }
                placeholder="Auto-generated if blank (e.g. OFFSITE)"
                maxLength={12}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  fontSize: '0.92rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: '#FFFDF9',
                  color: 'var(--ink-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Option 1: Short Spark Session */}
              <button
                id="start-spark-btn"
                onClick={() => launchHostWithPreset('spark-8')}
                className="btn-primary"
                style={{
                  padding: '0.95rem 1.25rem',
                  fontSize: '1.02rem',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>Short Spark Session</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>8 cards • ~25 min • Balanced across common domains &amp; Currents</div>
                </div>
                <span style={{ fontSize: '1.2rem' }}>→</span>
              </button>

              {/* Option 2: Focus Sessions for each of the 4 Currents */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ink-muted)',
                  }}
                >
                  Focus Session by Current (6 cards each)
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  <button
                    id="start-current01-btn"
                    onClick={() => launchHostWithPreset('current-01-focus')}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '0.65rem 0.8rem',
                      gap: '0.15rem',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--currents-teal)', textTransform: 'uppercase' }}>
                      Current 01
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)' }}>
                      Our Sense of Trust
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                      Authenticity &amp; disclosure
                    </span>
                  </button>

                  <button
                    id="start-current02-btn"
                    onClick={() => launchHostWithPreset('current-02-focus')}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '0.65rem 0.8rem',
                      gap: '0.15rem',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--currents-teal)', textTransform: 'uppercase' }}>
                      Current 02
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)' }}>
                      Relationships with AI
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                      Companions &amp; rehearsal
                    </span>
                  </button>

                  <button
                    id="start-current03-btn"
                    onClick={() => launchHostWithPreset('current-03-focus')}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '0.65rem 0.8rem',
                      gap: '0.15rem',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--currents-teal)', textTransform: 'uppercase' }}>
                      Current 03
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)' }}>
                      Our Inner Voice
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                      Expression &amp; synthesis
                    </span>
                  </button>

                  <button
                    id="start-current04-btn"
                    onClick={() => launchHostWithPreset('current-04-focus')}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '0.65rem 0.8rem',
                      gap: '0.15rem',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--currents-teal)', textTransform: 'uppercase' }}>
                      Current 04
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)' }}>
                      Acting for Us
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                      Proxies &amp; mediators
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 3: Full Deck */}
              <button
                id="start-full-btn"
                onClick={() => launchHostWithPreset('full-20')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '0.8rem 1rem' }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Full Deck</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                    Complete 64-card library across all 8 categories &amp; 4 Currents
                  </div>
                </div>
                <span style={{ color: 'var(--ink-muted)' }}>→</span>
              </button>

              {/* Option 4: Custom Session Builder Toggle */}
              <button
                id="toggle-custom-builder-btn"
                type="button"
                onClick={() => setShowCustomBuilder((prev) => !prev)}
                className="btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  padding: '0.8rem 1rem',
                  borderColor: showCustomBuilder ? 'var(--currents-teal)' : undefined,
                  backgroundColor: showCustomBuilder ? 'var(--currents-teal-tint)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <SlidersIcon size={16} style={{ color: 'var(--currents-teal)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                      Build a Custom Session
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                      Select specific categories, Currents &amp; card count
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                  {showCustomBuilder ? 'Hide ▲' : 'Configure ▼'}
                </span>
              </button>

              {/* Expandable Custom Session Builder Panel */}
              {showCustomBuilder && (
                <div
                  className="card-tabletop"
                  style={{
                    backgroundColor: 'var(--bg-tray)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem',
                  }}
                >
                  {/* Section 1: Scenario Categories */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        1. Scenario Categories ({selectedCategories.length} selected)
                      </span>
                    </div>

                    {/* Quick-filter pill buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {categoryPresets.map((preset) => {
                        const isPresetActive =
                          preset.categories.length === selectedCategories.length &&
                          preset.categories.every((c) => selectedCategories.includes(c));
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setSelectedCategories([...preset.categories])}
                            className="btn-ghost"
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              border: isPresetActive
                                ? '1px solid var(--currents-teal)'
                                : '1px solid var(--border-subtle)',
                              backgroundColor: isPresetActive
                                ? 'var(--currents-teal-tint)'
                                : '#FFFDF9',
                              color: isPresetActive
                                ? 'var(--currents-teal)'
                                : 'var(--ink-secondary)',
                              fontWeight: isPresetActive ? 700 : 500,
                            }}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* 8 Category Toggle Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                      {CATEGORY_LIST.map((cat) => {
                        const isSelected = selectedCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            id={`custom-cat-${cat.id}`}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected
                                ? `1.5px solid ${cat.accentColor}`
                                : '1px solid var(--border-default)',
                              backgroundColor: isSelected ? cat.surfaceTint : '#FFFDF9',
                              color: isSelected ? cat.accentColor : 'var(--ink-muted)',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {cat.shortLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Currents */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      2. Currents ({selectedCurrents.length} selected)
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
                      {CURRENTS_SHORT.map((c) => {
                        const isSelected = selectedCurrents.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            id={`custom-current-${c.id}`}
                            type="button"
                            onClick={() => toggleCurrent(c.id)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected
                                ? '1.5px solid var(--currents-teal)'
                                : '1px solid var(--border-default)',
                              backgroundColor: isSelected
                                ? 'var(--currents-teal-tint)'
                                : '#FFFDF9',
                              color: isSelected ? 'var(--currents-teal)' : 'var(--ink-muted)',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Total Number of Questions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      3. Total Number of Questions ({effectiveCount} cards)
                    </span>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
                      {countOptions.map((opt) => {
                        const isSelected = customCount === opt;
                        const isDisabled = opt !== 'all' && opt > matchingPool.length;
                        const label = opt === 'all' ? `All (${matchingPool.length})` : opt;
                        return (
                          <button
                            key={String(opt)}
                            id={`custom-count-${opt}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setCustomCount(opt)}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-md)',
                              border: isSelected
                                ? '1.5px solid var(--stance-support)'
                                : '1px solid var(--border-default)',
                              backgroundColor: isSelected
                                ? 'var(--stance-support-tint, #E7F2EC)'
                                : '#FFFDF9',
                              color: isSelected ? 'var(--stance-support-text)' : 'var(--ink-secondary)',
                              fontWeight: isSelected ? 700 : 500,
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.35 : 1,
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}

                      {/* Dec / Inc numeric adjustment buttons */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.35rem' }}>
                        <button
                          id="custom-count-dec-btn"
                          type="button"
                          onClick={handleDecCount}
                          disabled={effectiveCount <= 1}
                          className="btn-secondary"
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            minWidth: '32px',
                            justifyContent: 'center',
                            opacity: effectiveCount <= 1 ? 0.4 : 1,
                          }}
                          title="Decrease card count"
                        >
                          -
                        </button>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            minWidth: '28px',
                            textAlign: 'center',
                          }}
                        >
                          {effectiveCount}
                        </span>
                        <button
                          id="custom-count-inc-btn"
                          type="button"
                          onClick={handleIncCount}
                          disabled={effectiveCount >= matchingPool.length}
                          className="btn-secondary"
                          style={{
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            minWidth: '32px',
                            justifyContent: 'center',
                            opacity: effectiveCount >= matchingPool.length ? 0.4 : 1,
                          }}
                          title="Increase card count"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Status Line */}
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--ink-secondary)',
                        fontFamily: 'var(--font-mono)',
                        lineHeight: 1.4,
                        padding: '0.45rem 0.65rem',
                        backgroundColor: '#FFFDF9',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      Randomly draws {effectiveCount} of {matchingPool.length} matching scenarios • Interleaved across {selectedCategories.length} categories &amp; {selectedCurrents.length} Currents
                    </div>
                  </div>

                  {/* Launch Action */}
                  <button
                    id="start-custom-btn"
                    type="button"
                    onClick={handleLaunchCustom}
                    disabled={effectiveCount <= 0}
                    className="btn-primary"
                    style={{
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.96rem',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--currents-teal)',
                      opacity: effectiveCount <= 0 ? 0.4 : 1,
                      cursor: effectiveCount <= 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span>Start Custom Session ({effectiveCount} Cards) →</span>
                  </button>
                </div>
              )}
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
          Adapted for philanthropy &amp; social-impact from{' '}
          <a
            href="https://www.therithmproject.org/the-ai-effect"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>The AI Effect</span>
          </a>{' '}
          and{' '}
          <a
            href="https://aicurrents.therithmproject.org/"
            target="_blank"
            rel="noreferrer"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <span>The Four Currents</span>
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
