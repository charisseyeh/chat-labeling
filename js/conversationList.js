// Conversation list component: render, preview, selection, export
import { selectedCategories } from './topSection.js';

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function extractMessages(conversation) {
  const messages = [];
  if (!conversation.mapping) return messages;
  const allNodes = Object.values(conversation.mapping).filter(node =>
    node.message &&
    node.message.content &&
    node.message.content.content_type === 'text' &&
    node.message.content.parts?.[0]?.trim() !== ''
  );
  allNodes.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
  allNodes.forEach(node => {
    const role = node.message.author?.role || 'user';
    const content = node.message.content.parts?.[0] || '';
    if (content && content.trim() !== '') messages.push({ role, content: content.trim() });
  });
  return messages;
}

export function filterConversations(conversations, searchTerm) {
  const isAll = selectedCategories.size === 0;
  const term = (searchTerm || '').toLowerCase();
  return conversations.filter(convo => {
    const matchesSearch = (convo.title || '').toLowerCase().includes(term);
    const matchesCategory = isAll || (convo.aiCategory && selectedCategories.has(convo.aiCategory));
    return matchesSearch && matchesCategory;
  });
}

export function displayConversations(convos, containerId = 'conversationList') {
  const container = document.getElementById(containerId);
  container.innerHTML = convos.map((convo, index) => {
    // Find the original index in the allConversations array (before filtering)
    const originalIndex = window.allConversations ? window.allConversations.findIndex(c => c === convo) : index;
    return `
    <div class="conversation-item" data-original-index="${originalIndex}">
      <div class="conversation-header">
        <input type="checkbox" id="convo-${index}" onclick="event.stopPropagation()">
        <label for="convo-${index}" style="margin-left: 10px; flex-grow: 1;" onclick="window.toggleSelection(${index})">
          ${escapeHtml(convo.title || 'Untitled Conversation')}
          ${convo.aiCategory ? `<span class="category-tag ${convo.aiCategory}">${convo.aiCategory === 'relevant' ? 'Relevant' : 'Not Relevant'}</span>` : ''}
          ${convo.aiExplanation ? `<br><small style="color: #666;">${escapeHtml(convo.aiExplanation)}</small>` : ''}
        </label>
        <button onclick="event.stopPropagation(); window.togglePreview(${originalIndex})" class="preview-btn" title="Preview"><i class="fas fa-chevron-down"></i></button>
      </div>
      <div class="conversation-preview" style="display: none;">
        <div class="preview-messages"></div>
      </div>
    </div>
  `}).join('');
}

// Expose selection helpers for inline handlers generated above
export function attachSelectionHelpers() {
  window.toggleSelection = index => {
    const checkbox = document.getElementById(`convo-${index}`);
    checkbox.checked = !checkbox.checked;
    const item = checkbox.parentElement.parentElement;
    item.classList.toggle('selected', checkbox.checked);
  };

  window.togglePreview = originalIndex => {
    // Find the preview div by looking for the button that called this function
    const button = event.target.closest('.preview-btn');
    const conversationItem = button.closest('.conversation-item');
    
    if (!conversationItem) {
      console.error(`Conversation item not found`);
      return;
    }
    
    const previewDiv = conversationItem.querySelector('.conversation-preview');
    
    if (!previewDiv) {
      console.error(`Preview div not found for conversation item`);
      return;
    }
    
    const isVisible = previewDiv.style.display !== 'none';
    
    if (!isVisible) {
      // Get the conversation directly from the allConversations array (before filtering)
      const conversation = window.allConversations ? window.allConversations[originalIndex] : window.conversations[originalIndex];
      
      if (!conversation) {
        console.error(`Conversation not found for original index ${originalIndex}`);
        return;
      }
      
      const messages = extractMessages(conversation);
      let html = '';
      messages.forEach(message => {
        const role = message.role;
        const content = message.content;
        if (role === 'system' || !content || content.trim() === '') return;
        html += `
          <div class="preview-message ${role}">
            <div class="preview-avatar ${role}">${role === 'user' ? 'U' : 'A'}</div>
            <div class="preview-content">${escapeHtml(content.substring(0, 200))}${content.length > 200 ? '...' : ''}</div>
          </div>`;
      });
      const messagesContainer = previewDiv.querySelector('.preview-messages');
      if (messagesContainer) {
        messagesContainer.innerHTML = html;
      }
      previewDiv.style.display = 'block';
      
      // Update chevron icon to point up
      const previewBtn = previewDiv.previousElementSibling?.querySelector('.preview-btn i');
      if (previewBtn) {
        previewBtn.className = 'fas fa-chevron-up';
      }
    } else {
      previewDiv.style.display = 'none';
      
      // Update chevron icon to point down
      const previewBtn = previewDiv.previousElementSibling?.querySelector('.preview-btn i');
      if (previewBtn) {
        previewBtn.className = 'fas fa-chevron-down';
      }
    }
  };
}

export function collectDisplayedConversations(conversations) {
  const el = document.getElementById('searchInput');
  const searchTerm = (el && el.value ? el.value.toLowerCase() : '');
  return filterConversations(conversations, searchTerm);
}
