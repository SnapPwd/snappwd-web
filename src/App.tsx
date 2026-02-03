import React, { useEffect, useState } from 'react';
import { CreateSecret } from './components/CreateSecret';
import { ViewSecret } from './components/ViewSecret';

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Parse hash: #ID_KEY
  const match = hash.match(/^#([a-zA-Z0-9-]+)_([a-zA-Z0-9]+)$/);
  
  return (
    <div className="min-h-screen bg-neutral-900 text-white py-12 px-4">
      {match ? (
        <ViewSecret id={match[1]} decryptionKey={match[2]} />
      ) : (
        <CreateSecret />
      )}
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by SnapPwd Self-Hosted</p>
      </footer>
    </div>
  );
}

export default App;
