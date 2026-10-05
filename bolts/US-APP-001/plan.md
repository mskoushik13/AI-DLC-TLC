# Enigma-AI — Create a new application — Test Plan
Bolt: US-APP-001  |  Seed: tests/app.seed.spec.ts  |  App: http://10.11.13.219:669/  |  Config: playwright.app.config.cts  |  Context: none (code_grounding: off)

## Application overview
Enigma-AI is a hash-routed web app. A signed-in user reaches the Application screen from the side menu. It holds a paginated, searchable table of applications (110 today, 10 per page) with Name, Description, URL and Actions columns. "Add Application" opens a form (`/#/applicationdown`) with App Name, Description and URL, all marked `*`. A successful save shows a confirmation dialog.

## Screens in scope, and whether each was opened live

| Screen | Opened | What came back |
|---|---|---|
| Login `/#/login` | yes | "Welcome Back!", Email / Password textboxes, "Sign In" button |
| Dashboard `/#/dashboard` | yes | side menu incl. Application; "Login is succeed!" toast |
| Application `/#/application` | yes | heading "Application", "Add Application" button, "Keyword Search", table headers *Application Name · Application Description · Application URL · Actions*, pager "1 to 10 of 110" |
| Add Application `/#/applicationdown` | yes, saved twice | heading "Application Management", "Add New Application", App Name / Description / URL, Save / Cancel; success dialog observed |

## Coverage of acceptance criteria

| Criterion | Scenario(s) | Notes |
|---|---|---|
| AC1 sign in → Dashboard | 1.1 | |
| AC2 Dashboard → Application | 1.2 | via side menu link |
| AC3 Add Application screen with Name, Description, URL | 1.3 | route confirmed as `/#/applicationdown` |
| AC4 save "MSKOUSHIK" without errors | 1.4 | name is `MSKOUSHIK_<timestamp>` (owner decision); see Q1 below on the dialog wording |
| AC5 listed with Name, Description, URL exactly as entered | 1.4 | found via Keyword Search because the list is paginated |

## Test scenarios

### 1. Application management

#### 1.1 Sign in lands on the Dashboard
**Priority:** smoke
**Preconditions:** signed out; E2E_USER / E2E_PASSWORD in .env.local
**Steps:**
1. Open the Login screen.
2. Enter the email and password and choose "Sign In".
**Expected results:**
- The address is `/#/dashboard`.
- The side menu shows "Application".
**Source:** live app; story AC1

#### 1.2 Application screen opens from the Dashboard
**Priority:** smoke
**Preconditions:** signed in (as 1.1)
**Steps:**
1. Choose "Application" in the side menu.
**Expected results:**
- The address is `/#/application`.
- A heading reads "Application" and an "Add Application" button is shown.
- The table shows the columns Application Name, Application Description, Application URL, Actions, and at least one data row once loaded. The table shows "No Data Found" for up to ~3s before rows arrive, so the check waits for real rows.
**Source:** live app; story AC2

#### 1.3 Add Application screen shows Name, Description and URL fields
**Priority:** smoke
**Preconditions:** on the Application screen
**Steps:**
1. Choose "Add Application".
**Expected results:**
- The address is `/#/applicationdown`.
- The "App Name", "Description" and "URL" fields are shown, empty and editable, each labelled with `*`.
- "Save" and "Cancel" buttons are shown.
**Source:** live app; story AC3

#### 1.4 Create an application and see it listed exactly as entered
**Priority:** regression
**Preconditions:** signed in; no application with this run's name exists (guaranteed by the timestamp)
**Steps:**
1. From the Application screen choose "Add Application".
2. Enter App Name `MSKOUSHIK_<timestamp>`, Description `Automated test application`, URL `https://example.com`. Leave App Type, AI App and Login required? at their defaults.
3. Choose "Save".
4. Close the confirmation dialog with "OK".
5. Go to the Application screen and type the name into "Keyword Search".
6. Cleanup (always runs, even if a check fails): choose "Remove App" on that row, then "Yes, delete it!", then "OK" on "Deleted!".
**Expected results:**
- After Save, a dialog appears with the heading "Application Created Successfully!" (see Q1) and the text "You can now return to the applications list."
- No browser error pop-up appears. The failure case shows "Failed to save application data. Please check the network or inputs.", so any such pop-up fails the test.
- The search shows exactly one row ("1 to 1 of 1"), whose cells read exactly the name, `Automated test application` and `https://example.com`.
**Source:** live app (exploration saves 2026-10-05); story AC4, AC5

## Not covered by E2E

| Behaviour | Why | Where it should be tested |
|---|---|---|
| Required-field / URL-format / length validation | Story marks it out of scope; no rules specified | A follow-up story once rules are written |
| Duplicate-name rejection | Out of scope here, but observed live (see Discrepancies) | Separate story; the message wording needs a product decision first |
| Editing and deleting applications | Out of scope. Delete is used only as cleanup and is not asserted as a feature | Separate story |
| App Type / AI App / Login required? toggles | Not in the story | Separate story |

## Discrepancies (story vs live app)
> Grounding: off. No source code was read. The only comparison is the story against the live app.

| Story / expectation | App does | Impact |
|---|---|---|
| Story test data says Name is `MSKOUSHIK` | A second save with the same name is rejected, so a fixed name passes only once | Resolved by owner: `MSKOUSHIK_<timestamp>` |
| A save failure should say why | A duplicate name gets HTTP 200 with an empty record from the server, and the UI shows a plain browser pop-up blaming "the network or inputs" | Users aren't told the name already exists. Worth raising with the product team; not tested here |
| Success message (story asked what it is) | The heading renders literal asterisks: **"Application \*\*Created\*\* Successfully!"** | Cosmetic defect: markdown isn't rendered. See Q1 |
| The list shows the new application | The list first renders "No Data Found" for ~3s, then rows | Not a bug, but a test that reads the table too early would wrongly fail |

## Questions for the approver

**Q1. How strictly should the success heading be checked?**
1. Accept the heading with or without the asterisks: it must say "Application", "Created", "Successfully!" in that order **[recommended]**. The test stays green when the asterisk bug is fixed, and still fails if the message changes meaning.
2. Exact text as shown today, asterisks included. This bakes the cosmetic bug into the test, which will go red when the bug is fixed.
3. Exact text without asterisks. The test is red today, tagged `@known-defect` for the asterisk bug.

## Assumptions
- App Type (Web), AI App (off) and Login required? (off) stay at their defaults.
- Exploration created 2 throwaway applications and deleted both. Net permanent records: **0**.
- The OK button on the success dialog was not clicked during exploration. Generation will observe where it leads before writing step 4.

## Permanent data cost
1 application per run of 1.4, deleted by the cleanup step. This bolt: 1 × (1 run + 0 diagnostic + 0 heal re-runs + 1 determinism run) = **2 created, 0 kept**. A record survives only if the cleanup itself fails, and the test reports that loudly.
