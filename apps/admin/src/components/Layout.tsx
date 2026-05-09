import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'KYB Queue' },
  { path: '/businesses', label: 'Businesses' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      <header
        style={{
          background: '#111827',
          color: '#fff',
          padding: '0 1.5rem',
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link
            to="/"
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            Propeller Admin
          </Link>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    color: active ? '#fff' : '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.25rem 0',
                    borderBottom: active ? '2px solid #fff' : '2px solid transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          Behind Cloudflare Access
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '80rem', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
