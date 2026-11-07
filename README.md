# sha256-video

Renders a video of [sha256algorithm.com](https://sha256algorithm.com/) hashing a message, step by step, without screen recording.

## Requirements

- [Node.js](https://nodejs.org/)
- [ffmpeg](https://ffmpeg.org/) on your PATH

## Setup

```sh
npm install
npx playwright install chromium
```

## Usage

```sh
node render.js "your message" [secondsPerStep] [output.mp4]
```

| Argument | Default | Description |
|---|---|---|
| message | `hello world` | Text to hash |
| secondsPerStep | `0.25` | How long each step is shown |
| output | `sha256.mp4` | Output video file |

Example:

```sh
node render.js "abc" 0.2 abc.mp4
```

## Credits

The SHA-256 visualization is [sha256algorithm.com](https://sha256algorithm.com/) ([source](https://github.com/dmarman/sha256algorithm)). This project only automates viewing it.
