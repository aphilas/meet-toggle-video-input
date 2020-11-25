const sleep = delay => new Promise((resolve) => setTimeout(_ => resolve(), delay))

const sendMessage = details => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(details, response => { 
    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError)
      // console.error()
      return false
    }

    resolve(response) 
  })
})

const toggleVideo = async () => {
  const optionsEl = document.querySelector(`[aria-label='More options']`)
  
  if (!optionsEl) return false
  optionsEl.ariaExpanded == 'false' ? optionsEl.click() : null

  await sleep(200) // await dialog opening

  const settingsEl = document.querySelector(`[aria-label='Settings']`)
  const { top: offsetTop, right: offsetRight, bottom: offsetBottom, left: offsetLeft } = settingsEl.getBoundingClientRect()
  const coords = {
    x: offsetLeft + ((offsetRight - offsetLeft) / 2),
    y: offsetTop + ((offsetBottom - offsetTop) / 2),
  }

  const clickRes = await sendMessage({ command: 'click-settings', coords })
  if (!clickRes || !clickRes.data) return false

  const videoEl = document.querySelector(`[aria-label='Video']`)
  if (!videoEl) return false
  videoEl.click()

  const resolutionEl = document.querySelector(`[aria-label='Select receive bitrate']`)
  if (!resolutionEl) return false
  resolutionEl.children[0].click()

  const selected = resolutionEl.children[1].children.findIndex(option => option.ariaSelected == 'true')
  // 0 - auto, 1 - hd, 2 - sd, 3 - sd single, 4 - audio
  selected == 4 ? resolutionEl.children[1].children[3].click() : resolutionEl.children[1].children[4].click()

  const closeEl = document.querySelector(`[aria-label='Close']`)
  closeEl.click()

  return true
}

const onMessage = async (request, sender) => {
  if (request != 'toggle-video') return
  return await toggleVideo()
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  onMessage(request, sender).then(response => sendResponse(response))
  return true
})

/**
 * FIX:
 * find if video is enabled on start?
 * waitForEl
 *  
 */