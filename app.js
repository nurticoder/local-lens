const captureButton = document.querySelector("#captureButton");
const captureState = document.querySelector("#captureState");
const captureNote = document.querySelector("#captureNote");
const ocrOutput = document.querySelector("#ocrOutput");
const privacyToggle = document.querySelector("#privacyToggle");
const privacyDescription = document.querySelector("#privacyDescription");
const questionInput = document.querySelector("#questionInput");
const answerBox = document.querySelector("#answerBox");
const toast = document.querySelector("#toast");

let capturing = false;
let screenContext = "";

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

captureButton.addEventListener("click", () => {
  capturing = !capturing;
  captureButton.textContent = capturing ? "Pause capture" : "Start capture";
  captureState.textContent = capturing ? "Capturing" : "Paused";
  captureState.classList.toggle("neutral", !capturing);

  if (capturing) {
    screenContext = "Build a local-first assistant with explicit capture controls.";
    ocrOutput.innerHTML = `
      <p><strong>Build a local-first assistant with explicit capture controls.</strong></p>
      <p class="muted">OCR completed locally · 94% confidence · nothing saved</p>`;
    captureNote.textContent = "Analyzing the selected region locally. Pause capture any time.";
    showToast("Local capture started");
  } else {
    captureNote.textContent = "No screenshots are saved. OCR will run only while capture is enabled.";
    showToast("Capture paused");
  }
});

document.querySelector("#selectButton").addEventListener("click", () => {
  if (!window.localLens) {
    showToast("Run the Electron desktop app to select a screen source");
    return;
  }
  window.localLens.getCaptureSources()
    .then((sources) => showToast(sources.length ? `Found ${sources.length} available screen sources` : "No screen sources available"))
    .catch((error) => showToast(error.message));
});

privacyToggle.addEventListener("change", () => {
  const enabled = privacyToggle.checked;
  privacyDescription.textContent = enabled
    ? "The panel is minimized to a compact privacy indicator."
    : "The assistant panel stays visible and capture is paused.";
  showToast(enabled ? "Private display mode enabled" : "Visible display mode enabled");
});

document.querySelector("#askButton").addEventListener("click", () => {
  const question = questionInput.value.trim();
  if (!question) {
    questionInput.focus();
    showToast("Enter a question first");
    return;
  }
  if (!window.localLens) {
    answerBox.innerHTML = `<span class="answer-icon" aria-hidden="true">✦</span><p><strong>Prototype answer:</strong> The screen describes a local-first assistant with explicit controls and no default screenshot storage.</p>`;
    return;
  }
  answerBox.innerHTML = `<span class="answer-icon" aria-hidden="true">…</span><p>Asking DeepSeek…</p>`;
  window.localLens.askDeepSeek({ question, context: screenContext })
    .then((answer) => {
      answerBox.innerHTML = `<span class="answer-icon" aria-hidden="true">✦</span><p><strong>DeepSeek:</strong> ${escapeHtml(answer)}</p>`;
    })
    .catch((error) => {
      answerBox.innerHTML = `<span class="answer-icon" aria-hidden="true">!</span><p>${escapeHtml(error.message)}</p>`;
    });
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.querySelector("#askButton").click();
});

document.querySelector("#settingsButton").addEventListener("click", () => {
  showToast("Settings will include model, OCR, storage, and permission controls");
});

document.querySelector("#dataButton").addEventListener("click", () => {
  showToast("Data controls: local-only processing · screenshots off · clear history");
});
