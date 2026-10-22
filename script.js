const enterButton = document.getElementById("enterButton");
const entrance = document.getElementById("gardenEntrance");
const soundscape = document.getElementById("soundscape");
const instruction = document.getElementById("gardenInstruction");
const audioStatus = document.getElementById("audioStatus");
const gardenImage = document.querySelector(".garden-image");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

let hasEntered = false;

function revealGarden() {
  if (hasEntered) return;

  hasEntered = true;

  entrance.classList.add("is-hidden");
  entrance.setAttribute("aria-hidden", "true");
  entrance.inert = true;

  instruction.textContent = "Take your time. Listen to the garden.";

  if (!reducedMotion) {
    gardenImage.animate(
      [
        { transform: "scale(1.03)", opacity: 0.7 },
        { transform: "scale(1)", opacity: 1 }
      ],
      {
        duration: 1600,
        easing: "ease-out"
      }
    );
  }
}

enterButton.addEventListener("click", async () => {
  revealGarden();

  try {
    await soundscape.play();
  } catch (error) {
    audioStatus.textContent =
      "Unable to start the soundscape. Please try the audio player below.";
  }
});

soundscape.addEventListener("play", () => {
  revealGarden();
  audioStatus.textContent = "Now listening to the garden soundscape.";
});

soundscape.addEventListener("pause", () => {
  if (!soundscape.ended) {
    audioStatus.textContent = "Soundscape paused.";
  }
});

soundscape.addEventListener("ended", () => {
  audioStatus.textContent =
    "The soundscape has ended. Select play to listen again.";
});

soundscape.addEventListener("error", () => {
  audioStatus.textContent =
    "The audio could not be loaded. Please check the audio file location.";
});
const detailLayer = document.getElementById("hotspotLayer");
const detailScene = document.getElementById("gardenScene");

const gardenDetails = [
  {
    label: "Water",
    source: "audio/garden-water.ogg",
    x: 0,
    y: 0.31,
    width: 0.11,
    height: 0.15,
    shape: "polygon(0% 40%, 30% 20%, 76% 38%, 100% 62%, 100% 97%, 0% 97%)"
  },
  {
    label: "Birdsong",
    source: "audio/garden-birds.ogg",
    x: 0.225,
    y: 0.58,
    width: 0.135,
    height: 0.255,
    shape: "polygon(35% 0%, 70% 5%, 95% 28%, 85% 58%, 100% 72%, 80% 85%, 55% 100%, 20% 92%, 5% 60%, 0% 25%)"
  },
  {
    label: "Guqin",
    source: "audio/guqin-liu-shui.ogg",
    x: 0.118,
    y: 0.203,
    width: 0.056,
    height: 0.085,
    shape: "polygon(50% 0%, 100% 38%, 94% 84%, 50% 100%, 5% 82%, 0% 38%)"
  }
];

const detailAudio = new Audio();
detailAudio.preload = "metadata";

let activeDetailButton = null;
let detailTimer = null;
let detailRequest = 0;
let savedSoundscapeVolume = 1;
let duckedVolume = null;

const stopDetailButton = document.createElement("button");
stopDetailButton.type = "button";
stopDetailButton.className = "detail-stop";
stopDetailButton.textContent = "Stop detail sound";
stopDetailButton.hidden = true;
audioStatus.after(stopDetailButton);

function stopGardenDetail() {
  detailRequest += 1;
  detailAudio.pause();
  clearTimeout(detailTimer);
  detailTimer = null;

  if (activeDetailButton) {
    activeDetailButton.classList.remove("is-active");
    activeDetailButton.setAttribute("aria-pressed", "false");
  }

  activeDetailButton = null;
  stopDetailButton.hidden = true;

  if (
    duckedVolume !== null &&
    Math.abs(soundscape.volume - duckedVolume) < 0.001
  ) {
    soundscape.volume = savedSoundscapeVolume;
  }

  duckedVolume = null;

  if (hasEntered) {
    instruction.textContent = "Select a garden detail to listen.";
  }
}

function playGardenDetail(detail, button) {
  const wasActive = activeDetailButton === button;
  stopGardenDetail();

  if (wasActive) return;

  const request = detailRequest;

  savedSoundscapeVolume = soundscape.volume;
  detailAudio.src = detail.source;
  detailAudio.volume = savedSoundscapeVolume * 0.75;
  detailAudio.muted = soundscape.muted;

  if (!soundscape.paused) {
    duckedVolume = savedSoundscapeVolume * 0.3;
    soundscape.volume = duckedVolume;
  }

  activeDetailButton = button;
  button.classList.add("is-active");
  button.setAttribute("aria-pressed", "true");

  stopDetailButton.hidden = false;
  instruction.textContent = `Listening to ${detail.label.toLowerCase()}.`;

  detailAudio.play().then(() => {
    if (request !== detailRequest) return;

    detailTimer = setTimeout(stopGardenDetail, 7000);
  }).catch(() => {
    if (request !== detailRequest) return;

    stopGardenDetail();
    audioStatus.textContent =
      "This detail sound could not be loaded. Please check its audio file.";
  });
}

const detailElements = gardenDetails.map((detail) => {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "detail-hotspot";
  button.setAttribute("aria-label", `Listen to ${detail.label.toLowerCase()}`);
  button.setAttribute("aria-pressed", "false");

  button.style.left = `${detail.x * 100}%`;
  button.style.top = `${detail.y * 100}%`;
  button.style.width = `${detail.width * 100}%`;
  button.style.height = `${detail.height * 100}%`;
  button.style.setProperty("--shape", detail.shape);

  const imagePatch = document.createElement("span");
  imagePatch.className = "detail-image";
  imagePatch.setAttribute("aria-hidden", "true");

  const mark = document.createElement("span");
  mark.className = "hotspot-mark";
  mark.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "hotspot-label";
  label.textContent = detail.label;

  button.append(imagePatch, mark, label);
  detailLayer.append(button);

  button.addEventListener("click", () => {
    playGardenDetail(detail, button);
  });

  return { detail, imagePatch };
});

function alignGardenDetails() {
  const width = detailScene.clientWidth;
  const height = detailScene.clientHeight;

  detailElements.forEach(({ detail, imagePatch }) => {
    imagePatch.style.backgroundSize = `${width}px ${height}px`;

    imagePatch.style.backgroundPosition =
      `${-detail.x * width}px ${-detail.y * height}px`;
  });
}

new ResizeObserver(alignGardenDetails).observe(detailScene);
gardenImage.addEventListener("load", alignGardenDetails);
alignGardenDetails();

detailLayer.inert = !hasEntered;

enterButton.addEventListener("click", () => {
  detailLayer.inert = false;
});

soundscape.addEventListener("play", () => {
  detailLayer.inert = false;
});

soundscape.addEventListener("pause", stopGardenDetail);
soundscape.addEventListener("ended", stopGardenDetail);
detailAudio.addEventListener("ended", stopGardenDetail);

soundscape.addEventListener("volumechange", () => {
  detailAudio.muted = soundscape.muted;

  if (
    activeDetailButton &&
    (duckedVolume === null ||
      Math.abs(soundscape.volume - duckedVolume) > 0.001)
  ) {
    detailAudio.volume = soundscape.volume * 0.75;
  }
});

stopDetailButton.addEventListener("click", stopGardenDetail);

const gardenViewport = document.getElementById("gardenViewport");
const gardenSection = gardenViewport.closest(".garden");

const gardenTools = document.createElement("div");
gardenTools.className = "garden-tools";
gardenTools.setAttribute("role", "group");
gardenTools.setAttribute("aria-label", "Painting view controls");

gardenTools.innerHTML = `
  <button type="button" id="gardenZoomOut">Zoom out</button>
  <output id="gardenZoomLevel" aria-live="polite">100%</output>
  <button type="button" id="gardenZoomIn">Zoom in</button>
  <button type="button" id="gardenReset">Reset view</button>
`;

gardenSection.append(gardenTools);

const zoomInButton = document.getElementById("gardenZoomIn");
const zoomOutButton = document.getElementById("gardenZoomOut");
const resetViewButton = document.getElementById("gardenReset");
const zoomLevel = document.getElementById("gardenZoomLevel");

let viewScale = 1;
let viewX = 0;
let viewY = 0;
let dragStart = null;
let viewControlsEnabled = false;

gardenViewport.tabIndex = 0;
gardenViewport.setAttribute("role", "region");
gardenViewport.setAttribute(
  "aria-label",
  "Garden painting. Zoom in, then drag or use arrow keys to explore."
);

function updateGardenView() {
  const minimumX = Math.min(
    0,
    gardenViewport.clientWidth - detailScene.offsetWidth * viewScale
  );

  const minimumY = Math.min(
    0,
    gardenViewport.clientHeight - detailScene.offsetHeight * viewScale
  );

  viewX = Math.max(minimumX, Math.min(0, viewX));
  viewY = Math.max(minimumY, Math.min(0, viewY));

  detailScene.style.transform =
    `translate(${viewX}px, ${viewY}px) scale(${viewScale})`;

  gardenViewport.classList.toggle("is-zoomed", viewScale > 1);

  zoomLevel.value = `${Math.round(viewScale * 100)}%`;
  zoomOutButton.disabled = viewScale <= 1;
  zoomInButton.disabled = viewScale >= 2.5;
}

function changeGardenZoom(nextScale) {
  const newScale = Math.max(1, Math.min(2.5, nextScale));

  const centerX = gardenViewport.clientWidth / 2;
  const centerY = gardenViewport.clientHeight / 2;

  const imageX = (centerX - viewX) / viewScale;
  const imageY = (centerY - viewY) / viewScale;

  viewX = centerX - imageX * newScale;
  viewY = centerY - imageY * newScale;
  viewScale = newScale;

  updateGardenView();
}

zoomInButton.addEventListener("click", () => {
  changeGardenZoom(viewScale + 0.25);
});

zoomOutButton.addEventListener("click", () => {
  changeGardenZoom(viewScale - 0.25);
});

resetViewButton.addEventListener("click", () => {
  viewScale = 1;
  viewX = 0;
  viewY = 0;

  updateGardenView();
});

gardenViewport.addEventListener("pointerdown", (event) => {
  if (viewScale <= 1) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (event.target.closest("button")) return;

  event.preventDefault();

  dragStart = {
    pointerId: event.pointerId,
    pointerX: event.clientX,
    pointerY: event.clientY,
    imageX: viewX,
    imageY: viewY
  };

  gardenViewport.setPointerCapture(event.pointerId);
  gardenViewport.classList.add("is-dragging");
});

gardenViewport.addEventListener("pointermove", (event) => {
  if (!dragStart || event.pointerId !== dragStart.pointerId) return;

  viewX = dragStart.imageX + event.clientX - dragStart.pointerX;
  viewY = dragStart.imageY + event.clientY - dragStart.pointerY;

  updateGardenView();
});

function finishGardenDrag(event) {
  if (!dragStart || event.pointerId !== dragStart.pointerId) return;

  if (gardenViewport.hasPointerCapture(event.pointerId)) {
    gardenViewport.releasePointerCapture(event.pointerId);
  }

  dragStart = null;
  gardenViewport.classList.remove("is-dragging");
}

gardenViewport.addEventListener("pointerup", finishGardenDrag);
gardenViewport.addEventListener("pointercancel", finishGardenDrag);

gardenViewport.addEventListener("keydown", (event) => {
  if (event.target !== gardenViewport || viewScale <= 1) return;

  const movements = {
    ArrowLeft: [40, 0],
    ArrowRight: [-40, 0],
    ArrowUp: [0, 40],
    ArrowDown: [0, -40]
  };

  const movement = movements[event.key];
  if (!movement) return;

  event.preventDefault();
  viewX += movement[0];
  viewY += movement[1];

  updateGardenView();
});

function enableGardenView() {
  if (viewControlsEnabled) return;

  viewControlsEnabled = true;
  gardenSection.classList.add("is-entered");

  instruction.textContent =
    "Select a labeled detail to listen. Zoom in, then drag to explore.";
}

enterButton.addEventListener("click", enableGardenView);
soundscape.addEventListener("play", enableGardenView);

new ResizeObserver(updateGardenView).observe(gardenViewport);
gardenImage.addEventListener("load", updateGardenView);

updateGardenView();
const stopAllSoundButton = document.createElement("button");

stopAllSoundButton.type = "button";
stopAllSoundButton.className = "detail-stop";
stopAllSoundButton.textContent = "Stop all sound";

soundscape.insertAdjacentElement("afterend", stopAllSoundButton);

stopAllSoundButton.addEventListener("click", () => {
  soundscape.pause();
  stopGardenDetail();

  if (soundscape.readyState > 0) {
    soundscape.currentTime = 0;
  }

  audioStatus.textContent =
    "All sound stopped. Select play to start the soundscape again.";
});