# Project Guide: Conversation Emotional State Labeling & Evaluation

## Purpose

We are building a system to label emotional states for **ChatGPT conversation data** in order to test the hypothesis:

> *"The bot does not reliably leave the user in a more regulated state than when the conversation began."*

This system will:
- Allow **human self-labeling** of conversations at three checkpoints (pre, mid, post)
- Use the same 1–7 Likert scale across **five dimensions**:
  1. Presence Resonance
  2. Field Continuity
  3. Somatic Drift
  4. Reflective Trace
  5. Overall Emotional State
- Have the **AI perform the same labeling task** using conversation transcripts, so we can compare AI vs human ratings.
- Export results in a **structured JSON format** for evaluation.

---

## Labeling Flow

### Human Labeling
1. **Pre** — before first message (baseline)
2. **Mid** — after ~6 conversation turns
3. **Post** — after final turn

At each point, the human provides:
- Ratings for all 5 dimensions (1–7 scale)
- Optional notes field

### AI Labeling
- At each checkpoint, the AI is prompted with conversation context so far
- AI produces the same 5 ratings (1–7 scale) + a brief explanation

---

## Export Format

The export must contain **both human and AI ratings**, structured for easy evaluation.

Example JSON object for **one conversation**:

```json
{
  "conversation_index": 14,
  "conversation_title": "Overthinking after breakup",
  "num_turns": 12,
  "assessments": {
    "pre": {
      "human": {
        "presence_resonance": 2,
        "field_continuity": 3,
        "somatic_drift": 2,
        "reflective_trace": 3,
        "overall_state": 2,
        "notes": "Felt scattered and tense"
      },
      "ai": {
        "presence_resonance": 3,
        "field_continuity": 3,
        "somatic_drift": 2,
        "reflective_trace": 3,
        "overall_state": 3,
        "explanation": "User expressed tension and difficulty focusing"
      }
    },
    "mid": {
      "human": { },
      "ai": { }
    },
    "post": {
      "human": { },
      "ai": { }
    }
  },
  "messages": [
    { "role": "user", "text": "I don’t know why I keep spiraling like this." },
    { "role": "assistant", "text": "Want to walk me through what’s coming up right now?" }
  ]
}
```

---

## AI Labeling Prompt Template

At each checkpoint, provide the conversation so far to the AI and ask:

```
You are an emotionally intelligent assistant evaluating the user's emotional state.

Below is the conversation so far. Rate the user's likely state on the following 1–7 scale for each variable:
1 = Not at all true, 7 = Completely true

Variables:
1. Presence Resonance — grounded, calm, emotionally present
2. Field Continuity — coherent and connected thoughts
3. Somatic Drift — bodily/emotional awareness
4. Reflective Trace — depth of insight and integration
5. Overall Emotional State — regulation vs dysregulation

Return your answer as valid JSON with keys:
presence_resonance, field_continuity, somatic_drift, reflective_trace, overall_state, explanation

Conversation so far:
[conversation messages here]
```

---

## Evaluation Readiness

The export format must make it easy to compute:
- Change in human ratings (pre → post)
- Change in AI ratings (pre → post)
- Agreement between human and AI ratings (MAE, correlation, ±1 threshold, directionality)
- % of conversations where human-reported state improved

---

## Next Build Steps
1. **Human Label UI/CLI**: Form for selecting conversation, showing transcript, entering ratings.
2. **AI Labeling Layer**: Script that calls OpenAI API with prompt template above.
3. **Export Writer**: Saves combined human + AI labels into the JSON structure above.
4. **Eval Script**: Computes metrics comparing human vs AI + change detection.
