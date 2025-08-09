function safeNumber(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function mae(a, b) {
  const diffs = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] != null && b[i] != null) diffs.push(Math.abs(a[i] - b[i]));
  }
  if (diffs.length === 0) return null;
  return diffs.reduce((s, x) => s + x, 0) / diffs.length;
}

function corr(a, b) {
  const xs = [], ys = [];
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x != null && y != null) { xs.push(x); ys.push(y); }
  }
  const n = xs.length;
  if (n < 2) return null;
  const mean = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? null : num / den;
}

function extractSeries(items, keyPath) {
  // keyPath like ['assessments','pre','human','presence_resonance']
  return items.map(item => {
    let ref = item;
    for (const k of keyPath) {
      ref = (ref && ref[k] != null) ? ref[k] : null;
    }
    return safeNumber(ref);
  });
}

function computePerConversationChange(assess) {
  const dims = ['presence_resonance','field_continuity','somatic_drift','reflective_trace','overall_state'];
  const out = { human: {}, ai: {} };
  dims.forEach(d => {
    const hPre = safeNumber(assess.pre?.human?.[d]);
    const hPost = safeNumber(assess.post?.human?.[d]);
    const aPre = safeNumber(assess.pre?.ai?.[d]);
    const aPost = safeNumber(assess.post?.ai?.[d]);
    out.human[d] = (hPre != null && hPost != null) ? (hPost - hPre) : null;
    out.ai[d] = (aPre != null && aPost != null) ? (aPost - aPre) : null;
  });
  return out;
}

function computeComparisons(exportArray) {
  const dims = ['presence_resonance','field_continuity','somatic_drift','reflective_trace','overall_state'];
  const result = { per_conversation: [], summary: {} };

  // Per-conversation deltas
  exportArray.forEach(item => {
    result.per_conversation.push({
      conversation_index: item.conversation_index,
      conversation_title: item.conversation_title,
      change: computePerConversationChange(item.assessments)
    });
  });

  // Summary metrics for each dimension on post checkpoint (human vs ai) and change agreement
  dims.forEach(d => {
    const humanPost = extractSeries(exportArray, ['assessments','post','human', d]);
    const aiPost = extractSeries(exportArray, ['assessments','post','ai', d]);
    const humanPre = extractSeries(exportArray, ['assessments','pre','human', d]);
    const aiPre = extractSeries(exportArray, ['assessments','pre','ai', d]);
    const humanDelta = humanPost.map((v, i) => (v != null && humanPre[i] != null) ? (v - humanPre[i]) : null);
    const aiDelta = aiPost.map((v, i) => (v != null && aiPre[i] != null) ? (v - aiPre[i]) : null);

    const maePost = mae(humanPost, aiPost);
    const corrPost = corr(humanPost, aiPost);
    const maeDelta = mae(humanDelta, aiDelta);
    const corrDelta = corr(humanDelta, aiDelta);

    // +/-1 agreement
    let agreeWithin1 = 0, denom = 0;
    for (let i = 0; i < humanPost.length; i++) {
      if (humanPost[i] != null && aiPost[i] != null) {
        denom++;
        if (Math.abs(humanPost[i] - aiPost[i]) <= 1) agreeWithin1++;
      }
    }
    const pctWithin1 = denom > 0 ? agreeWithin1 / denom : null;

    // Directionality agreement on delta
    let dirAgree = 0, dirDenom = 0;
    for (let i = 0; i < humanDelta.length; i++) {
      const hd = humanDelta[i], ad = aiDelta[i];
      if (hd != null && ad != null) {
        dirDenom++;
        const signH = hd > 0 ? 1 : (hd < 0 ? -1 : 0);
        const signA = ad > 0 ? 1 : (ad < 0 ? -1 : 0);
        if (signH === signA) dirAgree++;
      }
    }
    const pctDirAgree = dirDenom > 0 ? dirAgree / dirDenom : null;

    result.summary[d] = {
      post_mae: maePost,
      post_corr: corrPost,
      delta_mae: maeDelta,
      delta_corr: corrDelta,
      pct_within_1_post: pctWithin1,
      pct_direction_agree_delta: pctDirAgree
    };
  });

  // % conversations with human-reported improvement on overall_state
  const overallHumanPre = extractSeries(exportArray, ['assessments','pre','human','overall_state']);
  const overallHumanPost = extractSeries(exportArray, ['assessments','post','human','overall_state']);
  let improved = 0, total = 0;
  for (let i = 0; i < overallHumanPost.length; i++) {
    if (overallHumanPost[i] != null && overallHumanPre[i] != null) {
      total++;
      if (overallHumanPost[i] - overallHumanPre[i] > 0) improved++;
    }
  }
  result.summary.human_improved_overall_pct = total > 0 ? improved / total : null;

  // Composite: Attunement Match Score (average post MAE across dimensions)
  const postMaeVals = dims.map(d => result.summary[d].post_mae).filter(v => v != null);
  result.summary.attunement_match_score_post_mae = postMaeVals.length ? (postMaeVals.reduce((s,v)=>s+v,0)/postMaeVals.length) : null;

  // Transformational Sensitivity on overall_state using strong improvement threshold (>= 2 points)
  const overallAiPre = extractSeries(exportArray, ['assessments','pre','ai','overall_state']);
  const overallAiPost = extractSeries(exportArray, ['assessments','post','ai','overall_state']);
  let humanStrong = 0, aiStrong = 0, bothStrong = 0, denomStrong = 0;
  for (let i = 0; i < overallHumanPost.length; i++) {
    const hpre = overallHumanPre[i], hpost = overallHumanPost[i];
    const apre = overallAiPre[i], apost = overallAiPost[i];
    if (hpre != null && hpost != null && apre != null && apost != null) {
      denomStrong++;
      const hDelta = hpost - hpre;
      const aDelta = apost - apre;
      const hStrong = hDelta >= 2; // human strong improvement
      const aStrong = aDelta >= 2; // ai strong improvement
      if (hStrong) humanStrong++;
      if (aStrong) aiStrong++;
      if (hStrong && aStrong) bothStrong++;
    }
  }
  const recall = humanStrong > 0 ? (bothStrong / humanStrong) : null; // sensitivity
  const precision = aiStrong > 0 ? (bothStrong / aiStrong) : null;
  const f1 = (precision != null && recall != null && (precision + recall) > 0) ? (2 * precision * recall) / (precision + recall) : null;
  result.summary.transformational_sensitivity = {
    threshold_points: 2,
    human_strong_improve_pct: denomStrong > 0 ? (humanStrong / denomStrong) : null,
    ai_strong_improve_pct: denomStrong > 0 ? (aiStrong / denomStrong) : null,
    precision_ai_detects_human_strong: precision,
    recall_ai_detects_human_strong: recall,
    f1_ai_detects_human_strong: f1
  };

  // Cohen's Kappa on binary regulated/dysregulated at post using overall_state threshold (>=5 regulated)
  const humanPostOverall = overallHumanPost;
  const aiPostOverall = overallAiPost;
  const humanCat = humanPostOverall.map(v => (v != null ? (v >= 5 ? 1 : 0) : null));
  const aiCat = aiPostOverall.map(v => (v != null ? (v >= 5 ? 1 : 0) : null));
  const kappa = computeKappaBinary(humanCat, aiCat);
  result.summary.overall_state_post_binary_kappa = kappa;

  return result;
}

function computeKappaBinary(human, ai) {
  // Filter pairs with non-null values
  const pairs = [];
  for (let i = 0; i < human.length; i++) {
    if (human[i] != null && ai[i] != null) pairs.push([human[i], ai[i]]);
  }
  const n = pairs.length;
  if (n === 0) return null;
  // Confusion counts: categories 0 and 1
  let n00 = 0, n01 = 0, n10 = 0, n11 = 0;
  pairs.forEach(([h, a]) => {
    if (h === 0 && a === 0) n00++;
    else if (h === 0 && a === 1) n01++;
    else if (h === 1 && a === 0) n10++;
    else if (h === 1 && a === 1) n11++;
  });
  const Po = (n00 + n11) / n;
  const pH0 = (n00 + n01) / n; // human 0 proportion
  const pH1 = (n10 + n11) / n; // human 1 proportion
  const pA0 = (n00 + n10) / n; // ai 0 proportion
  const pA1 = (n01 + n11) / n; // ai 1 proportion
  const Pe = (pH0 * pA0) + (pH1 * pA1);
  const denom = (1 - Pe);
  if (denom === 0) return null;
  return (Po - Pe) / denom;
}
