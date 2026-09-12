'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Password reset link sent!');
    }, 1200);
  };

  // Falling petals generation helper
  const renderPetals = () => {
    if (!mounted) return null;
    return Array.from({ length: 20 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 6 + Math.random() * 6;
      const size = 6 + Math.random() * 8;
      
      return (
        <span 
          key={i} 
          className="petal"
          style={{
            left: `${left}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`,
            width: `${size}px`,
            height: `${size * 0.7}px`
          }}
        />
      );
    });
  };

  const cherryBlossomPanel = (
    <div className="art-panel">
      {renderPetals()}
    </div>
  );

  return (
    <div className="saas-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .saas-root {
          min-height: 100vh;
          width: 100vw;
          background: #FFFFFF;
          display: flex;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }
        .outer-frame {
          display: flex;
          width: 100%;
          min-height: 100vh;
          background: #FFFFFF;
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .outer-frame {
            flex-direction: column;
          }
          .art-panel {
            display: none;
          }
        }
        
        /* Left Column */
        .form-panel {
          flex: 1;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .logo-text {
          font-size: 15px;
          font-weight: 700;
          color: #111111;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .top-action-btn {
          font-size: 13px;
          font-weight: 600;
          color: #4B5563;
          text-decoration: none;
        }
        .top-action-btn:hover {
          color: #111111;
        }
        
        .main-form-wrap {
          max-width: 360px;
          width: 100%;
          margin: 0 auto;
        }
        .form-header-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111111;
          margin-bottom: 24px;
        }
        .input-box {
          width: 100%;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #111111;
          outline: none;
          background: #FFFFFF;
          margin-bottom: 16px;
          transition: border-color 0.2s;
        }
        .input-box:focus {
          border-color: #111111;
        }
        
        .btn-submit-arrow {
          width: 100%;
          background: #111111;
          color: #FFFFFF;
          border: none;
          border-radius: 100px;
          padding: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background-color 0.2s;
          margin-top: 8px;
        }
        .btn-submit-arrow:hover {
          background: #222222;
        }
        
        .trouble-text {
          font-size: 12px;
          color: #6B7280;
          text-align: center;
          margin-top: 24px;
          line-height: 1.5;
        }
        .trouble-text a {
          color: #111111;
          text-decoration: underline;
        }
        .login-link-container {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          color: #4B5563;
        }
        .login-link-container a {
          color: #111111;
          font-weight: 700;
          text-decoration: underline;
        }
        
        .footer-row-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 32px;
        }
        .footer-row-meta a {
          color: #9CA3AF;
          text-decoration: none;
          margin-left: 12px;
        }
        .footer-row-meta a:hover {
          color: #111111;
        }

        /* Right Column Cherry Blossom */
        .art-panel {
          flex: 1.2;
          background-image: url('/sakura_tree.png');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          height: 100vh;
        }
        
        /* Petals Falling Animation */
        .petal {
          position: absolute;
          background: #FBCFE8;
          border-radius: 150% 0 150% 150%;
          z-index: 2;
          opacity: 0.85;
          top: -20px;
          transform: rotate(-45deg);
          animation: fall linear infinite;
        }
        
        @keyframes fall {
          0% {
            top: -20px;
            transform: translate(0, 0) rotate(-45deg) scale(0.8);
            opacity: 0.85;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            top: 105%;
            transform: translate(-180px, 400px) rotate(240deg) scale(1.1);
            opacity: 0;
          }
        }
      ` }} />

      <div className="outer-frame">
        {/* Left Form Column */}
        <div className="form-panel">
          <div className="header-row">
            <Link href="/" className="logo-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.png" alt="VidyaAI Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              Vidya AI
            </Link>
            <Link href="/login" className="top-action-btn">Log in</Link>
          </div>

          <div className="main-form-wrap">
            <h1 className="form-header-title">Forgot password</h1>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="input-box"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button type="submit" className="btn-submit-arrow" disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset password →'}
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '14px', color: '#10B981', fontWeight: 600, marginBottom: 20 }}>
                  Password reset link sent to your email successfully!
                </p>
                <button 
                  type="button" 
                  className="btn-submit-arrow" 
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  Reset another email →
                </button>
              </div>
            )}

            <p className="trouble-text">
              If you have any trouble resetting your password,<br/>
              contact us at <a href="mailto:support@vidyaai.com">support@vidyaai.com</a>.
            </p>

            <div className="login-link-container">
              Remember password? <Link href="/login" style={{ fontWeight: '700', textDecoration: 'underline' }}>Log in</Link>
            </div>
          </div>

          <div className="footer-row-meta">
            <span>© 2026 Vidya AI</span>
            <div>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>

        {/* Right Cherry Blossom Column */}
        {cherryBlossomPanel}
      </div>
    </div>
  );
}
