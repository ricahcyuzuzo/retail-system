import { useEffect, useState } from 'react';

export default function WaitingForApprovalScreen({ onApproved }: { onApproved: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading bar
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{
      background: '#181c20',
      color: '#fff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <h2 style={{ marginBottom: 24 }}>Desktop Access Ready</h2>
      <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 30, textAlign: 'center' }}>
        Desktop access is open. You can now log in.
      </p>
      <div style={{ width: 300, height: 8, background: '#333', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#4caf50', transition: 'width 0.2s' }} />
      </div>
      <button 
        onClick={onApproved}
        style={{
          marginTop: 30,
          padding: '12px 24px',
          background: '#4caf50',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Continue to Login
      </button>
    </div>
  );
}
