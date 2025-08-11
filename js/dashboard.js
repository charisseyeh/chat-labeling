// Dashboard functionality for displaying all conversations and their analysis

let conversations = [];
let conversationCounter = 1;

// Load all conversations from the new labeled directory structure
async function loadAllConversations() {
    try {
        // Load conversations index
        const response = await fetch('/labeled/conversations');
        if (!response.ok) {
            throw new Error('Failed to load conversations index');
        }
        
        const index = await response.json();
        
        if (index.conversations.length === 0) {
            showNoConversationsState();
            return;
        }
        
        // Load each conversation
        conversations = [];
        for (const conv of index.conversations) {
            try {
                const convResponse = await fetch(`/labeled/conversations/${conv.id}`);
                if (convResponse.ok) {
                    const convData = await convResponse.json();
                    conversations.push(convData);
                }
            } catch (err) {
                console.warn(`Failed to load conversation ${conv.id}:`, err);
            }
        }
        
        if (conversations.length > 0) {
            displayConversations();
        } else {
            showNoConversationsState();
        }
        
    } catch (error) {
        console.error('Error loading conversations:', error);
        showNoConversationsState();
    }
}

// Display all conversations in the grid
function displayConversations() {
    const grid = document.getElementById('conversationsGrid');
    const loadingState = document.getElementById('loadingState');
    
    if (conversations.length === 0) {
        showNoConversationsState();
        return;
    }
    
    // Hide loading state
    loadingState.style.display = 'none';
    
    // Update overview stats
    updateOverviewStats();
    
    // Generate conversation cards
    grid.innerHTML = conversations.map((conv, index) => 
        generateConversationCard(conv, index + 1)
    ).join('');
}

// Generate a single conversation card
function generateConversationCard(conversation, id) {
    const data = conversation.data[0];
    const comparisons = conversation.comparisons;
    const summary = comparisons.summary;
    
    // Determine completion status
    const status = determineCompletionStatus(data);
    
    // Generate metrics HTML
    const metricsHTML = generateMetricsHTML(summary);
    
    // Generate AI performance summary
    const aiSummary = generateAIPerformanceSummary(summary);
    
    return `
        <div class="conversation-card">
            <div class="conversation-header">
                <div>
                    <div class="conversation-id">Conversation #${id.toString().padStart(3, '0')}</div>
                    <div class="conversation-date">${formatDate(conversation.exportDate)}</div>
                </div>
                <div class="conversation-status ${status}">${status}</div>
            </div>
            
            <div class="metrics-section">
                ${metricsHTML}
            </div>
            
            <div class="ai-summary">
                <h4>AI Performance Summary</h4>
                ${aiSummary}
            </div>
        </div>
    `;
}

// Generate metrics HTML for all dimensions
function generateMetricsHTML(summary) {
    const dimensions = ['presence_resonance', 'field_continuity', 'somatic_drift', 'reflective_trace', 'overall_state'];
    
    return dimensions.map(dim => {
        const metrics = summary[dim] || {};
        return `
            <div class="dimension-metrics">
                <div class="dimension-title">${dim.replace('_', ' ')}</div>
                <div class="metric-row">
                    <span class="metric-label">MAE (post):</span>
                    <span class="metric-value">${formatNumber(metrics.post_mae)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">MAE (Δ):</span>
                    <span class="metric-value">${formatNumber(metrics.delta_mae)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Within ±1:</span>
                    <span class="metric-value">${formatNumber(metrics.pct_within_1_post)}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Dir agree (Δ):</span>
                    <span class="metric-value">${formatNumber(metrics.pct_direction_agree_delta)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Generate AI performance summary
function generateAIPerformanceSummary(summary) {
    const dimensions = ['presence_resonance', 'field_continuity', 'somatic_drift', 'reflective_trace', 'overall_state'];
    
    // Calculate overall MAE average
    const maeValues = dimensions.map(dim => summary[dim]?.post_mae).filter(v => v != null);
    const avgMae = maeValues.length > 0 ? maeValues.reduce((a, b) => a + b, 0) / maeValues.length : null;
    
    // Find best and worst dimensions
    let bestDim = null;
    let worstDim = null;
    let bestMae = Infinity;
    let worstMae = -Infinity;
    
    dimensions.forEach(dim => {
        const mae = summary[dim]?.post_mae;
        if (mae != null) {
            if (mae < bestMae) {
                bestMae = mae;
                bestDim = dim;
            }
            if (mae > worstMae) {
                worstMae = mae;
                worstDim = dim;
            }
        }
    });
    
    // Count good change tracking
    const goodChangeTracking = dimensions.filter(dim => {
        const deltaMae = summary[dim]?.delta_mae;
        return deltaMae != null && deltaMae <= 1.0;
    }).length;
    
    // Generate overall rating
    let overallRating = 'Unknown';
    if (avgMae != null) {
        if (avgMae < 0.5) overallRating = 'Excellent';
        else if (avgMae < 1.0) overallRating = 'Good';
        else if (avgMae < 1.5) overallRating = 'Fair';
        else overallRating = 'Poor';
    }
    
    return `
        <div class="summary-item">
            <span class="summary-label">Overall:</span>
            <span class="summary-value">${overallRating} agreement (MAE avg: ${formatNumber(avgMae)})</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Best:</span>
            <span class="summary-value">${bestDim ? bestDim.replace('_', ' ') : 'N/A'} (${formatNumber(bestMae)})</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Worst:</span>
            <span class="summary-value">${worstDim ? worstDim.replace('_', ' ') : 'N/A'} (${formatNumber(worstMae)})</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Change tracking:</span>
            <span class="summary-value">${goodChangeTracking}/${dimensions.length} dimensions</span>
        </div>
    `;
}

// Determine completion status of a conversation
function determineCompletionStatus(data) {
    const assessments = data.assessments;
    const hasPre = Object.keys(assessments.pre?.human || {}).length > 0;
    const hasMid = Object.keys(assessments.mid?.human || {}).length > 0;
    const hasPost = Object.keys(assessments.post?.human || {}).length > 0;
    
    if (hasPre && hasMid && hasPost) return 'complete';
    if (hasPre || hasMid || hasPost) return 'partial';
    return 'incomplete';
}

// Update overview statistics
function updateOverviewStats() {
    const total = conversations.length;
    const completed = conversations.filter(conv => 
        determineCompletionStatus(conv.data[0]) === 'complete'
    ).length;
    
    // Calculate overall agreement
    let totalMae = 0;
    let maeCount = 0;
    
    conversations.forEach(conv => {
        const summary = conv.comparisons.summary;
        const dimensions = ['presence_resonance', 'field_continuity', 'somatic_drift', 'reflective_trace', 'overall_state'];
        
        dimensions.forEach(dim => {
            const mae = summary[dim]?.post_mae;
            if (mae != null) {
                totalMae += mae;
                maeCount++;
            }
        });
    });
    
    const avgMae = maeCount > 0 ? totalMae / maeCount : 0;
    const overallAgreement = Math.max(0, 100 - (avgMae * 20)); // Convert MAE to percentage
    
    // Update DOM
    document.getElementById('totalConversations').textContent = total;
    document.getElementById('completedConversations').textContent = completed;
    document.getElementById('overallAgreement').textContent = `${Math.round(overallAgreement)}%`;
    
    // Update date range
    if (conversations.length > 0) {
        const dates = conversations.map(conv => new Date(conv.exportDate));
        const earliest = new Date(Math.min(...dates));
        const latest = new Date(Math.max(...dates));
        document.getElementById('dateRange').textContent = `${formatDate(earliest)} - ${formatDate(latest)}`;
    }
}

// Show no conversations state
function showNoConversationsState() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('noConversationsState').style.display = 'block';
}

// Export all safe versions (placeholder for future implementation)
function exportAllSafeVersions() {
    alert('Export functionality will be implemented in the next phase');
}

// Utility functions
function formatNumber(n) {
    if (n == null || Number.isNaN(n)) return '—';
    return typeof n === 'number' ? n.toFixed(3) : String(n);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAllConversations();
});
