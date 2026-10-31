import { useEffect, useState } from 'react';

function App() {
  const [backend, setBackend] = useState('Loading...');
  const [database, setDatabase] = useState('Loading...');
  const [message, setMessage] = useState('');
  const [input, setInput] = useState('');

  // On page load: call the backend (relative /api URLs, which nginx forwards to Fastify)
  useEffect(() => {
    fetch('/api/hello').then(r => r.json()).then(d => setBackend(d.message)).catch(() => setBackend('Backend not reachable'));
    fetch('/api/db/hello').then(r => r.json()).then(d => setDatabase(d.message)).catch(() => setDatabase('Database not reachable'));
    fetch('/api/message').then(r => r.json()).then(d => setMessage(d.text));
  }, []);

  // Save button: send the new message to the backend (PUT), which updates SQLite
  const save = async () => {
    const res = await fetch('/api/message', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessage(d.text);
      setInput('');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: 40 }}>
      <h2>Hello World from the frontend (React)</h2>
      <p>{backend}</p>
      <p>{database}</p>

      <h3>Editable message (stored in SQLite)</h3>
      <p><b>Current:</b> {message}</p>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="New message" />
      <button onClick={save}>Save</button>
    </div>
  );
}

export default App;