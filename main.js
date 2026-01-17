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

const audioCache = {
  buttonClick: null,
  wheelSpin: null,
  tryAgain: null,
  prizeWin: null,
};

function preloadAudio() {
  audioCache.buttonClick = new Audio("/audio-button-click.mp3");
  audioCache.wheelSpin = new Audio("/audio-wheel-spin.mp3");
  audioCache.tryAgain = new Audio("/audio-try-again.mp3");
  audioCache.prizeWin = new Audio("/audio-prize.mp3");

  audioCache.buttonClick.volume = 0.7;
  audioCache.wheelSpin.volume = 0.4;
  audioCache.tryAgain.volume = 0.7;
  audioCache.prizeWin.volume = 0.4;

  Object.values(audioCache).forEach((audio) => {
    if (audio) audio.load();
  });
}

function playButtonClickSound() {
  if (!audioCache.buttonClick) return;
  audioCache.buttonClick.currentTime = 0;
  audioCache.buttonClick
    .play()
    .catch((err) => console.warn("Audio error:", err));

  setTimeout(() => {
    audioCache.buttonClick.pause();
    audioCache.buttonClick.currentTime = 0;
  }, SOUND_DURATIONS.buttonClick);
}

function playWheelSpinSound() {
  if (!audioCache.wheelSpin) return;
  audioCache.wheelSpin.currentTime = 0;
  audioCache.wheelSpin.play().catch((err) => console.warn("Audio error:", err));

  setTimeout(() => {
    audioCache.wheelSpin.pause();
    audioCache.wheelSpin.currentTime = 0;
  }, SOUND_DURATIONS.wheelSpin);
}

function playTryAgainSound() {
  if (!audioCache.tryAgain) return;
  audioCache.tryAgain.currentTime = 0;
  audioCache.tryAgain.play().catch((err) => console.warn("Audio error:", err));

  setTimeout(() => {
    audioCache.tryAgain.pause();
    audioCache.tryAgain.currentTime = 0;
  }, SOUND_DURATIONS.tryAgain);
}

function playPrizeWinSound() {
  if (!audioCache.prizeWin) return;
  audioCache.prizeWin.currentTime = 0;
  audioCache.prizeWin.play().catch((err) => console.warn("Audio error:", err));
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
    radiusPercent = 45.6;
  } else if (screenWidth < 1280) {
    radiusPercent = 44.4;
  } else if (screenWidth < 1920) {
    radiusPercent = 43.8;
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
    spinsUsed = 0;
    prizeOpened = false;
  }
}

async function saveGameState() {
  try {
    localStorage.setItem("wheel_spins_used", spinsUsed.toString());
    localStorage.setItem("prize_opened", prizeOpened.toString());
  } catch (error) {
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

function startLights() {
  const lightsContainer = document.querySelector(".wheel-lights");
  if (lightsContainer) {
    lightsContainer.classList.add("spinning");
  }
}

function stopLights() {
  const lightsContainer = document.querySelector(".wheel-lights");
  if (lightsContainer) {
    lightsContainer.classList.remove("spinning");
  }
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
  startLights();

  const targetIndex = spinsUsed === 1 ? 2 : 0;
  const spins = spinsUsed === 1 ? 4 : 8;
  const finalRotation = spins * 360 + rotationForIndex(targetIndex);

  wheel.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation % 360;

  setTimeout(async () => {
    isSpinning = false;
    stopLights();

    if (!navigator.onLine) {
      showErrorModal();
      spinsUsed--;
      updateButtonState();
      return;
    }

    try {
      await saveGameState();
    } catch (error) {
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
  modal.style.zIndex = "11";
}

function showInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  modal.style.zIndex = "12";
}

function closeInfoModal() {
  const modal = document.getElementById("infoModal");
  if (!modal) return;

  modal.classList.remove("active");

  if (!document.getElementById("prizeModal")?.classList.contains("active")) {
    document.body.style.overflow = "";
  }
}

function showErrorModal() {
  const modal = document.getElementById("errorModal");
  if (!modal) return;

  modal.classList.add("active", "error-page-mode");
  document.body.style.overflow = "hidden";
  modal.style.zIndex = "13";
}

function closeErrorModal() {
  const errorModal = document.getElementById("errorModal");
  const prizeModal = document.getElementById("prizeModal");

  if (!errorModal) return;

  errorModal.classList.remove("active", "error-page-mode");

  if (!prizeModal?.classList.contains("active")) {
    document.body.style.overflow = "";
  }
}

window.addEventListener("offline", () => {
  showErrorModal();
});

window.addEventListener("online", () => {
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
  preloadAudio();

  createLightBulbs();
  const wheel = createWheel();

  document.querySelector(".spin-button")?.addEventListener("click", spinWheel);

  document.querySelectorAll("#infoModal .close-btn").forEach((btn) => {
    btn.addEventListener("click", closeInfoModal);
  });

  document
    .querySelector("#infoModal .modal-btn")
    ?.addEventListener("click", closeInfoModal);

  document
    .querySelector("#errorModal .modal-err-ok")
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

  const validPaths = ["/", "/index.html"];
  const currentPath = window.location.pathname;

  if (!validPaths.includes(currentPath)) {
    await loadGameState();
    if (prizeOpened) {
      showPrizeModal();
    }
    showErrorModal();
    return;
  }

  await loadGameState();

  currentRotation = rotationForIndex(0);
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  if (prizeOpened) {
    showPrizeModal();
  }

  updateButtonState();
});

window.addEventListener("load", function () {
  const loader = document.getElementById("page-loader");
  setTimeout(() => {
    loader.classList.add("hidden");
  }, 500);
});
