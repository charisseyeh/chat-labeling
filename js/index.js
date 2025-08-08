import { selectedCategories, syncFilterButtonsUI, filterByCategory, loadApiKey, analyzeWithAI } from './topSection.js';
import { displayConversations, attachSelectionHelpers, collectDisplayedConversations, extractMessages } from './conversationList.js';

// Global for inline helpers to access data
window.conversations = [];

async function loadConversations() {
  try {
    const response = await fetch('conversations.json');
    const data = await response.json();
    window.conversations = data;
    displayConversations(window.conversations);
    attachSelectionHelpers();
  } catch (error) {
    console.error('Error loading conversations:', error);
    document.getElementById('conversationList').innerHTML = '<p style="color: red;">Error loading conversations. Please check the console for details.</p>';
  }
}

function onSearchChange() {
  const displayed = collectDisplayedConversations(window.conversations);
  displayConversations(displayed);
  attachSelectionHelpers();
}

// Wire up top-section controls once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', onSearchChange);

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterByCategory(btn.dataset.category, () => {
        const displayed = collectDisplayedConversations(window.conversations);
        displayConversations(displayed);
        attachSelectionHelpers();
      });
    });
  });

  // Bulk select controls
  const selectAllBtn = document.querySelector('button[onclick="selectAll()"]');
  const deselectAllBtn = document.querySelector('button[onclick="deselectAll()"]');
  if (selectAllBtn) selectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = true;
      cb.parentElement.classList.add('selected');
    });
  });
  if (deselectAllBtn) deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
      cb.parentElement.classList.remove('selected');
    });
  });

  // Analyze button
  document.getElementById('analyzeBtn')?.addEventListener('click', async () => {
    await analyzeWithAI(window.conversations, extractMessages);
    const displayed = collectDisplayedConversations(window.conversations);
    displayConversations(displayed);
    attachSelectionHelpers();
  });

  // Initializations
  syncFilterButtonsUI();
  loadConversations();
  loadApiKey();
});
