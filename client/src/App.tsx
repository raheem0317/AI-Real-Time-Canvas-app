import React from 'react';
import Header from './components/Header';
import Canvas from './components/Canvas';
import PromptInput from './components/PromptInput';
import './App.css';

// Import socket to ensure it connects on app load
import './socket/socket';

const App: React.FC = () => {
  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Canvas />
        <PromptInput />
      </main>
    </div>
  );
};

export default App;
