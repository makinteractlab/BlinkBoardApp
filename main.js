const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const Util = require('./assets/js/util');



// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Debug flag
const DEBUG = Util.isDebugMode()


function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        minWidth: 1000,
        minHeight: 700,
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
            devTools: DEBUG
        },
        // frame: false,
        resizable: false,
        icon: path.join(__dirname, 'assets/icons/icon')
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // No menu
    mainWindow.setMenuBarVisibility(false)

    // Open the DevTools.
    DEBUG && mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    app.quit()
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// Debug 
// Enable live reload for Electron
DEBUG && require('electron-reload')(__dirname, {
    // Note that the path to electron may vary according to the main file
    electron: require(`${__dirname}/node_modules/electron`)
});


