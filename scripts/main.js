import { canvas, canvasContext } from './canvasElements.js';  // eslint-disable-line

let size = 4;
let pixelsize = (canvas.width / size);

let curPixel = null;
let mouseDown = false;
let curPenColor = '#000000';
let curFillColor = '#ffffff';
let curInstrument = 'draw';
document.getElementById('draw').classList.add('cur');
document.getElementById('size').classList.add('cur');

const canvasMatrix = [];

function initMatrix(color) {
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < size; i++) {
    canvasMatrix.push([]);
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < size; j++) {
      canvasMatrix[i].push(color);
    }
  }
}

initMatrix(curFillColor);

let ws;
let id;

function handleSockets() {
  ws = new WebSocket('ws://localhost:5000');
  ws.onopen = () => {
    console.log('connection opened');// eslint-disable-line
  };
  ws.onmessage = ({ data }) => {
    const parsed = JSON.parse(data);
    switch (parsed.type) {
      case 'draw':
        canvasMatrix[parseInt(parsed.x, 10)][parseInt(parsed.y, 10)] = parsed.color;
        break;
      case 'newId':
        id = parsed.id;
        break;
      case 'newSize':
        size = parsed.size;
        pixelsize = (canvas.width / size);
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        initMatrix(parsed.color);
        break;
      case 'cursor':
        if (id !== parsed.id) {
          let div = document.getElementById(`cursor${parsed.id}`);
          if (div == null) {
            div = document.createElement('div');
            div.innerHTML = '<img src="../img/cursor.svg" alt="cursor">';
            div.style.position = 'absolute';
            div.style.top = '0';
            div.style.left = '0';
            div.id = `cursor${parsed.id}`;
            document.body.appendChild(div);
          }
          div.style.top = `${parsed.y}px`;
          div.style.left = `${parsed.x}px`;
          console.log(div);// eslint-disable-line
        }
        break;
      case 'exit':
        document.getElementById(`cursor${parsed.id}`).remove();
        break;
      default:
        console.log('invalid request');// eslint-disable-line
    }
  };
  ws.onclose = () => {
    ws = null;
  };
}
function send(object) {
  if (!ws) {
    alert('not connected');// eslint-disable-line
  } else {
    const data = JSON.stringify(object);
    ws.send(data);
  }
}

handleSockets();

function fillPixel(x, y, color) {
  canvasMatrix[x][y] = curFillColor;
  send({
    type: 'draw', x, y, color: curFillColor,
  });
  if ((x - 1) >= 0) {
    if (canvasMatrix[x - 1][y] === color) {
      fillPixel(x - 1, y, color);
    }
  }
  if ((x + 1) < size) {
    if (canvasMatrix[x + 1][y] === color) {
      fillPixel(x + 1, y, color);
    }
  }
  if ((y + 1) < size) {
    if (canvasMatrix[x][y + 1] === color) {
      fillPixel(x, y + 1, color);
    }
  }
  if ((y - 1) >= 0) {
    if (canvasMatrix[x][y - 1] === color) {
      fillPixel(x, y - 1, color);
    }
  }
}

function repaintCanvas() {
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < size; i++) {
    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < size; j++) {
      canvasContext.fillStyle = canvasMatrix[i][j];
      canvasContext.fillRect(i * pixelsize, j * pixelsize, pixelsize, pixelsize);
    }
  }
  if (!mouseDown) {
    canvasContext.fillStyle = '#d2d1d1';
    if (curPixel != null) {
      canvasContext.fillRect(curPixel[0] * pixelsize, curPixel[1] * pixelsize,
        pixelsize, pixelsize);
    }
  }
  requestAnimationFrame(repaintCanvas);
}

document.addEventListener('mousemove', (ev) => {
  send({
    type: 'cursor', x: ev.pageX, y: ev.pageY, id,
  });
});

canvas.addEventListener('mousemove', (ev) => {
  const x = Math.ceil((ev.pageX - canvas.offsetLeft) / pixelsize - 1);
  const y = Math.ceil((ev.pageY - canvas.offsetTop) / pixelsize - 1);
  curPixel = [x, y];
  if (mouseDown) {
    canvasMatrix[x][y] = curPenColor;
    send({
      type: 'draw', x, y, color: curPenColor,
    });
  }
});

canvas.addEventListener('mouseleave', () => {
  curPixel = null;
});

canvas.addEventListener('mousedown', () => {
  if (curInstrument === 'draw') {
    canvasMatrix[curPixel[0]][curPixel[1]] = curPenColor;
    send({
      type: 'draw', x: curPixel[0], y: curPixel[1], color: curPenColor,
    });
    mouseDown = true;
  }
});

canvas.addEventListener('mouseup', () => {
  mouseDown = false;
});

canvas.addEventListener('click', () => {
  if (curInstrument === 'fill') {
    if (curFillColor !== canvasMatrix[curPixel[0]][curPixel[1]]) {
      fillPixel(curPixel[0], curPixel[1], canvasMatrix[curPixel[0]][curPixel[1]]);
    }
  }
});

document.getElementById('changeSize').addEventListener('click', () => {
  const res = confirm('При изменении размерности поля, холст будет очищен'); // eslint-disable-line
  if (res) {
    const rad = document.getElementsByName('size');
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < rad.length; i++) {
      if (rad[i].checked) {
        switch (i) {
          case 0:
            size = 4;
            break;
          case 1:
            size = 8;
            break;
          case 2:
            size = 16;
            break;
          case 3:
            size = 32;
            break;
          default:
            size = 4;
        }
      }
    }
    pixelsize = (canvas.width / size);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    initMatrix(curFillColor);
    send({ type: 'newSize', size, color: curFillColor });
  }
});

document.getElementById('colorPenPick').addEventListener('input', (ev) => {
  curPenColor = ev.target.value;
}, false);

document.getElementById('colorFillPick').addEventListener('input', (ev) => {
  curFillColor = ev.target.value;
}, false);

document.getElementById('fill').addEventListener('click', () => {
  curInstrument = 'fill';
  document.getElementById('fill').classList.add('cur');
  document.getElementById('draw').classList.remove('cur');
});

document.getElementById('draw').addEventListener('click', () => {
  curInstrument = 'draw';
  document.getElementById('draw').classList.add('cur');
  document.getElementById('fill').classList.remove('cur');
});

window.addEventListener('keydown', (ev) => {
  switch (ev.code) {
    case 'KeyB':
      document.getElementById('fill').click();
      break;
    case 'KeyP':
      document.getElementById('draw').click();
      break;
    case 'KeyC':
      if (curInstrument === 'fill') {
        document.getElementById('colorFillPick').click();
      } else {
        document.getElementById('colorPenPick').click();
      }
      break;
    default:
      console.log('invalid combination');// eslint-disable-line
  }
});

window.addEventListener('unload', () => {
  send({ type: 'exit', id });
});

window.requestAnimationFrame(repaintCanvas);
