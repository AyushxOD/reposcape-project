import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color, Vector3 } from 'three';
import { MapControls, Line, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import './App.css';

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

// --- Error Boundary: Our safety net ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong in the 3D scene.</h2>
          <p>Please try a different repository. The error has been logged to the console.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- InfoPanel: Displays commit details ---
function InfoPanel({ commit, onClose }) {
  if (!commit) return null;

  // Safely access all commit properties
  const author = commit.author;
  const commitDetails = commit.commit;
  const stats = commit.stats;

  const authorName = author?.login || commitDetails?.author?.name || "N/A";
  const avatarUrl = author?.avatar_url;
  const commitDate = commitDetails?.author?.date ? new Date(commitDetails.author.date).toLocaleString() : "N/A";
  const message = commitDetails?.message || "No message provided.";
  const additions = stats?.additions || 0;
  const deletions = stats?.deletions || 0;

  return (
    <div className="info-panel">
      <button onClick={onClose} className="close-button">X</button>
      
      {/* --- The New Avatar Header --- */}
      <div className="author-info">
        {avatarUrl && <img src={avatarUrl} alt={`${authorName}'s avatar`} className="author-avatar" />}
        <div className="author-details">
          <span>Author</span>
          <h3>{authorName}</h3>
        </div>
      </div>

      <div className="commit-stats">
        <p><strong>Date:</strong> {commitDate}</p>
        <div className="stats">
          <span className="additions">++ {additions}</span>
          <span className="deletions">-- {deletions}</span>
        </div>
      </div>
      
      <p className="commit-message-title">Commit Message</p>
      <p className="commit-message">{message}</p>
      
      <p className="sha-link"><strong>SHA:</strong> <a href={commit.html_url} target="_blank" rel="noopener noreferrer">{commit.sha.substring(0, 7)}</a></p>
    </div>
  );
}

// --- Legend Component ---
function Legend() {
  return (
    <div className="legend-panel">
      <h3>Legend</h3>
      <ul>
        <li><span className="swatch main-branch"></span> Main Branch</li>
        <li><span className="swatch feature-branch"></span> Feature Branch</li>
        <li><span className="swatch merge-commit"></span> Merge Commit</li>
        <li><span className="swatch-line merge-line"></span> Merge Path</li>
        <li><span className="swatch-line history-line"></span> Commit History</li>
      </ul>
      <div className="timeline-info">
        <span>Newest</span>
        <div className="timeline-arrow">→</div>
        <span>Oldest</span>
      </div>
    </div>
  );
}

// --- Scene: Renders the 3D graph ---
function Scene({ commits, onCommitClick, isAnimating }) {
  const CUBE_SIZE = 1.5;
  const COLUMN_WIDTH = 5;
  const COMMIT_GAP = 5;
  const HEIGHT_SCALE_FACTOR = 0.05;
  const Y_OFFSET = 4;
  const [hovered, setHovered] = useState(null);

  const { camera, controls } = useThree();
  const initialCameraSet = useRef(false);

  useEffect(() => {
    // Reset camera when a new fetch starts
    if (commits.length === 0) {
      initialCameraSet.current = false;
    }
  }, [commits]);

  // --- The Definitive "Race Start" Camera Logic (Reversed Axis) ---
  useFrame(() => {
    if (isAnimating && commits.length > 0 && controls) {
      const lastNode = commits[commits.length - 1];
      const lastNodePosition = new Vector3(lastNode.column * COLUMN_WIDTH, ( (lastNode.stats?.total || 1) * HEIGHT_SCALE_FACTOR / 2) - Y_OFFSET, -lastNode.timelineIndex * COMMIT_GAP);
      
      const targetPosition = new Vector3(lastNodePosition.x, -Y_OFFSET, lastNodePosition.z);
      
      const idealOffset = new Vector3(0, 20, 40); // Positive Z offset to stay behind the action
      const idealCameraPosition = targetPosition.clone().add(idealOffset);
      
      if (!initialCameraSet.current) {
        camera.position.copy(idealCameraPosition);
        controls.target.copy(targetPosition);
        initialCameraSet.current = true;
      } else {
        camera.position.lerp(idealCameraPosition, 0.05);
        controls.target.lerp(targetPosition, 0.05);
      }
      
      controls.update();
    }
  });

  const commitNodes = useMemo(() => {
    return commits.filter(Boolean).map((commit) => ({
      ...commit,
      // --- The Fix: Build the graph along the NEGATIVE Z-axis ---
      position: [commit.column * COLUMN_WIDTH, ( (commit.stats?.total || 1) * HEIGHT_SCALE_FACTOR / 2) - Y_OFFSET, -commit.timelineIndex * COMMIT_GAP],
      height: (commit.stats?.total || 1) * HEIGHT_SCALE_FACTOR
    }));
  }, [commits]);
  
  const nodeMap = useMemo(() => new Map(commitNodes.map(node => [node.sha, node])), [commitNodes]);

  const branchLabels = useMemo(() => {
    const labels = new Map();
    commitNodes.forEach(node => {
        if (node.branchName && !labels.has(node.branchName)) {
            labels.set(node.branchName, {
                name: node.branchName,
                position: [node.position[0], Y_OFFSET + 2, node.position[2] + COMMIT_GAP] 
            });
        }
    });
    return Array.from(labels.values());
  }, [commitNodes]);

  const { colorScale } = useMemo(() => {
    const max = Math.max(...commits.map(c => c.stats?.total || 0), 1);
    const startColor = new Color('skyblue');
    const endColor = new Color('tomato');
    return {
      colorScale: (changes, isMainBranch) => {
        if (isMainBranch) return new Color('gold');
        const t = Math.sqrt((changes || 0) / max);
        return new Color().lerpColors(startColor, endColor, t);
      }
    };
  }, [commits]);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight color="white" position={[50, 50, 50]} intensity={1} />
      
      {commitNodes.map((node) => {
        const color = colorScale(node.stats?.total, node.isMainBranch);
        const isMerge = node.parents.length > 1;

        return (
          <mesh key={node.sha} position={node.position} onPointerOver={(e) => { e.stopPropagation(); setHovered(node.sha); }} onPointerOut={() => setHovered(null)} onClick={() => onCommitClick(node)}>
            {isMerge ? (
              <sphereGeometry args={[CUBE_SIZE * 0.7, 32, 32]} />
            ) : (
              <boxGeometry args={[CUBE_SIZE, node.height, CUBE_SIZE]} />
            )}
            <meshStandardMaterial color={isMerge ? 'white' : color} emissive={hovered === node.sha ? 'yellow' : (isMerge ? 'cyan' : color)} emissiveIntensity={hovered === node.sha ? 1 : 0.35} />
          </mesh>
        )
      })}

      {commitNodes.map((node) => 
        node.parents.map(parent => {
          const parentNode = nodeMap.get(parent.sha);
          if (!parentNode) return null;
          const start = new Vector3(...node.position);
          const end = new Vector3(...parentNode.position);
          const isMerge = node.parents.length > 1;

          return (
            <Line
              key={`${node.sha}-${parent.sha}`}
              points={[start, end]}
              color={isMerge ? '#00ff00' : '#555'}
              lineWidth={isMerge ? 2.5 : 1}
            />
          );
        })
      )}

      {branchLabels.map(label => (
          label.name && <Text 
            key={label.name} 
            position={label.position} 
            color="white" 
            fontSize={1} 
            anchorX="center" 
            anchorY="middle"
            billboard={true}
          >
            {label.name}
          </Text>
      ))}

      <MapControls minDistance={5} maxDistance={400} />
    </>
  );
}

// --- App: The main component with all logic ---
function App() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/microsoft/vscode');
  const [commits, setCommits] = useState([]);
  const [allFetchedCommits, setAllFetchedCommits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState(null);

  useEffect(() => {
    if (isAnimating && allFetchedCommits.length > 0) {
      let index = 0;
      setCommits([]);
      const animationInterval = setInterval(() => {
        if (index < allFetchedCommits.length) {
          setCommits(allFetchedCommits.slice(0, index + 1));
          index++;
        } else {
          clearInterval(animationInterval);
          setIsAnimating(false);
        }
      }, 50);
      return () => clearInterval(animationInterval);
    }
  }, [isAnimating, allFetchedCommits]);

  const processCommitGraph = (allCommits, branches) => {
    const mainBranchName = branches.find(b => b.name === 'main' || b.name === 'master')?.name || branches[0]?.name;
    const branchColumns = {};
    let columnCounter = 1;
    let sign = 1;
    if (mainBranchName) branchColumns[mainBranchName] = 0;
    branches.forEach(branch => {
      if (branch.name !== mainBranchName) {
        branchColumns[branch.name] = columnCounter * sign;
        columnCounter++;
        sign *= -1;
      }
    });
    const commitMap = new Map(allCommits.map(c => [c.sha, c]));
    commitMap.forEach(commit => {
        commit.column = undefined;
        commit.isMainBranch = false;
    });
    const orderedBranches = [...branches.filter(b => b.name !== mainBranchName), ...branches.filter(b => b.name === mainBranchName)];
    orderedBranches.forEach(branch => {
      let currentSha = branch.commit.sha;
      while(currentSha && commitMap.has(currentSha)) {
        const commitNode = commitMap.get(currentSha);
        if (commitNode.column === undefined) {
          commitNode.column = branchColumns[branch.name];
          commitNode.branchName = branch.name;
        }
        if (branch.name === mainBranchName) {
            commitNode.isMainBranch = true;
        }
        if (commitNode.parents && commitNode.parents.length > 0) {
          currentSha = commitNode.parents[0].sha;
        } else {
          currentSha = null;
        }
      }
    });
    commitMap.forEach(commit => {
        if(commit.column === undefined) {
            commit.column = 0;
            if(mainBranchName) commit.isMainBranch = true;
        }
    });
    return Array.from(commitMap.values());
  };

  const handleCommitClick = (commit) => {
    setSelectedCommit(selectedCommit?.sha === commit.sha ? null : commit);
  };
  
  const handleFetch = async () => {
    setIsLoading(true);
    setCommits([]);
    setAllFetchedCommits([]);
    setSelectedCommit(null);
    const urlParts = repoUrl.trim().replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1];
    if (!owner || !repo) {
      alert("Please enter a valid GitHub repository URL.");
      setIsLoading(false);
      return;
    }
    
    try {
      const allBranchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
      if (!allBranchesRes.ok) throw new Error('Failed to fetch branches. Check repository URL and your API token.');
      let allBranches = await allBranchesRes.json();
      const recentBranches = allBranches.slice(0, 10);
      const commitMap = new Map();
      await Promise.all(recentBranches.map(async (branch) => {
        const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch.name}&per_page=30`, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } });
        if (!commitsRes.ok) return;
        const branchCommits = await commitsRes.json();
        if(!Array.isArray(branchCommits)) return;
        branchCommits.forEach(commit => {
          if (!commitMap.has(commit.sha)) commitMap.set(commit.sha, commit);
        });
      }));
      const allCommits = Array.from(commitMap.values());
      const graphWithColumns = processCommitGraph(allCommits, recentBranches);
      const graphMap = new Map(graphWithColumns.map(c => [c.sha, c]));
      const finalCommits = [];
      const batchSize = 50;
      for (let i = 0; i < graphWithColumns.length; i += batchSize) {
        const batch = graphWithColumns.slice(i, i + batchSize);
        const detailPromises = batch.map(commit => fetch(commit.url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}` } }).then(res => res.ok ? res.json() : null));
        const settledDetails = await Promise.allSettled(detailPromises);
        settledDetails.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            const detailedCommit = result.value;
            const originalCommit = graphMap.get(detailedCommit.sha);
            if (originalCommit) {
                detailedCommit.column = originalCommit.column;
                detailedCommit.isMainBranch = originalCommit.isMainBranch;
                detailedCommit.branchName = originalCommit.branchName;
            }
            finalCommits.push(detailedCommit);
          }
        });
      }
      const cleanFinalCommits = finalCommits.filter(Boolean);
      
      // Sort newest to oldest for the correct "race" direction
      const sortedCommits = cleanFinalCommits.sort((a, b) => new Date(b.commit.author.date) - new Date(a.commit.author.date));
      sortedCommits.forEach((commit, index) => commit.timelineIndex = index);
      
      console.log(`Finished fetching ${sortedCommits.length} commits. Starting animation...`);
      setAllFetchedCommits(sortedCommits);
      setIsAnimating(true);
    } catch (error) {
      console.error("Failed to fetch commits:", error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="ui-container">
        <input type="text" placeholder="e.g., https://github.com/facebook/react" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} disabled={isLoading || isAnimating}/>
        <button onClick={handleFetch} disabled={isLoading || isAnimating}>{isLoading ? 'Fetching...' : (isAnimating ? 'Animating...' : 'Fetch Commits')}</button>
      </div>
      <ErrorBoundary>
        <Canvas camera={{ position: [0, 20, 50], fov: 45 }}>
          <Scene commits={commits} onCommitClick={handleCommitClick} isAnimating={isAnimating} allCommitsCount={allFetchedCommits.length}/>
          <EffectComposer>
            <Bloom intensity={0.45} luminanceThreshold={0.4} luminanceSmoothing={0.5} mipmapBlur={true} />
          </EffectComposer>
        </Canvas>
      </ErrorBoundary>
      <Legend />
      <InfoPanel commit={selectedCommit} onClose={() => setSelectedCommit(null)} />
    </div>
  );
}

export default App;
