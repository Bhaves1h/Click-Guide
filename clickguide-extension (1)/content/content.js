// ClickGuide Step Player Engine (Injected into target web page)
(function () {
  'use strict';

  if (window.__CLICKGUIDE_CONTENT_SCRIPT_INITIALIZED__) {
    return;
  }
  window.__CLICKGUIDE_CONTENT_SCRIPT_INITIALIZED__ = true;

  console.log('[ClickGuide] Extension step player initialized.');

  let currentFlow = null;
  let currentStepIndex = 0;
  let currentLanguage = 'en';
  let geminiApiKey = null;
  let cursorCoords = { x: 100, y: 100 };

  /**
   * Speak narration using Web Speech API
   */
  function speakNarration(text, lang) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // Graceful fallback
    }
  }

  /**
   * Remove all ClickGuide UI from the page
   */
  function cleanupDOM() {
    document.querySelectorAll('.clickguide-highlight-target').forEach((el) => {
      el.classList.remove('clickguide-highlight-target');
    });

    const cursor = document.getElementById('clickguide-cursor');
    if (cursor) cursor.remove();

    const box = document.getElementById('clickguide-guidance-box');
    if (box) box.remove();

    const fallbackCard = document.getElementById('clickguide-fallback-card');
    if (fallbackCard) fallbackCard.remove();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  /**
   * Honest Fallback View: Triggered whenever a target element cannot be found in the DOM
   */
  function showHonestFallback(step, selector) {
    cleanupDOM();

    console.warn(`[ClickGuide] HONEST FALLBACK: Selector "${selector}" not found on page. Halting flow.`);

    const card = document.createElement('div');
    card.id = 'clickguide-fallback-card';
    card.innerHTML = `
      <div class="clickguide-fallback-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>Honest Fallback Activated</span>
      </div>
      <p class="clickguide-fallback-msg">
        This page looks different than expected — I won&apos;t guess. The site may have updated.
      </p>
      <div style="font-family: monospace; font-size: 11px; color: #8b949e; background: #0d1117; padding: 6px 10px; border-radius: 6px; margin-bottom: 12px; word-break: break-all;">
        Missing target: ${selector.split(',')[0]}
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button class="clickguide-btn clickguide-btn-secondary" id="clickguide-fallback-dismiss">End Guide</button>
      </div>
    `;

    document.body.appendChild(card);
    card.querySelector('#clickguide-fallback-dismiss').addEventListener('click', endGuide);
  }

  /**
   * Get or create virtual cursor DOM element
   */
  function getOrCreateCursor() {
    let cursor = document.getElementById('clickguide-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'clickguide-cursor';
      cursor.innerHTML = `
        <div class="clickguide-cursor-wrapper">
          <div class="clickguide-cursor-pulse"></div>
          <svg class="clickguide-cursor-pointer" viewBox="0 0 24 24" fill="#3fb950" stroke="#0d1117" stroke-width="1.5">
            <path d="M4 2l16 12-7 1 4 7-3 1-4-7-6 5V2z"/>
          </svg>
          <div class="clickguide-action-pill" id="clickguide-cursor-label">Click Here</div>
        </div>
      `;
      document.body.appendChild(cursor);
    }
    return cursor;
  }

  /**
   * Get or create floating guidance tooltip box
   */
  function getOrCreateGuidanceBox() {
    let box = document.getElementById('clickguide-guidance-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'clickguide-guidance-box';
      box.innerHTML = `
        <div class="clickguide-box-header">
          <div class="clickguide-badge-row">
            <span class="clickguide-brand-tag">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#3fb950;"></span>
              ClickGuide
            </span>
            <span class="clickguide-step-pill" id="clickguide-step-counter">Step 1 of 5</span>
          </div>
          <div>
            <button class="clickguide-lang-btn" id="clickguide-lang-toggle" title="Switch English / हिन्दी">
              EN / हिन्दी
            </button>
          </div>
        </div>
        <div class="clickguide-box-title" id="clickguide-step-title">Step Title</div>
        <div class="clickguide-box-desc" id="clickguide-step-desc">Step instructions</div>
        <div class="clickguide-box-footer">
          <button class="clickguide-btn clickguide-btn-danger" id="clickguide-btn-end">End guide</button>
          <div style="display: flex; gap: 8px;">
            <button class="clickguide-btn clickguide-btn-secondary" id="clickguide-btn-back">Back</button>
            <button class="clickguide-btn clickguide-btn-primary" id="clickguide-btn-next">Next &rarr;</button>
          </div>
        </div>
      `;
      document.body.appendChild(box);

      box.querySelector('#clickguide-btn-end').addEventListener('click', endGuide);
      box.querySelector('#clickguide-btn-back').addEventListener('click', previousStep);
      box.querySelector('#clickguide-btn-next').addEventListener('click', nextStep);
      box.querySelector('#clickguide-lang-toggle').addEventListener('click', toggleLanguage);
    }
    return box;
  }

  /**
   * Render the current step
   */
  function renderStep() {
    if (!currentFlow || currentStepIndex < 0 || currentStepIndex >= currentFlow.steps.length) {
      endGuide();
      return;
    }

    const step = currentFlow.steps[currentStepIndex];
    const totalSteps = currentFlow.steps.length;

    // 1. Selector Lookup
    let targetEl = null;
    try {
      targetEl = document.querySelector(step.selector);
    } catch (e) {
      console.error('[ClickGuide] Selector query failed:', e);
    }

    // 2. HONEST FALLBACK: If selector not found, STOP immediately
    if (!targetEl) {
      showHonestFallback(step, step.selector);
      return;
    }

    // Clear any previous fallback card if present
    const existingFallback = document.getElementById('clickguide-fallback-card');
    if (existingFallback) existingFallback.remove();

    // 3. Highlight Element & Scroll Into View
    document.querySelectorAll('.clickguide-highlight-target').forEach((el) => {
      el.classList.remove('clickguide-highlight-target');
    });
    targetEl.classList.add('clickguide-highlight-target');

    try {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      // scroll fallback
    }

    // 4. Calculate Coordinates and Animate Virtual Cursor
    const cursor = getOrCreateCursor();
    const rect = targetEl.getBoundingClientRect();
    const targetX = rect.left + window.scrollX + Math.max(12, rect.width / 2);
    const targetY = rect.top + window.scrollY + Math.max(12, rect.height / 2);

    cursor.style.transform = `translate(${targetX}px, ${targetY}px)`;
    cursorCoords = { x: targetX, y: targetY };

    const actionLabel = document.getElementById('clickguide-cursor-label');
    if (actionLabel) {
      actionLabel.textContent = step.actionText || 'Click here';
    }

    // 5. Update Guidance Card Text
    const box = getOrCreateGuidanceBox();
    const stepCounter = document.getElementById('clickguide-step-counter');
    const stepTitle = document.getElementById('clickguide-step-title');
    const stepDesc = document.getElementById('clickguide-step-desc');
    const btnBack = document.getElementById('clickguide-btn-back');
    const btnNext = document.getElementById('clickguide-btn-next');
    const langToggle = document.getElementById('clickguide-lang-toggle');

    if (stepCounter) {
      stepCounter.textContent = `Step ${currentStepIndex + 1} of ${totalSteps}`;
    }

    const titleText = currentLanguage === 'hi' ? step.title_hi : step.title_en;
    let descText = currentLanguage === 'hi' ? step.desc_hi : step.desc_en;

    if (stepTitle) stepTitle.textContent = titleText;
    if (stepDesc) stepDesc.textContent = descText;

    if (btnBack) {
      btnBack.disabled = currentStepIndex === 0;
    }

    if (btnNext) {
      btnNext.innerHTML = currentStepIndex === totalSteps - 1 ? 'Finish &check;' : 'Next &rarr;';
    }

    if (langToggle) {
      langToggle.textContent = currentLanguage === 'hi' ? 'हिन्दी (Active)' : 'EN (Active)';
    }

    // Speak narration
    speakNarration(descText, currentLanguage);
  }

  function nextStep() {
    if (currentFlow && currentStepIndex < currentFlow.steps.length - 1) {
      currentStepIndex++;
      renderStep();
    } else {
      endGuide();
    }
  }

  function previousStep() {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderStep();
    }
  }

  function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'hi' : 'en';
    renderStep();
  }

  function startFlow(flowId, lang, apiKey) {
    cleanupDOM();

    const flows = window.CLICKGUIDE_FLOWS;
    if (!flows || !flows[flowId]) {
      console.error(`[ClickGuide] Flow ID "${flowId}" not found in available flows.`);
      return;
    }

    currentFlow = flows[flowId];
    currentStepIndex = 0;
    if (lang) currentLanguage = lang;
    if (apiKey) geminiApiKey = apiKey;

    renderStep();
  }

  function endGuide() {
    cleanupDOM();
    currentFlow = null;
    currentStepIndex = 0;
    console.log('[ClickGuide] Guide ended. DOM cleaned up.');
  }

  // Listen for messages from popup or tests
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'START_FLOW') {
        startFlow(message.flowId, message.lang, message.geminiApiKey);
        sendResponse({ success: true });
      } else if (message.action === 'STOP_FLOW') {
        endGuide();
        sendResponse({ success: true });
      } else if (message.action === 'GET_STATUS') {
        sendResponse({
          active: !!currentFlow,
          flowId: currentFlow ? currentFlow.id : null,
          stepIndex: currentStepIndex
        });
      }
    });
  }

  // Keyboard shortcut Alt + C to summon guide directly on page
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.code === 'KeyC' || e.key === 'c' || e.key === 'C')) {
      const isNewRepo = window.location.pathname.includes('/new');
      startFlow(isNewRepo ? 'create-repo' : 'open-pr', currentLanguage);
    }
  });

  // Expose Player API on window for testing and programmatic injection
  window.ClickGuidePlayer = {
    startFlow,
    endGuide,
    nextStep,
    previousStep,
    renderStep,
    getCurrentStep: () => (currentFlow ? currentFlow.steps[currentStepIndex] : null),
    getCurrentStepIndex: () => currentStepIndex,
    getCurrentLanguage: () => currentLanguage,
    setLanguage: (lang) => {
      currentLanguage = lang;
      if (currentFlow) renderStep();
    }
  };
})();
