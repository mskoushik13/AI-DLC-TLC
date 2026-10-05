# Enigma-AI application app — project notes

App at `http://10.11.13.219:669/` (BASE_URL in .env.local). Not CrewHub: the other
files in this folder do not apply to it. Seed: `tests/app.seed.spec.ts`. Config:
`playwright.app.config.cts`. First observed in bolt US-APP-001, 2026-10-05.

## Sign-in
- `/#/login`: textboxes "Email" and "Password", button "Sign In". About 2.5s to `/#/dashboard`.
- Shows a "Login is succeed!" toast (role alert) after sign-in.

## Application list (`/#/application`)
- **Grid shows "No Data Found" for ~3s before the rows arrive.** Wait for a row
  action icon (`img "Remove App"`), not for the table or for networkidle.
- Paginated, 10 per page (110+ applications on 2026-10-05, a shared environment that
  others write to). Find a row through the "Keyword Search" textbox. The pager is a
  span reading e.g. "1 to 1 of 1".
- Row cells: Name (a link), Description, URL, Actions (`img` "Modify App", "Grab", "Remove App").
- Remove: "Remove App" → dialog "Are you sure?" → "Yes, delete it!" → dialog "Deleted!" → "OK".

## Add Application (`/#/applicationdown`)
- Textboxes: "App Name", "Enter description", "Enter URL". Each field has **its own**
  `span.required-field` "*". App Name's sits beside its label, while Description's and
  URL's sit inside their labels. `getByText('*')` therefore matches 3 elements; scope
  to the field's `.form-group` row (heal, US-APP-001 1.3).
- Save → POST `:665/api/Application`, then POST `/api/ApplicationUserMapping`.
- **Success is a modal dialog, not a role=alert toast.** Heading "Application \*\*Created\*\*
  Successfully!" (literal asterisks, a cosmetic defect), text "You can now return to the
  applications list.", buttons "Close" and "OK". A generic alert/toast query misses it.
- **Duplicate name is rejected**: POST returns HTTP 200 with an empty record
  (`isNull: 1`) and the UI raises a *native* `window.alert` "Failed to save application
  data. Please check the network or inputs." Register a dialog handler before Save.
- Names must be unique per run: use a timestamp suffix.
