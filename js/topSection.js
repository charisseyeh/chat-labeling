// Top section logic: filtering state, API key, analyze button
export const selectedCategories = new Set(); // empty = show all

export function syncFilterButtonsUI() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const cat = btn.dataset.category;
    if (selectedCategories.has(cat)) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

export function filterByCategory(category, onChange) {
  if (selectedCategories.has(category)) selectedCategories.delete(category);
  else selectedCategories.add(category);
  syncFilterButtonsUI();
  if (typeof onChange === 'function') onChange();
}

let apiKey = null;
export async function loadApiKey() {
  try {
    const response = await fetch('/api-key');
    const data = await response.json();
    if (data.apiKey) {
      apiKey = data.apiKey;
      const status = document.getElementById('apiKeyStatus');
      if (status) status.textContent = '✅ API key loaded';
      const btn = document.getElementById('analyzeBtn');
      if (btn) btn.disabled = false;
    } else {
      throw new Error('No API key found');
    }
  } catch (err) {
    console.error('Error loading API key:', err);
    const status = document.getElementById('apiKeyStatus');
    if (status) status.textContent = '❌ API key not found. Check .env file';
    const btn = document.getElementById('analyzeBtn');
    if (btn) btn.disabled = true;
  }
}

export async function analyzeWithAI(conversations, extractMessages) {
  if (!apiKey) {
    alert('API key not loaded. Please check your .env file and restart the server.');
    return;
  }

  const button = document.getElementById('analyzeBtn');
  if (button) {
    button.disabled = true;
    button.textContent = 'Analyzing...';
  }

  try {
    const batchSize = 20;
    for (let i = 0; i < conversations.length; i += batchSize) {
      const batch = conversations.slice(i, i + batchSize);
      const conversationSamples = batch.map(conv => {
        const messages = extractMessages(conv);
        const firstUserMessage = messages.find(msg => msg.role === 'user');
        const sample = firstUserMessage ? firstUserMessage.content.substring(0, 400) : (conv.title || 'Untitled Conversation');
        return { title: conv.title || 'Untitled Conversation', sample };
      });

      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are helping to identify conversations that might be relevant for reflective or therapy-like conversations with ChatGPT. Look for conversations about personal growth, emotions, relationships, self-reflection, mental health, or similar topics. You must respond with ONLY a valid JSON array, no other text.' },
          { role: 'user', content: `Analyze these conversations and determine if each is relevant for reflective/therapy-like conversations with ChatGPT. Look for topics like personal growth, emotions, relationships, self-reflection, mental health, or similar.\n\nFor each conversation, I'll provide the title and a sample of the first user message (up to 400 characters).\n\nRespond with ONLY a JSON array where each object has exactly these fields:\n- "category": either "relevant" or "not-relevant"\n- "explanation": a brief reason for the classification\n\nExample format:\n[{"category": "relevant", "explanation": "This appears to be about personal relationships"}, {"category": "not-relevant", "explanation": "This is about technical programming"}]\n\nConversations to analyze: ${JSON.stringify(conversationSamples)}` }
        ]
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error');
      let classifications = JSON.parse(data.choices[0].message.content);

      batch.forEach((conv, idx) => {
        if (classifications[idx] && classifications[idx].category) {
          conv.aiCategory = classifications[idx].category;
          conv.aiExplanation = classifications[idx].explanation || '';
        } else {
          conv.aiCategory = 'not-relevant';
          conv.aiExplanation = 'Failed to classify';
        }
      });
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Analyze Titles with AI';
    }
  }
}
