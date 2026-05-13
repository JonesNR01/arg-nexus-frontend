import React, { useState } from 'react';
import axios from 'axios';

interface CreateNodeFormProps {
  projectId: number;
  onNodeCreated: () => void;
}

const CreateNodeForm: React.FC<CreateNodeFormProps> = ({ projectId, onNodeCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    node_type: 'event',
    media_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/projects/${projectId}/nodes`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData({
        title: '',
        description: '',
        node_type: 'event',
        media_url: ''
      });

      onNodeCreated();
    } catch (error) {
      console.error('Error creating node:', error);
      alert('Failed to create node');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{ width: '100%', padding: '8px', minHeight: '60px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <select
          value={formData.node_type}
          onChange={(e) => setFormData({...formData, node_type: e.target.value})}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="event">Event</option>
          <option value="clue">Clue</option>
          <option value="character">Character</option>
          <option value="media">Media</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="url"
          placeholder="Media URL (optional)"
          value={formData.media_url}
          onChange={(e) => setFormData({...formData, media_url: e.target.value})}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#61dafb',
          border: 'none',
          borderRadius: '3px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating...' : 'Create Node'}
      </button>
    </form>
  );
};

export default CreateNodeForm;