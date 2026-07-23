// ===== Configuración =====
// Fecha destino: 26 de agosto. Cuenta regresiva en hora de Colombia (UTC-5).
const MES_DESTINO = 8;   // agosto
const DIA_DESTINO = 26;

// Devuelve la fecha/hora actual en Colombia como objeto Date "normalizado".
function ahoraColombia() {
  const ahora = new Date();
  // Hora UTC + offset de Colombia (-5h), sin horario de verano.
  const utcMs = ahora.getTime() + ahora.getTimezoneOffset() * 60000;
  return new Date(utcMs - 5 * 3600000);
}

// Calcula los días restantes hasta el próximo 26 de agosto (hora Colombia).
function diasRestantes() {
  const hoy = ahoraColombia();
  const hoyMedianoche = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  let anioDestino = hoy.getFullYear();
  let destino = new Date(anioDestino, MES_DESTINO - 1, DIA_DESTINO);
  // Si ya pasó este año, apunta al del próximo año.
  if (destino < hoyMedianoche) {
    destino = new Date(anioDestino + 1, MES_DESTINO - 1, DIA_DESTINO);
  }

  const msPorDia = 24 * 3600 * 1000;
  return Math.round((destino - hoyMedianoche) / msPorDia);
}

let DIAS_RESTANTES = diasRestantes();

// Reflejar el número en la interfaz
function actualizarDias() {
  DIAS_RESTANTES = diasRestantes();
  document.getElementById("stubDays").textContent = DIAS_RESTANTES;
  document.getElementById("daysText").textContent = DIAS_RESTANTES;
}
actualizarDias();
// Se recalcula cada hora por si la página queda abierta y cambia el día.
setInterval(actualizarDias, 3600 * 1000);

// ===== Elementos =====
const canvas = document.getElementById("heartCanvas");
const ctx = canvas.getContext("2d");
const pass = document.getElementById("pass");
const letter = document.getElementById("letter");
const boardBtn = document.getElementById("boardBtn");
const againBtn = document.getElementById("againBtn");

// ===== Ajuste del canvas a la pantalla (con densidad de píxeles) =====
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== Curva del corazón (parametrizada) =====
// t va de 0 a 2π. Devuelve un punto centrado y escalado en pantalla.
function heartPoint(t, cx, cy, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y =
    13 * Math.cos(t) -
    5 * Math.cos(2 * t) -
    2 * Math.cos(3 * t) -
    Math.cos(4 * t);
  return { x: cx + x * scale, y: cy - y * scale };
}

// ===== Estado de la animación =====
let animId = null;
const trail = []; // estela de partículas del avión

function launch() {
  // Bloquear botón y separar el pase
  boardBtn.disabled = true;
  pass.classList.add("launch");

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const scale = Math.min(window.innerWidth, window.innerHeight) / 44;

  let progress = 0;           // 0 a 1
  const speed = 0.006;        // velocidad del avión
  const heartPath = [];       // puntos ya recorridos (para dibujar el trazo)

  cancelAnimationFrame(animId);
  trail.length = 0;

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ángulo actual sobre la curva. Empieza arriba del corazón.
    const t = progress * Math.PI * 2 - Math.PI / 2;
    const p = heartPoint(t, cx, cy, scale);
    heartPath.push(p);

    // Dibujar el trazo del corazón ya recorrido
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e8506e";
    ctx.shadowColor = "rgba(232, 80, 110, .6)";
    ctx.shadowBlur = 12;
    heartPath.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Estela de corazoncitos
    if (Math.random() < 0.5) {
      trail.push({ x: p.x, y: p.y, life: 1, size: 8 + Math.random() * 8 });
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      const s = trail[i];
      s.life -= 0.02;
      s.y += 0.3;
      if (s.life <= 0) { trail.splice(i, 1); continue; }
      ctx.globalAlpha = s.life;
      drawMiniHeart(s.x, s.y, s.size);
      ctx.globalAlpha = 1;
    }

    // Dirección del avión (mirando hacia adelante en la curva)
    const tNext = t + 0.05;
    const pNext = heartPoint(tNext, cx, cy, scale);
    const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x);
    drawPlane(p.x, p.y, angle);

    progress += speed;
    if (progress < 1.02) {
      animId = requestAnimationFrame(frame);
    } else {
      revealLetter();
    }
  }
  frame();
}

// ===== Dibujar el avión =====
function drawPlane(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#1b2a4a";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(0,0,0,.2)";
  ctx.shadowBlur = 6;

  // fuselaje
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // alas
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-6, -10);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-6, 10);
  ctx.closePath();
  ctx.fillStyle = "#e8506e";
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

// ===== Dibujar un mini corazón (para la estela) =====
function drawMiniHeart(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-16, -6, -10, -22, 0, -12);
  ctx.bezierCurveTo(10, -22, 16, -6, 0, 8);
  ctx.closePath();
  ctx.fillStyle = "#ff7a94";
  ctx.fill();
  ctx.restore();
}

// ===== Mostrar la carta final =====
function revealLetter() {
  pass.style.opacity = "0";
  pass.style.pointerEvents = "none";
  letter.classList.add("show");
  letter.setAttribute("aria-hidden", "false");
}

// ===== Reiniciar =====
function reset() {
  cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  trail.length = 0;
  letter.classList.remove("show");
  letter.setAttribute("aria-hidden", "true");
  pass.style.opacity = "1";
  pass.style.pointerEvents = "auto";
  pass.classList.remove("launch");
  boardBtn.disabled = false;
}

boardBtn.addEventListener("click", launch);
againBtn.addEventListener("click", reset);
