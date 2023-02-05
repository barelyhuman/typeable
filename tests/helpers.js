export async function onReady(fn) {
  return new Promise(resolve => {
    setTimeout(() => {
      ;(async () => {
        try {
          await fn()
          resolve()
        } catch (err) {
          throw err
        }
      })()
    }, 1000)
  })
}
