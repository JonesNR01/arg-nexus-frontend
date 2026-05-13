import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Thread {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  comment_count: number;
}

interface Comment {
  id: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface DiscussionPanelProps {
  nodeId: number;
  nodeTitle: string;
  onClose: () => void;
}

const DiscussionPanel: React.FC<DiscussionPanelProps> = ({ nodeId, nodeTitle, onClose }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`https://arg-nexus-backend.onrender.com/api/nodes/${nodeId}/threads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setThreads(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching threads:', err);
        setLoading(false);
      }
    };
    fetchThreads();
  }, [nodeId]);

  useEffect(() => {
    if (selectedThread) {
      const fetchComments = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`https://arg-nexus-backend.onrender.com/api/threads/${selectedThread.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setComments(response.data);
        } catch (err) {
          console.error('Error fetching comments:', err);
        }
      };
      fetchComments();
    }
  }, [selectedThread]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://arg-nexus-backend.onrender.com/api/nodes/${nodeId}/threads`,
        { title: newThreadTitle, content: newThreadContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setThreads([response.data, ...threads]);
      setNewThreadTitle('');
      setNewThreadContent('');
      setShowNewThreadForm(false);
    } catch (err) {
      console.error('Error creating thread:', err);
      alert('Failed to create discussion thread');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://arg-nexus-backend.onrender.com/api/threads/${selectedThread!.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, response.data]);
      setNewComment('');
      setThreads(threads.map(t => 
        t.id === selectedThread!.id 
          ? { ...t, comment_count: t.comment_count + 1 }
          : t
      ));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
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
        backgroundColor: '#4ECDC4',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Discussions: {nodeTitle}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '15px' }}>
        {!selectedThread ? (
          <>
            <button
              onClick={() => setShowNewThreadForm(!showNewThreadForm)}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#61dafb',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '15px',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              + Start New Discussion
            </button>

            {showNewThreadForm && (
              <form onSubmit={handleCreateThread} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <input
                  type="text"
                  placeholder="Thread title"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <textarea
                  placeholder="What would you like to discuss?"
                  value={newThreadContent}
                  onChange={(e) => setNewThreadContent(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', minHeight: '80px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', backgroundColor: '#4ECDC4', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' }}>
                  {submitting ? 'Creating...' : 'Create Thread'}
                </button>
                <button type="button" onClick={() => setShowNewThreadForm(false)} style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </form>
            )}

            {loading ? (
              <div>Loading discussions...</div>
            ) : threads.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                No discussions yet. Start one!
              </div>
            ) : (
              threads.map(thread => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  style={{
                    padding: '12px',
                    marginBottom: '10px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: '1px solid #eee'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{thread.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {thread.author_name} · {new Date(thread.created_at).toLocaleDateString()} · Comments: {thread.comment_count}
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedThread(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ddd',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginBottom: '15px'
              }}
            >
              ← Back to all discussions
            </button>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>{selectedThread.title}</h4>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                Posted by {selectedThread.author_name} on {new Date(selectedThread.created_at).toLocaleDateString()}
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedThread.content}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Comments ({comments.length})</strong>
            </div>

            {comments.map(comment => (
              <div key={comment.id} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fafafa', borderRadius: '5px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  {comment.author_name} · {new Date(comment.created_at).toLocaleDateString()}
                </div>
                <p style={{ margin: 0, fontSize: '14px' }}>{comment.content}</p>
              </div>
            ))}

            <form onSubmit={handleAddComment} style={{ marginTop: '15px' }}>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{ width: '100%', padding: '8px', minHeight: '60px', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              <button type="submit" disabled={submitting} style={{ padding: '8px 16px', backgroundColor: '#4ECDC4', border: 'none', borderRadius: '3px', cursor: 'pointer', color: 'white' }}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default DiscussionPanel;