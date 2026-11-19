# Reference Design System (CANSALE DMS)

Evidence: the manual screenshots (1366px viewport) in `screenshots/manual-branch/` and live Admin screenshots (18-Nov-2026).
Values marked **(est.)** were read from screenshots. The rest are to be confirmed by computed-style measurement once a live session is available. Live measurement was blocked on 19-Nov because the session expired.

## Framework fingerprint
Bootstrap 3 + jQuery DataTables + Font Awesome 4 icons + Highcharts (dashboard "Plain / Inverted / Polar" toggles are the Highcharts demo pattern).

## Layout
| Element | Value |
|---|---|
| Sidebar width | 246px (est.), fixed, full height |
| Sidebar bg | #2f353b-ish dark slate (est.) |
| Logo area | white bg, ~40px tall, logo left |
| User box | 11px white bold: `NAME (LOGINID)`, then date `Wednesday, April 29th 2020` + power icon |
| Menu item | ~29px row, 13px white, coloured FA icon left, chevron-down right, 1px darker divider |
| Active parent | lighter bg (#3d454d est.) + green left border (3px) |
| Sub item | indented ~25px, 11px white, coloured icon, active sub = lighter bg |
| Content | margin-left 246px, padding ~12px 20px |
| Page title | centered, 24px, #333, FA icon before text, ~30px top margin |
| Footer | full width, #555 bg, ~48px, white bold 12px centered text |

## Tables (DataTables)
- "Show [10▾] entries" left, "Search: [input]" right, 12px.
- Header bg #337ab7, white bold 12px, sort arrows, cell borders white-ish.
- Rows ~30px, 12px #333, zebra (#f9f9f9 / #fff), 1px #ddd borders.
- Icon columns: eye (view, #337ab7), print, pencil-square (edit), trash (cancel), centered.
- Footer: "Showing 1 to 10 of N entries" left, Previous / 1 2 / Next right.
- Status text colours: PFA = red (#d9534f est.), Approved/Received = default.

## Panels (detail pages)
- `panel-primary`: heading #337ab7 bg, white 12px bold, ~32px tall; body has a bordered table of label/value pairs, 4 columns (label bold).
- Sections in order: Party Information, Items Information, Amount Information, Logistic Information, Receiving Information, Approval Action.
- Centered **Back** button (btn-primary, small).

## Buttons
- Primary: #337ab7 bg, white, 4px radius, 12–13px, ~30px tall ("Add New PO", "GO", "Save", "Back").
- "Add New …" sits top-right above the table.

## Forms
- 2-column label/input grid. Labels are bold 12px with a red `*` when required. Inputs are Bootstrap `form-control`, ~30px tall.
- Line-item grid: product select + numeric inputs, with an add-row "+" button.
- Totals block on the right: Sub Total, Total Qty, Total Discount, Grand Total.

## Dashboard tiles
Solid colour cards with the value top-left, the label bottom-right and a translucent icon:
- Sale: green #28a745
- Purchase: amber #ffc107
- PO: teal #17a2b8
- Collection: grey #6c757d
- Inventory: blue #007bff
- Outstanding: red #dc3545

## Typography
Font family "Helvetica Neue", Helvetica, Arial, sans-serif (Bootstrap 3 default). Base size 12–13px.
