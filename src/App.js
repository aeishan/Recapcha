import './App.css';
import LiveTranscriber from './components/LiveTranscriber';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* Optional: Keep logo or remove */}
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <h1>Live Transcriber Demo</h1>
        <LiveTranscriber />  {/* ✅ This is your component! */}
      </header>
    </div>
  );
}

export default App;
