'use strict';

const find = (selector) => document.querySelector(selector);

function mountFocusDesk() {
  const key = 'portfolio-mind-dock-inbox';
  let items = [];
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(stored)) items = stored.filter((item) => typeof item === 'string');
  } catch {
    // Keep the current session usable when storage is unavailable.
  }
  let selected = -1;
  const tasks = find('#tasks');
  const input = find('#thought');
  const complete = find('#complete');

  function render() {
    tasks.replaceChildren();
    items.forEach((text, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = text;
      button.setAttribute('aria-pressed', String(index === selected));
      button.addEventListener('click', () => {
        selected = index;
        render();
        tasks.children[index].firstElementChild.focus();
      });
      item.append(button);
      tasks.append(item);
    });
    find('#focus').textContent = items[selected] ?? 'Choose a task from the inbox.';
    complete.disabled = selected < 0;
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      // Tasks remain available in memory for this session.
    }
    render();
  }

  find('#capture').addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    items.push(text);
    input.value = '';
    save();
  });
  complete.addEventListener('click', () => {
    items.splice(selected, 1);
    selected = -1;
    save();
    input.focus();
  });
  render();
}

function mountYard() {
  const yard = find('#yard');
  const status = find('#yard-status');
  const materials = { Brick: '🧱', Crate: '📦', Cone: '🔶', Eraser: '' };
  function place(cell, material) {
    cell.dataset.filled = String(Boolean(materials[material]));
    cell.textContent = materials[material];
    cell.setAttribute('aria-label', `Square ${cell.dataset.index}, ${materials[material] ? material : 'empty'}`);
  }
  function updateCount() {
    const count = yard.querySelectorAll('[data-filled="true"]').length;
    status.textContent = `${count} ${count === 1 ? 'block' : 'blocks'} placed`;
  }
  for (let index = 1; index <= 48; index += 1) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.dataset.index = index;
    place(cell, 'Eraser');
    cell.addEventListener('click', () => {
      place(cell, find('#material').value);
      updateCount();
    });
    yard.append(cell);
  }
  find('#clear').addEventListener('click', () => {
    Array.from(yard.children).forEach((cell) => place(cell, 'Eraser'));
    updateCount();
  });
}

function mountCourse(project) {
  const canvas = find('#course');
  const ctx = canvas.getContext('2d');
  const status = find('#course-status');
  const weather = find('#weather');
  const flying = project === 'sky-trials';
  const night = project === 'midnight-city';
  const start = [57, 310];
  const gates = flying
    ? [[154, 255], [251, 135], [343, 192], [451, 90], [548, 205], [655, 131]]
    : night
      ? [[166, 310], [259, 221], [329, 100], [465, 115], [540, 240], [663, 299]]
      : [[157, 310], [258, 298], [310, 196], [420, 133], [535, 174], [650, 271]];
  const moves = { left: [-14, 0], right: [14, 0], up: [0, -14], down: [0, 14] };
  let position = [...start];
  let next = 0;

  function draw() {
    ctx.fillStyle = flying ? '#247099' : night ? '#21172d' : '#37383d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = flying ? 2 : 54;
    ctx.strokeStyle = flying ? '#bbebff' : night ? '#4c3359' : '#5c5960';
    ctx.beginPath();
    ctx.moveTo(...start);
    gates.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.stroke();
    gates.forEach(([x, y], index) => {
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fillStyle = index < next ? '#a1eec2' : index === next ? '#ffc765' : '#171e32';
      ctx.fill();
      ctx.fillStyle = index <= next ? '#15181f' : '#fff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x, y);
    });
    if (weather?.value === 'Fog') {
      ctx.fillStyle = '#cfccdf42';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (weather?.value === 'Rain') {
      ctx.strokeStyle = '#82bcf5aa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 12; x < canvas.width; x += 17) {
        const y = (x * 11) % canvas.height;
        ctx.moveTo(x, y);
        ctx.lineTo(x - 7, y + 19);
      }
      ctx.stroke();
    }
    const [x, y] = position;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + 13, y);
    ctx.lineTo(x - 9, y - 10);
    ctx.lineTo(x - 9, y + 10);
    ctx.closePath();
    ctx.fill();
  }

  function move(direction) {
    if (next === gates.length) return;
    const [dx, dy] = moves[direction];
    position = [
      Math.max(13, Math.min(canvas.width - 13, position[0] + dx)),
      Math.max(13, Math.min(canvas.height - 13, position[1] + dy)),
    ];
    const [x, y] = gates[next];
    if (Math.hypot(position[0] - x, position[1] - y) <= 24) {
      next += 1;
      updateStatus();
    }
    draw();
  }

  function updateStatus() {
    status.textContent = next === gates.length ? 'Course complete. All six gates cleared.' : `Gates cleared: ${next} of ${gates.length}`;
  }
  canvas.addEventListener('keydown', (event) => {
    if (!event.key.startsWith('Arrow')) return;
    event.preventDefault();
    move(event.key.slice(5).toLowerCase());
  });
  document.querySelectorAll('[data-move]').forEach((button) => {
    button.addEventListener('click', () => move(button.dataset.move));
  });
  find('#restart').addEventListener('click', () => {
    position = [...start];
    next = 0;
    updateStatus();
    draw();
  });
  weather?.addEventListener('change', draw);
  updateStatus();
  draw();
}

function mountAssetLab() {
  const fileInput = find('#glb');
  const status = find('#file-status');
  const display = find('#inventory');
  const exportButton = find('#export');
  const categories = ['scenes', 'nodes', 'meshes', 'materials', 'animations'];
  let inventory;
  let selection = 0;

  function show(name, data) {
    inventory = { file: name };
    display.replaceChildren();
    categories.forEach((category) => {
      const count = Array.isArray(data[category]) ? data[category].length : 0;
      inventory[category] = count;
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = category[0].toUpperCase() + category.slice(1);
      value.textContent = count;
      display.append(term, value);
    });
    exportButton.disabled = false;
    status.textContent = `Inventory loaded for ${name}`;
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    const current = ++selection;
    inventory = undefined;
    exportButton.disabled = true;
    display.replaceChildren();
    status.textContent = 'Reading file…';
    try {
      const header = new DataView(await file.slice(0, 20).arrayBuffer());
      if (header.byteLength !== 20 || header.getUint32(0, true) !== 0x46546c67
        || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size
        || header.getUint32(16, true) !== 0x4e4f534a) {
        throw new Error('Invalid GLB header');
      }
      const end = 20 + header.getUint32(12, true);
      if (end > file.size || end > 20 + 16 * 1024 * 1024) throw new Error('Unsupported JSON chunk size');
      const data = JSON.parse(await file.slice(20, end).text());
      if (typeof data.asset?.version !== 'string' || !data.asset.version.startsWith('2.')) {
        throw new Error('Missing glTF 2 asset');
      }
      if (current === selection) show(file.name, data);
    } catch {
      if (current === selection) status.textContent = 'Could not read this file. Choose a valid GLB 2.0 with a JSON chunk under 16 MiB.';
    }
  });
  find('#sample').addEventListener('click', () => {
    selection += 1;
    fileInput.value = '';
    show('Sample scene', { scenes: [{}], nodes: [{}, {}], meshes: [{}], materials: [{}] });
  });
  exportButton.addEventListener('click', () => {
    const link = document.createElement('a');
    const blob = new Blob([JSON.stringify(inventory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'asset-inventory.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

function mountSignal() {
  const frequency = find('#frequency');
  const meter = find('#strength');
  const status = find('#signal-status');
  const randomFrequency = () => 85 + Math.floor(Math.random() * 31);
  let signal = randomFrequency();
  frequency.addEventListener('input', () => {
    find('#freq').value = `${frequency.value} MHz`;
  });
  find('#sweep').addEventListener('click', () => {
    const strength = Math.max(0, 100 - Math.abs(signal - Number(frequency.value)) * 6);
    meter.value = strength;
    status.textContent = strength === 100 ? 'Signal locked.' : `Signal strength: ${strength}%`;
  });
  find('#new-signal').addEventListener('click', () => {
    signal = randomFrequency();
    meter.value = 0;
    status.textContent = 'New signal ready to scan';
  });
}

function mountWorkloads() {
  const workload = find('#workload');
  const info = {
    professional: ['Professional work', 'Start with the apps your team needs, its remote access requirements, and the devices people already use.'],
    creator: ['Creative production', 'Estimate the memory, GPU capacity, and storage your largest editing or rendering projects require.'],
    gaming: ['Gaming', 'Check network latency and stability from where you play, alongside the GPU and memory your games need.'],
  };
  function update() {
    const [title, copy] = info[workload.value];
    find('#workload-title').textContent = title;
    find('#workload-copy').textContent = copy;
  }
  workload.addEventListener('change', update);
  update();
}

const project = document.documentElement.dataset.project;
const demos = {
  'mind-dock': mountFocusDesk,
  'azlan-world': mountYard,
  'asset-lab': mountAssetLab,
  'first-contact': mountSignal,
  'lola-pc': mountWorkloads,
};
if (find('#course')) mountCourse(project);
else demos[project]?.();
