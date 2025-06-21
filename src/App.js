import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5050/api/samples')
      .then(res => res.json())
      .then(data => setSamples(data));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          MongoDB Sample Data:
        </p>
        <ul>
          {samples.map((item, idx) => (
            <li key={idx}>{item.name}</li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
