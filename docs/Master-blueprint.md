# PLG 3.0 Technical Design Document (TDD) – Master Blueprint

> This document is the master blueprint and documentation roadmap for the PLG 3.0 platform.

## Overview

PLG 3.0 is an AI-native creator operating system. The web application is the visual interface, while AI clients (Claude Desktop, Codex, Gemini, Cursor, terminal) interact with the platform through MCP tools.

## Documentation Structure

```
PLG-3.0/
├── 01-Vision/
│   ├── PRD.md
│   ├── Roadmap.md
│   └── Product-Principles.md
├── 02-Architecture/
│   ├── System-Architecture.md
│   ├── Infrastructure.md
│   ├── Multi-Tenancy.md
│   ├── Security.md
│   └── Event-Driven-Architecture.md
├── 03-Database/
│   ├── Database-Overview.md
│   ├── ERD.md
│   ├── auth.md
│   ├── organizations.md
│   ├── users.md
│   ├── products.md
│   ├── courses.md
│   ├── community.md
│   ├── crm.md
│   ├── analytics.md
│   ├── payments.md
│   └── automation.md
├── 04-API/
├── 05-MCP/
├── 06-Frontend/
├── 07-Backend/
├── 08-Modules/
├── 09-Deployment/
└── 10-Development/
```

## Recommended Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Netlify
- Stripe
- Resend
- Trigger.dev/Inngest
- Upstash Redis
- MCP Server

## Layered Architecture

```
Presentation
 ├─ Next.js
 ├─ Command Palette
 └─ AI Console

Application
 ├─ REST API
 ├─ MCP Server
 ├─ Webhooks
 └─ Edge Functions

Domain
 ├─ Courses
 ├─ Funnels
 ├─ CRM
 ├─ Community
 ├─ Email
 ├─ Automation
 └─ Analytics

Infrastructure
 ├─ PostgreSQL
 ├─ Storage
 ├─ Queue
 ├─ CDN
 └─ Monitoring

AI
 ├─ MCP Tools
 ├─ Prompt Engine
 ├─ Context Manager
 ├─ Embeddings
 └─ Agent Runtime
```

## Major Design Principles

- Modular monolith initially
- Multi-tenant from day one
- Row Level Security
- Event-driven architecture
- Every domain object exposes MCP tools
- Every object supports:
  - Permissions
  - Audit log
  - Version history
  - Analytics
  - Automation hooks
  - Search indexing
  - AI context

## Documentation Volumes

### Volume 1 — System Architecture (~80 pages)
- High-level architecture
- Auth
- Event bus
- Queue
- Security
- AI architecture
- Observability

### Volume 2 — Database (~120 pages)
Every table documented:
- Schema
- Relationships
- Indexes
- Constraints
- RLS
- Migrations

Core entities:
Organizations, Users, Roles, Products, Courses, Lessons, Memberships,
Funnels, Pages, Contacts, Orders, Subscriptions, Communities,
Posts, Comments, Events, Emails, Automations, Analytics, Media, Offers, Coupons.

### Volume 3 — API (~100 pages)
For every endpoint:
- Request
- Response
- Auth
- Validation
- Errors

### Volume 4 — MCP (~120 pages)
Every platform capability becomes an MCP tool:
- create_course
- publish_course
- create_funnel
- send_email
- create_offer
- refund_order
- create_space
- analytics_report
...etc.

Each tool defines:
- Input schema
- Output schema
- Permissions
- Validation
- Example prompt
- Example response

### Volume 5 — Frontend
- Folder structure
- Design system
- Routing
- State management
- Accessibility

### Volume 6 — Backend
- Services
- Repositories
- Workers
- Edge Functions

### Volume 7 — AI
- Prompt templates
- Context management
- Long-running tasks
- Streaming
- Memory strategy

### Volume 8 — Development
- Coding standards
- Git workflow
- Testing
- CI/CD
- Releases

## Final Vision

PLG 3.0 is designed as an AI-first operating system for creator businesses where AI is the primary interface and the browser is primarily for visualization and refinement.
