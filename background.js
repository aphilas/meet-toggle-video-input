const VERSION = '1.0'
const attachedTabs = {}

const toggleIcon = tab => {
  chrome.browserAction.getTitle(tab, result => {
    if (result == 'Disable video') {
      chrome.browserAction.setIcon({ ...tab, path: 'icons/no-video.png' })
      chrome.browserAction.setTitle({ ...tab, title: 'Enable video' })
    } else {
      chrome.browserAction.setIcon({ ...tab, path: 'icons/video.png' })
      chrome.browserAction.setTitle({ ...tab, title: 'Disable video' })
    }
  })  
}

const onDisabled = tab => {
  chrome.debugger.detach(tab, onDetach.bind(null, tab))
}

const onClickResponse = tab => {
  attachedTabs[tab.tabId]?.clickSendResponse?.({ data: true })
  chrome.debugger.sendCommand(tab, 'Debugger.disable', {}, onDisabled.bind(null, tab))
}

const onEnabled = tab => {
  console.info(`${tab.tabId} enabled`)
}

const onAttach = tab => {
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError)
    return false
  }

  console.info(`${tab.tabId} attached`)
  attachedTabs[tab.tabId] = {}
  chrome.debugger.sendCommand(tab, 'Debugger.enable', {}, onEnabled.bind(null, tab))
}

const onDetach = tab => {
  delete attachedTabs[tab.tabId]
  toggleIcon(tab)
}

const onEvent = (tab, method) => { }

const dispatchClick = (tab, { x, y }) => {
  // simulate click

  const options = { x, y, button: 'left', clickCount: 1 }
  options.type = 'mousePressed'
  chrome.debugger.sendCommand({ ...tab }, 'Input.dispatchMouseEvent', options)

  options.type = 'mouseReleased'
  chrome.debugger.sendCommand({ ...tab }, 'Input.dispatchMouseEvent', options, onClickResponse.bind(null, tab))
}

const onActionClick = tab => {
  const tabSig = { tabId: tab.id }
  if (!tab.url.includes('meet.google.com')) return
  if (!attachedTabs[tabSig.tabId]) chrome.debugger.attach({ ...tabSig }, VERSION, onAttach.bind(null, { ...tabSig }))
  chrome.tabs.sendMessage(tabSig.tabId, { command: 'toggle-video' })
}

const onMessage = (request, sender, sendResponse) => {
  if (request.command != 'click-settings') return
  dispatchClick({ tabId: sender.tab.id }, request.coords)
  if (attachedTabs[sender.tab.id]) attachedTabs[sender.tab.id].clickSendResponse = sendResponse

  return true
}

chrome.debugger.onEvent.addListener(onEvent)
chrome.debugger.onDetach.addListener(onDetach)
chrome.browserAction.onClicked.addListener(onActionClick)
chrome.runtime.onMessage.addListener(onMessage)
