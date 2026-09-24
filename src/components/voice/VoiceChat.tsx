'use client';

/**
 * VoiceChat — WebRTC Mesh P2P Voice Chat Component
 *
 * Architecture:
 *  - Each browser peer creates one RTCPeerConnection per remote peer (full mesh)
 *  - SDP Offer/Answer and ICE candidates exchanged through /api/signaling/[lobbyId]
 *  - Polling every 1.5s for new signaling messages (stops once all peers connected)
 *  - Web Audio API AnalyserNode for real-time speaking detection
 *  - Game-phase muting: LOBBY=off, NIGHT_BUFFER=mafia-only, DAY=all
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GamePhase } from '../../types/game';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PeerInfo {
  readonly userId: string;
  readonly faction?: string; // 'MAFIA' | 'TOWN' | etc.
  readonly isAlive: boolean;
}

interface VoiceChatProps {
  readonly lobbyId: string;
  readonly myUserId: string;
  readonly myFaction: string | null; // null = unknown (lobby phase)
  readonly phase: GamePhase;
  readonly peers: PeerInfo[]; // all OTHER players (not self)
  readonly onSpeakingChange: (speakingIds: Set<string>) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const POLL_INTERVAL_MS = 1500;
const SPEAKING_THRESHOLD = 20; // RMS amplitude threshold (0-255)
const SPEAKING_CHECK_INTERVAL_MS = 150;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMicAllowedByPhase(phase: GamePhase, myFaction: string | null): boolean {
  if (phase === 'LOBBY' || phase === 'ENDED') return false;
  if (phase === 'NIGHT_BUFFER') return myFaction === 'MAFIA';
  return true; // DAY phases — all can speak
}

async function postSignal(
  lobbyId: string,
  fromPeerId: string,
  toPeerId: string,
  type: string,
  payload: unknown
): Promise<void> {
  try {
    await fetch(`/api/signaling/${lobbyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromPeerId, toPeerId, type, payload }),
    });
  } catch {
    // Network error — ignore, will retry on next poll
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VoiceChat({
  lobbyId,
  myUserId,
  myFaction,
  phase,
  peers,
  onSpeakingChange,
}: VoiceChatProps) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [connectedPeerIds, setConnectedPeerIds] = useState<Set<string>>(new Set());
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [voiceActive, setVoiceActive] = useState(false); // User toggled voice on

  // Refs — stable across renders
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analyserMapRef = useRef<Map<string, { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> }>>(new Map());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myAnalyserRef = useRef<{ analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const micAllowed = isMicAllowedByPhase(phase, myFaction);

  // ── Speaking Detection ─────────────────────────────────────────────────────

  const checkSpeaking = useCallback(() => {
    const newSpeaking = new Set<string>();

    // Check self
    if (myAnalyserRef.current) {
      myAnalyserRef.current.analyser.getByteTimeDomainData(myAnalyserRef.current.data);
      const rms = computeRMS(myAnalyserRef.current.data);
      if (rms > SPEAKING_THRESHOLD) newSpeaking.add(myUserId);
    }

    // Check remote peers
    for (const [peerId, entry] of analyserMapRef.current.entries()) {
      entry.analyser.getByteTimeDomainData(entry.data);
      const rms = computeRMS(entry.data);
      if (rms > SPEAKING_THRESHOLD) newSpeaking.add(peerId);
    }

    setSpeakingIds((prev) => {
      const changed =
        newSpeaking.size !== prev.size ||
        [...newSpeaking].some((id) => !prev.has(id));
      if (changed) {
        onSpeakingChange(newSpeaking);
        return newSpeaking;
      }
      return prev;
    });
  }, [myUserId, onSpeakingChange]);

  function computeRMS(data: Uint8Array<ArrayBuffer>): number {
    let sum = 0;
    for (const v of data) {
      const centered = v - 128;
      sum += centered * centered;
    }
    return Math.sqrt(sum / data.length);
  }

  // ── Setup Analyser for a MediaStream ──────────────────────────────────────

  const setupAnalyser = useCallback(
    (stream: MediaStream, peerId: string | '__self__'): void => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;
      source.connect(analyser);

      if (peerId === '__self__') {
        myAnalyserRef.current = { analyser, data };
      } else {
        analyserMapRef.current.set(peerId, { analyser, data });
      }
    },
    []
  );

  // ── Create RTCPeerConnection for a remote peer ─────────────────────────────

  const createPeerConnection = useCallback(
    (remotePeerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

      // Add local audio track
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          pc.addTrack(track, localStreamRef.current);
        }
      }

      // Handle incoming audio track
      pc.ontrack = (evt) => {
        const remoteStream = evt.streams[0];
        if (!remoteStream) return;

        // Create or reuse audio element
        let audioEl = remoteAudioRefs.current.get(remotePeerId);
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          remoteAudioRefs.current.set(remotePeerId, audioEl);
        }
        audioEl.srcObject = remoteStream;

        // Set up analyser for speaking detection
        setupAnalyser(remoteStream, remotePeerId);
      };

      // Send ICE candidates to remote peer
      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          postSignal(lobbyId, myUserId, remotePeerId, 'candidate', evt.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectedPeerIds((prev) => new Set([...prev, remotePeerId]));
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          setConnectedPeerIds((prev) => {
            const next = new Set(prev);
            next.delete(remotePeerId);
            return next;
          });
          analyserMapRef.current.delete(remotePeerId);
        }
      };

      peerConnectionsRef.current.set(remotePeerId, pc);
      return pc;
    },
    [lobbyId, myUserId, setupAnalyser]
  );

  // ── Initiate connection to a peer (caller role) ────────────────────────────

  const initiateConnection = useCallback(
    async (remotePeerId: string): Promise<void> => {
      const existing = peerConnectionsRef.current.get(remotePeerId);
      if (existing && existing.signalingState !== 'closed') return;

      const pc = createPeerConnection(remotePeerId);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await postSignal(lobbyId, myUserId, remotePeerId, 'offer', offer);
    },
    [lobbyId, myUserId, createPeerConnection]
  );

  // ── Process incoming signaling messages ────────────────────────────────────

  const processSignal = useCallback(
    async (msg: {
      fromPeerId: string;
      type: string;
      payload: unknown;
    }): Promise<void> => {
      const { fromPeerId, type, payload } = msg;

      if (type === 'ready') {
        // Remote peer announced readiness — initiate if we have higher ID (deterministic caller)
        if (myUserId > fromPeerId) {
          await initiateConnection(fromPeerId);
        }
        return;
      }

      if (type === 'offer') {
        let pc = peerConnectionsRef.current.get(fromPeerId);
        if (!pc || pc.signalingState === 'closed') {
          pc = createPeerConnection(fromPeerId);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await postSignal(lobbyId, myUserId, fromPeerId, 'answer', answer);
        return;
      }

      if (type === 'answer') {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        }
        return;
      }

      if (type === 'candidate') {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
          } catch {
            // Stale candidate — ignore
          }
        }
        return;
      }

      if (type === 'bye') {
        const pc = peerConnectionsRef.current.get(fromPeerId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(fromPeerId);
        }
      }
    },
    [myUserId, lobbyId, createPeerConnection, initiateConnection]
  );

  // ── Poll for signaling messages ────────────────────────────────────────────

  const pollSignaling = useCallback(async () => {
    try {
      const res = await fetch(`/api/signaling/${lobbyId}?peerId=${myUserId}`);
      if (!res.ok) return;
      const data = await res.json() as { messages: Array<{ fromPeerId: string; type: string; payload: unknown }> };
      for (const msg of data.messages ?? []) {
        await processSignal(msg);
      }
    } catch {
      // Network unavailable — retry next tick
    }
  }, [lobbyId, myUserId, processSignal]);

  // ── Start Voice ────────────────────────────────────────────────────────────

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setHasPermission(true);
      setupAnalyser(stream, '__self__');

      // Announce readiness to all peers
      await postSignal(lobbyId, myUserId, '*', 'ready', null);

      // Start polling
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(pollSignaling, POLL_INTERVAL_MS);
      }

      // Start speaking detection
      if (!speakingTimerRef.current) {
        speakingTimerRef.current = setInterval(checkSpeaking, SPEAKING_CHECK_INTERVAL_MS);
      }

      setVoiceActive(true);
    } catch {
      setHasPermission(false);
    }
  }, [lobbyId, myUserId, pollSignaling, setupAnalyser, checkSpeaking]);

  // ── Stop Voice ─────────────────────────────────────────────────────────────

  const stopVoice = useCallback(async () => {
    // Announce goodbye
    await postSignal(lobbyId, myUserId, '*', 'bye', null);

    // Stop local stream tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    // Close all peer connections
    for (const pc of peerConnectionsRef.current.values()) {
      pc.close();
    }
    peerConnectionsRef.current.clear();

    // Stop audio elements
    for (const el of remoteAudioRefs.current.values()) {
      el.pause();
      el.srcObject = null;
    }
    remoteAudioRefs.current.clear();

    // Stop timers
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    if (speakingTimerRef.current) { clearInterval(speakingTimerRef.current); speakingTimerRef.current = null; }

    analyserMapRef.current.clear();
    myAnalyserRef.current = null;

    setSpeakingIds(new Set());
    onSpeakingChange(new Set());
    setConnectedPeerIds(new Set());
    setVoiceActive(false);
    setMicEnabled(false);
  }, [lobbyId, myUserId, onSpeakingChange]);

  // ── Apply phase-based mic mute ─────────────────────────────────────────────

  useEffect(() => {
    if (!localStreamRef.current) return;
    const allowed = isMicAllowedByPhase(phase, myFaction);
    for (const track of localStreamRef.current.getAudioTracks()) {
      track.enabled = allowed && micEnabled;
    }
  }, [phase, myFaction, micEnabled]);

  // ── Connect to newly joined peers ─────────────────────────────────────────

  useEffect(() => {
    if (!voiceActive) return;
    for (const peer of peers) {
      if (!peer.isAlive) continue;
      const existing = peerConnectionsRef.current.get(peer.userId);
      if (!existing || existing.connectionState === 'closed' || existing.connectionState === 'failed') {
        // Will connect when they respond to our 'ready' broadcast or send their own
      }
    }
  }, [peers, voiceActive]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopVoice();
      audioCtxRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mic Toggle ────────────────────────────────────────────────────────────

  const handleMicToggle = () => {
    if (!voiceActive) {
      startVoice();
      setMicEnabled(true);
    } else {
      const next = !micEnabled;
      setMicEnabled(next);
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getAudioTracks()) {
          track.enabled = next && micAllowed;
        }
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'LOBBY' || phase === 'ENDED') return null;

  const isActuallyMuted = !micEnabled || !micAllowed;
  const nightMuted = micEnabled && !micAllowed;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(10, 14, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        padding: '14px 20px',
        flexWrap: 'wrap',
      }}
    >
      {/* Mic Toggle Button */}
      <button
        type="button"
        onClick={handleMicToggle}
        title={isActuallyMuted ? 'Mikrofonu aç' : 'Mikrofonu söndür'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 800,
          fontSize: '14px',
          transition: 'all 0.2s',
          backgroundColor: isActuallyMuted
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(34, 197, 94, 0.18)',
          color: isActuallyMuted ? '#fca5a5' : '#86efac',
          boxShadow: isActuallyMuted
            ? '0 0 12px rgba(239, 68, 68, 0.25)'
            : '0 0 12px rgba(34, 197, 94, 0.35)',
        }}
      >
        <span style={{ fontSize: '18px' }}>{isActuallyMuted ? '🔇' : '🎙️'}</span>
        <span>
          {!voiceActive
            ? 'Səs Çata Qoşul'
            : isActuallyMuted
            ? 'Mikrofonun Bağlıdır'
            : 'Danışırsınız'}
        </span>
      </button>

      {/* Connected peer count */}
      {voiceActive && (
        <span style={{ fontSize: '13px', color: '#64748b' }}>
          {connectedPeerIds.size > 0 ? (
            <span style={{ color: '#38bdf8' }}>🔗 {connectedPeerIds.size} oyunçu qoşulub</span>
          ) : (
            <span>📡 Digər oyunçuların qoşulması gözlənilir...</span>
          )}
        </span>
      )}

      {/* Night phase warning */}
      {nightMuted && (
        <span
          style={{
            fontSize: '12px',
            color: '#fbbf24',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(251, 191, 36, 0.25)',
          }}
        >
          🌙 Gecə fazasında yalnız mafiya fraksiyası danışa bilər
        </span>
      )}

      {/* Microphone permission denied */}
      {hasPermission === false && (
        <span style={{ fontSize: '12px', color: '#f87171' }}>
          ⚠️ Mikrofon icazəsi verilmədi. Brauzer ayarlarından icazə verin.
        </span>
      )}

      {/* Speaking indicators for self */}
      {voiceActive && !isActuallyMuted && speakingIds.has(myUserId) && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#4ade80',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              animation: 'voicePulse 0.6s ease-in-out infinite alternate',
            }}
          />
          Danışırsınız
        </span>
      )}

      <style>{`
        @keyframes voicePulse {
          from { transform: scale(1); opacity: 0.7; }
          to   { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
