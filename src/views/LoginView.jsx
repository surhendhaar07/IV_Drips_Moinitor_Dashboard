import React, { useState } from 'react';
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Database,
  ShieldCheck,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useIV } from '../context/IVContext';
import { sqliteService, DEFAULT_STAFF } from '../services/sqliteService';

export default function LoginView({ onLoginSuccess }) {
  const { setCurrentUser, addToast, startDemoMode } = useIV();
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const user = await sqliteService.authenticate(usernameInput, password);

      const userObj = {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        badge: user.badge || `${user.role} Staff`,
        status: user.status
      };

      setCurrentUser(userObj);
      localStorage.setItem('iv_user', JSON.stringify(userObj));
      localStorage.setItem('iv_logged_in', 'true');

      if (addToast) {
        addToast(
          'Authenticated via SQLite',
          `Welcome back, ${user.name} (${user.role} - ${user.department}).`,
          'success'
        );
      }

      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchDoctorDemo = () => {
    startDemoMode();
    if (addToast) {
      addToast(
        'Doctor Live Simulation Started',
        'Simulating Dr. Alex Chen with autonomous bedside telemetry & low fluid warnings.',
        'success'
      );
    }
    if (onLoginSuccess) onLoginSuccess();
  };

  const fillQuickCredentials = (key) => {
    setErrorMessage('');
    let staffUser = null;
    if (key === 'Administrator') {
      staffUser = DEFAULT_STAFF.find(u => u.username === 'admin');
    } else if (key === 'Doctor') {
      staffUser = DEFAULT_STAFF.find(u => u.username === 'doctor');
    } else if (key === 'Nurse' || key === 'Nurse1') {
      staffUser = DEFAULT_STAFF.find(u => u.username === 'nurse');
    } else if (key === 'Nurse2') {
      staffUser = DEFAULT_STAFF.find(u => u.username === 'nurse2');
    } else if (key === 'Nurse3') {
      staffUser = DEFAULT_STAFF.find(u => u.username === 'nurse3');
    }

    if (staffUser) {
      setUsernameInput(staffUser.username);
      setPassword(staffUser.password);
    }
  };

  return (
    <div className="login-page-container">
      {/* Background with Hospital Backdrop Image */}
      <div className="login-backdrop-image"></div>
      <div className="login-backdrop-overlay"></div>

      {/* Glassmorphic Login Card matching Mockup */}
      <div className="login-glass-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-icon-wrap">
            <Activity size={28} className="login-pulse-icon" />
          </div>
          <h2 className="login-title">IV Drip Monitor</h2>
          <p className="login-subtitle">Intelligent Bedside Telemetry Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          {errorMessage && (
            <div className="login-error-banner">
              <AlertCircle size={16} className="text-danger flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label className="login-label">Staff Username or Hospital Email</label>
            <div className="input-with-icon">
              <Mail size={17} className="input-icon" />
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. doctor, nurse, nurse2, nurse3, admin"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="login-label">Password</label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="glass-input"
                placeholder="Staff password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot Password */}
          <div className="login-options-row">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>

          </div>

          {/* Main SQLite Login Button */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying with SQLite...' : 'Sign In to Hospital Portal'}
          </button>

          {/* Fast Quick Staff Select */}
          <div className="quick-logins-box">
            <div className="quick-login-header">
              <span className="quick-login-tag">Fast Staff Select (Auto-fills SQLite User):</span>
            </div>
            <div className="quick-btn-group">
              <div className="quick-btn-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillQuickCredentials('Administrator')}
                  title="Auto-fill Admin credentials (admin)"
                >
                  🏥 Admin
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillQuickCredentials('Doctor')}
                  title="Auto-fill Doctor credentials (doctor)"
                >
                  🩺 Doctor
                </button>
              </div>
              <div className="quick-btn-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillQuickCredentials('Nurse1')}
                  title="Auto-fill Nurse Elena Rostova credentials (nurse)"
                >
                  👩‍⚕️ Nurse Elena
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillQuickCredentials('Nurse2')}
                  title="Auto-fill Nurse Clara Higgins credentials (nurse2)"
                >
                  👩‍⚕️ Nurse Clara
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fillQuickCredentials('Nurse3')}
                  title="Auto-fill Nurse Marcus Chen credentials (nurse3)"
                >
                  👩‍⚕️ Nurse Marcus
                </button>
              </div>
            </div>
          </div>

          {/* Standalone Interactive Doctor Simulation Launcher */}
          <div className="login-demo-launcher-box">
            <div className="demo-launcher-header">
              <span className="demo-launcher-badge">AUTONOMOUS DEMO</span>
              <span className="demo-launcher-hint">Self-running telemetry (isolated from real hardware)</span>
            </div>
            <button
              type="button"
              className="btn-launch-doctor-demo"
              onClick={handleLaunchDoctorDemo}
              title="Simulate Dr. Alex Chen with automatic device telemetry and real-time low fluid alerts"
            >
              <div className="demo-btn-left">
                <div className="demo-sparkle-pill">
                  <Sparkles size={16} />
                </div>
                <div className="demo-text-block">
                  <span className="demo-btn-heading">Launch Doctor Live Simulation</span>
                  <span className="demo-btn-sub">Auto-dropping fluid levels, audible alerts & auto-clamping</span>
                </div>
              </div>
              <ArrowRight size={18} className="demo-arrow-icon" />
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .login-page-container {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          overflow: hidden;
          padding: 20px;
        }

        .login-backdrop-image {
          position: absolute;
          inset: 0;
          background: url('/hospital_backdrop.jpg') center/cover no-repeat;
          filter: blur(4px) brightness(0.85);
          transform: scale(1.05);
        }

        .login-backdrop-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.65) 100%);
        }

        .login-glass-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 28px;
          padding: 38px 34px;
          box-shadow: 0 25px 60px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.5);
          animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        [data-theme="dark"] .login-glass-card {
          background: rgba(18, 30, 61, 0.88);
          border-color: rgba(56, 189, 248, 0.2);
        }

        .login-brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 26px;
        }

        .login-icon-wrap {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4);
          margin-bottom: 14px;
        }

        .login-pulse-icon {
          animation: heartPulse 2s infinite ease-in-out;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .login-subtitle {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .login-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          font-weight: 600;
          line-height: 1.35;
        }

        [data-theme="dark"] .login-error-banner {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .sqlite-badge-tag {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--primary);
          background: rgba(2, 132, 199, 0.1);
          padding: 3px 8px;
          border-radius: 999px;
        }

        .login-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .glass-input {
          width: 100%;
          padding: 12px 40px 12px 42px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 0.9375rem;
          color: var(--text-primary);
          outline: none;
          transition: all var(--transition-fast);
        }

        [data-theme="dark"] .glass-input {
          background: rgba(15, 23, 42, 0.6);
        }

        .glass-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
          background: #ffffff;
        }

        .password-toggle-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .login-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .remember-me-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 500;
        }

        .forgot-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        /* Buttons matching screenshot */
        .login-submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: none;
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 14px var(--primary-glow);
        }

        .login-submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px var(--primary-glow);
        }

        .google-login-btn {
          width: 100%;
          padding: 12px;
          background: #ffffff;
          color: #334155;
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .google-login-btn:hover {
          background-color: #f8fafc;
          border-color: var(--border-focus);
        }

        .quick-logins-box {
          background-color: rgba(2, 132, 199, 0.08);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .quick-login-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
        }

        .quick-btn-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .quick-btn-row {
          display: flex;
          gap: 6px;
        }

        .quick-btn-row .btn {
          flex: 1;
          white-space: nowrap;
          padding: 6px 8px;
          font-size: 0.74rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .login-demo-launcher-box {
          margin-top: 10px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(13, 148, 136, 0.08));
          border: 1px dashed rgba(2, 132, 199, 0.35);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .demo-launcher-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.68rem;
        }

        .demo-launcher-badge {
          background: #0284c7;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .demo-launcher-hint {
          color: var(--text-muted);
          font-size: 0.7rem;
        }

        .btn-launch-doctor-demo {
          width: 100%;
          background: linear-gradient(135deg, #0284c7, #0d9488);
          color: #ffffff;
          border: none;
          padding: 9px 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all var(--transition-fast);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.28);
        }

        .btn-launch-doctor-demo:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
          background: linear-gradient(135deg, #0369a1, #0f766e);
        }

        .demo-btn-left {
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .demo-sparkle-pill {
          background: rgba(255, 255, 255, 0.22);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fef08a;
          flex-shrink: 0;
        }

        .demo-text-block {
          display: flex;
          flex-direction: column;
        }

        .demo-btn-heading {
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .demo-btn-sub {
          font-size: 0.69rem;
          opacity: 0.88;
          font-weight: 500;
        }

        .demo-arrow-icon {
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        .btn-launch-doctor-demo:hover .demo-arrow-icon {
          transform: translateX(4px);
        }

        .login-footer-caption {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
