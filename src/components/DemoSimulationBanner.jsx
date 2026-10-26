import React from 'react';
import { Sparkles, Activity, LogOut, ShieldAlert } from 'lucide-react';
import { useIV } from '../context/IVContext';

export default function DemoSimulationBanner() {
  const { isDemoMode, exitDemoMode } = useIV();

  if (!isDemoMode) return null;

  return (
    <div className="demo-simulation-banner">
      <div className="demo-banner-content">
        <div className="demo-banner-badge">
          <Sparkles size={14} className="demo-sparkle-icon" />
          <span>Doctor Simulation Active</span>
        </div>
        <div className="demo-banner-text">
          <strong>Dr. Alex Chen, MD:</strong> Autonomous device telemetry is running in memory. Simulated beds drop fluid levels and trigger notifications automatically. Real hardware & Firebase RTDB are completely untouched.
        </div>
      </div>
      <button 
        type="button" 
        className="demo-banner-exit-btn"
        onClick={exitDemoMode}
        title="Stop simulation and return to login portal"
      >
        <LogOut size={14} />
        <span>Exit Simulation</span>
      </button>

      <style>{`
        .demo-simulation-banner {
          background: linear-gradient(90deg, rgba(2, 132, 199, 0.95), rgba(13, 148, 136, 0.92));
          color: #ffffff;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
          position: sticky;
          top: 0;
          z-index: 99;
          backdrop-filter: blur(8px);
          animation: slideDownBanner 0.3s ease-out;
        }

        @keyframes slideDownBanner {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .demo-banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .demo-banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.35);
          padding: 3px 9px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .demo-sparkle-icon {
          animation: pulseSparkle 1.8s infinite alternate;
        }

        @keyframes pulseSparkle {
          from { transform: scale(0.9); opacity: 0.8; }
          to { transform: scale(1.2); opacity: 1; }
        }

        .demo-banner-text {
          font-size: 0.8125rem;
          line-height: 1.4;
        }

        .demo-banner-text strong {
          color: #fef08a;
          font-weight: 700;
        }

        .demo-banner-exit-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.95);
          color: #0369a1;
          border: none;
          padding: 5px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .demo-banner-exit-btn:hover {
          background: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          color: #0284c7;
        }

        @media (max-width: 768px) {
          .demo-simulation-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .demo-banner-exit-btn {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
