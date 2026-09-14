import { Analytics } from 'plausible/lib/client'

export const plausible = new Analytics({
  domain: 'caliber-analyzer.com',
  apiVersion: 1
})

export function trackEvent(name: string, props?: Record<string, any>) {
  plausible.track(name, props)
}

// Add this to your layout or main component:
// <Analytics src="https://plausible.io/js/plausible.js" domain="caliber-analyzer.com" apiVersion={1} />