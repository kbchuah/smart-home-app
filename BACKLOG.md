# Backlog

Tracker for parked ideas and open decisions. Move items to **Done** when shipped.

## To do

| # | Item | Notes | Status |
|---|------|-------|--------|
| 1 | **Pre-fill last verified mobile number in TAC step** | Suggest the most recently verified number (editable). A TAC is still required every time, because the verified number decides billing (Charge to Bill vs Direct Debit). Don't take it from the sign-up profile. | Agreed, later |
| 2 | Enforce plan device limit | Premium Home allows up to 4 devices per home. Decide: block or warn at the limit. KB home's demo data (13 devices) is already over the limit. | Needs decision |
| 3 | Rooms synced from the home's ecosystem | For homes powered by Google Home / SmartThings / Apple Home, rooms should come from that system ("Synced from …"), and local room editing turned off. Check each system's developer API for write access. | Idea |
| 4 | Enable more device types in pairing | Speaker, smart display, light, plug, aircond, lock, doorbell are currently "Coming soon". Only Camera works. | Later |
| 5 | AI features from the marketing page | AI assistant (plain-language control), suggested routines, smart camera alerts, energy insights. Marketing copy only so far. | Later |

## Done

- Marketing page with single Premium Home plan (MYR 60/month), consent + Malaysia-only checkboxes
- Mock Google sign-up / login; demo accounts: KB (1 home), future@example.com (3 homes)
- Homes ("structures") with "Powered by" ecosystem label
- Device pairing flow modelled on Google Home (create home → system → camera → scan → Wi-Fi → room → name)
- Per-home subscription: TAC → Charge to Bill (telco customer) or Direct Debit → paired-device count → agree
- First-pairing flow v2: home (default “My home”, Google) → mock QR/serial → compatibility → price rule → agree → TAC → payment → eligibility checks with retry → processing → success (room “My room”)
- Eligibility-failure routing approved: spend limit / inactive / card declined / expired → payment method (failed option disabled); timeout → retry on confirm. Never back to TAC or scan.
- Demo simulator panel (force scan / compatibility / billing outcomes) + “What does what” reference
- First pairing: Wi-Fi connect before pricing/billing (wrong password / weak signal / offline → retry or choose network); room & name after activation (defaults: “My room”, model name)
- Pilot: Google Home only — create-home screen removed; first home auto-created as “My Home”, renamable in Home settings (⚙)
