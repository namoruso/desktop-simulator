# WebOS Design System (Master)

**Style:** macOS Big Sur / Ventura dark — glassmorphism, grouped settings, SF system UI  
**Stack:** Next.js 14, React, Tailwind CSS  
**Skill:** ui-ux-pro-max (`.cursor/skills/ui-ux-pro-max/`)  
**Source of truth:** `app/globals.css` + `components/ui/os-ui.tsx`

## Color tokens

| Role | Variable | Hex (default) |
|------|----------|---------------|
| Accent | `--accent` | `#0a84ff` (Apple system blue) |
| App background | `--app-bg` | `#1e1e1e` |
| Elevated groups | `--app-bg-elevated` | `#2c2c2e` |
| Text primary | `--text-primary` | `#f5f5f7` |
| Text muted | `--text-muted` | `#98989d` |
| Separator | `--separator` | `rgba(255,255,255,0.08)` |
| Toggle on | `--mac-green` | `#34c759` |
| Traffic lights | `--mac-red/yellow/green` | macOS standard |

## Component classes (use these — avoid raw `slate-*` / `indigo-*`)

| Class | Usage |
|-------|--------|
| `mac-toolbar` | App toolbars (File Manager, Browser, editors) |
| `mac-sidebar` | Finder-style left column |
| `mac-field` | Text inputs, URL bar |
| `mac-search` | Search fields with padding |
| `mac-icon-btn` / `mac-icon-btn-active` | Toolbar icon buttons |
| `mac-btn` + `mac-btn-primary` / `mac-btn-danger` | Buttons |
| `mac-toggle` | 51×31 switches |
| `mac-select` | Dropdowns |
| `mac-range` | Sliders |
| `mac-settings-group` / `mac-settings-row` | Settings panels |
| `mac-segmented` / `mac-tab` / `mac-tab-active` | Tab bars |
| `mac-table` / `mac-table-wrap` | Data tables |
| `mac-panel` | Info cards |
| `mac-callout` | Accent hint boxes |
| `os-menu-item` | Spotlight, context menus |
| `os-glass-popover` | Menus, dialogs, toasts |
| `glass-window` / `app-chrome` | Window shell |
| `menubar-glass` / `dock-glass` | Desktop chrome |

## React components (`os-ui.tsx`)

`MacToggle`, `MacSelect`, `MacRange`, `MacButton`, `MacInput`, `MacSettingsGroup`, `MacSettingsRow`, `MacPage`, `MacIconButton`, `MacListItem` — prefer over ad-hoc markup.

## Rules

1. **Desktop OS simulator** — not a marketing landing page.
2. **Lucide icons only** — no emoji as icons.
3. **System font stack** — `-apple-system`, SF Pro; JetBrains Mono for terminal only.
4. **Terminal** — keep green-on-black output; only chrome uses mac tokens.
5. **Focus & motion** — `os-interactive`, `os-focus-ring`, respect `reduce-motion`.
6. **Unfocused windows** — muted title bar; focused: subtle accent ring on `glass-window.focused`.

## Anti-patterns

- `text-slate-*`, `bg-indigo-*`, `from-indigo-500 to-violet-600` on shell/apps
- Huge flat color blocks for accent picker (use `mac-color-swatch`)
- Raw pill toggles instead of `mac-toggle`
- Popovers with `bg-[rgba(18,22,32,0.98)]` instead of `os-glass-popover`
- Clickables without pointer cursor or keyboard focus

## Pre-delivery checklist (ui-ux-pro-max)

- [ ] No emojis as icons (Lucide)
- [ ] `cursor-pointer` on all clickables (`os-interactive`)
- [ ] Hover transitions 150–300ms
- [ ] Visible focus rings
- [ ] `prefers-reduced-motion` / Settings reduce motion
- [ ] Contrast on primary text vs backgrounds
