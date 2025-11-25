🔵 PHASE 0 — Database (Start Here)

Before UI, build the database tables for:

1. Users

userID → format #AD1234

fullName

email

password (hashed)

avatar

QRcode data

deviceToken (to skip Access Page)

2. Groups

groupID

groupName

createdBy

members[] (userIDs)

roles[]

activity log

3. Recents

recentGroups[]

recentPresentations[]

recentTemplates[]

lastActiveGroup

4. Templates

templateID

templateName

previewImage

🔵 PHASE 1 — Welcome Page + Auto-Login
Features:

Trebuchet font

Aramco branding

“Get Started” button

Check if deviceToken exists

If yes → skip Access Page

Go directly to Home Page

Load user info

🔵 PHASE 2 — Access Page (Login)
Features:

Email

Password

Trebuchet font

“Remember this device” option

After login:

Generate and save deviceToken

Go to Home Page

Load recents, templates, groups

🔵 PHASE 3 — Home Page (Your Biggest Part)
A. Sidebar Structure

Groups

Arrow toggle

New Group

Recent Groups

See More

Presentations

Arrow toggle

New Presentation

Recent Presentations

See More

Templates

Arrow toggle

Template categories

Recently used

All sections must be collapsible.
B. Chatbot Button (New Feature Added)

Add a floating or top-right “AI Assistant” button.

When clicked:

Opens a small chat window

User can type questions

Or use voice input

Chatbot only answers things related to:

How to use the website

How to create groups

How to use templates

How to manage presentations

How to use features

Make it simple, small, clean corporate UI.

C. Main Home Page Content

User’s name

User ID (#AD1234)

Button to show/download QR code

Their recent groups

Recent presentations

Recently used templates

All in Trebuchet font.

🔵 PHASE 4 — Group Page
Features:

Members shown on top-right

Roles

Add members by:

User ID

Scanning QR Code

Invite link

Clicking invite link → join group immediately

Group slides list in a clean layout

Activity log

Autosave recents

🔵 PHASE 5 — Simplicity & UX
Rules:

Everything uses Trebuchet

Clean navigation

Minimal buttons

Consistent styling

Fast loading

Corporate style

Smooth animations but not heavy