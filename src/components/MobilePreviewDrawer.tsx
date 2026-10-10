import React, { useEffect, useMemo, useState } from 'react';
import { ParticipantView } from '../views/ParticipantView';
import { createClientChannel, ClientRoomChannel } from '../utils/roomSync';
import { RoomState } from '../types/game';
import { PhoneIcon, CloseIcon } from './Icons';

export interface MobilePreviewDrawerProps {
  room: RoomState;
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePreviewDrawer: React.FC<MobilePreviewDrawerProps> = ({
  room,
  isOpen,
  onClose,
}) => {
  const previewClientId = useMemo(
    () => 'preview_' + room.code.toLowerCase(),
    [room.code]
  );

  const [syncedRoom, setSyncedRoom] = useState<RoomState>(room);
  const [channel, setChannel] = useState<ClientRoomChannel | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const ch = createClientChannel(
      room.code,
      previewClientId,
      (updatedState) => {
        setSyncedRoom(updatedState);
      }
    );

    setChannel(ch);
    // Send immediate join for preview voter (gets an auto-assigned alliterative animal name)
    ch.sendJoin();

    return () => {
      ch.destroy();
      setChannel(null);
    };
  }, [isOpen, room.code, previewClientId]);

  // Keep state updated from parent prop if needed
  useEffect(() => {
    setSyncedRoom(room);
  }, [room]);

  if (!isOpen) return null;

  return (
    <div
      className="mobile-preview-overlay"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '430px',
        backgroundColor: 'rgba(31, 28, 24, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mobile-preview-device"
        style={{
          width: '390px',
          height: '844px',
          maxHeight: '92vh',
          backgroundColor: 'var(--bg-canvas)',
          borderRadius: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 0 10px #2D2926',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Device Top Speaker Bar & Close Header */}
        <div
          style={{
            height: '42px',
            backgroundColor: '#2D2926',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            color: '#FAF6F0',
            fontSize: '0.78rem',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <PhoneIcon size={14} />
            <span style={{ fontWeight: 600 }}>Mobile Participant Dry-Run</span>
          </div>

          <button
            id="close-mobile-preview-btn"
            onClick={onClose}
            style={{
              color: '#FAF6F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.2rem 0.4rem',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Close mobile preview"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Scrollable Mobile Phone Screen */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            backgroundColor: 'var(--bg-canvas)',
          }}
        >
          {channel && (
            <ParticipantView
              room={syncedRoom}
              channel={channel}
              clientId={previewClientId}
            />
          )}
        </div>
      </div>
    </div>
  );
};
