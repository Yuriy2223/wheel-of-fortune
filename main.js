// /===================== блокування поки кеш не очистити ==========================/

const TOTAL_SEGMENTS = 6;
const SEGMENT_DEG = 360 / TOTAL_SEGMENTS;

let currentRotation = 0;
let spinsUsed = 0;
let isSpinning = false;
let prizeOpened = false; // Чи відкрив користувач приз

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
    // Використовуємо localStorage для звичайного сайту
    const savedSpins = localStorage.getItem("wheel_spins_used");
    spinsUsed = savedSpins ? parseInt(savedSpins) : 0;

    // Завантажуємо статус відкриття призу
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
    // Використовуємо localStorage для звичайного сайту
    localStorage.setItem("wheel_spins_used", spinsUsed.toString());
    // Зберігаємо статус відкриття призу
    localStorage.setItem("prize_opened", prizeOpened.toString());
  } catch (error) {
    console.error("Помилка збереження:", error);
    // КИДАЄМО помилку далі щоб її можна було обробити
    throw error;
  }
}

function updateButtonState() {
  const btn = document.querySelector(".spin-button");
  if (!btn) return;

  // Блокуємо кнопку якщо використано 2 спіни АБО приз вже відкрито
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
  // Блокуємо обертання якщо приз вже відкрито
  if (isSpinning || spinsUsed >= 2 || prizeOpened) return;

  // Перевірка інтернету ПЕРЕД обертанням
  if (!navigator.onLine) {
    showErrorModal();
    return;
  }

  const wheel = document.getElementById("wheelImage");
  const btn = document.querySelector(".spin-button");

  isSpinning = true;
  btn.disabled = true;
  btn.textContent = "Spinning...";
  spinsUsed++;

  const targetIndex = spinsUsed === 1 ? 2 : 0;
  const spins = spinsUsed === 1 ? 4 : 8;

  const finalRotation = spins * 360 + rotationForIndex(targetIndex);

  wheel.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation % 360;

  setTimeout(async () => {
    isSpinning = false;

    // Перевірка інтернету ПІСЛЯ обертання
    if (!navigator.onLine) {
      showErrorModal();
      spinsUsed--; // Повертаємо спін
      updateButtonState();
      return;
    }

    // Спроба зберегти стан - ловимо ВСІ помилки
    try {
      await saveGameState();
    } catch (error) {
      console.error("Помилка при збереженні:", error);
      // ПОКАЗУЄМО МОДАЛКУ при будь-якій помилці
      showErrorModal();
      spinsUsed--; // Повертаємо спін
      updateButtonState();
      return;
    }

    updateButtonState();

    // Показуємо модалку призу тільки для "500%" (другий спін)
    if (targetIndex === 0) {
      prizeOpened = true; // Позначаємо що приз відкрито
      await saveGameState(); // Зберігаємо цей статус
      showPrizeModal();
    }
  }, 7000);
}

function showPrizeModal() {
  const modal = document.getElementById("prizeModal");
  if (!modal) return;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  modal.style.zIndex = "100";

  // Відтворення звуку
  const audio = new Audio("/audio-prize.mp3");
  audio.volume = 1; // Гучність
  audio.play().catch((err) => console.log("Звук не відтворився:", err));
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

// Показуємо модалку при втраті інтернету
window.addEventListener("offline", () => {
  console.log("Інтернет втрачено");
  showErrorModal();
});

// Закриваємо модалку при відновленні інтернету
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

  // Якщо користувач вже відкрив приз раніше - показуємо модалку одразу
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

  // Кнопка "Ok" в infoModal
  document
    .querySelector("#infoModal .modal-btn")
    ?.addEventListener("click", closeInfoModal);

  // Кнопка "Ok" в errorModal
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

// const TOTAL_SEGMENTS = 6;
// const SEGMENT_DEG = 360 / TOTAL_SEGMENTS;

// let currentRotation = 0;
// let spinsUsed = 0;
// let isSpinning = false;

// function createLightBulbs() {
//   const container = document.querySelector(".inner-fortune");
//   if (!container) return;

//   const lightsContainer = document.createElement("div");
//   lightsContainer.className = "wheel-lights";

//   // Кількість лампочок
//   const numberOfBulbs = 20;

//   let radiusPercent;
//   const screenWidth = window.innerWidth;

//   if (screenWidth < 768) {
//     radiusPercent = 46;
//   } else if (screenWidth < 1280) {
//     radiusPercent = 44.8;
//   } else if (screenWidth < 1920) {
//     radiusPercent = 43.7;
//   } else {
//     radiusPercent = 43.7;
//   }

//   // Зсув початку
//   const startAngle = -90; // Градуси

//   // Створюємо лампочки по колу
//   for (let i = 0; i < numberOfBulbs; i++) {
//     const bulb = document.createElement("div");
//     bulb.className = "light-bulb";

//     const angle = startAngle + (360 / numberOfBulbs) * i;
//     const radian = (angle * Math.PI) / 180;
//     const x = 50 + radiusPercent * Math.cos(radian);
//     const y = 50 + radiusPercent * Math.sin(radian);

//     bulb.style.left = `${x}%`;
//     bulb.style.top = `${y}%`;

//     lightsContainer.appendChild(bulb);
//   }

//   container.appendChild(lightsContainer);
// }

// function rotationForIndex(index) {
//   return 360 - (index * SEGMENT_DEG + SEGMENT_DEG / 2) + 30; //  +30 = підкрутка для точної зупинки
// }

// async function loadGameState() {
//   try {
//     if (window.storage) {
//       const r = await window.storage.get("wheel_spins_used");
//       spinsUsed = r?.value ? parseInt(r.value) : 0;
//     } else {
//       spinsUsed = 0;
//       console.log("Storage недоступний, початкове значення:", spinsUsed);
//     }
//   } catch {
//     spinsUsed = 0;
//   }
// }

// async function saveGameState() {
//   try {
//     if (window.storage) {
//       await window.storage.set("wheel_spins_used", spinsUsed.toString());
//     } else {
//       console.log("Storage недоступний, дані в пам'яті:", spinsUsed);
//     }
//   } catch (error) {
//     console.error("Помилка збереження:", error);
//     throw error;
//   }
// }

// function updateButtonState() {
//   const btn = document.querySelector(".spin-button");
//   if (!btn) return;

//   if (spinsUsed >= 2) {
//     btn.disabled = true;
//     btn.textContent = "No spins";
//     btn.style.opacity = "0.5";
//   } else {
//     btn.disabled = false;
//     btn.textContent = "Spin";
//     btn.style.opacity = "1";
//   }
// }

// function createWheel() {
//   const wheelImg = document.createElement("img");
//   wheelImg.id = "wheelImage";
//   wheelImg.src = "/spinning-wheel.webp";
//   wheelImg.style.position = "absolute";
//   wheelImg.style.inset = "0";
//   wheelImg.style.width = "100%";
//   wheelImg.style.height = "100%";
//   wheelImg.style.transition = "transform 7s cubic-bezier(0.17,0.67,0.12,0.99)"; //  Час обертання
//   wheelImg.style.zIndex = "2";
//   wheelImg.style.objectFit = "contain";

//   document.querySelector(".roulette-wheel")?.appendChild(wheelImg);
//   return wheelImg;
// }

// async function spinWheel() {
//   if (isSpinning || spinsUsed >= 2) return;

//   if (!checkInternetConnection()) {
//     return;
//   }

//   const wheel = document.getElementById("wheelImage");
//   const btn = document.querySelector(".spin-button");

//   isSpinning = true;
//   btn.disabled = true;
//   btn.textContent = "Spinning...";
//   spinsUsed++;

//   const targetIndex = spinsUsed === 1 ? 2 : 0;
//   const spins = spinsUsed === 1 ? 4 : 8; //  Кількість повних обертів

//   const finalRotation = spins * 360 + rotationForIndex(targetIndex);

//   wheel.style.transform = `rotate(${finalRotation}deg)`;
//   currentRotation = finalRotation % 360;

//   setTimeout(async () => {
//     isSpinning = false;

//     try {
//       await saveGameState();
//     } catch (error) {
//       showErrorModal();
//       spinsUsed--;
//       updateButtonState();
//       return;
//     }

//     updateButtonState();

//     // Показуємо модалку тільки для "500%" (другий спін)
//     if (targetIndex === 0) {
//       showPrizeModal();
//     }
//   }, 7000); //  Час обертання (має співпадати з transition)
// }

// function showPrizeModal() {
//   const modal = document.getElementById("prizeModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   document.body.style.overflow = "hidden";
//   modal.style.zIndex = "100";

//   // // Відтворення звуку
//   // const audio = new Audio("/prize-sound.mp3");
//   // audio.volume = 0.5; // Гучність (0.0 - 1.0)
//   // audio.play().catch((err) => console.log("Звук не відтворився:", err));
// }

// function showInfoModal() {
//   const modal = document.getElementById("infoModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   modal.style.zIndex = "110";
// }

// function closeInfoModal() {
//   const modal = document.getElementById("infoModal");
//   if (!modal) return;

//   modal.classList.remove("active");
// }

// function showErrorModal() {
//   const modal = document.getElementById("errorModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   if (!document.getElementById("prizeModal")?.classList.contains("active")) {
//     document.body.style.overflow = "hidden";
//   }

//   modal.style.zIndex = "110";
// }

// function closeErrorModal() {
//   const modal = document.getElementById("errorModal");
//   if (!modal) return;

//   modal.classList.remove("active");
//   if (!document.getElementById("prizeModal")?.classList.contains("active")) {
//     document.body.style.overflow = "";
//   }
// }

// /*ПЕРЕВІРКА ІНТЕРНЕТ З'ЄДНАННЯ*/
// function checkInternetConnection() {
//   if (!navigator.onLine) {
//     showErrorModal();
//     return false;
//   }
//   return true;
// }

// window.addEventListener("offline", () => {
//   showErrorModal();
// });

// window.addEventListener("online", () => {
//   closeErrorModal();
// });

// document.addEventListener("DOMContentLoaded", async () => {
//   await loadGameState();

//   // Створюємо лампочки
//   createLightBulbs();
//   // Створюємо колесо
//   const wheel = createWheel();

//   currentRotation = rotationForIndex(0);
//   wheel.style.transform = `rotate(${currentRotation}deg)`;

//   document.querySelector(".spin-button")?.addEventListener("click", spinWheel);

//   document.querySelectorAll("#infoModal .close-btn").forEach((btn) => {
//     btn.addEventListener("click", closeInfoModal);
//   });

//   document.querySelectorAll("#errorModal .close-btn").forEach((btn) => {
//     btn.addEventListener("click", closeErrorModal);
//   });

//   document
//     .querySelector("#infoModal .claim-button")
//     ?.addEventListener("click", closeInfoModal);

//   document
//     .querySelector("#errorModal .ok-button")
//     ?.addEventListener("click", closeErrorModal);

//   document.querySelector(".wheel-info")?.addEventListener("click", (e) => {
//     e.preventDefault();
//     showInfoModal();
//   });

//   document.getElementById("infoModal")?.addEventListener("click", (e) => {
//     if (e.target.id === "infoModal") {
//       closeInfoModal();
//     }
//   });

//   document.getElementById("errorModal")?.addEventListener("click", (e) => {
//     if (e.target.id === "errorModal") {
//       closeErrorModal();
//     }
//   });

//   updateButtonState();
// });
// /=================================/

// const TOTAL_SEGMENTS = 6;
// const SEGMENT_DEG = 360 / TOTAL_SEGMENTS;

// let currentRotation = 0;
// let spinsUsed = 0;
// let isSpinning = false;

// function createLightBulbs() {
//   const container = document.querySelector(".inner-fortune");
//   if (!container) return;

//   const lightsContainer = document.createElement("div");
//   lightsContainer.className = "wheel-lights";

//   const numberOfBulbs = 20;

//   let radiusPercent;
//   const screenWidth = window.innerWidth;

//   if (screenWidth < 768) {
//     radiusPercent = 46;
//   } else if (screenWidth < 1280) {
//     radiusPercent = 44.8;
//   } else if (screenWidth < 1920) {
//     radiusPercent = 43.7;
//   } else {
//     radiusPercent = 43.7;
//   }

//   const startAngle = -90;

//   for (let i = 0; i < numberOfBulbs; i++) {
//     const bulb = document.createElement("div");
//     bulb.className = "light-bulb";

//     const angle = startAngle + (360 / numberOfBulbs) * i;
//     const radian = (angle * Math.PI) / 180;
//     const x = 50 + radiusPercent * Math.cos(radian);
//     const y = 50 + radiusPercent * Math.sin(radian);

//     bulb.style.left = `${x}%`;
//     bulb.style.top = `${y}%`;

//     lightsContainer.appendChild(bulb);
//   }

//   container.appendChild(lightsContainer);
// }

// function recreateLightBulbs() {
//   const oldLights = document.querySelector(".wheel-lights");
//   if (oldLights) {
//     oldLights.remove();
//   }
//   createLightBulbs();
// }

// function rotationForIndex(index) {
//   return 360 - (index * SEGMENT_DEG + SEGMENT_DEG / 2) + 30;
// }

// async function loadGameState() {
//   try {
//     if (window.storage) {
//       const r = await window.storage.get("wheel_spins_used");
//       spinsUsed = r?.value ? parseInt(r.value) : 0;
//     } else {
//       spinsUsed = 0;
//     }
//   } catch (error) {
//     console.error("Помилка завантаження:", error);
//     spinsUsed = 0;
//   }
// }

// async function saveGameState() {
//   try {
//     if (window.storage) {
//       await window.storage.set("wheel_spins_used", spinsUsed.toString());
//     } else {
//       console.log("Storage недоступний, дані в пам'яті:", spinsUsed);
//     }
//   } catch (error) {
//     console.error("Помилка збереження:", error);
//     // КИДАЄМО помилку далі щоб її можна було обробити
//     throw error;
//   }
// }

// function updateButtonState() {
//   const btn = document.querySelector(".spin-button");
//   if (!btn) return;

//   if (spinsUsed >= 2) {
//     btn.disabled = true;
//     btn.textContent = "No spins";
//     btn.style.opacity = "0.5";
//   } else {
//     btn.disabled = false;
//     btn.textContent = "Spin";
//     btn.style.opacity = "1";
//   }
// }

// function createWheel() {
//   const wheelImg = document.createElement("img");
//   wheelImg.id = "wheelImage";
//   wheelImg.src = "/spinning-wheel.webp";
//   wheelImg.style.position = "absolute";
//   wheelImg.style.inset = "0";
//   wheelImg.style.width = "100%";
//   wheelImg.style.height = "100%";
//   wheelImg.style.transition = "transform 7s cubic-bezier(0.17,0.67,0.12,0.99)";
//   wheelImg.style.zIndex = "2";
//   wheelImg.style.objectFit = "contain";

//   document.querySelector(".roulette-wheel")?.appendChild(wheelImg);
//   return wheelImg;
// }

// async function spinWheel() {
//   if (isSpinning || spinsUsed >= 2) return;

//   // Перевірка інтернету ПЕРЕД обертанням
//   if (!navigator.onLine) {
//     showErrorModal();
//     return;
//   }

//   const wheel = document.getElementById("wheelImage");
//   const btn = document.querySelector(".spin-button");

//   isSpinning = true;
//   btn.disabled = true;
//   btn.textContent = "Spinning...";
//   spinsUsed++;

//   const targetIndex = spinsUsed === 1 ? 2 : 0;
//   const spins = spinsUsed === 1 ? 4 : 8;

//   const finalRotation = spins * 360 + rotationForIndex(targetIndex);

//   wheel.style.transform = `rotate(${finalRotation}deg)`;
//   currentRotation = finalRotation % 360;

//   setTimeout(async () => {
//     isSpinning = false;

//     // Перевірка інтернету ПІСЛЯ обертання
//     if (!navigator.onLine) {
//       showErrorModal();
//       spinsUsed--; // Повертаємо спін
//       updateButtonState();
//       return;
//     }

//     // Спроба зберегти стан - ловимо ВСІ помилки
//     try {
//       await saveGameState();
//     } catch (error) {
//       console.error("Помилка при збереженні:", error);
//       // ПОКАЗУЄМО МОДАЛКУ при будь-якій помилці
//       showErrorModal();
//       spinsUsed--; // Повертаємо спін
//       updateButtonState();
//       return;
//     }

//     updateButtonState();

//     // Показуємо модалку призу тільки для "500%" (другий спін)
//     if (targetIndex === 0) {
//       showPrizeModal();
//     }
//   }, 7000);
// }

// function showPrizeModal() {
//   const modal = document.getElementById("prizeModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   document.body.style.overflow = "hidden";
//   modal.style.zIndex = "100";
// }

// function showInfoModal() {
//   const modal = document.getElementById("infoModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   modal.style.zIndex = "110";
// }

// function closeInfoModal() {
//   const modal = document.getElementById("infoModal");
//   if (!modal) return;

//   modal.classList.remove("active");
// }

// function showErrorModal() {
//   const modal = document.getElementById("errorModal");
//   if (!modal) return;

//   modal.classList.add("active");
//   if (!document.getElementById("prizeModal")?.classList.contains("active")) {
//     document.body.style.overflow = "hidden";
//   }
//   modal.style.zIndex = "110";
// }

// function closeErrorModal() {
//   const modal = document.getElementById("errorModal");
//   if (!modal) return;

//   modal.classList.remove("active");
//   if (!document.getElementById("prizeModal")?.classList.contains("active")) {
//     document.body.style.overflow = "";
//   }
// }

// // Показуємо модалку при втраті інтернету
// window.addEventListener("offline", () => {
//   console.log("Інтернет втрачено");
//   showErrorModal();
// });

// // Закриваємо модалку при відновленні інтернету
// window.addEventListener("online", () => {
//   console.log("Інтернет відновлено");
//   closeErrorModal();
// });

// let resizeTimeout;
// window.addEventListener("resize", () => {
//   clearTimeout(resizeTimeout);
//   resizeTimeout = setTimeout(() => {
//     recreateLightBulbs();
//   }, 250);
// });

// document.addEventListener("DOMContentLoaded", async () => {
//   await loadGameState();

//   createLightBulbs();
//   const wheel = createWheel();

//   currentRotation = rotationForIndex(0);
//   wheel.style.transform = `rotate(${currentRotation}deg)`;

//   document.querySelector(".spin-button")?.addEventListener("click", spinWheel);

//   document.querySelectorAll("#infoModal .close-btn").forEach((btn) => {
//     btn.addEventListener("click", closeInfoModal);
//   });

//   document.querySelectorAll("#errorModal .close-btn").forEach((btn) => {
//     btn.addEventListener("click", closeErrorModal);
//   });

//   document
//     .querySelector("#infoModal .claim-button")
//     ?.addEventListener("click", closeInfoModal);

//   document
//     .querySelector("#errorModal .ok-button")
//     ?.addEventListener("click", closeErrorModal);

//   document.querySelector(".wheel-info")?.addEventListener("click", (e) => {
//     e.preventDefault();
//     showInfoModal();
//   });

//   document.getElementById("infoModal")?.addEventListener("click", (e) => {
//     if (e.target.id === "infoModal") {
//       closeInfoModal();
//     }
//   });

//   document.getElementById("errorModal")?.addEventListener("click", (e) => {
//     if (e.target.id === "errorModal") {
//       closeErrorModal();
//     }
//   });

//   updateButtonState();
// });
