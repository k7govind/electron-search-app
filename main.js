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

//Search in folder
ipcMain.handle(
  "search-in-folder",
  async (event, folderPath, searchText, searchMode = "plain") => {
    try {
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".txt"));
      const results = [];
      const isRegex = searchMode === "regex";
      const isCaseInsensitive = searchMode === "case-insensitive";
      let regex;
      if (isRegex) {
        regex = new RegExp(searchText);
      } else if (isCaseInsensitive) {
        regex = new RegExp(
          searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i"
        ); // Escape + i
      }
      for (let file of files) {
        const filePath = path.join(folderPath, file);
        const lines = fs.readFileSync(filePath, "utf-8").split("\n");
        const matches = [];
        lines.forEach((line, idx) => {
          if (isRegex || isCaseInsensitive) {
            if (regex.test(line)) {
              matches.push({ number: idx + 1, line });
            }
          } else {
            if (line.includes(searchText)) {
              matches.push({ number: idx + 1, line });
            }
          }
        });

        if (matches.length > 0) {
          results.push({ file, matches });
        }
      }

      return results.length > 0 ? results : ["No matches found."];
    } catch (err) {
      return ["Error searching in folder: " + err.message];
    }
  }
);


ipcMain.handle("export-results", async (event, results) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Search Results",
      defaultPath: "search-results.txt",
      filters: [{ name: "Text Files", extensions: ["txt"] }],
    });

    if (canceled || !filePath) return "Export cancelled";

    let content = "";
    results.forEach((file) => {
      content += `File: ${file.file}\n`;
      file.matches.forEach((m) => {
        content += `  Line ${m.number}: ${m.line}\n`;
      });
      content += "\n";
    });

    fs.writeFileSync(filePath, content, "utf-8");
    return "Results exported successfully to: " + filePath;
  } catch (err) {
    return "Error exporting results: " + err.message;
  }
});