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
| 6 | Own-device message | Scanning a camera already in the customer's *own* home should say “This camera is already in My Home” (not “registered to another account”). | Later |
| 7 | Backend errors before payment | Simulate the compatibility / price-quote services being unreachable, with retry. | Later |
| 8 | Success follow-ups | “We've sent a confirmation by SMS and email”, plus a place to view / cancel the subscription later. | Later |
| 9 | Legal links on price agreement | Terms of service and privacy policy links on the agreement checkbox. | Later |

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
- Pilot: Google Home only — create-home screen removed; first home auto-created as “My Home” (then “My Home 2”, “My Home 3”… if taken), renamable in Home settings (⚙)
- TAC failures (incorrect with tries left, expired → resend, 3 wrong → locked 30 min) and telco account check right after TAC (spend limit / inactive → Charge to Bill not offered); Confirm-time check kept as backup
- TAC lock is account-wide (all mobile numbers) for 30 min, persists across restarting the flow and page reloads; shown from the first pairing step; demo “Clear TAC lock”
- First pairing: room & name step removed — camera goes to “My room”, named after its model; change later via Home settings (⚙) and the camera's Edit (✏️)
- Payment: Charge to Bill-eligible customers see only Charge to Bill; Direct Debit shown only when Charge to Bill isn't possible (not telco, blocked after TAC, or fails at Confirm)
- Processing failures after payment/agreement (device registration, subscription activate/update) with “not charged”, retry and support reference
- Adding devices to an existing home uses the new flow (scan → compatibility → Wi-Fi → price); 5th+ device shows current → new price with agreement
- “Leave setup?” confirmation when exiting the pairing flow mid-way
- Existing-home add device: Room step (pick existing room with device counts, or create a new one; duplicate names reuse the existing room)
- “Reset all demo data” on the marketing page and in the Demo simulator (clears all saved homes and TAC locks, signs out)
- Session kept across refresh (straight into the home, or homes list); cleared by Log out and Reset all demo data
- Subscription card inside each home (plan, monthly charge from device count, included-device meter, payment method; tap for breakdown) and monthly price on the homes list
- Add device on existing home: home Wi-Fi hint and pre-selection; warning (not a block) when a different network is chosen, repeated on success
- Device Wi-Fi visibility: per-device network in device details, 'Different Wi-Fi' tile label and home banner, Change Wi-Fi (mock reconnect with failures)
- Cancel Premium per home (what you lose / keep, ends at billing period, undo), free tier (Premium features locked, devices kept, add devices free), upgrade back via TAC + payment
- Unpair device with fee impact (drop applies from next renewal, current price kept until then; no change within 4 included, free/ending homes, last-device note); demo skip to renewal
- Renewal dates: Charge to Bill on the telco bill cycle day, Direct Debit on the subscription anniversary, clamped to month end; demo homes have fixed anchors
- Pro-rated first bill for Charge to Bill (sign-up to first bill cycle date: price × days ÷ days in period); shown on payment option, confirm, success and subscription details
