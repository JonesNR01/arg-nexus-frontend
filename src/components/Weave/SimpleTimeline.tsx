import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { Stage, Layer, Circle, Text, Path, Rect } from 'react-konva';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DiscussionPanel from './DiscussionPanel';
import WikiPanel from './WikiPanel';

interface Node {
  id: number;
  title: string;
  description?: string;
  node_type: string;
  media_url?: string;
  created_at?: string;
  x?: number;
  y?: number;
}

// Button styles
const buttonStyle = {
  padding: '8px 12px',
  backgroundColor: '#61dafb',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  color: '#fff'
};

// Loading spinner component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column',
    gap: '10px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #4ECDC4',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p>Loading timeline...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Tooltip wrapper component
const TooltipButton = ({ children, tooltip, onClick, style }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={onClick}
        style={style}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </button>
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '5px',
          padding: '4px 8px',
          backgroundColor: '#333',
          color: 'white',
          fontSize: '12px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          zIndex: 100
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
};

// Memoized connection component
const TimelineConnection = memo(({ conn, sourcePos, targetPos }: any) => {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const offset = Math.min(Math.abs(dx) * 0.3, 100);
  
  const cp1x = sourcePos.x + dx * 0.3;
  const cp1y = sourcePos.y + dy * 0.2 - offset;
  const cp2x = sourcePos.x + dx * 0.7;
  const cp2y = sourcePos.y + dy * 0.8 + offset;
  
  return (
    <React.Fragment>
      <Path
        x={0}
        y={0}
        data={`M ${sourcePos.x} ${sourcePos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPos.x} ${targetPos.y}`}
        stroke="#888"
        strokeWidth={3}
        fill="none"
      />
      <Circle
        x={targetPos.x}
        y={targetPos.y}
        radius={5}
        fill="#888"
      />
    </React.Fragment>
  );
});

// Memoized node component
const TimelineNode = memo(({ 
  node, 
  isSelected, 
  connectionMode, 
  onNodeClick, 
  onNodeDragEnd,
  onDiscussClick,
  onWikiClick,
  getNodeColor,
  getNodeIcon
}: any) => {
  return (
    <React.Fragment>
      <Circle
        x={node.x}
        y={node.y}
        radius={35}
        fill={getNodeColor(node.node_type)}
        shadowBlur={8}
        stroke={isSelected ? '#FFD700' : "#fff"}
        strokeWidth={isSelected ? 4 : 2}
        draggable={!connectionMode}
        onDragEnd={(e: any) => {
          if (!connectionMode) {
            onNodeDragEnd(node.id, e.target.x(), e.target.y());
          }
        }}
        onClick={() => onNodeClick(node)}
        onMouseEnter={(e: any) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = connectionMode ? 'crosshair' : 'pointer';
          e.target.scaleX(1.05);
          e.target.scaleY(1.05);
        }}
        onMouseLeave={(e: any) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'default';
          e.target.scaleX(1);
          e.target.scaleY(1);
        }}
      />
      <Text
        x={node.x! - 12}
        y={node.y! - 12}
        text={getNodeIcon(node.node_type)}
        fontSize={20}
        align="center"
      />
      <Text
        x={node.x! - 30}
        y={node.y! + 40}
        text={node.title.length > 12 ? node.title.substring(0, 12) + '...' : node.title}
        fontSize={12}
        width={60}
        align="center"
        fill="#333"
        fontStyle="bold"
      />
      
      {/* Discussion button */}
      <Circle
        x={node.x! + 25}
        y={node.y! - 25}
        radius={12}
        fill="#4ECDC4"
        stroke="#fff"
        strokeWidth={2}
        onClick={(e: any) => {
          e.cancelBubble = true;
          onDiscussClick(node);
        }}
        onMouseEnter={(e: any) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
          e.target.scaleX(1.1);
          e.target.scaleY(1.1);
        }}
        onMouseLeave={(e: any) => {
          e.target.scaleX(1);
          e.target.scaleY(1);
        }}
      />
      <Text
        x={node.x! + 17}
        y={node.y! - 32}
        text="D"
        fontSize={16}
        fontStyle="bold"
        align="center"
        fill="#fff"
        onClick={(e: any) => {
          e.cancelBubble = true;
          onDiscussClick(node);
        }}
      />

      {/* Wiki button */}
      <Circle
        x={node.x! + 25}
        y={node.y! - 45}
        radius={10}
        fill="#96CEB4"
        stroke="#fff"
        strokeWidth={2}
        onClick={(e: any) => {
          e.cancelBubble = true;
          onWikiClick(node);
        }}
        onMouseEnter={(e: any) => {
          const container = e.target.getStage()?.container();
          if (container) container.style.cursor = 'pointer';
          e.target.scaleX(1.1);
          e.target.scaleY(1.1);
        }}
        onMouseLeave={(e: any) => {
          e.target.scaleX(1);
          e.target.scaleY(1);
        }}
      />
      <Text
        x={node.x! + 19}
        y={node.y! - 52}
        text="W"
        fontSize={12}
        fontStyle="bold"
        align="center"
        fill="#fff"
        onClick={(e: any) => {
          e.cancelBubble = true;
          onWikiClick(node);
        }}
      />
    </React.Fragment>
  );
});

const SimpleTimeline: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [discussionNode, setDiscussionNode] = useState<Node | null>(null);
  const [wikiNode, setWikiNode] = useState<Node | null>(null);
  const stageRef = useRef<any>(null);
  const navigate = useNavigate();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showMinimap, setShowMinimap] = useState(true);
  const minimapRef = useRef<any>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedSourceNode, setSelectedSourceNode] = useState<Node | null>(null);

  const [activeFilters, setActiveFilters] = useState({
    event: true,
    clue: true,
    character: true,
    media: true
  });

  const positionUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('https://arg-nexus-backend.onrender.com/api/projects/1/nodes', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const nodesWithPositions = response.data.map((node: Node, index: number) => ({
          ...node,
          x: node.x || 100 + (index % 5) * 150,
          y: node.y || 100 + Math.floor(index / 5) * 100
        }));

        setNodes(nodesWithPositions);
        fetchConnections();
        setLoading(false);
      } catch (err) {
        console.error('Error fetching nodes:', err);
        setError('Failed to load timeline nodes');
        setLoading(false);
      }
    };

    fetchNodes();
  }, [navigate]);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://arg-nexus-backend.onrender.com/api/projects/1/connections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data);
    } catch (err) {
      console.error('Error fetching connections:', err);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = scale;
    
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - position.x,
      y: stage.getPointerPosition().y / oldScale - position.y,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.5), 3);
    
    const newPos = {
      x: stage.getPointerPosition().x / clampedScale - mousePointTo.x,
      y: stage.getPointerPosition().y / clampedScale - mousePointTo.y,
    };

    setScale(clampedScale);
    setPosition(newPos);
  };

  const fitToScreen = () => {
    if (nodes.length === 0) return;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
      }
    });
    
    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    
    const stageWidth = window.innerWidth - 100;
    const stageHeight = 600;
    const scaleX = stageWidth / width;
    const scaleY = stageHeight / height;
    const newScale = Math.min(scaleX, scaleY, 2);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newX = stageWidth / 2 - centerX * newScale;
    const newY = stageHeight / 2 - centerY * newScale;
    
    setScale(newScale);
    setPosition({ x: newX, y: newY });
  };

  const getNodePosition = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : null;
  };

  const toggleFilter = (type: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const getMinimapBounds = () => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x);
        maxY = Math.max(maxY, node.y);
      }
    });
    
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = getMinimapBounds();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const minimapWidth = 200;
    const minimapHeight = 150;
    const ratioX = bounds.width / minimapWidth;
    const ratioY = bounds.height / minimapHeight;
    
    const targetX = bounds.minX + clickX * ratioX;
    const targetY = bounds.minY + clickY * ratioY;
    
    const stageWidth = window.innerWidth - 100;
    const stageHeight = 600;
    const newX = stageWidth / 2 - targetX * scale;
    const newY = stageHeight / 2 - targetY * scale;
    
    setPosition({ x: newX, y: newY });
  };

  const createConnection = async (sourceId: number, targetId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'https://arg-nexus-backend.onrender.com/api/connections',
        { source_node_id: sourceId, target_node_id: targetId, connection_type: 'narrative' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Connection created!');
      fetchConnections();
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Failed to create connection');
    }
  };

  const updateNodePosition = useCallback(async (nodeId: number, x: number, y: number) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, x, y } : node
      )
    );
    
    if (positionUpdateTimer.current) {
      clearTimeout(positionUpdateTimer.current);
    }
    
    positionUpdateTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `https://arg-nexus-backend.onrender.com/api/nodes/${nodeId}`,
          { x, y },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Error saving node position:', err);
      }
    }, 500);
  }, []);

  const getNodeColor = (type: string) => {
    switch(type) {
      case 'event': return '#FF6B6B';
      case 'clue': return '#4ECDC4';
      case 'character': return '#45B7D1';
      case 'media': return '#96CEB4';
      default: return '#FFEAA7';
    }
  };

  const getNodeIcon = (type: string) => {
    switch(type) {
      case 'event': return 'EV';
      case 'clue': return 'CL';
      case 'character': return 'CH';
      case 'media': return 'MD';
      default: return '??';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '8px', position: 'relative', overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Timeline Controls */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        right: 10,
        zIndex: 10, 
        background: 'white', 
        padding: '8px 12px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {/* Filter buttons - LEFT SIDE */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <TooltipButton
            tooltip="Show/Hide Event nodes"
            onClick={() => toggleFilter('event')}
            style={{ ...buttonStyle, backgroundColor: activeFilters.event ? '#FF6B6B' : '#ccc' }}
          >
            Events
          </TooltipButton>
          <TooltipButton
            tooltip="Show/Hide Clue nodes"
            onClick={() => toggleFilter('clue')}
            style={{ ...buttonStyle, backgroundColor: activeFilters.clue ? '#4ECDC4' : '#ccc' }}
          >
            Clues
          </TooltipButton>
          <TooltipButton
            tooltip="Show/Hide Character nodes"
            onClick={() => toggleFilter('character')}
            style={{ ...buttonStyle, backgroundColor: activeFilters.character ? '#45B7D1' : '#ccc' }}
          >
            Characters
          </TooltipButton>
          <TooltipButton
            tooltip="Show/Hide Media nodes"
            onClick={() => toggleFilter('media')}
            style={{ ...buttonStyle, backgroundColor: activeFilters.media ? '#96CEB4' : '#ccc' }}
          >
            Media
          </TooltipButton>
        </div>

        {/* Zoom controls - RIGHT SIDE */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <TooltipButton tooltip="Zoom In" onClick={() => setScale(s => Math.min(s * 1.2, 3))} style={buttonStyle}>
            +
          </TooltipButton>
          <span style={{ margin: '0 5px', minWidth: '45px', textAlign: 'center', fontWeight: 'bold' }}>
            {Math.round(scale * 100)}%
          </span>
          <TooltipButton tooltip="Zoom Out" onClick={() => setScale(s => Math.max(s / 1.2, 0.5))} style={buttonStyle}>
            -
          </TooltipButton>
          <TooltipButton tooltip="Fit all nodes to screen" onClick={fitToScreen} style={buttonStyle}>
            Fit
          </TooltipButton>
          <TooltipButton tooltip="Reset view" onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} style={buttonStyle}>
            Reset
          </TooltipButton>
          <TooltipButton 
            tooltip="Toggle minimap"
            onClick={() => setShowMinimap(!showMinimap)} 
            style={{ ...buttonStyle, backgroundColor: showMinimap ? '#4ECDC4' : '#ccc' }}
          >
            Map
          </TooltipButton>
          <TooltipButton 
            tooltip={connectionMode ? "Cancel connection mode" : "Connect nodes together"}
            onClick={() => {
              setConnectionMode(!connectionMode);
              setSelectedSourceNode(null);
            }} 
            style={{ ...buttonStyle, backgroundColor: connectionMode ? '#FF6B6B' : '#61dafb' }}
          >
            {connectionMode ? 'Cancel' : 'Connect'}
          </TooltipButton>
        </div>
      </div>

      {/* Connection mode status bar */}
      {connectionMode && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: '#FF6B6B',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          fontWeight: 500
        }}>
          Connection Mode Active - Click a node, then click another node to connect them
        </div>
      )}

      {/* @ts-ignore */}
      <Stage
        width={window.innerWidth - 100}
        height={600}
        ref={stageRef}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onDragEnd={(e: any) => {
          setPosition({ x: e.target.x(), y: e.target.y() });
        }}
      >
        <Layer>
          {connections
            .filter(conn => {
              const sourceNode = nodes.find(n => n.id === conn.source_node_id);
              const targetNode = nodes.find(n => n.id === conn.target_node_id);
              return sourceNode && targetNode && 
                activeFilters[sourceNode.node_type as keyof typeof activeFilters] &&
                activeFilters[targetNode.node_type as keyof typeof activeFilters];
            })
            .map((conn) => {
              const sourcePos = getNodePosition(conn.source_node_id);
              const targetPos = getNodePosition(conn.target_node_id);
              if (!sourcePos || !targetPos) return null;
              
              return (
                <TimelineConnection
                  key={conn.id}
                  conn={conn}
                  sourcePos={sourcePos}
                  targetPos={targetPos}
                />
              );
            })}
          
          {nodes
            .filter(node => activeFilters[node.node_type as keyof typeof activeFilters])
            .map((node) => (
              <TimelineNode
                key={node.id}
                node={node}
                isSelected={selectedSourceNode?.id === node.id}
                connectionMode={connectionMode}
                onNodeClick={(clickedNode: Node) => {
                  if (connectionMode) {
                    if (!selectedSourceNode) {
                      setSelectedSourceNode(clickedNode);
                      alert(`Selected "${clickedNode.title}" as source. Click another node to connect.`);
                    } else if (selectedSourceNode.id === clickedNode.id) {
                      setSelectedSourceNode(null);
                    } else {
                      createConnection(selectedSourceNode.id, clickedNode.id);
                      setSelectedSourceNode(null);
                      setConnectionMode(false);
                    }
                  } else {
                    setSelectedNode(clickedNode);
                  }
                }}
                onNodeDragEnd={updateNodePosition}
                onDiscussClick={(clickedNode: Node) => {
                  setDiscussionNode(clickedNode);
                }}
                onWikiClick={(clickedNode: Node) => {
                  setWikiNode(clickedNode);
                }}
                getNodeColor={getNodeColor}
                getNodeIcon={getNodeIcon}
              />
            ))}
        </Layer>
      </Stage>

      {/* Minimap */}
      {showMinimap && nodes.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: '220px',
            height: '170px',
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '2px solid #ccc',
            borderRadius: '8px',
            zIndex: 20,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            cursor: 'pointer'
          }}
          onClick={handleMinimapClick}
        >
          <div style={{ 
            fontSize: '10px', 
            padding: '4px 8px', 
            backgroundColor: '#f0f0f0', 
            borderBottom: '1px solid #ccc',
            borderRadius: '6px 6px 0 0',
            fontWeight: 'bold'
          }}>
            Mini Map (click to jump)
          </div>
          <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 24px)', padding: '10px' }}>
            {/* @ts-ignore */}
            <Stage
              width={200}
              height={150}
              ref={minimapRef}
            >
              <Layer>
                {nodes
                  .filter(node => activeFilters[node.node_type as keyof typeof activeFilters])
                  .map((node) => {
                    const bounds = getMinimapBounds();
                    const minimapX = ((node.x! - bounds.minX) / bounds.width) * 200;
                    const minimapY = ((node.y! - bounds.minY) / bounds.height) * 150;
                    
                    return (
                      <Circle
                        key={node.id}
                        x={minimapX}
                        y={minimapY}
                        radius={4}
                        fill={getNodeColor(node.node_type)}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  })}
                
                {(() => {
                  const bounds = getMinimapBounds();
                  const stageWidth = window.innerWidth - 100;
                  const stageHeight = 600;
                  
                  const visibleLeft = -position.x / scale;
                  const visibleTop = -position.y / scale;
                  const visibleRight = visibleLeft + stageWidth / scale;
                  const visibleBottom = visibleTop + stageHeight / scale;
                  
                  const rectLeft = ((visibleLeft - bounds.minX) / bounds.width) * 200;
                  const rectTop = ((visibleTop - bounds.minY) / bounds.height) * 150;
                  const rectWidth = ((visibleRight - visibleLeft) / bounds.width) * 200;
                  const rectHeight = ((visibleBottom - visibleTop) / bounds.height) * 150;
                  
                  return (
                    <Rect
                      x={rectLeft}
                      y={rectTop}
                      width={rectWidth}
                      height={rectHeight}
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      fill="rgba(255,107,107,0.1)"
                    />
                  );
                })()}
              </Layer>
            </Stage>
          </div>
        </div>
      )}

      {/* Modal for node details */}
      {selectedNode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease'
        }} onClick={() => setSelectedNode(null)}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>{selectedNode.title}</h3>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                backgroundColor: getNodeColor(selectedNode.node_type),
                borderRadius: '20px',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {selectedNode.node_type.toUpperCase()}
              </span>
            </div>
            
            <p style={{ marginBottom: '15px', lineHeight: '1.5', color: '#555' }}>
              {selectedNode.description || 'No description provided.'}
            </p>
            
            {selectedNode.media_url && (
              <div style={{ marginBottom: '15px' }}>
                <strong>Media:</strong>
                <a href={selectedNode.media_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', wordBreak: 'break-all', color: '#4ECDC4' }}>
                  {selectedNode.media_url}
                </a>
              </div>
            )}
            
            <div style={{ fontSize: '12px', color: '#999', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              Created: {selectedNode.created_at ? new Date(selectedNode.created_at).toLocaleDateString() : 'Unknown'}
            </div>
          </div>
        </div>
      )}

      {/* Discussion Panel */}
      {discussionNode && (
        <DiscussionPanel
          nodeId={discussionNode.id}
          nodeTitle={discussionNode.title}
          onClose={() => setDiscussionNode(null)}
        />
      )}

      {/* Wiki Panel */}
      {wikiNode && (
        <WikiPanel
          nodeId={wikiNode.id}
          nodeTitle={wikiNode.title}
          onClose={() => setWikiNode(null)}
        />
      )}
    </div>
  );
};

export default SimpleTimeline;