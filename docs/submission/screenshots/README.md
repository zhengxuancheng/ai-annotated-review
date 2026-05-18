# Submission Screenshots

Generate local draft screenshots with:

```bash
npm run capture:screenshots
```

This creates `review-widget-desktop.png` from the local widget preview. Use production ChatGPT connector screenshots for OpenAI submission evidence.

The strict submission gate expects the production desktop screenshot at:

```text
docs/submission/screenshots/production-review-widget-desktop.png
```

Current note: `production-review-widget-desktop.png` was captured on 2026-05-18 after the stable Cloudflare Worker production connector passed Developer Mode validation. It was visually checked and shows ChatGPT web with connector `AI Annotated Review Production`, the embedded review widget, three annotations, two confirmed annotations, and a generated revision pack.
