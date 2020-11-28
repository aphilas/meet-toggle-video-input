const sleep = delay => new Promise((resolve) => setTimeout(_ => resolve(), delay))

const sendMessage = details => new Promise((resolve, reject) => {
  chrome.runtime.sendMessage(details, response => { 
    if (chrome.runtime.lastError) {
      reject(chrome.runtime.lastError)
      return false
    }

    resolve(response)
  })
})

const toggleVideo = async () => {
  const optionsEl = document.querySelector(`[aria-label='More options']`)
  
  if (!optionsEl) return false
  optionsEl.ariaExpanded == 'false' ? optionsEl.click() : null
  optionsEl.style.pointerEvents = 'none' // disable on click

  await sleep(1500) // await dialog opening

  const settingsEl = document.querySelector(`[aria-label='Settings']`)
  const { top: offsetTop, right: offsetRight, bottom: offsetBottom, left: offsetLeft } = settingsEl.getBoundingClientRect()
  const coords = {
    x: offsetLeft + ((offsetRight - offsetLeft) / 2),
    y: offsetTop + ((offsetBottom - offsetTop) / 2),
  }

  const clickRes = await sendMessage({ command: 'click-settings', coords })
  // if (!clickRes || !clickRes.data) return false

  await sleep(500)
  const videoEl = document.querySelector(`[aria-label='Video']`)
  if (!videoEl) return false
  videoEl.click()

  await sleep(500)
  const resolutionEl = document.querySelector(`[aria-label='Select receive bitrate']`)
  if (!resolutionEl) return false
  resolutionEl.children[0].click()

  await sleep(500)
  const optionEls = Array.from(resolutionEl.children[1].children)

  const selected = optionEls.findIndex(option => option.ariaSelected == 'true')
  selected == optionEls.length - 1 ? optionEls[optionEls.length - 2].click() : optionEls[optionEls.length - 1].click()
  // [0 - auto], 1 - hd, 2 - sd, 3 - sd single, 4 - audio

  const closeEl = document.querySelector(`[aria-label='Close']`)
  closeEl.click()

  optionsEl.style.pointerEvents = 'auto' // disable on click
  
  return true
}

const onMessage = async (request, sender) => {
  if (request.command != 'toggle-video') return
  return await toggleVideo()
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // onMessage(request, sender)
  onMessage(request, sender).then(ret => sendResponse({ command: 'toggle-video', data: ret }))
  return true
})

/**
 * FIX:
 * find if video is enabled on start?
 * waitForEl
 *  
 */