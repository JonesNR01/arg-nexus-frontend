import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SimpleTimeline from './Weave/SimpleTimeline';
import CreateNodeForm from './Weave/CreateNodeForm';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);

    // Optional: Verify token with backend
    const verifyToken = async () => {
      try {
        const response = await axios.get('https://arg-nexus-backend.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      } catch (error) {
        // Token invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    verifyToken();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNodeCreated = () => {
    setRefreshKey(prev => prev + 1); // This forces SimpleTimeline to reload
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to ARG Nexus Dashboard</h1>
      <p>Hello, {user?.username}!</p>
      <button 
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Logout
      </button>
      
      {/* Create Node Form Section */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '5px'
      }}>
        <h2>Create New Timeline Node</h2>
        <CreateNodeForm 
          projectId={1} 
          onNodeCreated={handleNodeCreated} 
        />
      </div>

      {/* Timeline Section */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #ddd',
        borderRadius: '5px'
      }}>
        <h2>The Weave - Interactive Timeline</h2>
        <SimpleTimeline key={refreshKey} />
      </div>
    </div>
  );
};

export default Dashboard;