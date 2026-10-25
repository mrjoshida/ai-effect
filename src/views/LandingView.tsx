import React, { useEffect, useMemo, useState } from 'react';
import { Pebble } from '../components/Pebble';
import { CustomDeckOptions, DeckPresetId, RithmCurrentId, ScenarioCard, ScenarioCategory } from '../types/game';
import {
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  ScreenIcon,
  SlidersIcon,
  SparkIcon,
  TrashIcon,
  UploadIcon,
} from '../components/Icons';
import { RITHM_CURRENTS_LIST } from '../content/currents';
import { CATEGORY_LIST, CATEGORY_META, getMatchingScenariosPool } from '../content/scenarios';
import { sanitizeCustomRoomCode } from '../state/roomEngine';
import { getConfiguredAiKey, setConfiguredAiKey } from '../utils/ideaGrouping';
import { detectCapabilities, getCachedCapabilities } from '../utils/capabilities';
import {
  ActiveCustomDeckConfig,
  draftScenarioWithAI,
  exportCustomScenariosJson,
  importCustomScenariosFromJson,
  loadCustomScenarios,
  saveActiveCustomDeckConfig,
  saveCustomScenarios,
  validateAndSanitizeScenario,
} from '../utils/customScenarios';

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
  const [aiKey, setAiKey] = useState<string>(() => getConfiguredAiKey());
  const [isEditingKey, setIsEditingKey] = useState<boolean>(false);
  const [keyInputVal, setKeyInputVal] = useState<string>('');
  const [serverAiActive, setServerAiActive] = useState<boolean>(
    () => Boolean(getCachedCapabilities()?.aiAvailable)
  );
  const [capsReady, setCapsReady] = useState<boolean>(
    () => getCachedCapabilities() !== null
  );

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

  // Scenario Studio State
  const [showScenarioStudio, setShowScenarioStudio] = useState(false);
  const [customScenarios, setCustomScenarios] = useState<ScenarioCard[]>(() => loadCustomScenarios());
  const [studioDeckMode, setStudioDeckMode] = useState<'prepend' | 'custom-only'>('prepend');
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [draftCurrentId, setDraftCurrentId] = useState<RithmCurrentId>('current-01');
  const [draftCategory, setDraftCategory] = useState<ScenarioCategory>('coworkers');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');

  // Editable card fields
  const [formTitle, setFormTitle] = useState('');
  const [formCurrentId, setFormCurrentId] = useState<RithmCurrentId>('current-01');
  const [formCategory, setFormCategory] = useState<ScenarioCategory>('coworkers');
  const [formPrompt, setFormPrompt] = useState('');
  const [formWhatIf, setFormWhatIf] = useState('');

  useEffect(() => {
    detectCapabilities().then((caps) => {
      if (caps.internalServer && caps.aiAvailable) {
        setServerAiActive(true);
      }
      setCapsReady(true);
    });
  }, []);

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

  const syncCustomDeckLaunch = () => {
    if (customScenarios.length > 0) {
      saveActiveCustomDeckConfig({
        mode: studioDeckMode,
        scenarios: customScenarios,
      });
    }
  };

  const handleLaunchCustom = () => {
    syncCustomDeckLaunch();
    const cleanCustom = sanitizeCustomRoomCode(hostCustomCode);
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
    const cleanCode = sanitizeCustomRoomCode(joinCode);
    if (cleanCode.length >= 2) {
      onJoinRoom(cleanCode, joinName.trim() || undefined);
    }
  };

  const launchHostWithPreset = (preset: DeckPresetId) => {
    syncCustomDeckLaunch();
    const cleanCustom = sanitizeCustomRoomCode(hostCustomCode);
    onStartHost(preset, undefined, cleanCustom || undefined);
  };

  const handleDraftWithAi = async () => {
    if (!draftTopic.trim()) return;
    setIsDrafting(true);
    setDraftError('');
    try {
      const card = await draftScenarioWithAI({
        prompt: draftTopic.trim(),
        currentId: draftCurrentId,
        category: draftCategory,
      });
      setFormTitle(card.title);
      setFormCurrentId(card.currentId || draftCurrentId);
      setFormCategory(card.category || draftCategory);
      setFormPrompt(card.prompt);
      setFormWhatIf(card.twist);
    } catch (err: any) {
      setDraftError(err?.message || 'Could not draft scenario with AI');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSaveCardToStudio = () => {
    if (!formPrompt.trim()) return;
    const sanitized = validateAndSanitizeScenario({
      title: formTitle,
      currentId: formCurrentId,
      category: formCategory,
      prompt: formPrompt,
      whatIf: formWhatIf,
    });
    if (!sanitized) return;

    const nextList = [sanitized, ...customScenarios];
    setCustomScenarios(nextList);
    saveCustomScenarios(nextList);

    // Reset form
    setFormTitle('');
    setFormCurrentId('current-01');
    setFormCategory('coworkers');
    setFormPrompt('');
    setFormWhatIf('');
    setDraftTopic('');
    setIsAddingCard(false);
  };

  const handleDeleteCustomScenario = (id: string) => {
    const nextList = customScenarios.filter((s) => s.id !== id);
    setCustomScenarios(nextList);
    saveCustomScenarios(nextList);
  };

  const handleExportCustomDeck = () => {
    const json = exportCustomScenariosJson(customScenarios);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-scenarios-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCustomDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = importCustomScenariosFromJson(content);
        if (imported.length > 0) {
          const merged = [...imported, ...customScenarios];
          setCustomScenarios(merged);
          saveCustomScenarios(merged);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
          from where <em>could</em> we use AI to where <em>should</em> we 
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

            {/* Optional Custom Room Code */}
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

            {/* Manual AI Key Input (only shown when server AI is not active) */}
            {capsReady && !serverAiActive && (
              <div style={{ marginBottom: '1rem' }}>
                  <label
                    htmlFor="host-ai-key-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.3rem',
                    }}
                  >
                    <SparkIcon size={13} style={{ color: 'var(--currents-teal)' }} />
                    <span>Idea Grouping Key (Optional)</span>
                  </label>

                  {aiKey && !isEditingKey ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: '#FFFDF9',
                        gap: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          color: 'var(--stance-support)',
                          fontWeight: 600,
                        }}
                      >
                        <CheckIcon size={12} />
                        <span>Saved on this browser (groups similar brainstorm ideas)</span>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          id="change-ai-key-btn"
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            setKeyInputVal(aiKey);
                            setIsEditingKey(true);
                          }}
                          style={{
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.45rem',
                            color: 'var(--ink-secondary)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }}
                        >
                          Change
                        </button>
                        <button
                          id="clear-ai-key-btn"
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            setConfiguredAiKey('');
                            setAiKey('');
                            setKeyInputVal('');
                            setIsEditingKey(false);
                          }}
                          style={{
                            fontSize: '0.74rem',
                            padding: '0.2rem 0.45rem',
                            color: 'var(--ink-muted)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          id="host-ai-key-input"
                          type="password"
                          value={keyInputVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setKeyInputVal(val);
                            setConfiguredAiKey(val);
                            if (!val.trim()) {
                              setAiKey('');
                            }
                          }}
                          onBlur={() => {
                            const trimmed = keyInputVal.trim();
                            setConfiguredAiKey(trimmed);
                            setAiKey(trimmed);
                            if (isEditingKey) {
                              setIsEditingKey(false);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const trimmed = keyInputVal.trim();
                              setConfiguredAiKey(trimmed);
                              setAiKey(trimmed);
                              setIsEditingKey(false);
                            }
                          }}
                          placeholder="Paste AI Studio key to group similar ideas"
                          autoComplete="off"
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.8rem',
                            fontSize: '0.88rem',
                            fontFamily: 'var(--font-mono)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: '#FFFDF9',
                            color: 'var(--ink-primary)',
                          }}
                        />
                        {isEditingKey && (
                          <button
                            id="save-ai-key-btn"
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              const trimmed = keyInputVal.trim();
                              setConfiguredAiKey(trimmed);
                              setAiKey(trimmed);
                              setIsEditingKey(false);
                            }}
                            style={{
                              padding: '0.5rem 0.8rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Save
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.73rem',
                          color: 'var(--ink-muted)',
                          marginTop: '0.35rem',
                          lineHeight: 1.35,
                        }}
                      >
                        Stored only in your browser. If left blank, ideas are voted on directly without grouping.
                      </div>
                    </div>
                  )}
              </div>
            )}

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

              {/* Option 2: Focus Sessions */}
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

              {/* Custom Session Builder Panel */}
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
                  {/* Categories */}
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
                      1. Scenario Categories ({selectedCategories.length} selected)
                    </span>

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

                  {/* Currents */}
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

                  {/* Count */}
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

              {/* Option 5: Scenario Studio Drawer Toggle */}
              <button
                id="toggle-scenario-studio-btn"
                type="button"
                onClick={() => setShowScenarioStudio((prev) => !prev)}
                className="btn-secondary"
                style={{
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  padding: '0.8rem 1rem',
                  borderColor: showScenarioStudio ? 'var(--currents-teal)' : undefined,
                  backgroundColor: showScenarioStudio ? 'var(--currents-teal-tint)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <PencilIcon size={16} style={{ color: 'var(--currents-teal)' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink-primary)' }}>
                      Scenario Studio {customScenarios.length > 0 ? `(${customScenarios.length} Custom Cards)` : ''}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--ink-muted)' }}>
                      Draft custom workplace dilemma cards with AI or build your own
                    </div>
                  </div>
                </div>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                  {showScenarioStudio ? 'Hide ▲' : 'Open Studio ▼'}
                </span>
              </button>

              {/* Scenario Studio Drawer */}
              {showScenarioStudio && (
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
                  {/* Top Bar: Deck Info & Import/Export */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'var(--ink-primary)',
                        }}
                      >
                        {customScenarios.length} Custom {customScenarios.length === 1 ? 'Card' : 'Cards'} in Studio
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        id="export-custom-deck-btn"
                        type="button"
                        onClick={handleExportCustomDeck}
                        disabled={customScenarios.length === 0}
                        className="btn-ghost"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.55rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#FFFDF9',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: customScenarios.length === 0 ? 'not-allowed' : 'pointer',
                          opacity: customScenarios.length === 0 ? 0.4 : 1,
                        }}
                        title="Download custom scenarios as JSON"
                      >
                        <DownloadIcon size={12} />
                        <span>Export</span>
                      </button>

                      <label
                        htmlFor="import-custom-deck-file"
                        className="btn-ghost"
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.55rem',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#FFFDF9',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                        title="Import custom scenarios from JSON"
                      >
                        <UploadIcon size={12} />
                        <span>Import</span>
                        <input
                          id="import-custom-deck-file"
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportCustomDeck}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Inclusion Mode Selection */}
                  {customScenarios.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Session Launch Mode
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          id="studio-mode-prepend-btn"
                          onClick={() => setStudioDeckMode('prepend')}
                          className="btn-secondary"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.5rem 0.65rem',
                            textAlign: 'left',
                            borderColor: studioDeckMode === 'prepend' ? 'var(--currents-teal)' : undefined,
                            backgroundColor: studioDeckMode === 'prepend' ? 'var(--currents-teal-tint)' : '#FFFDF9',
                            fontWeight: studioDeckMode === 'prepend' ? 700 : 500,
                          }}
                        >
                          <div>Prepend to Session</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 400 }}>
                            Custom cards first, then built-in
                          </div>
                        </button>
                        <button
                          type="button"
                          id="studio-mode-customonly-btn"
                          onClick={() => setStudioDeckMode('custom-only')}
                          className="btn-secondary"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.5rem 0.65rem',
                            textAlign: 'left',
                            borderColor: studioDeckMode === 'custom-only' ? 'var(--currents-teal)' : undefined,
                            backgroundColor: studioDeckMode === 'custom-only' ? 'var(--currents-teal-tint)' : '#FFFDF9',
                            fontWeight: studioDeckMode === 'custom-only' ? 700 : 500,
                          }}
                        >
                          <div>Custom Only</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', fontWeight: 400 }}>
                            Only run your {customScenarios.length} custom cards
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Scenario Section */}
                  {isAddingCard ? (
                    <div
                      style={{
                        backgroundColor: '#FFFDF9',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-primary)' }}>
                          New Custom Scenario
                        </span>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => {
                            setIsAddingCard(false);
                            setDraftError('');
                          }}
                          style={{ padding: '0.2rem', color: 'var(--ink-muted)' }}
                        >
                          <CloseIcon size={14} />
                        </button>
                      </div>

                      {/* Draft with AI Section */}
                      <div
                        style={{
                          backgroundColor: 'var(--currents-teal-tint, #EFF7F5)',
                          border: '1px solid var(--currents-teal-border, #C5E0DC)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--currents-teal)' }}>
                          <SparkIcon size={13} />
                          <span>Draft with AI</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <input
                            id="studio-draft-topic-input"
                            type="text"
                            value={draftTopic}
                            onChange={(e) => setDraftTopic(e.target.value)}
                            placeholder="e.g. Deciding whether to delay a launch after an edge-case bug"
                            style={{
                              flex: '1 1 200px',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.84rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                              backgroundColor: '#FFFDF9',
                            }}
                          />
                          <select
                            id="studio-draft-current-select"
                            value={draftCurrentId}
                            onChange={(e) => setDraftCurrentId(e.target.value as RithmCurrentId)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.82rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                              backgroundColor: '#FFFDF9',
                              maxWidth: '180px',
                            }}
                          >
                            {RITHM_CURRENTS_LIST.map((cur) => (
                              <option key={cur.id} value={cur.id}>
                                {cur.number}: {cur.title}
                              </option>
                            ))}
                          </select>
                          <select
                            id="studio-draft-category-select"
                            value={draftCategory}
                            onChange={(e) => setDraftCategory(e.target.value as ScenarioCategory)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.82rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                              backgroundColor: '#FFFDF9',
                            }}
                          >
                            {CATEGORY_LIST.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.shortLabel}
                              </option>
                            ))}
                          </select>
                          <button
                            id="studio-draft-btn"
                            type="button"
                            onClick={handleDraftWithAi}
                            disabled={isDrafting || !draftTopic.trim()}
                            className="btn-primary"
                            style={{
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8rem',
                              backgroundColor: 'var(--currents-teal)',
                              opacity: isDrafting || !draftTopic.trim() ? 0.5 : 1,
                            }}
                          >
                            {isDrafting ? 'Drafting...' : 'Draft Scenario'}
                          </button>
                        </div>
                        {draftError && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--stance-erode, #C0392B)' }}>
                            {draftError}
                          </div>
                        )}
                      </div>

                      {/* Scenario Fields */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div>
                          <label htmlFor="studio-form-title" style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '0.2rem' }}>
                            Title (Optional)
                          </label>
                          <input
                            id="studio-form-title"
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Auto-generated from scenario text if left blank"
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.86rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                            }}
                          />
                        </div>

                        <div>
                          <label htmlFor="studio-form-current" style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '0.2rem' }}>
                            Current (Optional)
                          </label>
                          <select
                            id="studio-form-current"
                            value={formCurrentId}
                            onChange={(e) => setFormCurrentId(e.target.value as RithmCurrentId)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.84rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                            }}
                          >
                            {RITHM_CURRENTS_LIST.map((cur) => (
                              <option key={cur.id} value={cur.id}>
                                {cur.number}: {cur.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="studio-form-category" style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '0.2rem' }}>
                            Domain Category (Optional)
                          </label>
                          <select
                            id="studio-form-category"
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value as ScenarioCategory)}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.84rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                            }}
                          >
                            {CATEGORY_LIST.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.label} ({cat.shortLabel})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="studio-form-prompt" style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '0.2rem' }}>
                            Scenario Text / Dilemma (Required)
                          </label>
                          <textarea
                            id="studio-form-prompt"
                            rows={3}
                            value={formPrompt}
                            onChange={(e) => setFormPrompt(e.target.value)}
                            placeholder="Describe the dilemma facing the team..."
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.84rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                              fontFamily: 'inherit',
                            }}
                          />
                        </div>

                        <div>
                          <label htmlFor="studio-form-whatif" style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '0.2rem' }}>
                            Twist: "What if...?" (Optional)
                          </label>
                          <input
                            id="studio-form-whatif"
                            type="text"
                            value={formWhatIf}
                            onChange={(e) => setFormWhatIf(e.target.value)}
                            placeholder="What if the stakeholder rejects the automated recommendation?"
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.65rem',
                              fontSize: '0.84rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-default)',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', marginTop: '0.25rem' }}>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setIsAddingCard(false)}
                            style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}
                          >
                            Cancel
                          </button>
                          <button
                            id="studio-save-card-btn"
                            type="button"
                            onClick={handleSaveCardToStudio}
                            disabled={!formPrompt.trim()}
                            className="btn-primary"
                            style={{
                              fontSize: '0.82rem',
                              padding: '0.45rem 0.95rem',
                              backgroundColor: 'var(--currents-teal)',
                              opacity: !formPrompt.trim() ? 0.4 : 1,
                            }}
                          >
                            Save to Studio
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      id="studio-add-card-btn"
                      type="button"
                      onClick={() => setIsAddingCard(true)}
                      className="btn-secondary"
                      style={{
                        padding: '0.65rem 0.95rem',
                        fontSize: '0.84rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        borderStyle: 'dashed',
                      }}
                    >
                      <PlusIcon size={14} />
                      <span>Add Custom Scenario</span>
                    </button>
                  )}

                  {/* List of Custom Scenarios */}
                  {customScenarios.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {customScenarios.map((scenario) => (
                        <div
                          key={scenario.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.8rem',
                            backgroundColor: '#FFFDF9',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'var(--font-mono)',
                                  textTransform: 'uppercase',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--currents-teal-tint)',
                                  color: 'var(--currents-teal)',
                                  fontWeight: 700,
                                }}
                              >
                                {scenario.currentId ? scenario.currentId.replace('current-', 'Current ') : 'Current 01'}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'var(--font-mono)',
                                  textTransform: 'uppercase',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'var(--border-subtle, #EDEBE8)',
                                  color: 'var(--ink-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                {CATEGORY_META[scenario.category]?.shortLabel || scenario.category}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {scenario.title}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--ink-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {scenario.prompt}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomScenario(scenario.id)}
                            className="btn-ghost"
                            style={{
                              padding: '0.25rem',
                              color: 'var(--ink-muted)',
                              cursor: 'pointer',
                            }}
                            title="Delete scenario"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Launch Custom Deck */}
                  {customScenarios.length > 0 && (
                    <button
                      id="studio-launch-presenter-btn"
                      type="button"
                      onClick={() => handleLaunchCustom()}
                      className="btn-primary"
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.96rem',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--currents-teal)',
                      }}
                    >
                      <span>
                        Launch Presenter Screen ({customScenarios.length} Custom Card{customScenarios.length === 1 ? '' : 's'}) →
                      </span>
                    </button>
                  )}
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
