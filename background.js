// background.js
// Service worker (manifest v3) - context menus, commands, and open-popup-with-value flow.

'use strict';

// Create context menus when installed
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: "check-selected-text",
      title: "Check selected text (CyberGuard)",
      contexts: ["selection"]
    });
  } catch (e) {}

  try {
    chrome.contextMenus.create({
      id: "check-editable",
      title: "Check input value (CyberGuard)",
      contexts: ["editable"]
    });
  } catch (e) {}
});

/**
 * Store a temporary password/text and open popup.html.
 * Uses chrome.storage.local.set (callback style).
 * @param {string} value
 */
function openPopupWithValue(value) {
  const key = { cyberguard_temp_pw: value || '' };

  try {
    chrome.storage.local.set(key, () => {
      const url = chrome.runtime.getURL('popup.html');
      chrome.tabs.create({ url }, () => {});
    });
  } catch (e) {
    const url = chrome.runtime.getURL('popup.html');
    try {
      chrome.tabs.create({ url });
    } catch (_) {}
  }
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info || !tab) {
    openPopupWithValue('');
    return;
  }

  if (info.menuItemId === 'check-selected-text') {
    const selected = (info.selectionText || '').toString();
    openPopupWithValue(selected);
    return;
  }

  if (info.menuItemId === 'check-editable') {
    try {
      chrome.tabs.sendMessage(
        tab.id,
        { action: 'getFocusedFieldValue' },
        (response) => {
          if (chrome.runtime.lastError) {
            openPopupWithValue('');
            return;
          }

          const value =
            (response && response.value)
              ? response.value
              : '';

          openPopupWithValue(value);
        }
      );
    } catch (err) {
      openPopupWithValue('');
    }
    return;
  }
});

// Commands listener (keyboard shortcut)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-cyberguard') {
    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      (tabs) => {
        const tab = tabs && tabs[0];

        if (!tab) {
          openPopupWithValue('');
          return;
        }

        try {
          chrome.tabs.sendMessage(
            tab.id,
            { action: 'getFocusedFieldValue' },
            (response) => {
              if (chrome.runtime.lastError) {
                openPopupWithValue('');
                return;
              }

              const value =
                (response && response.value)
                  ? response.value
                  : '';

              openPopupWithValue(value);
            }
          );
        } catch (err) {
          openPopupWithValue('');
        }
      }
    );
  }
});

// Accept open_with_value messages from content script if needed
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return;

  if (msg.action === 'open_with_value') {
    const v =
      (typeof msg.value === 'string')
        ? msg.value
        : '';

    openPopupWithValue(v);

    try {
      sendResponse && sendResponse({ ok: true });
    } catch (_) {}

    return true;
  }
});
