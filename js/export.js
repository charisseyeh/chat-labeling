// Data export and formatting module

// Export functions
export function exportLabeledData(conversations, labels) {
    const labeledConversations = conversations.map((conv, index) => ({
        ...conv,
        labels: labels[index] || {}
    }));

    const exportData = {
        exportDate: new Date().toISOString(),
        totalConversations: conversations.length,
        labeledConversations: labeledConversations,
        labels: labels
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labeled_conversations_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Exported ${conversations.length} conversations with labels!`);
}

// Build export in the format from project guide (both human and AI ratings)
export function buildExportPayload(conversations, labels, aiLabels) {
    const payload = [];
    conversations.forEach((conv, index) => {
        const messages = extractMessages(conv);
        const convoTitle = conv.title || 'Untitled Conversation';
        const convoObj = {
            conversation_index: index,
            conversation_title: convoTitle,
            num_turns: messages.length,
            assessments: { pre: { human: {}, ai: {} }, mid: { human: {}, ai: {} }, post: { human: {}, ai: {} } },
            messages: messages.map(m => ({ role: m.role, text: m.content }))
        };
        // Human
        const human = labels[index]?.survey || {};
        if (human.beginning) {
            convoObj.assessments.pre.human = mapSurveyToGuide(human.beginning);
        }
        if (human.turn6) {
            convoObj.assessments.mid.human = mapSurveyToGuide(human.turn6);
        }
        if (human.end) {
            convoObj.assessments.post.human = mapSurveyToGuide(human.end);
        }
        // AI
        const ai = aiLabels[index] || {};
        if (ai.pre) convoObj.assessments.pre.ai = ai.pre;
        if (ai.mid) convoObj.assessments.mid.ai = ai.mid;
        if (ai.post) convoObj.assessments.post.ai = ai.post;
        payload.push(convoObj);
    });
    return payload;
}

export function mapSurveyToGuide(section) {
    return {
        presence_resonance: section.presence_resonance ?? null,
        field_continuity: section.field_continuity ?? null,
        somatic_drift: section.somatic_drift ?? null,
        reflective_trace: section.reflective_trace ?? null,
        overall_state: section.overall_emotional_state ?? null,
        notes: section.notes || undefined
    };
}

// Export only human labels per guide schema
export function exportHumanLabelsJson(conversations, labels) {
    const data = buildExportPayload(conversations, labels, {});
    // Strip AI sections
    const humanOnly = data.map(item => {
        return {
            ...item,
            assessments: {
                pre: { human: item.assessments.pre.human, ai: {} },
                mid: { human: item.assessments.mid.human, ai: {} },
                post: { human: item.assessments.post.human, ai: {} }
            }
        };
    });
    const blob = new Blob([JSON.stringify(humanOnly, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `human_labels_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export combined human + AI + comparisons
export function exportCombinedAndComparisons(conversations, labels, aiLabels, computeComparisons) {
    const combined = buildExportPayload(conversations, labels, aiLabels);
    const comparison = computeComparisons(combined);
    const output = {
        exportDate: new Date().toISOString(),
        totalConversations: conversations.length,
        data: combined,
        comparisons: comparison
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combined_labels_and_comparisons_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Build a single export item for a specific conversation index
export function buildExportPayloadForIndex(conversations, labels, aiLabels, index) {
    const conv = conversations[index];
    const messages = extractMessages(conv);
    const convoTitle = conv.title || 'Untitled Conversation';
    const convoObj = {
        conversation_index: index,
        conversation_title: convoTitle,
        num_turns: messages.length,
        assessments: { pre: { human: {}, ai: {} }, mid: { human: {}, ai: {} }, post: { human: {}, ai: {} } },
        messages: messages.map(m => ({ role: m.role, text: m.content }))
    };
    // Human
    const human = labels[index]?.survey || {};
    if (human.beginning) {
        convoObj.assessments.pre.human = mapSurveyToGuide(human.beginning);
    }
    if (human.turn6) {
        convoObj.assessments.mid.human = mapSurveyToGuide(human.turn6);
    }
    if (human.end) {
        convoObj.assessments.post.human = mapSurveyToGuide(human.end);
    }
    // AI
    const ai = aiLabels[index] || {};
    if (ai.pre) convoObj.assessments.pre.ai = ai.pre;
    if (ai.mid) convoObj.assessments.mid.ai = ai.mid;
    if (ai.post) convoObj.assessments.post.ai = ai.post;
    return convoObj;
}

// Export combined + comparisons for a single conversation
export function exportCombinedAndComparisonsForIndex(conversations, labels, aiLabels, index, computeComparisons, renderAiMetrics) {
    const combined = [buildExportPayloadForIndex(conversations, labels, aiLabels, index)];
    const comparison = computeComparisons(combined);
    const output = {
        exportDate: new Date().toISOString(),
        totalConversations: 1,
        data: combined,
        comparisons: comparison
    };
    
    // Store comparison data globally for the summary section
    window.lastComparisonData = comparison;
    
    // Also render the metrics panel inline for quick glance
    try { renderAiMetrics(comparison); } catch (_) {}
    
    // Save to server labeled/ directory
    fetch('/save-labeled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: `combined_labels_and_comparisons_conversation_${index + 1}_${new Date().toISOString().split('T')[0]}.json`,
            data: output
        })
    }).then(res => res.json()).then(resp => {
        if (!resp?.success) {
            console.warn('Failed to save labeled export on server', resp);
        } else {
            console.log('Saved labeled file on server at:', resp.filename);
            try {
                const notice = document.getElementById('saveNotice');
                if (notice) {
                    notice.style.display = 'block';
                    notice.innerHTML = `Saved to <a href="/${resp.filename}" target="_blank">/${resp.filename}</a>`;
                }
            } catch (_) {}
        }
    }).catch(err => console.error('Save labeled error', err));

    return output;
}

// Utility functions
export function formatNumber(n) {
    return (n == null || Number.isNaN(n)) ? '—' : (typeof n === 'number' ? n.toFixed(3) : String(n));
}

export function renderAiMetrics(metricsOrComparison) {
    const panel = document.getElementById('aiMetricsPanel');
    if (!panel) return;
    panel.style.display = 'block';

    // Accept either whole metrics object or { summary, per_conversation }
    const summary = metricsOrComparison.summary || metricsOrComparison;
    const dims = ['presence_resonance','field_continuity','somatic_drift','reflective_trace','overall_state'];

    let html = '<h3>AI vs Human metrics (post & change)</h3>';
    html += '<div class="metrics-grid">';
    dims.forEach(d => {
        const s = summary[d] || {};
        html += `
          <div class="metric-card">
            <div class="metric-title">${d.replace('_',' ')}</div>
            <div class="metric-row"><span>MAE (post)</span><span>${formatNumber(s.post_mae)}</span></div>
            <div class="metric-row"><span>Pearson r (post)</span><span>${formatNumber(s.post_corr)}</span></div>
            <div class="metric-row"><span>MAE (Δ)</span><span>${formatNumber(s.delta_mae)}</span></div>
            <div class="metric-row"><span>r (Δ)</span><span>${formatNumber(s.delta_corr)}</span></div>
            <div class="metric-row"><span>Within ±1 (post)</span><span>${formatNumber(s.pct_within_1_post)}</span></div>
            <div class="metric-row"><span>Dir agree (Δ)</span><span>${formatNumber(s.pct_direction_agree_delta)}</span></div>
          </div>`;
    });
    html += '</div>';

    if (summary.transformational_sensitivity) {
        const t = summary.transformational_sensitivity;
        html += `
          <div class="metric-card">
            <div class="metric-title">Transformational sensitivity (overall_state, ≥ ${t.threshold_points})</div>
            <div class="metric-row"><span>Precision</span><span>${formatNumber(t.precision_ai_detects_human_strong)}</span></div>
            <div class="metric-row"><span>Recall</span><span>${formatNumber(t.recall_ai_detects_human_strong)}</span></div>
            <div class="metric-row"><span>F1</span><span>${formatNumber(t.f1_ai_detects_human_strong)}</span></div>
          </div>`;
    }

    panel.innerHTML = html;
}

// Message extraction utility
export function extractMessages(conversation) {
    const messages = [];
    
    if (!conversation.mapping) {
        return messages;
    }
    
    // Get all nodes and sort them by creation time
    const allNodes = Object.values(conversation.mapping).filter(node => 
        node.message && 
        node.message.content && 
        node.message.content.content_type === 'text' &&
        node.message.content.parts?.[0]?.trim() !== ''
    );
    
    // Sort by creation time to get chronological order
    allNodes.sort((a, b) => {
        const timeA = a.message.create_time || 0;
        const timeB = b.message.create_time || 0;
        return timeA - timeB;
    });
    
    allNodes.forEach(node => {
        const role = node.message.author?.role || 'user';
        const content = node.message.content.parts?.[0] || '';
        
        if (content && content.trim() !== '') {
            messages.push({
                role: role,
                content: content.trim()
            });
        }
    });
    
    console.log('Extracted messages:', messages);
    return messages;
}

// Make functions available globally for backward compatibility
window.exportLabeledData = exportLabeledData;
window.exportHumanLabelsJson = exportHumanLabelsJson;
window.exportCombinedAndComparisons = exportCombinedAndComparisons;
window.exportCombinedAndComparisonsForIndex = exportCombinedAndComparisonsForIndex;
window.renderAiMetrics = renderAiMetrics;
window.extractMessages = extractMessages;

// Add missing functions that are referenced in conversation-core.js
window.computeComparisons = window.computeComparisons || function() {
    console.warn('computeComparisons not loaded - this function is required for AI metrics');
    return { summary: {} };
};

window.labelConversationWithAI = window.labelConversationWithAI || function() {
    console.warn('labelConversationWithAI not loaded - this function is required for AI labeling');
    return Promise.reject(new Error('AI labeling module not loaded'));
};
