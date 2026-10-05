# Traceability Matrix

Generated 2026-10-05T10:00:55.734Z · commit unknown · project CLC (brownfield)

**4/4 planned scenarios map to a named test**, across 1 bolt(s).

Last run: 5 passed, 0 failed, 0 skipped.

| Bolt | Planned scenario | Test | Matched by | Last run |
|---|---|---|---|---|
| US-APP-001 | 1.1 Sign in lands on the Dashboard | `1.1 sign in lands on the Dashboard @smoke` | header + title | ✅ passed |
| US-APP-001 | 1.2 Application screen opens from the Dashboard | `1.2 Application screen opens from the Dashboard @smoke` | header + title | ✅ passed |
| US-APP-001 | 1.3 Add Application screen shows Name, Description and URL fields | `1.3 Add Application shows Name, Description and URL fields @smoke` | header + title | ✅ passed |
| US-APP-001 | 1.4 Create an application and see it listed exactly as entered | `1.4 create an application and see it listed exactly as entered @regression` | header + title | ✅ passed |

## Gaps

_None — every planned scenario has a test._

## Retired

_None._

---

### How to read the "Matched by" column

| Value | Means | Trust |
|---|---|---|
| `header + title` | the spec file declares this scenario id in its `// spec:` header, and a test inside it matches by name | reliable |
| `header` | the spec file declares this scenario id, but no single test name matched — the file is named instead | reliable at file level |
| **title only** | **no spec file declares this id.** Matched by title similarity alone, which has bound scenarios to the wrong test before | verify before quoting |

_Every matched row is anchored to a `// spec:` header. No row relies on title similarity._