const prizes = [
  { label: "500%", color: "#1E1622", image: "/crown.webp" },
  { label: "100 FS", color: "#CE1C1B", image: "/three-sevens.webp" },
  { label: "Try again", color: "#6501CD", image: "/crown.webp" },
  { label: "10 CAP", color: "#02503B", image: "/wad.webp" },
  { label: "200%", color: "#AA0808", image: "/diamond.webp" },
  { label: "50 FS", color: "#012E21", image: "/three-sevens.webp" },
];

const SEGMENT_DEG = 360 / prizes.length;

let currentRotation = 0;
let spinsUsed = 0;
let isSpinning = false;
let loadedImages = {};

function rotationForIndex(index) {
  return 360 - (index * SEGMENT_DEG + SEGMENT_DEG / 2);
}

function getCanvasMode(canvas) {
  if (canvas.width >= 1000) return "desktop";
  if (canvas.width >= 768) return "tablet";
  return "mobile";
}

async function loadGameState() {
  try {
    if (window.storage) {
      const r = await window.storage.get("wheel_spins_used");
      spinsUsed = r?.value ? parseInt(r.value) : 0;
    } else {
      // Для локальної розробки
      spinsUsed = 0;
      console.log("Storage недоступний, початкове значення:", spinsUsed);
    }
  } catch {
    spinsUsed = 0;
  }
}

async function saveGameState() {
  try {
    // Перевірка чи storage доступний
    if (window.storage) {
      await window.storage.set("wheel_spins_used", spinsUsed.toString());
    } else {
      // Fallback для локальної розробки - зберігаємо в змінну
      console.log("Storage недоступний, дані в пам'яті:", spinsUsed);
    }
  } catch (error) {
    // Тільки для реальних помилок, не для відсутності storage
    console.error("Помилка збереження:", error);
    throw error;
  }
}

function updateButtonState() {
  const btn = document.querySelector(".spin-button");
  if (!btn) return;

  if (spinsUsed >= 2) {
    btn.disabled = true;
    btn.textContent = "No spins";
    btn.style.opacity = "0.5";
  } else {
    btn.disabled = false;
    btn.textContent = "Spin";
    btn.style.opacity = "1";
  }
}

function preloadImages() {
  return Promise.all(
    prizes.map((p) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[p.image] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = p.image;
      });
    })
  );
}

function createWheel() {
  const canvas = document.createElement("canvas");
  canvas.id = "wheelCanvas";
  const isDesktop = window.innerWidth >= 1920;
  canvas.width = isDesktop ? 1230 : 568;
  canvas.height = isDesktop ? 1230 : 568;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.transition = "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)";
  canvas.style.zIndex = "2";

  document.querySelector(".roulette-wheel")?.appendChild(canvas);
  return canvas;
}

function drawWheel(canvas) {
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 20; // Трохи збільшено відступ, щоб уникнути обрізання

  const mode = getCanvasMode(canvas);

  let fontScale, imgScale, textYOffset, imgYOffset;

  switch (mode) {
    case "desktop":
      fontScale = 0.12; //  Розмір тексту на desktop
      imgScale = 0.26; //  Розмір картинок на desktop
      textYOffset = 0.82; //  Відстань тексту від центру (більше = далі)
      imgYOffset = 0.56; //  Відстань картинки від центру
      break;
    case "tablet":
      fontScale = 0.105;
      imgScale = 0.13;
      textYOffset = 0.63;
      imgYOffset = 0.44;
      break;
    default:
      fontScale = 0.12;
      imgScale = 0.25;
      textYOffset = 0.78;
      imgYOffset = 0.52;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Базове коло
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#000"; //  Колір фону колеса
  ctx.fill();

  // Рамка колеса
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = radius * 0.05; //  Товщина рамки колеса
  ctx.strokeStyle = "#ebc566"; //  Колір рамки колеса (золотий)
  ctx.shadowColor = "#FFD700"; //  Колір тіні рамки (золотий)
  ctx.shadowBlur = radius * 0.03; //  Розмиття тіні рамки
  ctx.stroke();

  // Малюємо сектори
  prizes.forEach((p, i) => {
    const start = i * ((2 * Math.PI) / prizes.length) - Math.PI / 2;
    const end = start + (2 * Math.PI) / prizes.length;
    const mid = (start + end) / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid + Math.PI / 2);

    const fontSize = radius * fontScale;
    const textY = -radius * textYOffset;
    const imgSize = radius * imgScale;
    const imgY = -radius * imgYOffset;

    ctx.font = `bold ${fontSize}px Inter`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff"; //  Колір тексту
    ctx.strokeStyle = "#000"; //  Колір обводки тексту
    ctx.lineWidth = fontSize * 0.1; //  Товщина обводки тексту

    ctx.strokeText(p.label, 0, textY);
    ctx.fillText(p.label, 0, textY);

    const img = loadedImages[p.image];
    if (img) {
      ctx.drawImage(img, -imgSize / 2, imgY - imgSize / 2, imgSize, imgSize);
    }

    ctx.restore();
  });

  // Розділювачі між секторами (золоті лінії з обводкою)
  for (let i = 0; i < prizes.length; i++) {
    const angle = (i * 2 * Math.PI) / prizes.length - Math.PI / 2;
    const endX = cx + Math.cos(angle) * radius;
    const endY = cy + Math.sin(angle) * radius;

    // Темна обводка
    ctx.strokeStyle = "#e7c710ff"; //  Колір обводки розділювача (коричневий)
    ctx.lineWidth = radius * 0.025; //  Товщина обводки розділювача
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Золота лінія
    ctx.strokeStyle = "#FFD700"; //  Колір розділювача (золотий)
    ctx.lineWidth = radius * 0.015; //  Товщина розділювача
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

async function spinWheel() {
  if (isSpinning || spinsUsed >= 2) return;

  // Перевірка інтернет з'єднання перед спіном
  if (!checkInternetConnection()) {
    return;
  }

  const canvas = document.getElementById("wheelCanvas");
  const btn = document.querySelector(".spin-button");

  isSpinning = true;
  btn.disabled = true;
  btn.textContent = "Spinning...";

  spinsUsed++;

  const targetIndex = spinsUsed === 1 ? 2 : 0;
  const spins = spinsUsed === 1 ? 4 : 8;

  const finalRotation = spins * 360 + rotationForIndex(targetIndex);

  canvas.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation % 360;

  setTimeout(async () => {
    isSpinning = false;

    // Спроба зберегти стан гри з обробкою помилок
    try {
      await saveGameState();
    } catch (error) {
      // Якщо не вдалося зберегти - показуємо Error модалку
      showErrorModal();
      // Відкатуємо кількість спінів назад
      spinsUsed--;
      updateButtonState();
      return;
    }

    updateButtonState();

    // Показуємо модалку тільки для 500% (друге обертання)
    if (targetIndex === 0) {
      showPrizeModal();
    }
    // Для "Try again" (перше обертання) - нічого не показуємо
  }, 4000);
}

function showPrizeModal() {
  const modal = document.getElementById("prizeModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closePrizeModal() {
  const modal = document.getElementById("prizeModal");
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function showInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function showErrorModal() {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeErrorModal() {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// Перевірка наявності інтернет з'єднання
function checkInternetConnection() {
  if (!navigator.onLine) {
    showErrorModal();
    return false;
  }
  return true;
}

// Слухач на втрату інтернету (спрацьовує автоматично)
window.addEventListener("offline", () => {
  showErrorModal();
});

// Слухач на відновлення інтернету (автоматично закриває модалку)
window.addEventListener("online", () => {
  closeErrorModal();
});

document.addEventListener("DOMContentLoaded", async () => {
  await preloadImages();
  await loadGameState();

  const canvas = createWheel();
  drawWheel(canvas);

  currentRotation = rotationForIndex(0);
  canvas.style.transform = `rotate(${currentRotation}deg)`;

  document.querySelector(".spin-button")?.addEventListener("click", spinWheel);

  // Кнопки закриття Prize модалки
  document.querySelectorAll("#prizeModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closePrizeModal);
  });

  // Кнопки закриття Info модалки
  document.querySelectorAll("#infoModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closeInfoModal);
  });

  // Кнопки закриття Error модалки
  document.querySelectorAll("#errorModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closeErrorModal);
  });

  // Кнопка Claim закриває Prize модалку
  document
    .querySelector("#prizeModal .claim-button")
    ?.addEventListener("click", closePrizeModal);

  // Кнопка Ok в Info модалці
  document
    .querySelector("#infoModal .claim-button")
    ?.addEventListener("click", closeInfoModal);

  // Кнопка Ok в Error модалці
  document
    .querySelector("#errorModal .ok-button")
    ?.addEventListener("click", closeErrorModal);

  // Посилання "Wheel Info" (відкриває Info модалку)
  document.querySelector(".wheel-info")?.addEventListener("click", (e) => {
    e.preventDefault();
    closePrizeModal();
    showInfoModal();
  });

  // Закриття при кліку поза Prize модалкою
  document.getElementById("prizeModal")?.addEventListener("click", (e) => {
    if (e.target.id === "prizeModal") {
      closePrizeModal();
    }
  });

  // Закриття при кліку поза Info модалкою
  document.getElementById("infoModal")?.addEventListener("click", (e) => {
    if (e.target.id === "infoModal") {
      closeInfoModal();
    }
  });

  // Закриття при кліку поза Error модалкою
  document.getElementById("errorModal")?.addEventListener("click", (e) => {
    if (e.target.id === "errorModal") {
      closeErrorModal();
    }
  });

  updateButtonState();
});
