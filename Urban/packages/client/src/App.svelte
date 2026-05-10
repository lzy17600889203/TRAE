<script>
  import { onMount, afterUpdate, tick } from 'svelte';

  let canvas;
  let ctx;
  let animationId;

  let nodes = [];
  let pipes = [];
  let pumps = [];
  let valves = [];
  let warnings = [];
  let anomalies = [];
  let presets = [];

  let selectedTool = 'select';
  let selectedNodeId = null;
  let selectedPipeId = null;
  let selectedPumpId = null;
  let selectedValveId = null;

  let connectionStart = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  let particles = [];
  let frameTime = 0;
  let pressureDisplayValues = {};

  let mousePos = { x: 0, y: 0 };
  let hoveredNodeId = null;
  let hoveredPipeId = null;

  const NODE_RADIUS = 18;

  onMount(async () => {
    await loadPresets();
    await loadNetwork();
    initCanvas();
    startAnimation();
  });

  async function loadPresets() {
    try {
      const res = await fetch('/api/presets');
      presets = await res.json();
    } catch (e) {
      console.error('加载预设失败:', e);
    }
  }

  async function loadNetwork() {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      nodes = data.nodes || [];
      pipes = data.pipes || [];
      pumps = data.pumps || [];
      valves = data.valves || [];
      pressureDisplayValues = {};
      nodes.forEach(n => {
        pressureDisplayValues[n.id] = n.pressure;
      });
    } catch (e) {
      console.error('加载网络失败:', e);
    }
  }

  async function calculateNetwork() {
    try {
      const res = await fetch('/api/calculate', { method: 'POST' });
      const data = await res.json();
      nodes = data.nodes || [];
      pipes = data.pipes || [];
      pumps = data.pumps || [];
      valves = data.valves || [];
      warnings = data.warnings || [];
      anomalies = data.anomalies || [];
      
      particles = [];
      pipes.forEach(pipe => {
        if (pipe.isBroken && pipe.breakSeverity > 0) {
          const start = nodes.find(n => n.id === pipe.startNodeId);
          const end = nodes.find(n => n.id === pipe.endNodeId);
          if (start && end) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            for (let i = 0; i < 50 * pipe.breakSeverity; i++) {
              particles.push(createWaterParticle(midX, midY));
            }
          }
        }
      });
    } catch (e) {
      console.error('计算失败:', e);
    }
  }

  async function loadPreset(key) {
    try {
      const res = await fetch(`/api/presets/${key}/load`, { method: 'POST' });
      const data = await res.json();
      nodes = data.nodes || [];
      pipes = data.pipes || [];
      pumps = data.pumps || [];
      valves = data.valves || [];
      warnings = data.warnings || [];
      anomalies = data.anomalies || [];
      pressureDisplayValues = {};
      particles = [];
      nodes.forEach(n => {
        pressureDisplayValues[n.id] = n.pressure;
      });
      pipes.forEach(pipe => {
        if (pipe.isBroken && pipe.breakSeverity > 0) {
          const start = nodes.find(n => n.id === pipe.startNodeId);
          const end = nodes.find(n => n.id === pipe.endNodeId);
          if (start && end) {
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;
            for (let i = 0; i < 50 * pipe.breakSeverity; i++) {
              particles.push(createWaterParticle(midX, midY));
            }
          }
        }
      });
    } catch (e) {
      console.error('加载预设失败:', e);
    }
  }

  function initCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    ctx = canvas.getContext('2d');
  }

  function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === 'node') {
      createNode(x, y);
    } else if (selectedTool === 'select') {
      const clickedNode = nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS;
      });

      if (connectionStart) {
        if (clickedNode && clickedNode.id !== connectionStart.id) {
          createPipe(connectionStart.id, clickedNode.id);
        }
        connectionStart = null;
      } else if (clickedNode) {
        selectedNodeId = clickedNode.id;
        selectedPipeId = null;
        selectedPumpId = null;
        selectedValveId = null;
        connectionStart = clickedNode;
      } else {
        selectedNodeId = null;
        selectedPipeId = null;
        selectedPumpId = null;
        selectedValveId = null;
        connectionStart = null;
      }
    } else if (selectedTool === 'connect') {
      const clickedNode = nodes.find(n => {
        const dx = n.x - x;
        const dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS;
      });

      if (connectionStart) {
        if (clickedNode && clickedNode.id !== connectionStart.id) {
          createPipe(connectionStart.id, clickedNode.id);
        }
        connectionStart = null;
      } else if (clickedNode) {
        connectionStart = clickedNode;
      }
    }
  }

  function handleCanvasMouseDown(e) {
    if (selectedTool !== 'select' && selectedTool !== 'move') return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = nodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS;
    });

    if (clickedNode) {
      isDragging = true;
      dragOffset = {
        x: clickedNode.x - x,
        y: clickedNode.y - y,
      };
      selectedNodeId = clickedNode.id;
    }
  }

  function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    hoveredNodeId = null;
    hoveredPipeId = null;

    nodes.forEach(n => {
      const dx = n.x - mousePos.x;
      const dy = n.y - mousePos.y;
      if (Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS) {
        hoveredNodeId = n.id;
      }
    });

    pipes.forEach(p => {
      const start = nodes.find(n => n.id === p.startNodeId);
      const end = nodes.find(n => n.id === p.endNodeId);
      if (start && end && isPointNearLine(mousePos, start, end, 10)) {
        hoveredPipeId = p.id;
      }
    });

    if (isDragging && selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        node.x = mousePos.x + dragOffset.x;
        node.y = mousePos.y + dragOffset.y;
        updateNode(node);
      }
    }
  }

  function handleCanvasMouseUp() {
    isDragging = false;
  }

  function isPointNearLine(point, lineStart, lineEnd, threshold) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  async function createNode(x, y) {
    const node = {
      x,
      y,
      pressure: 0,
      elevation: 0,
      isSource: false,
      isSink: false,
      demand: 0,
      pressureLimit: 80,
    };

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
      const newNode = await res.json();
      nodes = [...nodes, newNode];
      pressureDisplayValues[newNode.id] = 0;
    } catch (e) {
      console.error('创建节点失败:', e);
    }
  }

  async function updateNode(node) {
    try {
      await fetch(`/api/nodes/${node.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(node),
      });
    } catch (e) {
      console.error('更新节点失败:', e);
    }
  }

  async function deleteNode(id) {
    try {
      await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
      nodes = nodes.filter(n => n.id !== id);
      pipes = pipes.filter(p => p.startNodeId !== id && p.endNodeId !== id);
      selectedNodeId = null;
      delete pressureDisplayValues[id];
    } catch (e) {
      console.error('删除节点失败:', e);
    }
  }

  async function createPipe(startId, endId) {
    const pipe = {
      startNodeId: startId,
      endNodeId: endId,
      diameter: 150,
      roughness: 0.01,
    };

    try {
      const res = await fetch('/api/pipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipe),
      });
      const newPipe = await res.json();
      pipes = [...pipes, newPipe];
    } catch (e) {
      console.error('创建管道失败:', e);
    }
  }

  async function updatePipe(pipe) {
    try {
      await fetch(`/api/pipes/${pipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pipe),
      });
    } catch (e) {
      console.error('更新管道失败:', e);
    }
  }

  async function deletePipe(id) {
    try {
      await fetch(`/api/pipes/${id}`, { method: 'DELETE' });
      pipes = pipes.filter(p => p.id !== id);
      pumps = pumps.filter(pu => pu.pipeId !== id);
      valves = valves.filter(v => v.pipeId !== id);
      selectedPipeId = null;
    } catch (e) {
      console.error('删除管道失败:', e);
    }
  }

  async function addPumpToPipe(pipeId) {
    const pump = {
      pipeId,
      power: 50,
      head: 40,
      flowCapacity: 200,
      isActive: true,
    };

    try {
      const res = await fetch('/api/pumps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pump),
      });
      const newPump = await res.json();
      pumps = [...pumps, newPump];
    } catch (e) {
      console.error('创建泵站失败:', e);
    }
  }

  async function updatePump(pump) {
    try {
      await fetch(`/api/pumps/${pump.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pump),
      });
    } catch (e) {
      console.error('更新泵站失败:', e);
    }
  }

  async function deletePump(id) {
    try {
      await fetch(`/api/pumps/${id}`, { method: 'DELETE' });
      pumps = pumps.filter(p => p.id !== id);
    } catch (e) {
      console.error('删除泵站失败:', e);
    }
  }

  async function addValveToPipe(pipeId) {
    const valve = {
      pipeId,
      openPercentage: 1.0,
      isOperational: true,
    };

    try {
      const res = await fetch('/api/valves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valve),
      });
      const newValve = await res.json();
      valves = [...valves, newValve];
    } catch (e) {
      console.error('创建阀门失败:', e);
    }
  }

  async function updateValve(valve) {
    try {
      await fetch(`/api/valves/${valve.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valve),
      });
    } catch (e) {
      console.error('更新阀门失败:', e);
    }
  }

  async function deleteValve(id) {
    try {
      await fetch(`/api/valves/${id}`, { method: 'DELETE' });
      valves = valves.filter(v => v.id !== id);
    } catch (e) {
      console.error('删除阀门失败:', e);
    }
  }

  function createWaterParticle(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: -Math.abs(Math.sin(angle) * speed) - 2,
      life: 1,
      size: 2 + Math.random() * 4,
    };
  }

  function startAnimation() {
    function animate() {
      frameTime += 1;
      draw();
      updateParticles();
      updatePressureDisplay();
      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  function updateParticles() {
    pipes.forEach(pipe => {
      if (pipe.isBroken && pipe.breakSeverity > 0) {
        const start = nodes.find(n => n.id === pipe.startNodeId);
        const end = nodes.find(n => n.id === pipe.endNodeId);
        if (start && end && Math.random() < pipe.breakSeverity * 0.3) {
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          for (let i = 0; i < 3; i++) {
            particles.push(createWaterParticle(midX, midY));
          }
        }
      }
    });

    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.01;
      return p.life > 0;
    });
  }

  function updatePressureDisplay() {
    nodes.forEach(node => {
      const target = node.pressure;
      const current = pressureDisplayValues[node.id] || 0;
      const diff = target - current;
      if (Math.abs(diff) > 0.01) {
        pressureDisplayValues[node.id] = current + diff * 0.1;
      }
    });
  }

  function draw() {
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawPipes();
    drawFlowArrows();
    drawPumps();
    drawValves();
    drawParticles();
    drawNodes();
    drawConnectionPreview();
    drawWarnings();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawPipes() {
    pipes.forEach(pipe => {
      const start = nodes.find(n => n.id === pipe.startNodeId);
      const end = nodes.find(n => n.id === pipe.endNodeId);
      if (!start || !end) return;

      const isSelected = pipe.id === selectedPipeId;
      const isHovered = pipe.id === hoveredPipeId;

      let lineWidth = Math.max(4, pipe.diameter / 25);
      if (isSelected) lineWidth += 3;
      if (isHovered) lineWidth += 2;

      let strokeColor = '#4a90d9';
      if (pipe.isBroken) {
        strokeColor = `rgba(255, 100, 100, ${0.7 + 0.3 * Math.sin(frameTime * 0.1)})`;
      } else if (pipe.hasReverseFlow) {
        strokeColor = '#ff9500';
      } else if (pipe.isDeadEnd) {
        strokeColor = '#999';
      }

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = strokeColor;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (pipe.isBroken) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(midX, midY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', midX, midY);
      }
    });
  }

  function drawFlowArrows() {
    pipes.forEach(pipe => {
      const start = nodes.find(n => n.id === pipe.startNodeId);
      const end = nodes.find(n => n.id === pipe.endNodeId);
      if (!start || !end) return;

      const absFlow = Math.abs(pipe.flowRate);
      if (absFlow < 0.1) return;

      const direction = pipe.flowDirection;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 20) return;

      const nx = dx / length;
      const ny = dy / length;

      const arrowCount = Math.min(5, Math.max(1, Math.floor(length / 80)));
      const arrowSpeed = Math.min(1, absFlow / 50) * (frameTime * 0.05);

      for (let i = 0; i < arrowCount; i++) {
        let t = ((i / arrowCount) + arrowSpeed) % 1;
        if (direction < 0) t = 1 - t;

        const x = start.x + dx * t;
        const y = start.y + dy * t;

        drawArrow(x, y, direction > 0 ? nx : -nx, direction > 0 ? ny : -ny, pipe.hasReverseFlow);
      }
    });
  }

  function drawArrow(x, y, nx, ny, isReverse) {
    const size = 12;
    const perpX = -ny;
    const perpY = nx;

    ctx.beginPath();
    ctx.moveTo(x + nx * size, y + ny * size);
    ctx.lineTo(x - nx * size / 2 + perpX * size / 2, y - ny * size / 2 + perpY * size / 2);
    ctx.lineTo(x - nx * size / 2 - perpX * size / 2, y - ny * size / 2 - perpY * size / 2);
    ctx.closePath();

    ctx.fillStyle = isReverse ? '#ff9500' : '#2ecc71';
    ctx.fill();
  }

  function drawNodes() {
    nodes.forEach(node => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = node.id === hoveredNodeId;
      const isConnecting = connectionStart && connectionStart.id === node.id;

      let radius = NODE_RADIUS;
      if (isSelected) radius += 4;
      if (isHovered) radius += 2;
      if (isConnecting) radius += 6;

      let color = '#3498db';
      if (node.isSource) color = '#27ae60';
      else if (node.isSink) color = '#e74c3c';

      if (node.hasHighPressureWarning) {
        const pulse = 0.5 + 0.5 * Math.sin(frameTime * 0.15);
        ctx.fillStyle = `rgba(255, 0, 0, ${0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 25 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (isSelected || isConnecting) {
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      if (isHovered) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (node.isSource || node.isSink) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.isSource ? '源' : '汇', node.x, node.y);
      }

      const pressure = pressureDisplayValues[node.id] || node.pressure;
      const pressureText = pressure.toFixed(1);
      
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      const bounce = Math.sin(frameTime * 0.2 + node.x) * 1;
      ctx.fillStyle = node.hasHighPressureWarning ? '#ff3333' : 'white';
      ctx.fillText(pressureText, node.x, node.y - radius - 8 + bounce);

      ctx.font = '9px Arial';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('mH2O', node.x, node.y - radius - 18 + bounce);
    });
  }

  function drawPumps() {
    pumps.forEach(pump => {
      const pipe = pipes.find(p => p.id === pump.pipeId);
      if (!pipe) return;

      const start = nodes.find(n => n.id === pipe.startNodeId);
      const end = nodes.find(n => n.id === pipe.endNodeId);
      if (!start || !end) return;

      const t = 0.5;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      const rotation = pump.isActive ? frameTime * 0.1 : 0;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      ctx.fillStyle = pump.isActive ? '#9b59b6' : '#95a5a6';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const px = Math.cos(angle) * 15;
        const py = Math.sin(angle) * 15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      if (pump.isActive) {
        ctx.fillStyle = '#e8d5f4';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      ctx.fillStyle = '#9b59b6';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`泵${pump.power}kW`, x, y - 25);
    });
  }

  function drawValves() {
    valves.forEach(valve => {
      const pipe = pipes.find(p => p.id === valve.pipeId);
      if (!pipe) return;

      const start = nodes.find(n => n.id === pipe.startNodeId);
      const end = nodes.find(n => n.id === pipe.endNodeId);
      if (!start || !end) return;

      const t = 0.3;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const openAngle = valve.openPercentage * 90;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-12, -8, 24, 16);

      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 10, -Math.PI / 2, -Math.PI / 2 + (openAngle * Math.PI / 180));
      ctx.stroke();

      ctx.fillStyle = valve.openPercentage > 0.5 ? '#27ae60' : valve.openPercentage > 0 ? '#f39c12' : '#e74c3c';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = '#34495e';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`阀${Math.round(valve.openPercentage * 100)}%`, x, y - 20);
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.fillStyle = `rgba(100, 180, 255, ${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawConnectionPreview() {
    if (connectionStart && selectedTool === 'connect') {
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(connectionStart.x, connectionStart.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawWarnings() {
    const highPressureNodes = nodes.filter(n => n.hasHighPressureWarning);
    if (highPressureNodes.length > 0) {
      const alpha = 0.1 + 0.05 * Math.sin(frameTime * 0.1);
      ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function handleResize() {
    if (canvas) {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
  }

  $: selectedNode = nodes.find(n => n.id === selectedNodeId);
  $: selectedPipe = pipes.find(p => p.id === selectedPipeId);
  $: selectedPump = pumps.find(p => p.id === selectedPumpId);
  $: selectedValve = valves.find(v => v.id === selectedValveId);
</script>

<svelte:window on:resize={handleResize} />

<div class="app">
  <header class="header">
    <h1>🏙️ 城市地下管网拓扑构建与流体传输模拟系统</h1>
    <div class="header-actions">
      <button on:click={calculateNetwork} class="btn btn-primary">
        ⚡ 计算水压分布
      </button>
      <button on:click={loadNetwork} class="btn">
        🔄 刷新
      </button>
    </div>
  </header>

  <div class="toolbar">
    <div class="tool-group">
      <button
        class={`tool-btn ${selectedTool === 'select' ? 'active' : ''}`}
        on:click={() => { selectedTool = 'select'; connectionStart = null; }}
      >
        🔍 选择
      </button>
      <button
        class={`tool-btn ${selectedTool === 'node' ? 'active' : ''}`}
        on:click={() => { selectedTool = 'node'; connectionStart = null; }}
      >
        ➕ 添加节点
      </button>
      <button
        class={`tool-btn ${selectedTool === 'connect' ? 'active' : ''}`}
        on:click={() => { selectedTool = 'connect'; connectionStart = null; }}
      >
        🔗 连接节点
      </button>
    </div>

    <div class="preset-group">
      <span class="label">预设场景:</span>
      {#each presets as preset}
        <button
          class="preset-btn"
          on:click={() => loadPreset(preset.key)}
        >
          {preset.name}
        </button>
      {/each}
    </div>
  </div>

  <div class="main-content">
    <div class="canvas-container">
      <canvas
        bind:this={canvas}
        on:click={handleCanvasClick}
        on:mousedown={handleCanvasMouseDown}
        on:mousemove={handleCanvasMouseMove}
        on:mouseup={handleCanvasMouseUp}
        on:mouseleave={handleCanvasMouseUp}
      ></canvas>

      {#if connectionStart}
        <div class="connection-hint">
          点击另一个节点完成连接，或点击空白处取消
        </div>
      {/if}
    </div>

    <aside class="sidebar">
      {#if warnings.length > 0}
        <div class="panel warning-panel">
          <h3>⚠️ 系统警告</h3>
          {#each warnings as warning}
            <div class="warning-item severity-{warning.severity}">
              <strong>{warning.message}</strong>
            </div>
          {/each}
        </div>
      {/if}

      {#if anomalies.length > 0}
        <div class="panel anomaly-panel">
          <h3>🚨 异常检测</h3>
          {#each anomalies as anomaly}
            <div class="anomaly-item">
              <strong>{anomaly.description}</strong>
              <div class="anomaly-details">
                类型: {anomaly.type}
                <br />
                量级: {anomaly.magnitude.toFixed(2)}
              </div>
            </div>
          {/each}
        </div>
      {/if}

      {#if selectedNode}
        <div class="panel">
          <h3>🔵 节点属性</h3>
          <div class="property">
            <label>类型:</label>
            <select
              value={selectedNode.isSource ? 'source' : selectedNode.isSink ? 'sink' : 'normal'}
              on:change={(e) => {
                const val = e.target.value;
                selectedNode.isSource = val === 'source';
                selectedNode.isSink = val === 'sink';
                updateNode(selectedNode);
              }}
            >
              <option value="normal">普通节点</option>
              <option value="source">水源节点</option>
              <option value="sink">用水节点</option>
            </select>
          </div>
          <div class="property">
            <label>标高:</label>
            <input
              type="number"
              value={selectedNode.elevation}
              on:input={(e) => {
                selectedNode.elevation = Number(e.target.value);
                updateNode(selectedNode);
              }}
            />
            <span class="unit">m</span>
          </div>
          <div class="property">
            <label>用水量:</label>
            <input
              type="number"
              value={selectedNode.demand}
              on:input={(e) => {
                selectedNode.demand = Number(e.target.value);
                updateNode(selectedNode);
              }}
            />
            <span class="unit">L/s</span>
          </div>
          <div class="property">
            <label>压力限制:</label>
            <input
              type="number"
              value={selectedNode.pressureLimit}
              on:input={(e) => {
                selectedNode.pressureLimit = Number(e.target.value);
                updateNode(selectedNode);
              }}
            />
            <span class="unit">mH2O</span>
          </div>
          <div class="info-row">
            <span>当前压力:</span>
            <strong class={selectedNode.hasHighPressureWarning ? 'danger' : ''}>
              {selectedNode.pressure.toFixed(2)} mH2O
            </strong>
          </div>
          <button
            class="btn btn-danger"
            on:click={() => deleteNode(selectedNode.id)}
          >
            ❌ 删除节点
          </button>
        </div>
      {/if}

      {#if selectedPipe}
        <div class="panel">
          <h3>🔵 管道属性</h3>
          <div class="property">
            <label>管径:</label>
            <input
              type="number"
              value={selectedPipe.diameter}
              on:input={(e) => {
                selectedPipe.diameter = Number(e.target.value);
                updatePipe(selectedPipe);
              }}
            />
            <span class="unit">mm</span>
          </div>
          <div class="property">
            <label>粗糙度:</label>
            <input
              type="number"
              step="0.001"
              value={selectedPipe.roughness}
              on:input={(e) => {
                selectedPipe.roughness = Number(e.target.value);
                updatePipe(selectedPipe);
              }}
            />
          </div>
          <div class="property">
            <label>爆管:</label>
            <input
              type="checkbox"
              checked={selectedPipe.isBroken}
              on:change={(e) => {
                selectedPipe.isBroken = e.target.checked;
                updatePipe(selectedPipe);
              }}
            />
          </div>
          {#if selectedPipe.isBroken}
            <div class="property">
              <label>破裂程度:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedPipe.breakSeverity}
                on:input={(e) => {
                  selectedPipe.breakSeverity = Number(e.target.value);
                  updatePipe(selectedPipe);
                }}
              />
              <span>{Math.round(selectedPipe.breakSeverity * 100)}%</span>
            </div>
          {/if}
          <div class="info-row">
            <span>流量:</span>
            <strong>{selectedPipe.flowRate.toFixed(2)} L/s</strong>
          </div>
          <div class="info-row">
            <span>流速:</span>
            <strong>{selectedPipe.velocity.toFixed(2)} m/s</strong>
          </div>
          <div class="info-row">
            <span>长度:</span>
            <strong>{selectedPipe.length.toFixed(0)} px</strong>
          </div>

          {#if selectedPipe.hasReverseFlow}
            <div class="alert alert-warning">
              ⚠️ 检测到水流倒流!
            </div>
          {/if}
          {#if selectedPipe.isDeadEnd}
            <div class="alert alert-info">
              💡 此管道连接到死胡同
            </div>
          {/if}

          <div class="button-group">
            <button
              class="btn btn-secondary"
              on:click={() => {
                const hasPump = pumps.some(p => p.pipeId === selectedPipe.id);
                if (!hasPump) addPumpToPipe(selectedPipe.id);
              }}
            >
              ⚙️ 添加泵站
            </button>
            <button
              class="btn btn-secondary"
              on:click={() => {
                const hasValve = valves.some(v => v.pipeId === selectedPipe.id);
                if (!hasValve) addValveToPipe(selectedPipe.id);
              }}
            >
              🚰 添加阀门
            </button>
          </div>
          <button
            class="btn btn-danger"
            on:click={() => deletePipe(selectedPipe.id)}
          >
            ❌ 删除管道
          </button>
        </div>
      {/if}

      {#each pumps as pump}
        <div class="panel">
          <h3>⚙️ 泵站 {pump.id.slice(0, 4)}</h3>
          <div class="property">
            <label>功率:</label>
            <input
              type="number"
              value={pump.power}
              on:input={(e) => {
                pump.power = Number(e.target.value);
                updatePump(pump);
              }}
            />
            <span class="unit">kW</span>
          </div>
          <div class="property">
            <label>扬程:</label>
            <input
              type="number"
              value={pump.head}
              on:input={(e) => {
                pump.head = Number(e.target.value);
                updatePump(pump);
              }}
            />
            <span class="unit">m</span>
          </div>
          <div class="property">
            <label>流量:</label>
            <input
              type="number"
              value={pump.flowCapacity}
              on:input={(e) => {
                pump.flowCapacity = Number(e.target.value);
                updatePump(pump);
              }}
            />
            <span class="unit">L/s</span>
          </div>
          <div class="property">
            <label>运行:</label>
            <input
              type="checkbox"
              checked={pump.isActive}
              on:change={(e) => {
                pump.isActive = e.target.checked;
                updatePump(pump);
              }}
            />
          </div>
          <button
            class="btn btn-danger btn-small"
            on:click={() => deletePump(pump.id)}
          >
            删除
          </button>
        </div>
      {/each}

      {#each valves as valve}
        <div class="panel">
          <h3>🚰 阀门 {valve.id.slice(0, 4)}</h3>
          <div class="property">
            <label>开度:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={valve.openPercentage}
              on:input={(e) => {
                valve.openPercentage = Number(e.target.value);
                updateValve(valve);
              }}
            />
            <span>{Math.round(valve.openPercentage * 100)}%</span>
          </div>
          <div class="property">
            <label>可用:</label>
            <input
              type="checkbox"
              checked={valve.isOperational}
              on:change={(e) => {
                valve.isOperational = e.target.checked;
                updateValve(valve);
              }}
            />
          </div>
          <button
            class="btn btn-danger btn-small"
            on:click={() => deleteValve(valve.id)}
          >
            删除
          </button>
        </div>
      {/each}

      {#if !selectedNode && !selectedPipe && pumps.length === 0 && valves.length === 0 && warnings.length === 0}
        <div class="panel help-panel">
          <h3>📖 使用说明</h3>
          <ol>
            <li><strong>选择工具:</strong> 使用工具栏选择操作模式</li>
            <li><strong>添加节点:</strong> 选择"添加节点"后点击画布</li>
            <li><strong>连接节点:</strong> 选择"连接节点"后依次点击两个节点</li>
            <li><strong>编辑属性:</strong> 点击节点或管道编辑属性</li>
            <li><strong>添加设备:</strong> 选中管道后可添加泵站/阀门</li>
            <li><strong>计算模拟:</strong> 点击"计算水压分布"运行模拟</li>
            <li><strong>预设场景:</strong> 点击顶部预设按钮快速加载场景</li>
          </ol>
          <h4>🎯 可观察的现象:</h4>
          <ul>
            <li>水流方向箭头（绿色正常，橙色倒流）</li>
            <li>节点压力数值实时跳动</li>
            <li>管道破裂喷水粒子</li>
            <li>阀门开合机械动画</li>
            <li>高压警告红光呼吸</li>
            <li>压力无限叠加和流量不守恒</li>
          </ul>
        </div>
      {/if}
    </aside>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #ecf0f1;
    overflow: hidden;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header h1 {
    margin: 0;
    font-size: 1.4rem;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .btn-primary {
    background: linear-gradient(135deg, #3498db, #2980b9);
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, #2980b9, #3498db);
  }

  .btn-danger {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
  }

  .btn-secondary {
    background: linear-gradient(135deg, #9b59b6, #8e44ad);
  }

  .btn-small {
    padding: 4px 10px;
    font-size: 12px;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tool-group {
    display: flex;
    gap: 5px;
  }

  .tool-btn {
    padding: 8px 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: transparent;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tool-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .tool-btn.active {
    background: rgba(52, 152, 219, 0.3);
    border-color: #3498db;
  }

  .preset-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .preset-group .label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }

  .preset-btn {
    padding: 6px 12px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    background: rgba(52, 152, 219, 0.2);
    color: white;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }

  .preset-btn:hover {
    background: rgba(52, 152, 219, 0.4);
    transform: translateY(-1px);
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .canvas-container {
    flex: 1;
    position: relative;
    background: linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%);
  }

  canvas {
    display: block;
    cursor: crosshair;
  }

  .connection-hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(241, 196, 15, 0.9);
    color: #333;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .sidebar {
    width: 300px;
    background: rgba(0, 0, 0, 0.3);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    overflow-y: auto;
    padding: 15px;
  }

  .panel {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .warning-panel {
    background: rgba(243, 156, 18, 0.1);
    border-color: rgba(243, 156, 18, 0.3);
  }

  .anomaly-panel {
    background: rgba(231, 76, 60, 0.1);
    border-color: rgba(231, 76, 60, 0.3);
  }

  .help-panel {
    background: rgba(52, 152, 219, 0.1);
    border-color: rgba(52, 152, 219, 0.3);
  }

  .panel h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;
  }

  .property {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 8px;
  }

  .property label {
    min-width: 70px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  .property input[type="number"],
  .property select {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    font-size: 13px;
  }

  .property input[type="range"] {
    flex: 1;
  }

  .property input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .unit {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .info-row strong {
    color: #3498db;
  }

  .info-row strong.danger {
    color: #e74c3c;
  }

  .button-group {
    display: flex;
    gap: 8px;
    margin: 10px 0;
  }

  .alert {
    padding: 10px;
    border-radius: 6px;
    margin: 10px 0;
    font-size: 13px;
  }

  .alert-warning {
    background: rgba(243, 156, 18, 0.2);
    border: 1px solid rgba(243, 156, 18, 0.3);
    color: #f39c12;
  }

  .alert-info {
    background: rgba(52, 152, 219, 0.2);
    border: 1px solid rgba(52, 152, 219, 0.3);
    color: #3498db;
  }

  .warning-item {
    padding: 8px;
    margin: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.2);
  }

  .warning-item.severity-critical {
    border-left: 4px solid #ff0000;
  }

  .warning-item.severity-high {
    border-left: 4px solid #ff6b6b;
  }

  .warning-item.severity-medium {
    border-left: 4px solid #ffa502;
  }

  .warning-item.severity-low {
    border-left: 4px solid #2ed573;
  }

  .anomaly-item {
    padding: 10px;
    margin: 8px 0;
    border-radius: 4px;
    background: rgba(231, 76, 60, 0.15);
    border: 1px solid rgba(231, 76, 60, 0.3);
    font-size: 12px;
  }

  .anomaly-details {
    margin-top: 5px;
    color: rgba(255, 255, 255, 0.6);
  }

  .help-panel ol,
  .help-panel ul {
    margin: 10px 0;
    padding-left: 20px;
    font-size: 12px;
    line-height: 1.8;
  }

  .help-panel li {
    margin-bottom: 4px;
  }

  .help-panel h4 {
    margin: 15px 0 5px 0;
    font-size: 13px;
    color: #3498db;
  }
</style>
