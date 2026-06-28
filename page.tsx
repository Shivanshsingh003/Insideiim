import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Dashboard />
    </main>
  );
}
