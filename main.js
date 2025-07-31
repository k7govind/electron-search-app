const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

// Select single file
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Select folder
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Search in file
ipcMain.handle("search-in-file", async (event, { filePath, searchString }) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content.includes(searchString)
      ? `Text found in file: ${path.basename(filePath)}`
      : `Text NOT found in file: ${path.basename(filePath)}`;
  } catch (err) {
    return `Error: ${err.message}`;
  }
});

// Search in folder
ipcMain.handle(
  "search-in-folder",
  async (event, { folderPath, searchString }) => {
    try {
      const matchedFiles = [];

      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && path.extname(filePath).toLowerCase() === ".txt") {
          const content = fs.readFileSync(filePath, "utf-8");
          if (content.includes(searchString)) {
            matchedFiles.push(file);
          }
        }
      }

      return matchedFiles.length > 0 ? matchedFiles : ["No matches found"];
    } catch (err) {
      return [`Error: ${err.message}`];
    }
  }
);
