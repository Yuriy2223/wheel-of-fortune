const TOTAL_SEGMENTS = 6;
const SEGMENT_DEG = 360 / TOTAL_SEGMENTS;

let currentRotation = 0;
let spinsUsed = 0;
let isSpinning = false;
let prizeOpened = false;

const SOUND_DURATIONS = {
  buttonClick: 500,
  wheelSpin: 7000,
  tryAgain: 3000,
  prizeWin: null,
};

function playSound(soundPath, volume = 1, maxDuration = null) {
  try {
    const audio = new Audio(soundPath);
    audio.volume = volume;
    audio.play().catch((err) => console.log("Звук не відтворився:", err));

    if (maxDuration !== null && maxDuration > 0) {
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, maxDuration);
    }

    return audio;
  } catch (error) {
    console.error("Помилка відтворення звуку:", error);
    return null;
  }
}

function playButtonClickSound() {
  // playSound("/audio-button-click.mp3", 1.0, SOUND_DURATIONS.buttonClick);
  playSound("/audio-prize.mp3", 1.0, SOUND_DURATIONS.buttonClick);
}

function playWheelSpinSound() {
  // return playSound("/audio-wheel-spin.mp3", 1.0, SOUND_DURATIONS.wheelSpin);
  return playSound("/audio-prize.mp3", 1.0, SOUND_DURATIONS.wheelSpin);
}

function playTryAgainSound() {
  // playSound("/audio-try-again.mp3", 1.0, SOUND_DURATIONS.tryAgain);
  playSound("/audio-prize.mp3", 1.0, SOUND_DURATIONS.tryAgain);
}

function playPrizeWinSound() {
  // playSound("/audio-prize.mp3", 1.0, SOUND_DURATIONS.prizeWin);
  playSound("/audio-prize.mp3", 1.0, SOUND_DURATIONS.prizeWin);
}

function createLightBulbs() {
  const container = document.querySelector(".inner-fortune");
  if (!container) return;

  const lightsContainer = document.createElement("div");
  lightsContainer.className = "wheel-lights";

  const numberOfBulbs = 20;

  let radiusPercent;
  const screenWidth = window.innerWidth;

  if (screenWidth < 768) {
    radiusPercent = 46;
  } else if (screenWidth < 1280) {
    radiusPercent = 44.8;
  } else if (screenWidth < 1920) {
    radiusPercent = 43.7;
  } else {
    radiusPercent = 43.7;
  }

  const startAngle = -90;

  for (let i = 0; i < numberOfBulbs; i++) {
    const bulb = document.createElement("div");
    bulb.className = "light-bulb";

    const angle = startAngle + (360 / numberOfBulbs) * i;
    const radian = (angle * Math.PI) / 180;
    const x = 50 + radiusPercent * Math.cos(radian);
    const y = 50 + radiusPercent * Math.sin(radian);

    bulb.style.left = `${x}%`;
    bulb.style.top = `${y}%`;

    lightsContainer.appendChild(bulb);
  }

  container.appendChild(lightsContainer);
}

function recreateLightBulbs() {
  const oldLights = document.querySelector(".wheel-lights");
  if (oldLights) {
    oldLights.remove();
  }
  createLightBulbs();
}

function rotationForIndex(index) {
  return 360 - (index * SEGMENT_DEG + SEGMENT_DEG / 2) + 30;
}

async function loadGameState() {
  try {
    const savedSpins = localStorage.getItem("wheel_spins_used");
    spinsUsed = savedSpins ? parseInt(savedSpins) : 0;

    const savedPrize = localStorage.getItem("prize_opened");
    prizeOpened = savedPrize === "true";
  } catch (error) {
    console.error("Помилка завантаження:", error);
    spinsUsed = 0;
    prizeOpened = false;
  }
}

async function saveGameState() {
  try {
    localStorage.setItem("wheel_spins_used", spinsUsed.toString());
    localStorage.setItem("prize_opened", prizeOpened.toString());
  } catch (error) {
    console.error("Помилка збереження:", error);
    throw error;
  }
}

function updateButtonState() {
  const btn = document.querySelector(".spin-button");
  if (!btn) return;

  if (spinsUsed >= 2 || prizeOpened) {
    btn.disabled = true;
    btn.textContent = "No spins";
    btn.style.opacity = "0.5";
  } else {
    btn.disabled = false;
    btn.textContent = "Spin";
    btn.style.opacity = "1";
  }
}

function createWheel() {
  const wheelImg = document.createElement("img");
  wheelImg.id = "wheelImage";
  wheelImg.src = "/spinning-wheel.webp";
  wheelImg.style.position = "absolute";
  wheelImg.style.inset = "0";
  wheelImg.style.width = "100%";
  wheelImg.style.height = "100%";
  wheelImg.style.transition = "transform 7s cubic-bezier(0.17,0.67,0.12,0.99)";
  wheelImg.style.zIndex = "2";
  wheelImg.style.objectFit = "contain";

  document.querySelector(".roulette-wheel")?.appendChild(wheelImg);
  return wheelImg;
}

async function spinWheel() {
  if (isSpinning || spinsUsed >= 2 || prizeOpened) return;

  if (!navigator.onLine) {
    showErrorModal();
    return;
  }

  playButtonClickSound();

  const wheel = document.getElementById("wheelImage");
  const btn = document.querySelector(".spin-button");

  isSpinning = true;
  btn.disabled = true;
  btn.textContent = "Spinning...";
  spinsUsed++;

  const spinDuration = SOUND_DURATIONS.wheelSpin;

  playWheelSpinSound();

  const targetIndex = spinsUsed === 1 ? 2 : 0;
  const spins = spinsUsed === 1 ? 4 : 8;

  const finalRotation = spins * 360 + rotationForIndex(targetIndex);

  wheel.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation % 360;

  setTimeout(async () => {
    isSpinning = false;

    if (!navigator.onLine) {
      showErrorModal();
      spinsUsed--;
      updateButtonState();
      return;
    }

    try {
      await saveGameState();
    } catch (error) {
      console.error("Помилка при збереженні:", error);
      showErrorModal();
      spinsUsed--;
      updateButtonState();
      return;
    }

    updateButtonState();

    if (targetIndex === 0) {
      prizeOpened = true;
      await saveGameState();
      playPrizeWinSound();
      showPrizeModal();
    } else {
      playTryAgainSound();
    }
  }, spinDuration);
}

function showPrizeModal() {
  const modal = document.getElementById("prizeModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  modal.style.zIndex = "100";
}

function showInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.add("active");
  modal.style.zIndex = "110";
}

function closeInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.remove("active");
}

function showErrorModal() {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.classList.add("active");
  if (!document.getElementById("prizeModal")?.classList.contains("active")) {
    document.body.style.overflow = "hidden";
  }
  modal.style.zIndex = "110";
}

function closeErrorModal() {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.classList.remove("active");
  if (!document.getElementById("prizeModal")?.classList.contains("active")) {
    document.body.style.overflow = "";
  }
}

window.addEventListener("offline", () => {
  console.log("Інтернет втрачено");
  showErrorModal();
});

window.addEventListener("online", () => {
  console.log("Інтернет відновлено");
  closeErrorModal();
});

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    recreateLightBulbs();
  }, 250);
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadGameState();

  createLightBulbs();
  const wheel = createWheel();

  currentRotation = rotationForIndex(0);
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  if (prizeOpened) {
    showPrizeModal();
  }

  document.querySelector(".spin-button")?.addEventListener("click", spinWheel);

  document.querySelectorAll("#infoModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closeInfoModal);
  });

  document.querySelectorAll("#errorModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closeErrorModal);
  });

  document
    .querySelector("#infoModal .modal-btn")
    ?.addEventListener("click", closeInfoModal);

  document
    .querySelector("#errorModal .modal-btn")
    ?.addEventListener("click", closeErrorModal);

  document.querySelector(".wheel-info")?.addEventListener("click", (e) => {
    e.preventDefault();
    showInfoModal();
  });

  document.getElementById("infoModal")?.addEventListener("click", (e) => {
    if (e.target.id === "infoModal") {
      closeInfoModal();
    }
  });

  document.getElementById("errorModal")?.addEventListener("click", (e) => {
    if (e.target.id === "errorModal") {
      closeErrorModal();
    }
  });

  updateButtonState();
});
