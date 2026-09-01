'use client';

import { useEffect, useRef, useState } from 'react';
import { useConflictFeed } from '@/lib/hooks';
import { useConflict } from '@/lib/conflicts/context';
import { playAlertSound } from '@/lib/generateAlert';
import { BRAND } from '@/lib/brand';
import type { AlertStatus } from '@/lib/alertStatus';

interface AlertData {
  status: AlertStatus;
  provider: string | null;
  activeCount: number;
  alerts: {
    id: string;
    time: string;
    type: string;
    threat: string;
    locations: string[];
    source: string;
    active: boolean;
  }[];
  lastChecked: string;
}

interface DroneTrack {
  id: string;
  label: string;
  color: string;
  heading: number;
  count: number;
  place: string;
  time: string;
}

interface DroneData {
  drones: DroneTrack[];
  count: number;
  ballisticThreat: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  MISSILE: '🚀',
  ROCKET: '🎯',
  DRONE: '✈',
  MORTAR: '💣',
  INFILTRATION: '⚠',
  ALERT: '🔴',
};

export default function AlertsPanel() {
  const { config } = useConflict();
  const alertSystemName = config.client.alertSystemName;
  const { data, loading } = useConflictFeed<AlertData>('/api/alerts', 15000);
  const { data: droneData } = useConflictFeed<DroneData>('/api/drones', 20000);
  const drones = droneData?.drones || [];
  const prevStatus = useRef<string>('CLEAR');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Enable audio context after first user interaction (browser requirement)
  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Play sound when status changes to ACTIVE
  useEffect(() => {
    if (!data) return;

    if (data.status === 'ACTIVE' && prevStatus.current !== 'ACTIVE' && soundEnabled && hasInteracted) {
      // Play urgent sound for new alerts
      playAlertSound('urgent');

      // Also send browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(`${BRAND.short} ALERT`, {
          body: `${data.activeCount} active alert(s) - ${data.alerts[0]?.type}: ${data.alerts[0]?.threat}`,
          icon: '/favicon.ico',
          tag: 'ironsight-alert',
        });
      }
    }

    prevStatus.current = data.status;
  }, [data, soundEnabled, hasInteracted]);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const isActive = data?.status === 'ACTIVE';
  const hasThreat = isActive || drones.length > 0;
  // An empty alert list is only reassuring when the provider actually answered.
  // These two states must never be painted green: one means the upstream is
  // unreachable, the other that this theater has no mirror at all.
  const isUnavailable = data?.status === 'UNAVAILABLE';
  const isNoSource = data?.status === 'NO_SOURCE';
  const canReassure = data?.status === 'CLEAR';

  return (
    <div
      className="panel h-full flex flex-col"
      style={hasThreat ? { borderColor: 'var(--red)', boxShadow: '0 0 20px rgba(255, 51, 102, 0.3)' } : {}}
    >
      <div className="panel-header">
        <span
          className="status-dot"
          style={{
            background: hasThreat
              ? 'var(--red)'
              : canReassure
                ? 'var(--green)'
                : 'var(--text-secondary)',
            animation: hasThreat ? 'pulse-dot 0.5s ease-in-out infinite' : undefined,
          }}
        />
        {config.client.alertStatusTitle}
        <div className="ml-auto flex items-center gap-2">
          {/* Sound toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled && hasInteracted) {
                playAlertSound('ping'); // Preview sound when enabling
              }
            }}
            className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
            style={{
              color: soundEnabled ? 'var(--cyan)' : 'var(--text-secondary)',
              borderColor: soundEnabled ? 'var(--cyan)' : 'var(--border-color)',
              background: soundEnabled ? 'rgba(0,212,255,0.1)' : 'transparent',
            }}
            title={soundEnabled ? 'Sound alerts ON' : 'Sound alerts OFF'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>
          <span className="text-[9px] font-normal normal-case tracking-normal"
            style={{
              color: hasThreat
                ? 'var(--red)'
                : canReassure
                  ? 'var(--green)'
                  : isUnavailable
                    ? 'var(--red, #ef4444)'
                    : 'var(--text-secondary)',
            }}
          >
            {hasThreat
              ? `${data?.activeCount || 0} ALERT${drones.length ? ` · ${drones.length} TRK` : ''}`
              : isUnavailable
                ? 'FEED DOWN'
                : isNoSource
                  ? 'NO SOURCE'
                  : 'ALL CLEAR'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {drones.length > 0 && (
          <div className="border-b border-[var(--border-color)]">
            <div className="px-3 py-1 text-[9px] tracking-widest text-[var(--text-secondary)] bg-[var(--bg-panel-header)]">
              LIVE TRACKS // {drones.length} INBOUND
            </div>
            {drones.slice(0, 12).map(d => (
              <div key={d.id} className="data-row flex items-center gap-2">
                <span className="text-sm" style={{ color: d.color, transform: `rotate(${d.heading}deg)` }}>▲</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold" style={{ color: d.color }}>
                    {d.label}{d.count > 1 ? ` ×${d.count}` : ''}
                    {d.place ? <span className="text-[var(--text-primary)] font-normal"> → {d.place}</span> : null}
                  </div>
                  <div className="text-[8px] text-[var(--text-secondary)]">
                    hdg {d.heading}° · {new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading ? (
          <div className="p-3">
            <div className="loading-shimmer h-20 rounded" />
          </div>
        ) : isActive ? (
          <>
            {/* Active alert banner */}
            <div className="px-3 py-2 bg-red-900/30 border-b border-red-800/50 alert-flash">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <div>
                  <div className="text-xs font-bold text-[var(--red)]">
                    INCOMING THREAT DETECTED
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)]">
                    {alertSystemName} sirens activated
                  </div>
                </div>
              </div>
            </div>

            {data?.alerts.map((alert, i) => (
              <div key={i} className="data-row">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{TYPE_ICONS[alert.type] || '🔴'}</span>
                  <span className="text-[10px] font-bold text-[var(--red)]">
                    {alert.type}
                  </span>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    {new Date(alert.time).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-primary)]">
                  {alert.threat}
                </div>
                <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">
                  {alert.locations.join(', ')}
                </div>
              </div>
            ))}
          </>
        ) : drones.length > 0 ? (
          // Drones inbound but no oblast siren active — the LIVE TRACKS section above covers it
          <div className="px-3 py-2 text-[9px] text-[var(--text-secondary)]">
            No oblast air-raid sirens active · tracking {drones.length} inbound threat{drones.length > 1 ? 's' : ''} above
          </div>
        ) : isUnavailable || isNoSource ? (
          // Neither of these is an all-clear. Rendering the green shield here
          // would tell a reader the sky is quiet when the truth is that nothing
          // is being watched.
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="relative w-16 h-16 mb-3">
              {isUnavailable ? (
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="var(--red, #ef4444)" strokeWidth="1.5">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(239,68,68,0.1)" strokeLinejoin="round" />
                  <path d="M12 9v4" strokeLinecap="round" />
                  <path d="M12 17h.01" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="var(--text-secondary)" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" fill="rgba(148,163,184,0.08)" />
                  <path d="M5.64 5.64l12.72 12.72" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div
              className="text-sm font-bold mb-1"
              style={{ color: isUnavailable ? 'var(--red, #ef4444)' : 'var(--text-secondary)' }}
            >
              {isUnavailable ? 'ALERT FEED DOWN' : 'NO ALERT SOURCE'}
            </div>
            <div className="text-[9px] text-[var(--text-secondary)] text-center max-w-[240px] leading-relaxed">
              {isUnavailable
                ? `${alertSystemName} is not responding. This is not an all-clear — the current alert state is unknown.`
                : 'This theater has no public air-raid mirror. Alert status is not monitored here.'}
            </div>
            {isUnavailable && (
              <div className="text-[8px] text-[var(--text-secondary)] mt-2">
                Retrying every 5s • Last attempt: {data?.lastChecked ? new Date(data.lastChecked).toLocaleTimeString() : '...'}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="relative w-16 h-16 mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full" stroke="var(--green)" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(0,255,136,0.1)" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm font-bold text-[var(--green)] mb-1">ALL CLEAR</div>
            <div className="text-[9px] text-[var(--text-secondary)] text-center">
              No active alerts from {alertSystemName}
            </div>
            <div className="text-[8px] text-[var(--text-secondary)] mt-2">
              Polling every 5s • Last: {data?.lastChecked ? new Date(data.lastChecked).toLocaleTimeString() : '...'}
            </div>
            <div className="text-[8px] mt-1" style={{ color: soundEnabled ? 'var(--cyan)' : 'var(--text-secondary)' }}>
              Sound: {soundEnabled ? 'ON' : 'OFF'} {!hasInteracted && soundEnabled ? '(click anywhere to enable)' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
