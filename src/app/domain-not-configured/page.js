'use client';

export default function DomainNotConfigured() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            backgroundColor: '#FEF3C7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}
        >
          🌐
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '12px',
          }}
        >
          Domain Not Configured
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '16px',
            color: '#6B7280',
            marginBottom: '8px',
            lineHeight: '1.6',
          }}
        >
          The domain <strong style={{ color: '#374151' }}>{hostname}</strong> is not properly configured or verified yet.
        </p>

        <p
          style={{
            fontSize: '14px',
            color: '#9CA3AF',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          If you're the owner of this domain, please complete the DNS setup and verification in your coach dashboard.
        </p>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#E5E7EB',
            margin: '32px 0',
          }}
        />

        {/* Help Section */}
        <div style={{ textAlign: 'left' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '12px',
            }}
          >
            Common Issues:
          </h2>
          <ul
            style={{
              fontSize: '14px',
              color: '#6B7280',
              lineHeight: '1.8',
              paddingLeft: '20px',
              margin: 0,
            }}
          >
            <li>DNS records not yet propagated (can take up to 48 hours)</li>
            <li>Incorrect A record configuration</li>
            <li>Domain not verified in coach settings</li>
            <li>Coach account not active</li>
          </ul>
        </div>

        {/* Button */}
        <a
          href="https://dailycompanion.app"
          style={{
            display: 'inline-block',
            marginTop: '32px',
            padding: '12px 32px',
            backgroundColor: '#3B82F6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#2563EB')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#3B82F6')}
        >
          Go to Daily Companion
        </a>

        {/* Footer */}
        <p
          style={{
            fontSize: '12px',
            color: '#9CA3AF',
            marginTop: '24px',
          }}
        >
          Need help? Contact support at{' '}
          <a
            href="mailto:support@dailycompanion.app"
            style={{ color: '#3B82F6', textDecoration: 'none' }}
          >
            support@dailycompanion.app
          </a>
        </p>
      </div>
    </div>
  );
}
