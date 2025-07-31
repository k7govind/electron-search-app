const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  searchInFile: (filePath, searchString) =>
    ipcRenderer.invoke("search-in-file", { filePath, searchString }),
  searchInFolder: (folderPath, searchString) =>
    ipcRenderer.invoke("search-in-folder", { folderPath, searchString }),
  exportResults: (results) => ipcRenderer.invoke("export-results", results),
});
