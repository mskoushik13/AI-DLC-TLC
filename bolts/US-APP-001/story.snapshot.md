<!-- story-snapshot
  source: inputs/stories/US-APP-001.md
  sha256: ee010daf8141
  taken: 2026-10-05T09:53:57.002Z
-->
# US-APP-001 — Create a new application

**Type:** Story
**Feature area:** Application management
**Application under test:** http://10.11.13.219:669/

---

## Story

**As a** signed-in user
**I want** to add a new application with a name, description and URL
**So that** it is registered in the system and listed on the Application page

## Screens involved

| Screen | URL |
|---|---|
| Login | http://10.11.13.219:669/#/login |
| Dashboard | http://10.11.13.219:669/#/dashboard |
| Application (list) | http://10.11.13.219:669/#/application |
| Add Application | http://10.11.13.219:669/#/applicationdown |

## Acceptance criteria

1. Given valid credentials, when I sign in on the Login screen, then I am authenticated and the Dashboard (`/#/dashboard`) is displayed.
2. Given I am on the Dashboard, when I navigate to Application, then the Application screen (`/#/application`) is displayed.
3. Given I am on the Application screen, when I choose to add an application, then the Add Application screen (`/#/applicationdown`) is displayed with fields for Name, Description and URL.
4. Given the Add Application screen is open, when I enter Name "MSKOUSHIK", any description text, and a valid public URL, and save, then the application is created without errors.
5. Given the application has been saved, when I view the Application screen, then the new application is listed with the Name, Description and URL exactly as entered.

## Test data

| Field | Value |
|---|---|
| Name | `MSKOUSHIK` |
| Description | any text, e.g. `Automated test application` |
| URL | any reachable public URL, e.g. `https://example.com` |

Credentials are not part of this story. They are read from `.env.local`
(`E2E_USER` / `E2E_PASSWORD`).

## Out of scope

- Editing or deleting an existing application
- Field validation rules (required fields, URL format, length limits) — not
  specified; see open questions

## Open questions for Gate 1

- Which control opens Add Application from the Application screen (button,
  menu item)? Confirm `/#/applicationdown` is the intended route name.
- What confirms a successful save — a message, a redirect back to
  `/#/application`, or both? What is the exact message text?
- Is Name required to be unique? A second run with `MSKOUSHIK` may be rejected
  as a duplicate — should test runs append a timestamp to the name?
- Can a created application be deleted? If not, every run leaves a permanent
  record.
- Which of Name, Description and URL are mandatory?

## Notes / dependencies

- The application is on an internal address (`10.11.13.219`) over plain HTTP;
  the machine running the bolt must be on that network.
- A valid user account is a prerequisite for every criterion.
