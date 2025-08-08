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
  container.innerHTML = convos.map((convo, index) => `
    <div class="conversation-item">
      <div class="conversation-header">
        <input type="checkbox" id="convo-${index}" onclick="event.stopPropagation()">
        <label for="convo-${index}" style="margin-left: 10px; flex-grow: 1;" onclick="window.toggleSelection(${index})">
          ${escapeHtml(convo.title || 'Untitled Conversation')}
          ${convo.aiCategory ? `<span class="category-tag ${convo.aiCategory}">${convo.aiCategory === 'relevant' ? 'Relevant' : 'Not Relevant'}</span>` : ''}
          ${convo.aiExplanation ? `<br><small style="color: #666;">${escapeHtml(convo.aiExplanation)}</small>` : ''}
        </label>
        <button onclick="event.stopPropagation(); window.togglePreview(${index})" class="preview-btn" title="Preview"><i class="fas fa-chevron-down"></i></button>
      </div>
      <div id="preview-${index}" class="conversation-preview" style="display: none;">
        <div class="preview-messages"></div>
      </div>
    </div>
  `).join('');
}

// Expose selection helpers for inline handlers generated above
export function attachSelectionHelpers() {
  window.toggleSelection = index => {
    const checkbox = document.getElementById(`convo-${index}`);
    checkbox.checked = !checkbox.checked;
    const item = checkbox.parentElement.parentElement;
    item.classList.toggle('selected', checkbox.checked);
  };

  window.togglePreview = index => {
    const previewDiv = document.getElementById(`preview-${index}`);
    if (!previewDiv) {
      console.error(`Preview div not found for index ${index}`);
      return;
    }
    
    const previewBtn = previewDiv.previousElementSibling?.querySelector('.preview-btn i');
    const isVisible = previewDiv.style.display !== 'none';
    
    if (!isVisible) {
      const el = document.getElementById('searchInput');
      const searchTerm = (el && el.value ? el.value.toLowerCase() : '');
      const displayedConversations = filterConversations(window.conversations || [], searchTerm);
      const conversation = displayedConversations[index];
      if (!conversation) {
        console.error(`Conversation not found for index ${index}`);
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
      if (previewBtn) {
        previewBtn.className = 'fas fa-chevron-up';
      }
    } else {
      previewDiv.style.display = 'none';
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
