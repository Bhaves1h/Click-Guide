// ClickGuide Popup Script
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const flows = window.CLICKGUIDE_FLOWS || {};
  const matcher = window.ClickGuideMatcher || { matchQuery: () => ({ matched: false }) };

  let currentLang = 'en';
  let selectedFlowId = 'create-repo';
  let geminiApiKey = '';

  // Elements
  const searchInput = document.getElementById('search-input');
  const btnLangEn = document.getElementById('btn-lang-en');
  const btnLangHi = document.getElementById('btn-lang-hi');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const settingsDrawer = document.getElementById('settings-drawer');
  const inputGeminiKey = document.getElementById('gemini-api-key');
  const chipCreateRepo = document.getElementById('chip-create-repo');
  const chipOpenPr = document.getElementById('chip-open-pr');
  const resultContainer = document.getElementById('result-container');
  const btnStartGuide = document.getElementById('btn-start-guide');
  const tabWarning = document.getElementById('tab-warning');

  // Load preferences from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['clickguide_lang', 'clickguide_gemini_key'], (res) => {
      if (res.clickguide_lang) {
        setLanguage(res.clickguide_lang);
      }
      if (res.clickguide_gemini_key) {
        geminiApiKey = res.clickguide_gemini_key;
        inputGeminiKey.value = geminiApiKey;
      }
    });
  } else {
    const savedLang = localStorage.getItem('clickguide_lang');
    if (savedLang) setLanguage(savedLang);
    const savedKey = localStorage.getItem('clickguide_gemini_key');
    if (savedKey) {
      geminiApiKey = savedKey;
      inputGeminiKey.value = geminiApiKey;
    }
  }

  // Language selection
  function setLanguage(lang) {
    currentLang = lang;
    if (lang === 'hi') {
      btnLangHi.classList.add('active');
      btnLangEn.classList.remove('active');
    } else {
      btnLangEn.classList.add('active');
      btnLangHi.classList.remove('active');
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ clickguide_lang: lang });
    } else {
      localStorage.setItem('clickguide_lang', lang);
    }

    updateUI();
  }

  btnLangEn.addEventListener('click', () => setLanguage('en'));
  btnLangHi.addEventListener('click', () => setLanguage('hi'));

  // Settings Drawer Toggle
  btnSettingsToggle.addEventListener('click', () => {
    settingsDrawer.classList.toggle('open');
  });

  inputGeminiKey.addEventListener('input', (e) => {
    geminiApiKey = e.target.value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ clickguide_gemini_key: geminiApiKey });
    } else {
      localStorage.setItem('clickguide_gemini_key', geminiApiKey);
    }
  });

  // Flow chip selection
  function selectFlow(flowId) {
    selectedFlowId = flowId;
    searchInput.value = '';
    updateUI();
  }

  chipCreateRepo.addEventListener('click', () => selectFlow('create-repo'));
  chipOpenPr.addEventListener('click', () => selectFlow('open-pr'));

  // Search input processing
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      updateUI();
      return;
    }

    const matchResult = matcher.matchQuery(query);
    if (matchResult.matched && matchResult.flowId) {
      selectedFlowId = matchResult.flowId;
      renderMatchCard(matchResult.flow);
      btnStartGuide.disabled = false;
    } else {
      renderFallbackCard();
    }
  });

  function renderMatchCard(flow) {
    const f = flow || flows[selectedFlowId] || flows['create-repo'];
    const title = currentLang === 'hi' ? f.title_hi : f.title_en;
    const desc = currentLang === 'hi' ? f.description_hi : f.description_en;

    resultContainer.innerHTML = `
      <div class="cg-result-card" id="match-card">
        <div class="cg-result-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Matched Verified Task</span>
        </div>
        <div class="cg-result-title">${title}</div>
        <div class="cg-result-desc">${desc}</div>
      </div>
    `;

    chipCreateRepo.classList.toggle('active', f.id === 'create-repo');
    chipOpenPr.classList.toggle('active', f.id === 'open-pr');
  }

  function renderFallbackCard() {
    resultContainer.innerHTML = `
      <div class="cg-fallback-notice">
        <div style="font-weight: 700; margin-bottom: 4px;">I can guide you through these tasks:</div>
        <div style="font-size: 11px; opacity: 0.9;">
          Pick one of the verified flows below to start walking through on GitHub.
        </div>
      </div>
    `;
    chipCreateRepo.classList.remove('active');
    chipOpenPr.classList.remove('active');
  }

  function updateUI() {
    renderMatchCard(flows[selectedFlowId]);
    btnStartGuide.disabled = false;
  }

  // Start Guide Execution
  btnStartGuide.addEventListener('click', async () => {
    if (!selectedFlowId) return;

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      alert('Extension environment detected in mock mode.');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        tabWarning.style.display = 'block';
        return;
      }

      if (!tab.url.startsWith('https://github.com')) {
        tabWarning.style.display = 'block';
        tabWarning.innerHTML = `
          ⚠️ Please open <strong>github.com</strong> in this tab to run ClickGuide.
        `;
        return;
      }

      tabWarning.style.display = 'none';

      const payload = {
        action: 'START_FLOW',
        flowId: selectedFlowId,
        lang: currentLang,
        geminiApiKey
      };

      // Try sending message directly first (if content script already injected)
      chrome.tabs.sendMessage(tab.id, payload, async (response) => {
        if (chrome.runtime.lastError || !response) {
          try {
            // Inject content scripts manually
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['flows.js', 'content/content.js']
            });

            await chrome.scripting.insertCSS({
              target: { tabId: tab.id },
              files: ['content/overlay.css']
            });

            // Resend after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, payload, () => {
                window.close();
              });
            }, 100);
          } catch (err) {
            console.error('[ClickGuide] Injection error:', err);
            tabWarning.style.display = 'block';
            tabWarning.textContent = 'Could not inject ClickGuide: ' + err.message;
          }
        } else {
          window.close();
        }
      });
    } catch (err) {
      console.error('[ClickGuide] Launch error:', err);
      tabWarning.style.display = 'block';
      tabWarning.textContent = 'Launch error: ' + err.message;
    }
  });

  // Initial render
  updateUI();
});
