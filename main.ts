import { YtDlp } from "ytdlp-nodejs";
import fs from "fs";
import path from "path";
import { createInterface } from "readline";
import * as cliProgress from "cli-progress";

const ytdlp = new YtDlp({
    binaryPath: path.join(__dirname, "yt-dlp.exe"),
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
    prompt: "> ",
})

let directory = './downloads'

function changeDirectory() {
    rl.removeAllListeners("line");
    rl.setPrompt("Directory> ");
    rl.prompt();
    rl.on("line", (path) => {
        if (!fs.existsSync(path)) {
            console.log("Directory does not exist.");
            main();
            return;
        }
        directory = path;
        console.log(`Changed directory to ${path}`);
        main();
        return;
    })
}

async function downloadAudio(urls: string[]) {
    rl.removeAllListeners("line");
    if (urls.length === 0) {
        console.log("Plase enter any URL to download.");
        main();
        return;
    }
    await Promise.all(urls.map(async (url, index) => {
        try {
            if (url.trim() === "") {
                console.log("URL is empty. Skipping...");
                return;
            } else if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
                console.log("URL is not a youtube URL. Skipping...");
                return;
            }
            const info = await ytdlp.getInfoAsync(url);
            const title = info.title.replaceAll(/[^0-9a-zA-Z가-힣\s\-]/g, "").trim();
            const filename = `${directory}/${index + 1}. ${title}.mp3`;
            const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            progressBar.start(100, 0);
            const stream = ytdlp.stream(url, {
                onProgress: (progress) => {
                    progressBar.update(parseInt(progress.percentage.toFixed(2)));
                },
                extractAudio: true,
                audioFormat: "mp3",
                audioQuality: 'highest',
            });
            await stream.pipeAsync(fs.createWriteStream(filename));
        } catch (error) {
            console.error(`Error while downloading ${error}`);
        }
    }));
    console.log("\nDownload complete.");
    main();
    return;
}

function getUrls() {
    rl.removeAllListeners("line");
    let urls: string[] = [];
    console.log("Enter the URLs to download. Type 'done' when finished. Type 'exit' to go back to the main menu.");
    rl.setPrompt("URL> ");
    rl.prompt();
    rl.on("line", async (url) => {
        if (url.trim() === 'done') {
            downloadAudio(urls);
        } else if (url.trim() === "exit") {
            main();
            return;
        } else {
            urls.push(url.trim());
            rl.prompt();
        }
    })
}

function printHelp() {
    rl.removeAllListeners("line");
    console.log(`
    Commands:
    download - Download audio from a URL
    changedir - Change the download directory
    exit - Exit the program
    `);
    main();
}

function main() {
    rl.removeAllListeners("line");
    rl.setPrompt("> ");
    rl.prompt();
    rl.on("line", async (line) => {
        switch(line.trim()) {
            case "exit":
                process.exit(0);
            case "download":
                getUrls();
                break;
            case "changedir":
                changeDirectory();
                break;
            case "help":
                printHelp()
                break;
            default:
                console.log("Unknown command. Type 'help' for a list of commands.");
                main();
                break;
        }
    });
}

console.log("Youtube Audio Mp3 Downloader");
console.log('Write "help" for commands');
main();
