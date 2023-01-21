const q = []
let queueRunning = false

export function addToQueue(fn) {
  q.push(fn)
  processQueue()
}

async function processQueue() {
  if (queueRunning) {
    setTimeout(() => {
      processQueue()
    }, 100)
    return
  }
  queueRunning = true
  await q.reduce((acc, item) => {
    return acc.then(_ => item())
  }, Promise.resolve())
  queueRunning = false
}
