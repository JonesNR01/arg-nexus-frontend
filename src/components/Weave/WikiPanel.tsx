import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface WikiPage {
  id: number;
  title: string;
  content: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface WikiPanelProps {
  nodeId: number;
  nodeTitle: string;
  onClose: () => void;
}

const WikiPanel: React.FC<WikiPanelProps> = ({ nodeId, nodeTitle, onClose }) => {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWiki = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://arg-nexus-backend.onrender.com/api/nodes/${nodeId}/wiki`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPage(response.data.page);
        setHistory(response.data.history);
        setEditTitle(response.data.page.title);
        setEditContent(response.data.page.content);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching wiki:', err);
        setLoading(false);
      }
    };
    fetchWiki();
  }, [nodeId]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://arg-nexus-backend.onrender.com/api/wiki/${page.id}`,
        { title: editTitle, content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPage(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving wiki:', err);
      alert('Failed to save wiki page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '500px',
      height: '100vh',
      backgroundColor: 'white',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
      zIndex: 1001,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        backgroundColor: '#96CEB4',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Wiki: {nodeTitle}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
        {loading ? (
          <div>Loading wiki page...</div>
        ) : !page ? (
          <div>No wiki page found.</div>
        ) : isEditing ? (
          <>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{ width: '100%', padding: '8px', minHeight: '300px', fontFamily: 'monospace' }}
            />
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#96CEB4', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>{page.title}</h2>
              <button onClick={() => setIsEditing(true)} style={{ padding: '5px 10px', backgroundColor: '#61dafb', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' }}>
                Edit
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Created by {page.created_by_name} on {new Date(page.created_at).toLocaleDateString()}
              {page.updated_at !== page.created_at && ` · Updated ${new Date(page.updated_at).toLocaleDateString()}`}
            </div>
            <div style={{
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '5px',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {page.content}
            </div>
            
            {history.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h4>Edit History</h4>
                {history.map((h: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#666', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                    Edited by {h.edited_by_name} on {new Date(h.edited_at).toLocaleString()}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WikiPanel;