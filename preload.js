const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("localLens", {
  getCaptureSources: () => ipcRenderer.invoke("capture-sources"),
  askDeepSeek: (payload) => ipcRenderer.invoke("ask-deepseek", payload)
});
