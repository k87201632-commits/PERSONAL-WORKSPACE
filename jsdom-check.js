const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();

virtualConsole.on("error", (err) => {
    console.log("DOM Error:", err);
});
virtualConsole.on("jsdomError", (err) => {
    console.log("JSDOM Error:", err);
});
virtualConsole.on("log", (message) => {
    console.log("Console Log:", message);
});

const dom = new JSDOM(html, {
    url: "file:///" + __dirname.replace(/\\/g, '/') + "/index.html",
    runScripts: "dangerously",
    resources: "usable",
    virtualConsole
});

dom.window.addEventListener('load', () => {
    console.log("Window loaded successfully.");
    setTimeout(() => {
        console.log("Closing DOM.");
        process.exit(0);
    }, 2000);
});
