// --- AI Config (model, system message, prompt template) ---
const DEFAULT_AI_MODEL = 'gpt-3.5-turbo';
const DEFAULT_SYSTEM_MESSAGE = 'Respond with a single JSON object only. No markdown fences, no preamble, no commentary.';

// Import survey configuration
import { SurveyConfigManager } from './survey-config.js';

// Default prompt template (will be overridden by survey config)
const DEFAULT_PROMPT_TEMPLATE = `You are an emotionally intelligent assistant evaluating the user's emotional state.

Below is the conversation so far. Rate the user's likely state on the following 1–7 scale for each variable:
1 = Not at all true, 7 = Completely true

Rate EACH variable using the detailed anchors below. Base ratings primarily on the USER's language cues and described sensations. Use brief, evidence-based explanations (quote short phrases when helpful). If there are no user messages provided, assume a neutral baseline: set all scores to 4 and explanation to "No user messages provided; neutral baseline assumption."

Variables and detailed anchors:
1) Presence Resonance — grounded, calm, emotionally present
   1: Completely disconnected or dissociated
   2: Mostly absent or distracted
   3: Slightly tuned in, but not grounded
   4: Somewhat present and aware
   5: Mostly calm and embodied
   6: Very grounded and attentive
   7: Fully present, centered, and emotionally attuned

2) Field Continuity — coherent and connected thoughts
   1: Completely scattered, incoherent, or disjointed
   2: Jumping between thoughts with little connection
   3: Some sense of connection but fragmented
   4: Somewhat coherent with minor drop-offs
   5: Mostly focused, with recurring themes
   6: Very cohesive and self-referencing
   7: ideas flowed naturally and built on each other

3) Somatic Drift — bodily/emotional awareness
   1: Completely numb, dissociated, or disconnected from body
   2: Vague bodily awareness; emotionally foggy
   3: Minor physical awareness, but still scattered
   4: Mixed connection; sometimes grounded, sometimes reactive
   5: Mostly physically present and slow-paced
   6: Strong bodily awareness; emotionally settled
   7: Deeply embodied, grounded, and physically centered

4) Reflective Trace — depth of insight and integration
   1: No lasting impact; fleeting or shallow
   2: Momentary insight that faded quickly
   3: Mildly interesting, but not transformative
   4: Some insight that lingered briefly
   5: Insight that stayed with me for a while
   6: Strong insight that influenced later thoughts
   7: Deep, lasting shift in awareness or understanding

5) Overall Emotional State — regulation vs dysregulation
   1: Highly dysregulated; overwhelmed or shut down
   2: Very emotionally reactive or scattered
   3: Mild dysregulation; some difficulty focusing
   4: Neutral or mixed emotional experience
   5: Mostly emotionally steady and calm
   6: Very regulated and clear-headed
   7: Fully balanced, open, and emotionally integrated

Output requirements:
- Return ONLY a single valid JSON object with keys: presence_resonance, field_continuity, somatic_drift, reflective_trace, overall_state, explanation
- Each of the five scores must be an integer from 1 to 7
- The explanation should be 1–2 sentences citing concrete evidence from the user messages (if present)`;

// --- API Key storage helpers (shared across pages via localStorage) ---
const API_KEY_STORAGE_KEY = 'openai_api_key';

function getStoredApiKey() {
  const key = localStorage.getItem(API_KEY_STORAGE_KEY);
  return key && key.trim() ? key.trim() : null;
}

function setStoredApiKey(key) {
  if (typeof key === 'string' && key.trim()) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
}

function clearStoredApiKey() {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

function maskApiKey(key) {
  if (!key) return '';
  const k = String(key);
  if (k.length <= 10) return '•••••';
  return `${k.slice(0, 6)}••••${k.slice(-4)}`;
}

function getAiModel() {
  return localStorage.getItem('aiModel') || DEFAULT_AI_MODEL;
}

function setAiModel(modelName) {
  if (typeof modelName === 'string' && modelName.trim()) {
    localStorage.setItem('aiModel', modelName.trim());
  }
}

function getSystemMessage() {
  return localStorage.getItem('aiSystemMessage') || DEFAULT_SYSTEM_MESSAGE;
}

function setSystemMessage(message) {
  if (typeof message === 'string') {
    localStorage.setItem('aiSystemMessage', message);
  }
}

function getPromptTemplate() {
  // Check if user has a custom prompt template
  const customTemplate = localStorage.getItem('aiPromptTemplate');
  if (customTemplate) {
    return customTemplate;
  }
  
  // Generate prompt template from current survey configuration
  try {
    const configManager = new SurveyConfigManager();
    return configManager.generateAiPromptTemplate();
  } catch (error) {
    console.warn('Failed to generate prompt template from survey config, using default:', error);
    return DEFAULT_PROMPT_TEMPLATE;
  }
}

function setPromptTemplate(template) {
  if (typeof template === 'string') {
    localStorage.setItem('aiPromptTemplate', template);
  }
}

// Expose helpers globally for UI access
window.getAiModel = getAiModel;
window.setAiModel = setAiModel;
window.getSystemMessage = getSystemMessage;
window.setSystemMessage = setSystemMessage;
window.getPromptTemplate = getPromptTemplate;
window.setPromptTemplate = setPromptTemplate;
// API key helpers
window.getStoredApiKey = getStoredApiKey;
window.setStoredApiKey = setStoredApiKey;
window.clearStoredApiKey = clearStoredApiKey;
window.maskApiKey = maskApiKey;

async function fetchApiKey() {
  try {
    // Prefer key provided by user and stored locally
    const localKey = getStoredApiKey();
    if (localKey) return localKey;
    // Fallback to server-provided key for backwards compatibility
    const res = await fetch('/api-key');
    const data = await res.json();
    if (!res.ok || !data.apiKey) throw new Error('API key not available');
    return data.apiKey;
  } catch (e) {
    console.error('Failed to load API key:', e);
    return null;
  }
}

function extractMessagesForExport(conversation) {
  // Reuse structure from conversation.js (but this file is standalone)
  const mapping = conversation.mapping || {};
  const nodes = Object.values(mapping).filter(n => n?.message?.content?.content_type === 'text' && (n.message.content.parts?.[0]?.trim() || '') !== '');
  nodes.sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
  const msgs = [];
  nodes.forEach(n => {
    const role = n.message.author?.role || 'user';
    const content = n.message.content.parts?.[0] || '';
    if (role === 'system') return;
    if (content && content.trim() !== '') msgs.push({ role, text: content.trim() });
  });
  return msgs;
}

function buildPrompt(conversationMessages) {
  const baseTemplate = getPromptTemplate();
  const combined = `${baseTemplate}\n\nConversation so far (array of {role, text}):\n${JSON.stringify(conversationMessages)}`;
  return combined;
}

async function callOpenAI(apiKey, messages) {
  const selectedModel = getAiModel();
  const systemMsg = getSystemMessage();
  const body = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemMsg },
      { role: 'user', content: messages }
    ]
  };

  try {
    const truncatedSystem = (systemMsg || '').slice(0, 200);
    const userPreview = (typeof messages === 'string' ? messages : JSON.stringify(messages)).slice(0, 200);
    console.log('[AI Labeling] Using model:', selectedModel);
    console.log('[AI Labeling] System message (first 200 chars):', truncatedSystem);
    console.log('[AI Labeling] User prompt length/chunk preview:', typeof messages === 'string' ? messages.length : 'object', userPreview);
  } catch (_) {
    // best-effort logging; do not block on errors
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'OpenAI error');
  }
  const content = data.choices?.[0]?.message?.content || '{}';
  try {
    const parsed = JSON.parse(content);
    
    // Validate that the AI response contains the expected fields
    try {
      const configManager = new SurveyConfigManager();
      const expectedFields = configManager.getFieldNames();
      const missingFields = expectedFields.filter(field => !(field in parsed));
      
      if (missingFields.length > 0) {
        console.warn(`AI response missing expected fields: ${missingFields.join(', ')}`);
        // Add missing fields with neutral values
        missingFields.forEach(field => {
          parsed[field] = 4; // Neutral baseline
        });
      }
    } catch (error) {
      console.warn('Could not validate AI response fields:', error);
    }
    
    return parsed;
  } catch (e) {
    console.warn('AI returned non-JSON; wrapping as explanation');
    return { explanation: content };
  }
}

async function labelConversationWithAI(conversation) {
  const apiKey = await fetchApiKey();
  if (!apiKey) throw new Error('Missing API Key');
  const msgs = extractMessagesForExport(conversation);

  // Build three checkpoints: pre (no messages), mid (~first 6 turns), post (all)
  const preMsgs = [];
  const midMsgs = msgs.slice(0, Math.min(12, msgs.length)); // ~6 turns ≈ 12 messages (user+assistant)
  const postMsgs = msgs;

  const [pre, mid, post] = await Promise.all([
    callOpenAI(apiKey, buildPrompt(preMsgs)),
    callOpenAI(apiKey, buildPrompt(midMsgs)),
    callOpenAI(apiKey, buildPrompt(postMsgs))
  ]);

  return { pre, mid, post };
}

async function labelConversationsWithAI(conversations) {
  const results = {};
  for (let i = 0; i < conversations.length; i++) {
    try {
      results[i] = await labelConversationWithAI(conversations[i]);
    } catch (e) {
      console.error('AI labeling failed for index', i, e);
      results[i] = { pre: {}, mid: {}, post: {} };
    }
  }
  return results;
}
