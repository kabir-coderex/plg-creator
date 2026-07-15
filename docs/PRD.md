# Product Requirements Document (PRD)

# Project Name

**PLG 3.0 — AI Native Creator Platform**

**Tagline**

> Build your entire creator business from your terminal.

---

# Vision

PLG 3.0 is an AI-native creator platform where creators manage their complete business by talking to AI instead of navigating dashboards.

Unlike Kajabi, where users manually click through dozens of screens, PLG 3.0 exposes every capability through MCP (Model Context Protocol) tools.

A creator can open Claude Desktop, Codex, Gemini, Cursor, or the terminal and simply type:

> Create a landing page for my AI course.

or

> Launch cohort 8 next Monday with 200 seats.

or

> Send an email to students who completed Module 4 but haven't booked coaching.

Everything happens immediately on the live application.

The web application becomes the visual layer.

The AI becomes the operating system.

---

# Mission

Become the first truly AI-native creator operating system.

Not an AI feature inside a dashboard.

A platform whose primary interface is AI.

---

# Core Philosophy

Traditional SaaS

```
Human
    ↓
Dashboard
    ↓
Backend
```

PLG 3.0

```
Human
    ↓
Claude / GPT / Gemini / Terminal
    ↓
MCP
    ↓
Backend
    ↓
Live Website
```

No clicking.

No complex admin panels.

Just conversation.

---

# Target Users

Primary

* Coaches
* Educators
* Course creators
* Community builders
* Consultants
* Agencies

Secondary

* SaaS founders
* Solopreneurs
* Marketing teams
* Digital product creators

---

# Product Positioning

"We are not building another LMS."

"We are building the operating system for creator businesses."

Kajabi

↓

Dashboard First

PLG 3.0

↓

AI First

---

# Goals

Creators should be able to create, edit, manage and automate everything using AI.

Examples

```
Create a course.

Duplicate last month's funnel.

Increase coaching price.

Generate 20 emails.

Build a webinar.

Create landing page.

Import students.

Refund order.

Create automation.

Publish blog.

Analyze sales.

Create challenge.

Launch podcast.

Everything.
```

---

# Success Metrics

Within AI

* 90% of platform actions available through MCP
* Less than 10 seconds to perform common tasks
* Zero dashboard dependency

Platform

* Course creation < 30 sec
* Funnel creation < 60 sec
* Website creation < 2 min
* Email campaign < 30 sec

---

# Tech Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* TanStack Query
* Zustand

Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase Edge Functions
* Supabase Realtime

Infrastructure

* Netlify
* Supabase
* Resend
* Stripe
* Cloudflare Images (optional)
* Mux/Bunny Stream (video)
* Upstash Redis (cache)
* Trigger.dev / Inngest (background jobs)

Developer Experience

* MCP Server
* OpenAPI
* TypeScript SDK
* CLI
* AI SDK
* GitHub Actions

---

# Core Architecture

```
Next.js

↓

API Layer

↓

Supabase

↓

Services

Courses
Emails
Funnels
Payments
Community
Automation

↓

MCP Server

↓

Claude Desktop
Codex
Gemini
Cursor
Terminal
```

---

# Product Modules

---

# Module 1

Website Builder

Features

* Website builder
* Landing pages
* Sales pages
* Blog
* Navigation
* Themes
* Branding
* SEO
* Domain management
* Templates
* Sections
* Blocks
* Page analytics
* Preview mode
* Version history

AI Commands

```
Create homepage

Create landing page

Generate about page

Duplicate page

Improve SEO

Publish website
```

---

# Module 2

Products

Features

* Courses
* Mini Courses
* Membership
* Coaching
* Community
* Podcast
* Downloadables
* Evergreen
* Drip

---

# Module 3

Course Builder

Features

* Categories
* Lessons
* Video
* Audio
* PDFs
* Quiz
* Assignment
* Certificate
* Progress
* Completion
* Drip
* Locking
* Discussion
* Notes
* Downloads
* Live sessions

AI

```
Generate course

Import syllabus

Create quizzes

Generate certificates

Translate course
```

---

# Module 4

Coaching

Features

* One to One
* Group
* Packages
* Calendars
* Availability
* Zoom
* Google Meet
* Booking
* Reminder
* Notes

---

# Module 5

Community

Features

* Spaces
* Feed
* Posts
* Comments
* Reactions
* Polls
* Challenges
* Events
* Chat
* Members
* Leaderboard
* Moderation

Future

Slack-like channels

---

# Module 6

Funnels

Features

* Funnel Builder
* Templates
* Landing
* Checkout
* Thank You
* Webinar
* Lead Magnet
* Upsell
* Downsell
* Split Testing
* Analytics

---

# Module 7

Marketing

Features

* Broadcasts
* Sequences
* Tags
* Segments
* Forms
* Popups
* Lead Capture
* Campaigns
* Automations

---

# Module 8

Checkout

Features

* Stripe
* PayPal
* Coupons
* Taxes
* Subscription
* Payment Plans
* Upsells
* Order Bumps
* Currency

---

# Module 9

CRM

Features

* Contacts
* Activity
* Tags
* Purchase History
* Student Progress
* Lifetime Value
* Notes
* Custom Fields

---

# Module 10

Automation

Visual automation builder

Triggers

* Purchase
* Enrollment
* Complete lesson
* Complete course
* Tag added
* Tag removed
* Form submitted
* Payment failed
* Event booked

Actions

* Send email
* Add tag
* Remove tag
* Enroll
* Grant access
* Remove access
* Notify
* Create task
* Webhook
* Delay
* Conditions

---

# Module 11

Email

Features

* Visual Builder
* Rich Editor
* Variables
* Templates
* Scheduling
* Analytics
* Deliverability
* Drafts
* AI Writing

---

# Module 12

Analytics

Dashboard

Revenue

MRR

ARR

Subscriptions

Student growth

Email

Funnels

Conversion

Website traffic

Community activity

Cohort analytics

---

# Module 13

Events

Features

* Live
* Webinar
* Zoom
* Meet
* Replay
* Registration
* Reminder
* Attendance

---

# Module 14

Podcast

Features

* Public
* Private
* Episodes
* RSS
* Subscribers

---

# Module 15

Affiliate

Features

* Referral links
* Commission
* Payout
* Coupons
* Analytics

---

# Module 16

Admin

Features

* Users
* Roles
* Teams
* Permissions
* Import
* Export
* Audit Log
* Media

---

# Module 17

AI

Native AI Layer

Features

* AI Writing
* AI Course Generator
* AI Funnel Builder
* AI Website Builder
* AI Email Writer
* AI Community Manager
* AI Analytics
* AI Assistant

---

# Module 18

MCP

The Heart of PLG 3.0

Every feature must expose an MCP Tool.

Example

```
create_course()

update_lesson()

create_funnel()

publish_page()

duplicate_product()

send_email()

create_offer()

refund_payment()

generate_coupon()

create_blog()

create_event()

create_space()

create_membership()

create_workflow()

search_contacts()

analytics_report()

upload_video()

publish_course()
```

Everything accessible from AI.

---

# MCP Workflow

Example

User

```
Create a new AI course.
```

Claude

↓

MCP

↓

create_course()

↓

Supabase

↓

Website updates live

---

# Permissions

Workspace

↓

Products

↓

Resources

↓

Actions

Fine-grained permissions for

* Admin
* Manager
* Instructor
* Assistant
* Support

---

# API

REST

GraphQL (future)

MCP

TypeScript SDK

Webhooks

---

# Database

Core Entities

Users

Organizations

Products

Courses

Lessons

Categories

Memberships

Funnels

Pages

Emails

Automations

Orders

Subscriptions

Contacts

Tags

Events

Communities

Posts

Comments

Media

Analytics

Notifications

Offers

Coupons

Certificates

Affiliate

---

# Non-functional Requirements

Performance

* First load under 2 seconds
* AI action under 5 seconds
* Global CDN
* Server-side rendering where beneficial
* Optimistic UI
* Realtime updates

Security

* Row Level Security
* MFA
* Audit Logs
* Encryption
* Rate limiting
* API keys
* OAuth

Scalability

100K creators

10M students

Millions of events

---

# UI Philosophy

Minimal.

Modern.

Fast.

Everything searchable.

Command palette everywhere.

Dark mode.

Mobile responsive.

Keyboard first.

---

# Roadmap

## Phase 1

Foundation

Authentication

Organizations

Website

Pages

Products

Courses

Media

Storage

Users

MCP

---

## Phase 2

Funnels

Email

Checkout

CRM

Offers

Coupons

Payments

---

## Phase 3

Community

Coaching

Events

Podcast

Certificates

---

## Phase 4

Automation

Analytics

Affiliate

API

SDK

---

## Phase 5

AI Native

Complete MCP Coverage

Claude Integration

Gemini Integration

Cursor Integration

Codex Integration

CLI

---

# Differentiator

Kajabi

Dashboard

↓

Click

↓

Save

↓

Refresh

PLG 3.0

Claude

↓

"Create my product."

↓

Done.

No dashboards required.

Everything conversational.

---

# Long-term Vision

PLG 3.0 becomes the operating system for creator businesses.

A creator should never have to wonder *where* a setting lives inside the platform. They simply ask their AI assistant to perform the task, and the platform executes it instantly through MCP tools. The browser is for reviewing and refining work; AI is for creating, managing, and automating it.

Our ambition is that every object in the system—courses, communities, funnels, emails, automations, websites, payments, analytics, CRM records, and future capabilities—is fully addressable and controllable through natural language. The platform evolves from a traditional SaaS product into an extensible creator operating system where humans, AI agents, and external applications collaborate seamlessly.
