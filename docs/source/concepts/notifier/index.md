---
title: Notifier
next: concepts/journaler
---

# Notifier

<div class="tile tile-centered tile-note tile-outside">
  <div class="tile-icon">
    <i class="icon icon-alert-triangle"></i>
  </div>
  <div class="tile-content">
    <p class="tile-subtitle">This module is **not active** when backtesting, since there is no point in receiving notifications.</p>
  </div>
</div>

## Slack Notifications

1. Visit `https://<YOUR-WORKSPACE>.slack.com/apps/manage`
2. Search for "Incoming Webhooks"
3. Click the "Add Configuration" button
4. Copy the Webhook URL
5. Paste it into your Vester configuration as below:

```javascript
run({
  ...,
  slackUrl: '<YOUR-WEBHOOK-URL>',
  ...
})
```

The Notifier will then send a Slack notification each time an event passes through it.
