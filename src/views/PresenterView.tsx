import React, { useEffect, useState } from 'react';
import { CurrentsWorkshop } from '../components/CurrentsWorkshop';
import { FramingSlides } from '../components/FramingSlides';
import { Pebble } from '../components/Pebble';
import { ResponseGraph } from '../components/ResponseGraph';
import { RITHM_CURRENTS_LIST } from '../content/currents';
import { CATEGORY_LIST, CATEGORY_META } from '../content/scenarios';
import {
  addCustomScenario,
  navigateToScenario,
  sanitizeCustomRoomCode,
  saveHostRoomState,
  setFramingSlideIndex,
  setRoomPhase,
  setWorkshopGroupingStatus,
  setWorkshopIdeaGroups,
  setWorkshopStage,
  toggleGroupEndorsement,
  toggleProposalEndorsement,
  triggerScenarioTwist,
  updateCurrentCommitment,
} from '../state/roomEngine';
import { detectCapabilities, getCachedCapabilities } from '../utils/capabilities';
import { buildJoinUrl, formatShortJoinLink, generateJoinQrSvg } from '../utils/qrCode';
import {
  getConfiguredAiKey,
  groupWorkshopIdeasWithAI,
  isAiAvailable,
  setConfiguredAiKey,
} from '../utils/ideaGrouping';
import {
  buildParticipantJoinUrl,
  clearActiveCustomDeckConfig,
  draftScenarioWithAI,
  loadActiveCustomDeckConfig,
  validateAndSanitizeScenario,
} from '../utils/customScenarios';
import { HostRoomChannel } from '../utils/roomSync';
import { RithmCurrentId, RoomState, ScenarioCard, ScenarioCategory, WorkshopStage } from '../types/game';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  QrIcon,
  SparkIcon,
  UsersIcon,
} from '../components/Icons';

export interface PresenterViewProps {
  room: RoomState;
  channel: HostRoomChannel;
  onUpdateRoom: (room: RoomState) => void;
  onChangeRoomCode?: (newCode: string) => void;
  onExit: () => void;
}

export const PresenterView: React.FC<PresenterViewProps> = ({
  room,
  channel,
  onUpdateRoom,
  onChangeRoomCode,
  onExit,
}) => {
  const [qrSvg, setQrSvg] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [draftCode, setDraftCode] = useState(room.code);
  const [copiedJoinLink, setCopiedJoinLink] = useState(false);
  const [aiKey, setAiKey] = useState<string>(() => getConfiguredAiKey());
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keyInputVal, setKeyInputVal] = useState('');
  const [, setCapsLoaded] = useState(false);

  useEffect(() => {
    detectCapabilities().then(() => {
      setCapsLoaded(true);
    });
  }, []);

  // Live Scenario Addition State
  const [showAddScenarioModal, setShowAddScenarioModal] = useState(false);
  const [addTopic, setAddTopic] = useState('');
  const [addCurrentId, setAddCurrentId] = useState<RithmCurrentId>('current-01');
  const [addCategory, setAddCategory] = useState<ScenarioCategory>('coworkers');
  const [isDraftingLive, setIsDraftingLive] = useState(false);
  const [draftLiveError, setDraftLiveError] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addPrompt, setAddPrompt] = useState('');
  const [addWhatIf, setAddWhatIf] = useState('');

  const roomRef = React.useRef(room);
  roomRef.current = room;

  const joinUrl = buildJoinUrl(room.code);
  const shortJoinLink = formatShortJoinLink(joinUrl);

  const handleCopyJoinLink = async () => {
    try {
      const url = buildParticipantJoinUrl(room.code);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedJoinLink(true);
      setTimeout(() => setCopiedJoinLink(false), 2000);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    const activeConfig = loadActiveCustomDeckConfig();
    if (activeConfig && activeConfig.scenarios && activeConfig.scenarios.length > 0) {
      clearActiveCustomDeckConfig();
      const existingIds = new Set(roomRef.current.scenarios.map((s) => s.id));
      const newCards = activeConfig.scenarios.filter((s) => !existingIds.has(s.id));
      if (newCards.length > 0) {
        let updatedDeck: ScenarioCard[];
        if (activeConfig.mode === 'custom-only') {
          updatedDeck = activeConfig.scenarios;
        } else {
          updatedDeck = [...activeConfig.scenarios, ...roomRef.current.scenarios];
        }
        const updatedRoom: RoomState = {
          ...roomRef.current,
          scenarios: updatedDeck,
          currentScenarioIndex: 0,
          updatedAt: Date.now(),
        };
        updateRoomState(updatedRoom);
      }
    }
  }, []);

  const handleOpenQrModal = () => {
    const current = getConfiguredAiKey();
    setAiKey(current);
    setKeyInputVal(current);
    setIsEditingKey(false);
    setShowQrModal(true);
  };

  const handleSetWorkshopStage = async (stage: WorkshopStage) => {
    if (stage === 'small_groups') {
      updateRoomState(setWorkshopStage(roomRef.current, 'small_groups'));
      return;
    }

    if (stage === 'large_group') {
      const currentRoom = roomRef.current;
      const proposals = Object.values(currentRoom.workshopProposals || {});
      const hasAiKey = await isAiAvailable();

      if (proposals.length === 0 || !hasAiKey) {
        const next = setWorkshopIdeaGroups(
          setWorkshopStage(currentRoom, 'large_group'),
          [],
          'unavailable'
        );
        updateRoomState(next);
        return;
      }

      const groupingRoom = setWorkshopGroupingStatus(
        setWorkshopStage(currentRoom, 'large_group'),
        'grouping'
      );
      updateRoomState(groupingRoom);

      const startTime = Date.now();
      try {
        const result = await groupWorkshopIdeasWithAI(proposals);
        if (!result.fromCache) {
          const elapsed = Date.now() - startTime;
          if (elapsed < 600) {
            await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
          }
        }
        const latest = roomRef.current;
        const finalized = setWorkshopIdeaGroups(latest, result.groups, result.status);
        updateRoomState(finalized);
      } catch {
        const latest = roomRef.current;
        const failed = setWorkshopIdeaGroups(latest, [], 'unavailable');
        updateRoomState(failed);
      }
    }
  };

  // Generate QR code SVG whenever room code changes
  useEffect(() => {
    setDraftCode(room.code);
    let active = true;
    generateJoinQrSvg(joinUrl).then((svg) => {
      if (active) setQrSvg(svg);
    });
    return () => {
      active = false;
    };
  }, [room.code]);

  const handleSaveCustomCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = sanitizeCustomRoomCode(draftCode);
    setIsEditingCode(false);
    if (clean && clean !== room.code) {
      onChangeRoomCode?.(clean);
    } else {
      setDraftCode(room.code);
    }
  };

  // Synchronize room updates: save to storage and broadcast to channel
  const updateRoomState = (next: RoomState) => {
    saveHostRoomState(next);
    channel.publishState(next);
    onUpdateRoom(next);
  };

  const handleDraftLiveScenario = async () => {
    if (!addTopic.trim()) return;
    setIsDraftingLive(true);
    setDraftLiveError('');
    try {
      const card = await draftScenarioWithAI({
        prompt: addTopic.trim(),
        currentId: addCurrentId,
        category: addCategory,
      });
      setAddTitle(card.title);
      setAddCurrentId(card.currentId || addCurrentId);
      setAddCategory(card.category || addCategory);
      setAddPrompt(card.prompt);
      setAddWhatIf(card.twist);
    } catch (err: any) {
      setDraftLiveError(err?.message || 'Could not draft scenario with AI');
    } finally {
      setIsDraftingLive(false);
    }
  };

  const handleSaveLiveScenario = () => {
    if (!addPrompt.trim()) return;
    const sanitized = validateAndSanitizeScenario({
      title: addTitle,
      currentId: addCurrentId,
      category: addCategory,
      prompt: addPrompt,
      whatIf: addWhatIf,
    });
    if (!sanitized) return;

    const nextRoom = addCustomScenario(roomRef.current, sanitized);
    updateRoomState(nextRoom);

    setShowAddScenarioModal(false);
    setAddTopic('');
    setAddCurrentId('current-01');
    setAddCategory('coworkers');
    setAddTitle('');
    setAddPrompt('');
    setAddWhatIf('');
    setDraftLiveError('');
  };

  const currentCard: ScenarioCard | undefined = room.scenarios[room.currentScenarioIndex];
  const currentRound = currentCard ? room.rounds[currentCard.id] : undefined;
  const totalCards = room.scenarios.length;
  const isLastCard = room.currentScenarioIndex === totalCards - 1;
  const participantsList = Object.values(room.participants);
  const totalParticipants = participantsList.length;

  const currentVotesCount = currentRound ? Object.keys(currentRound.votes).length : 0;
  const twistActive = room.phase === 'twist' || Boolean(currentRound?.twistTriggered);

  // Keyboard navigation & step advancement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      const activeSlide = room.framingSlideIndex ?? 0;

      if (e.code === 'Space') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          updateRoomState(setRoomPhase(room, 'voting'));
        } else if (room.phase === 'currents_framing') {
          if (activeSlide < 4) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'currents_workshop'));
          }
        } else {
          advanceLogicalStep();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          updateRoomState(setRoomPhase(room, 'voting'));
        } else if (room.phase === 'currents_framing') {
          if (activeSlide < 4) {
            updateRoomState(setFramingSlideIndex(room, activeSlide + 1));
          } else {
            updateRoomState(setRoomPhase(room, 'currents_workshop'));
          }
        } else {
          handleNextScenario();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (room.phase === 'opening_framing') {
          if (activeSlide > 0) {
            updateRoomState(setFramingSlideIndex(room, activeSlide - 1));
          } else {
            updateRoomState(setRoomPhase(room, 'lobby'));
          }
        } else if (room.phase === 'currents_framing') {
          if (activeSlide > 0) {
            updateRoomState(setFramingSlideIndex(room, activeSlide - 1));
          } else {
            updateRoomState(setRoomPhase(room, 'revealed'));
          }
        } else {
          handlePrevScenario();
        }
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        if (room.phase === 'revealed' && !twistActive) {
          const next = triggerScenarioTwist(room);
          updateRoomState(next);
        }
      } else if (e.code === 'KeyW') {
        e.preventDefault();
        const next = setRoomPhase(
          room,
          room.phase === 'currents_workshop' ? 'revealed' : 'currents_workshop'
        );
        updateRoomState(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room]);

  const advanceLogicalStep = () => {
    if (room.phase === 'lobby') {
      const next = setRoomPhase(room, 'opening_framing');
      updateRoomState(next);
    } else if (room.phase === 'voting') {
      const next = setRoomPhase(room, 'revealed');
      updateRoomState(next);
    } else if (room.phase === 'revealed' && !twistActive) {
      const next = triggerScenarioTwist(room);
      updateRoomState(next);
    } else if (room.phase === 'revealed' || room.phase === 'twist') {
      handleNextScenario();
    }
  };

  const handleNextScenario = () => {
    if (isLastCard) {
      const next = setRoomPhase(room, 'currents_framing');
      updateRoomState(next);
    } else {
      const next = navigateToScenario(room, room.currentScenarioIndex + 1);
      updateRoomState(next);
    }
  };

  const handlePrevScenario = () => {
    if (room.currentScenarioIndex > 0) {
      const next = navigateToScenario(room, room.currentScenarioIndex - 1);
      updateRoomState(next);
    }
  };

  const categoryMeta = currentCard ? CATEGORY_META[currentCard.category] : undefined;

  return (
    <div
      className="presenter-view"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* 1. Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left: App Title & Room Code Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--ink-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Return to main menu"
          >
            <span>The AI Effect</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditingCode ? (
              <form onSubmit={handleSaveCustomCode} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  id="edit-room-code-input"
                  type="text"
                  value={draftCode}
                  onChange={(e) =>
                    setDraftCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
                    )
                  }
                  maxLength={12}
                  autoFocus
                  style={{
                    width: '120px',
                    padding: '0.28rem 0.55rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--currents-teal)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />
                <button
                  id="save-room-code-btn"
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                id="edit-room-code-btn"
                onClick={() => {
                  setDraftCode(room.code);
                  setIsEditingCode(true);
                }}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--bg-tray)',
                  border: '1px solid var(--border-default)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  letterSpacing: '0.08em',
                  color: 'var(--ink-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                }}
                title="Click to set a custom room code"
              >
                <span>CODE: {room.code}</span>
                <PencilIcon size={12} style={{ color: 'var(--ink-muted)' }} />
              </button>
            )}

            <button
              id="copy-join-link-btn"
              onClick={handleCopyJoinLink}
              className="btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Copy join link"
            >
              <CopyIcon size={14} />
              <span>{copiedJoinLink ? 'Copied Join Link' : 'Copy Join Link'}</span>
            </button>

            <button
              id="toggle-qr-btn"
              onClick={handleOpenQrModal}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              title="Show join QR code for latecomers"
            >
              <QrIcon size={14} /> Show QR
            </button>
          </div>
        </div>

        {/* Center: Stage Jump Pills */}
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
            id="nav-framing-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'opening_framing'))}
            className={room.phase === 'opening_framing' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Framing
          </button>
          <button
            id="nav-scenarios-btn"
            onClick={() => {
              const nextPhase =
                room.phase === 'voting' || room.phase === 'revealed' || room.phase === 'twist'
                  ? room.phase
                  : 'voting';
              updateRoomState(setRoomPhase(room, nextPhase));
            }}
            className={
              room.phase === 'voting' || room.phase === 'revealed' || room.phase === 'twist'
                ? 'btn-primary'
                : 'btn-ghost'
            }
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Scenarios
          </button>
          <button
            id="nav-currents-framing-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'currents_framing'))}
            className={room.phase === 'currents_framing' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Currents Intro
          </button>
          <button
            id="open-workshop-btn"
            onClick={() => updateRoomState(setRoomPhase(room, 'currents_workshop'))}
            className={room.phase === 'currents_workshop' ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)' }}
          >
            Brainstorm
          </button>
        </div>

        {/* Right: Participants count & Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              color: 'var(--ink-secondary)',
              backgroundColor: 'var(--bg-tray)',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <UsersIcon size={14} />
            <span>{totalParticipants} joined</span>
          </span>

          <button
            onClick={onExit}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
            title="Exit session"
          >
            Exit
          </button>
        </div>
      </header>

      {/* 2. Main Presenter Stage */}
      <main style={{ flex: 1, padding: '2rem 1.75rem', maxWidth: 'var(--max-width-stage)', width: '100%', margin: '0 auto' }}>
        {room.phase === 'lobby' ? (
          /* =================================================================
             LOBBY PHASE: Giant QR Code, Join Code & Live Pebble Basin
             ================================================================= */
          <div
            className="lobby-stage"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.25fr',
              gap: '2.5rem',
              alignItems: 'center',
              minHeight: '70vh',
            }}
          >
            {/* Left: Giant QR Code & Short Code */}
            <div
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2.5rem 2rem',
                gap: '1.5rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--currents-teal)',
                }}
              >
                Scan with your phone to join
              </span>

              {/* High Contrast Inline SVG QR Code */}
              <div
                style={{
                  width: '260px',
                  height: '260px',
                  backgroundColor: '#FFFDF9',
                  padding: '12px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Room Code
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    color: 'var(--ink-primary)',
                    lineHeight: 1,
                  }}
                >
                  {room.code}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', marginTop: '0.65rem' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>
                    Or join manually at
                  </span>
                  <button
                    id="copy-short-link-btn"
                    onClick={handleCopyJoinLink}
                    className="btn-ghost"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-tray)',
                      border: '1px solid var(--border-default)',
                      fontSize: '1.05rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-primary)',
                    }}
                    title="Click to copy join link"
                  >
                    <span>{shortJoinLink}</span>
                    {copiedJoinLink ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Live Sandstone Pebble Basin */}
            <div
              className="card-tabletop"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.75rem',
                minHeight: '440px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 style={{ fontSize: '2.15rem' }}>The Workshop Table</h2>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--ink-secondary)',
                  }}
                >
                  {totalParticipants} Joined
                </span>
              </div>

              {/* Sandstone Pebble Well */}
              <div
                className="tray-sandstone"
                style={{
                  minHeight: '220px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  alignItems: 'center',
                  alignContent: 'flex-start',
                }}
              >
                {totalParticipants === 0 ? (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-muted)',
                      gap: '0.5rem',
                      padding: '2rem 0',
                    }}
                  >
                    <Pebble variant={0} stance="neutral" size="md" className="animate-pulse" />
                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Waiting for participants to scan the QR code...
                    </span>
                  </div>
                ) : (
                  participantsList.map((p) => (
                    <div
                      key={p.clientId}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      className="animate-pebble-drop"
                    >
                      <Pebble
                        variant={p.pebbleVariant}
                        stance="neutral"
                        size="md"
                        label={p.name.slice(0, 2).toUpperCase()}
                      />
                      <span
                        style={{
                          fontSize: '0.95rem',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-secondary)',
                          maxWidth: '90px',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.name}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Begin Session Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.85rem' }}>
                <button
                  id="skip-framing-btn"
                  onClick={() => {
                    const next = setRoomPhase(room, 'voting');
                    updateRoomState(next);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.95rem 1.4rem',
                    fontSize: '0.95rem',
                  }}
                >
                  Skip to Scenario 1
                </button>
                <button
                  id="begin-session-btn"
                  onClick={() => {
                    const next = setRoomPhase(room, 'opening_framing');
                    updateRoomState(next);
                  }}
                  className="btn-primary"
                  style={{
                    padding: '0.95rem 1.85rem',
                    fontSize: '1.05rem',
                    backgroundColor: 'var(--stance-support)',
                  }}
                >
                  Begin Session →
                </button>
              </div>
            </div>
          </div>
        ) : room.phase === 'opening_framing' ? (
          /* =================================================================
             OPENING FRAMING PHASE: Built-in 3-Slide Framing Deck
             ================================================================= */
          <FramingSlides
            mode="opening"
            room={room}
            onSelectSlide={(index) => {
              const next = setFramingSlideIndex(room, index);
              updateRoomState(next);
            }}
            onComplete={() => {
              const next = setRoomPhase(room, 'voting');
              updateRoomState(next);
            }}
            onBack={() => {
              const next = setRoomPhase(room, 'lobby');
              updateRoomState(next);
            }}
          />
        ) : room.phase === 'currents_framing' ? (
          /* =================================================================
             CURRENTS FRAMING PHASE: Built-in 5-Slide Current Deep-Dive Deck
             ================================================================= */
          <FramingSlides
            mode="currents"
            room={room}
            onSelectSlide={(index) => {
              const next = setFramingSlideIndex(room, index);
              updateRoomState(next);
            }}
            onComplete={() => {
              const next = setRoomPhase(room, 'currents_workshop');
              updateRoomState(next);
            }}
            onBack={() => {
              const next = setRoomPhase(room, 'revealed');
              updateRoomState(next);
            }}
          />
        ) : room.phase === 'currents_workshop' ? (
          /* =================================================================
             WORKSHOP PHASE: The Four Currents Offsite Synthesis
             ================================================================= */
          <CurrentsWorkshop
            room={room}
            onSetWorkshopStage={handleSetWorkshopStage}
            onToggleEndorsement={(proposalId) => {
              const next = toggleProposalEndorsement(roomRef.current, 'host', proposalId);
              updateRoomState(next);
            }}
            onToggleGroupEndorsement={(groupId) => {
              const next = toggleGroupEndorsement(roomRef.current, 'host', groupId);
              updateRoomState(next);
            }}
            onUpdateCommitment={(cid, text) => {
              const next = updateCurrentCommitment(roomRef.current, cid, text);
              updateRoomState(next);
            }}
            onBackToScenarios={() => {
              const next = setRoomPhase(roomRef.current, 'revealed');
              updateRoomState(next);
            }}
          />
        ) : (
          /* =================================================================
             GAMEPLAY STAGE: Voting, Revealed & "What If?" Twist
             ================================================================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stage Header: Category Pill, Card Counter, Prev Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {categoryMeta && (
                  <span
                    className="badge-category"
                    style={{
                      backgroundColor: categoryMeta.surfaceTint,
                      color: categoryMeta.accentColor,
                      border: `1px solid ${categoryMeta.accentColor}33`,
                      fontSize: '0.86rem',
                    }}
                  >
                    {categoryMeta.label}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--ink-muted)' }}>
                  Scenario {room.currentScenarioIndex + 1} of {totalCards}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  id="end-scenarios-early-btn"
                  onClick={() => {
                    const next = setRoomPhase(room, 'currents_framing');
                    updateRoomState(next);
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    color: 'var(--currents-teal)',
                    borderColor: 'var(--currents-teal-border)',
                  }}
                  title="Wrap up scenarios early and move to The Four Currents"
                >
                  End Scenarios → Currents
                </button>

                <button
                  id="prev-scenario-btn"
                  onClick={handlePrevScenario}
                  disabled={room.currentScenarioIndex === 0}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    opacity: room.currentScenarioIndex === 0 ? 0.4 : 1,
                  }}
                  title="Previous scenario (Left Arrow)"
                >
                  ← Prev
                </button>
              </div>
            </div>

            {/* Main Scenario Editorial Card */}
            {currentCard && (
              <div
                className="card-tabletop"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '4px solid var(--currents-teal)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h1 style={{ fontSize: '2.35rem', maxWidth: '960px', lineHeight: 1.2 }}>
                    {currentCard.title}
                  </h1>
                </div>

                {/* Scenario Prompt */}
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.4rem',
                    lineHeight: 1.55,
                    color: 'var(--ink-primary)',
                    maxWidth: '1040px',
                  }}
                >
                  {currentCard.prompt}
                </p>

                {/* What If Twist Card (Highlighted if active) */}
                {twistActive && (
                  <div className="twist-banner animate-pebble-drop" style={{ marginTop: '0.5rem' }}>
                    <div className="twist-banner-title">
                      <SparkIcon size={16} />
                      <span>What if?</span>
                    </div>
                    <div className="twist-banner-body">
                      {currentCard.twist}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Voting Phase Tray vs Revealed Response Graph */}
            {room.phase === 'voting' ? (
              <div
                className="card-tabletop"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '2.5rem',
                  gap: '1.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.45rem', marginBottom: '0.35rem' }}>
                    Pebbles are Being Placed...
                  </h3>
                  <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem' }}>
                    Participants are reading the scenario on their phones and casting their stance: Supports, It Depends, or Erodes.
                  </p>
                </div>

                {/* Live Anonymous Pebble Tray */}
                <div
                  className="tray-sandstone"
                  style={{
                    width: '100%',
                    maxWidth: '680px',
                    minHeight: '110px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {currentVotesCount === 0 ? (
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                      Waiting for initial votes from the room...
                    </span>
                  ) : (
                    currentRound &&
                    Object.values(currentRound.votes).map((vote, idx) => {
                      const participant = room.participants[vote.clientId];
                      return (
                        <Pebble
                          key={vote.clientId || idx}
                          variant={participant?.pebbleVariant ?? (idx % 5)}
                          stance="neutral"
                          size="md"
                          className="animate-pebble-drop"
                          label={participant ? participant.name.slice(0, 2).toUpperCase() : `P${idx + 1}`}
                          title={`${participant?.name || 'Voter'} placed their stone`}
                        />
                      );
                    })
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', fontWeight: 600 }}>
                    {currentVotesCount} of {Math.max(totalParticipants, currentVotesCount)} voted
                  </span>

                  <button
                    id="reveal-responses-btn"
                    onClick={() => {
                      const next = setRoomPhase(room, 'revealed');
                      updateRoomState(next);
                    }}
                    className="btn-primary"
                    style={{ padding: '0.8rem 1.6rem', fontSize: '1rem' }}
                  >
                    Reveal Responses →
                  </button>
                </div>
              </div>
            ) : (
              /* Response Graph & Compact Facilitator Discussion Bar */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* 3 Stance Columns Graph */}
                <div className="card-tabletop">
                  <ResponseGraph
                    round={currentRound}
                    participants={room.participants}
                    showNotes={true}
                  />
                </div>

                {/* Action Bar */}
                {currentCard && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '0.65rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    {!twistActive && (
                      <button
                        id="trigger-twist-btn"
                        onClick={() => {
                          const next = triggerScenarioTwist(room);
                          updateRoomState(next);
                        }}
                        className="btn-primary"
                        style={{
                          backgroundColor: 'var(--stance-depends)',
                          padding: '0.7rem 1.25rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <SparkIcon size={15} />
                        <span>What if?</span>
                      </button>
                    )}

                    {!isLastCard && (
                      <button
                        id="finish-scenarios-btn"
                        onClick={() => {
                          const next = setRoomPhase(room, 'currents_framing');
                          updateRoomState(next);
                        }}
                        className="btn-secondary"
                        style={{
                          padding: '0.7rem 1.15rem',
                          color: 'var(--currents-teal)',
                          borderColor: 'var(--currents-teal-border)',
                        }}
                        title="Wrap up scenarios and move to The Four Currents"
                      >
                        End Scenarios → Currents
                      </button>
                    )}

                    <button
                      id="presenter-add-scenario-btn"
                      type="button"
                      onClick={() => setShowAddScenarioModal(true)}
                      className="btn-secondary"
                      style={{
                        padding: '0.7rem 1.15rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      title="Add a custom scenario live to this session"
                    >
                      <PlusIcon size={14} />
                      <span>Add Scenario</span>
                    </button>

                    <button
                      id="advance-scenario-btn"
                      onClick={handleNextScenario}
                      className="btn-primary"
                      style={{ padding: '0.7rem 1.3rem' }}
                    >
                      {isLastCard ? 'Introduce The Four Currents →' : 'Next Scenario →'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Popover / Modal for Latecomer QR Code */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(31, 28, 24, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQrModal(false);
          }}
        >
          <div
            className="card-tabletop"
            style={{
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1.25rem',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
              title="Close QR modal"
            >
              <CloseIcon size={16} />
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--currents-teal)' }}>
              Join the Active Session
            </span>

            <div
              style={{
                width: '240px',
                height: '240px',
                backgroundColor: '#FFFDF9',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.4rem', fontWeight: 800, letterSpacing: '0.15em' }}>
                {room.code}
              </span>
              <div style={{ marginTop: '0.4rem', fontSize: '0.84rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-secondary)' }}>
                {shortJoinLink}
              </div>
            </div>

            {/* Local AI Grouping Key (Optional - hidden when server AI is active) */}
            {!getCachedCapabilities()?.aiAvailable && (
              <div
                style={{
                  width: '100%',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  textAlign: 'left',
                }}
              >
                <label
                  htmlFor="modal-host-ai-key-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ink-secondary)',
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
                        fontSize: '0.78rem',
                        color: 'var(--stance-support)',
                        fontWeight: 600,
                      }}
                    >
                      <CheckIcon size={12} />
                      <span>Saved on this browser</span>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        id="modal-change-ai-key-btn"
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
                        id="modal-clear-ai-key-btn"
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
                        id="modal-host-ai-key-input"
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
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.84rem',
                          fontFamily: 'var(--font-mono)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)',
                          backgroundColor: '#FFFDF9',
                          color: 'var(--ink-primary)',
                        }}
                      />
                      {isEditingKey && (
                        <button
                          id="modal-save-ai-key-btn"
                          type="button"
                          className="btn-secondary"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            const trimmed = keyInputVal.trim();
                            setConfiguredAiKey(trimmed);
                            setAiKey(trimmed);
                            setIsEditingKey(false);
                          }}
                          onClick={() => {
                            const trimmed = keyInputVal.trim();
                            setConfiguredAiKey(trimmed);
                            setAiKey(trimmed);
                            setIsEditingKey(false);
                          }}
                          style={{
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.76rem',
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
                        fontSize: '0.72rem',
                        color: 'var(--ink-muted)',
                        marginTop: '0.35rem',
                        lineHeight: 1.35,
                      }}
                    >
                      Enables automated AI theme clustering during Stage 2 of the Four Currents brainstorm.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showAddScenarioModal && (
        <div
          id="add-scenario-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddScenarioModal(false);
          }}
        >
          <div
            className="card-tabletop"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              gap: '1rem',
              position: 'relative',
              padding: '1.5rem',
            }}
          >
            <button
              id="close-add-scenario-modal-btn"
              onClick={() => setShowAddScenarioModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink-muted)',
              }}
              title="Close modal"
            >
              <CloseIcon size={16} />
            </button>

            <div>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--currents-teal)',
                  letterSpacing: '0.04em',
                }}
              >
                Live Scenario Addition
              </span>
              <h3
                style={{
                  margin: '0.2rem 0 0.35rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                }}
              >
                Add Scenario to Active Deck
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.4,
                }}
              >
                Draft with AI or type a custom workplace dilemma. The card will be appended to this session deck in real time.
              </p>
            </div>

            {/* AI Draft helper box */}
            <div
              style={{
                backgroundColor: 'var(--bg-tray)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--ink-secondary)',
                }}
              >
                <SparkIcon size={13} style={{ color: 'var(--currents-teal)' }} />
                <span>Draft with AI Assistant</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  id="live-scenario-topic-input"
                  type="text"
                  value={addTopic}
                  onChange={(e) => setAddTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDraftLiveScenario();
                    }
                  }}
                  placeholder="e.g. Budget reallocation vs grantee trust"
                  style={{
                    flex: '1 1 200px',
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />

                <select
                  id="live-scenario-current-select"
                  value={addCurrentId}
                  onChange={(e) => setAddCurrentId(e.target.value as RithmCurrentId)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
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
                  id="live-scenario-category-select"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value as ScenarioCategory)}
                  style={{
                    padding: '0.45rem 0.65rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                >
                  {CATEGORY_LIST.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.shortLabel}
                    </option>
                  ))}
                </select>

                <button
                  id="live-scenario-draft-btn"
                  type="button"
                  onClick={handleDraftLiveScenario}
                  disabled={isDraftingLive || !addTopic.trim()}
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    opacity: isDraftingLive || !addTopic.trim() ? 0.6 : 1,
                  }}
                >
                  {isDraftingLive ? 'Drafting...' : 'Generate Draft'}
                </button>
              </div>

              {draftLiveError && (
                <div style={{ fontSize: '0.74rem', color: 'var(--color-crimson)' }}>
                  {draftLiveError}
                </div>
              )}
            </div>

            {/* Scenario Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label
                  htmlFor="live-scenario-current"
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Current (Optional)
                </label>
                <select
                  id="live-scenario-current"
                  value={addCurrentId}
                  onChange={(e) => setAddCurrentId(e.target.value as RithmCurrentId)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
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
                <label
                  htmlFor="live-scenario-category"
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Domain Category (Optional)
                </label>
                <select
                  id="live-scenario-category"
                  value={addCategory}
                  onChange={(e) => setAddCategory(e.target.value as ScenarioCategory)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
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
                <label
                  htmlFor="live-scenario-title"
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Title (Optional)
                </label>
                <input
                  id="live-scenario-title"
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Auto-generated from scenario text if left blank"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="live-scenario-prompt"
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Scenario Text / Dilemma (Required)
                </label>
                <textarea
                  id="live-scenario-prompt"
                  rows={2}
                  value={addPrompt}
                  onChange={(e) => setAddPrompt(e.target.value)}
                  placeholder="Describe the initial decision point and tension."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="live-scenario-whatif"
                  style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--ink-secondary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  Twist: "What if...?" (Optional)
                </label>
                <input
                  id="live-scenario-whatif"
                  type="text"
                  value={addWhatIf}
                  onChange={(e) => setAddWhatIf(e.target.value)}
                  placeholder="e.g. What if the recipient specifically requested human counsel?"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFDF9',
                    color: 'var(--ink-primary)',
                  }}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.65rem',
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                id="cancel-add-scenario-btn"
                type="button"
                className="btn-ghost"
                onClick={() => setShowAddScenarioModal(false)}
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                id="save-live-scenario-btn"
                type="button"
                className="btn-primary"
                onClick={handleSaveLiveScenario}
                disabled={!addPrompt.trim()}
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.82rem',
                  opacity: !addPrompt.trim() ? 0.6 : 1,
                }}
              >
                Add to Session Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
