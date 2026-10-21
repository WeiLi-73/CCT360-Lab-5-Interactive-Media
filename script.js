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