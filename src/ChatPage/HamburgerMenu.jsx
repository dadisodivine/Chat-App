import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../FirebaseConfig/firebase';

const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          margin: 0,
          outline: 'none',
        }}
        aria-label="Open menu"
      >
        {/* Hamburger icon SVG */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '120%',
            background: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            borderRadius: 10,
            minWidth: 160,
            zIndex: 100,
            padding: '10px 0',
          }}
        >
          <button
            onClick={() => signOut(auth)}
            style={{
              width: '100%',
              background: 'linear-gradient(45deg, #70ff6b, #46ee24)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontWeight: 600,
              fontFamily: 'inherit',
              margin: '0 0 8px 0',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
          <div style={{ padding: '0 18px', color: '#888', fontSize: 14 }}>
            {/* Placeholder for other features */}
            <div style={{ padding: '8px 0' }}>Profile (coming soon)</div>
            <div style={{ padding: '8px 0' }}>Settings (coming soon)</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu; 