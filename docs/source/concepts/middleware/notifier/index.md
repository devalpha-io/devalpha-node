---
title: Notifier
next: concepts/middleware/journaler
---

# Notifier

## Setup Slack Notifications

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

The Notifier middleware will then send a Slack notification each time an event passes through it.

## Backtesting

This middleware is not active when backtesting, as there is no point in receiving notifications during backtests.
