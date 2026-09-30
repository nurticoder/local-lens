const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require("electron");
const path = require("node:path");

let mainWindow;

function createWindow() {
  const display = screen.getPrimaryDisplay();
  const width = 410;
  const height = 660;
  mainWindow = new BrowserWindow({
    width,
    height,
    x: display.workArea.x + display.workArea.width - width - 24,
    y: display.workArea.y + 24,
    minWidth: 360,
    minHeight: 520,
    alwaysOnTop: true,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0d1117",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js")
    }
  });
  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));
}

ipcMain.handle("capture-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 1280, height: 720 }
  });
  return sources.map(({ id, name, thumbnail }) => ({
    id,
    name,
    thumbnail: thumbnail.toDataURL()
  }));
});

ipcMain.handle("ask-deepseek", async (_event, { question, context }) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured. Add it to the environment before asking questions.");
  }
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a concise desktop assistant. Use only the supplied screen context. Say when the context is insufficient. Do not claim to have seen anything outside the provided text."
        },
        { role: "user", content: `Screen context:\n${context || "(none)"}\n\nQuestion:\n${question}` }
      ]
    })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek request failed (${response.status}): ${body.slice(0, 240)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "DeepSeek returned no answer.";
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
