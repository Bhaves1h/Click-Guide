// ClickGuide Authored Flows (Verified against live GitHub)
const CLICKGUIDE_FLOWS = {
  'create-repo': {
    id: 'create-repo',
    title_en: 'Create your first repository',
    title_hi: 'अपनी पहली रिपॉजिटरी बनाएं',
    targetUrlPattern: 'github.com/new',
    description_en: 'Set up a new GitHub repository with a README and public visibility in 5 guided steps.',
    description_hi: '5 आसान चरणों में README और पब्लिक विजिबिलिटी के साथ नई GitHub रिपॉजिटरी बनाएं।',
    steps: [
      {
        id: 'step-repo-name',
        selector: 'input#repository-name-input, input[data-testid="repository-name-input"], input#repository_name, input[name="repository[name]"]',
        title_en: 'Name your repository',
        title_hi: 'अपनी रिपॉजिटरी को नाम दें',
        desc_en: "Type a short, memorable name for your project (e.g., 'my-first-app').",
        desc_hi: "अपने प्रोजेक्ट के लिए एक छोटा और यादगार नाम लिखें (उदा. 'my-first-app')।",
        actionText: 'Enter repository name'
      },
      {
        id: 'step-repo-desc',
        selector: 'input#repository-description-input, input[data-testid="repository-description-input"], input#repository_description, input[name="repository[description]"]',
        title_en: 'Add a short description',
        title_hi: 'छोटा विवरण जोड़ें',
        desc_en: 'Optionally describe what this project is about so teammates understand it immediately.',
        desc_hi: 'वैकल्पिक रूप से बताएं कि यह प्रोजेक्ट किस बारे में है ताकि अन्य लोग समझ सकें।',
        actionText: 'Enter project description'
      },
      {
        id: 'step-visibility',
        selector: 'input#repository_visibility_public, input[value="public"], input[data-testid="repository-visibility-public-radio"]',
        title_en: 'Choose visibility (Public)',
        title_hi: 'विजिबिलिटी चुनें (पब्लिक)',
        desc_en: "Select 'Public' so anyone on GitHub can view and learn from your code.",
        desc_hi: "'Public' चुनें ताकि इंटरनेट पर कोई भी आपका कोड देख सके।",
        actionText: 'Select Public'
      },
      {
        id: 'step-readme',
        selector: 'input#repository_auto_init, input[data-testid="repository-readme-checkbox"], input[name="repository[auto_init]"], #repository_auto_init',
        title_en: 'Initialize with a README',
        title_hi: 'README फ़ाइल जोड़ें',
        desc_en: 'Check this box to automatically initialize your repository with a README.md documentation file.',
        desc_hi: 'अपने प्रोजेक्ट के डॉक्यूमेंटेशन के लिए README फ़ाइल अपने आप बनाने के लिए इस बॉक्स को चुनें।',
        actionText: 'Check README checkbox'
      },
      {
        id: 'step-submit',
        selector: 'button[data-testid="create-repository-button"], button.btn-primary[type="submit"], form[action*="repositories"] button[type="submit"]',
        title_en: "Click 'Create repository'",
        title_hi: "'Create repository' पर क्लिक करें",
        desc_en: 'Click this green button to finalize setup and publish your brand new repository!',
        desc_hi: 'सेटअप पूरा करने और अपनी नई रिपॉजिटरी लाइव करने के लिए इस हरे बटन पर क्लिक करें!',
        actionText: 'Click Create repository'
      }
    ]
  },
  'open-pr': {
    id: 'open-pr',
    title_en: 'Open your first pull request',
    title_hi: 'अपनी पहली पुल रिक्वेस्ट खोलें',
    targetUrlPattern: 'github.com',
    description_en: 'Edit a README, commit your changes, and propose a pull request in 4 steps.',
    description_hi: 'README फ़ाइल बदलें, बदलाव कमिट करें और 4 चरणों में पुल रिक्वेस्ट भेजें।',
    steps: [
      {
        id: 'step-edit-btn',
        selector: 'a[aria-label*="Edit this file"], button[aria-label*="Edit this file"], [data-testid="pencil-button"], a[data-testid="edit-button"], #edit-button, a.js-edit-file',
        title_en: 'Click Edit File (Pencil)',
        title_hi: 'फ़ाइल एडिट करें (पेंसिल आइकन)',
        desc_en: 'Click the pencil icon on the README to open the in-browser file editor.',
        desc_hi: 'ब्राउज़र एडिटर खोलने के लिए README पर पेंसिल आइकन पर क्लिक करें।',
        actionText: 'Click Edit file'
      },
      {
        id: 'step-editor-area',
        selector: '.cm-content, #commit-file-body, textarea[name="value"], .react-blob-editor-header, .monaco-editor, .cm-editor, #file-content',
        title_en: 'Make your edits',
        title_hi: 'अपने बदलाव लिखें',
        desc_en: 'Make your changes or add a new line directly inside this live code editor.',
        desc_hi: 'इस लाइव कोड एडिटर में सीधे अपने बदलाव या नई लाइन लिखें।',
        actionText: 'Edit file content'
      },
      {
        id: 'step-commit-btn',
        selector: 'button[data-testid="open-commit-dialog-button"], button.js-blob-submit, button[aria-label*="Commit"], #commit-changes-button, button.btn-primary[data-hotkey*="Mod+Enter"]',
        title_en: "Click 'Commit changes...'",
        title_hi: "'Commit changes...' पर क्लिक करें",
        desc_en: 'Click this button to open the commit dialog and summary panel.',
        desc_hi: 'कमिट डायलॉग और विवरण बॉक्स खोलने के लिए इस बटन पर क्लिक करें।',
        actionText: 'Click Commit changes'
      },
      {
        id: 'step-propose-btn',
        selector: 'button[data-testid="commit-changes-button"], button#submit-file, button.js-blob-submit, button[type="submit"].btn-primary',
        title_en: "Click 'Propose changes'",
        title_hi: "'Propose changes' पर क्लिक करें",
        desc_en: "Click 'Propose changes' to save your branch and open your first pull request!",
        desc_hi: "अपनी ब्रांच सेव करने और पुल रिक्वेस्ट तैयार करने के लिए 'Propose changes' पर क्लिक करें!",
        actionText: 'Click Propose changes'
      }
    ]
  }
};

// Global browser window assignment
if (typeof window !== 'undefined') {
  window.CLICKGUIDE_FLOWS = CLICKGUIDE_FLOWS;
}
if (typeof globalThis !== 'undefined') {
  globalThis.CLICKGUIDE_FLOWS = CLICKGUIDE_FLOWS;
}
// Node module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CLICKGUIDE_FLOWS;
}
