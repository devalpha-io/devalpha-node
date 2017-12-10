---
title: Notifier
next: concepts/journaler
---

# Notifier

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

## Backtesting

The Notifier is not active when backtesting, as there is no point in receiving notifications during backtests.
