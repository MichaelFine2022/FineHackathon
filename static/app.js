const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let x = 0, y = 0;
const undoStack = [];

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
}

function draw(e) {
    if (!isDrawing) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    x = e.offsetX;
    y = e.offsetY;
}

function stopDrawing() {
    isDrawing = false;
    undoStack.push(canvas.toDataURL());
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function undo() {
    if (undoStack.length === 0) return;
    const img = new Image();
    img.src = undoStack.pop();
    img.onload = () => {
        clearCanvas();
        ctx.drawImage(img, 0, 0);
    };
}

function saveCanvas() {
    const dataURL = canvas.toDataURL('image/png');
    fetch('/save_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataURL })
    })
    .then(response => response.json())
    .then(data => alert('Note saved successfully!'));
}

document.getElementById('math-input').addEventListener('input', () => {
    const input = document.getElementById('math-input').value;
    const preview = document.getElementById('math-preview');
    preview.innerHTML = input;
    MathJax.typesetPromise([preview]);
});

document.getElementById('saveButton').addEventListener('click', () => {
    const image = canvas.toDataURL();
    fetch('/recognize_math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: image })
    })
    .then(response => response.json())
    .then(data => alert(data.result))  // Show recognized result
    .catch(err => console.error('Error:', err));
});
