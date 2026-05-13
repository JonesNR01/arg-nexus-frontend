import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '10px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
          <Link to="/register" style={{ marginRight: '15px' }}>Register</Link>
          <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <Routes>
          <Route path="/" element={
            <header className="App-header">
              <h1>🔍 ARG Nexus</h1>
              <p>Your Alternate Reality Game collaboration platform</p>
              <p>Please <Link to="/register">register</Link> or <Link to="/login">login</Link> to continue.</p>
            </header>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;