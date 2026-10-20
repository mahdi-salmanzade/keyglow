// Worker timers aren't throttled like a hidden tab's, so lighting keeps animating
// while keyglow sits behind a game. The main thread renders a frame per tick.
const INTERVAL_MS = 1000 / 60

setInterval(() => postMessage(performance.now()), INTERVAL_MS)
