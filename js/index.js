import { selectedCategories, syncFilterButtonsUI, filterByCategory, loadApiKey, analyzeWithAI } from './topSection.js';
import { displayConversations, attachSelectionHelpers, collectDisplayedConversations, extractMessages } from './conversationList.js';

// Global for inline helpers to access data
window.conversations = [];

async function loadConversations() {
  try {
    const response = await fetch('conversations.json');
    const data = await response.json();
    window.allConversations = data; // Store all conversations before filtering
    
    // Filter conversations to only include those with more than 6 turns
    const longConversations = data.filter(conversation => {
      const messages = extractMessages(conversation);
      return messages.length > 6;
    });
    
    // Update the conversation counts
    const totalElement = document.getElementById('totalConversationCount');
    const longElement = document.getElementById('longConversationCount');
    if (totalElement) totalElement.textContent = data.length;
    if (longElement) longElement.textContent = longConversations.length;
    
    // Use only long conversations for further processing
    window.conversations = longConversations;
    
    // Initialize filtered conversations
    window.filteredConversations = longConversations;
    const filteredElement = document.getElementById('filteredCount');
    if (filteredElement) filteredElement.textContent = longConversations.length;
    
    displayConversations(window.conversations);
    attachSelectionHelpers();
    
    // Update the total conversations count in the header
    const headerTotalElement = document.getElementById('totalConversations');
    if (headerTotalElement) {
      headerTotalElement.textContent = longConversations.length;
    }
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
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('input', onSearchChange);

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
