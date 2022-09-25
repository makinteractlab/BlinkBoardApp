var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');

var crypto = require('crypto');
const {
    Octokit
} = require("@octokit/rest");
var pjson = require('../../package.json');

// Open links to extetrnal browser
const shell = require('electron').shell;


const firebaseConfig = {
    apiKey: "YOUR KEY",
    authDomain: "YOURDOMAIN",
    databaseURL: "YOURDOMAIN",
    projectId: "blinkboard-c8374",
    storageBucket: "blinkboard-c8374.appspot.com",
    messagingSenderId: "587052739775",
    appId: "1:587052739775:web:881bc0fe047818679bea0a"
}


module.exports = {
    
    isDebugMode: function()
    {
      // access the debug tag in package.json
      return pjson.debug;  
    },

    log: function(msg, tag="")
    {
        if (this.isDebugMode()) console.log(`${tag}: ${msg}`)
    },

    // get latest app release
    getLatestAppReleaseInfo: async function() {
        const octokit = new Octokit()
        const result = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
            owner: 'makinteractlab',
            repo: 'BlinkBoardApp'
        });
        return result;
    },

    // get current app 
    getCurrentAppVersion: function() {
        // access the version tag in package.json
        return pjson.version;
    },

    versionToNumber: function (v){
        // following the format X.X.X
        return parseInt(v.split('.').join(""))
    },

    md5: function (string) {
        return crypto.createHash('md5').update(string).digest('hex');
    },

    getFirebase: function() {
        // init Firebase
        firebase.initializeApp(firebaseConfig);
        return firebase;
    },

    openLinksInBrowser: function()
    {
        $(document).on('click', 'a[href^="http"]', function (event) {
            event.preventDefault();
            shell.openExternal(this.href);
        });
    },

    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

};






