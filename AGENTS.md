<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md
# SIGER-KAN Development Guide for Codex

---

# Project Identity

Project Name:
SIGER-KAN

Full Name:
Sistem Informasi Terintegrasi Gerai Mutu dan Perikanan

Project Goal

SIGER-KAN is an enterprise-scale digital platform developed to integrate
fisheries quality services in Indonesia.

The system provides digital services for fisheries business actors,
government agencies, laboratories, certification bodies,
quality consultants, and decision makers.

Main Modules

- Landing Page
- Authentication
- User Management
- Role & Permission
- Business Management
- Registrasi Pelaku Usaha
- Pengujian Mutu
- Sertifikasi
- Klinik Mutu
- AI Knowledge Base
- Business Matching
- Monitoring
- Executive Dashboard
- Reports & Analytics

Target Users

- Fisheries Business Actors
- Laboratory Staff
- Certification Staff
- Quality Consultants
- Government Officers
- Executive Leaders
- System Administrators

---

# Technology Stack

Framework

- Next.js App Router

Language

- TypeScript

Database

- PostgreSQL

ORM

- Prisma ORM new version

Authentication

- JWT
- HttpOnly Cookie

Validation

- Zod

Forms

- React Hook Form

Styling

- Tailwind CSS

UI Components

- shadcn/ui

Icons

- lucide-react

Charts

- Recharts

Animation

- Framer Motion (only if already installed)

Deployment

- Docker Ready

---

# Hard Rules

Never
- Never replace PostgreSQL.
- Never use another ORM.
- Never install packages without approval.
- Never delete existing files without approval.
- Never create migrations automatically.
- Never modify schema.prisma without explanation.
- Never expose secrets.
- Never commit automatically.
- Never push automatically.
- Never use "any" unless unavoidable.
- Never duplicate reusable components.

Always

- Inspect project first.
- Explain implementation plan.
- List affected files.
- Keep code modular.
- Use reusable components.
- Follow TypeScript strict mode.
- Run lint.
- Run build.
- Fix all errors before finishing.

---

# Folder Structure

Preferred structure

app/
components/
components/landing/
components/ui/
features/
services/
lib/
hooks/
types/
prisma/
public/

Never create random folders.

---

# Coding Convention

PascalCase

Components

Example

UserCard.tsx

camelCase

Variables

Example

userProfile

Functions

Example

createBusiness()

Database

snake_case

Example

business_name

Prisma Models

PascalCase

Example

Business

---

# TypeScript Rules

Use strict typing.

Prefer interface over type for objects.

No any.

Use readonly where appropriate.

Use enums for status.

Always define props.

---

# Database Convention

Primary Key

BigInt

Standard Fields

createdAt

updatedAt

deletedAt (Soft Delete)

Use mapped snake_case.

Example

created_at

Never use UUID unless requested.

---

# Authentication

Use JWT.

Store JWT in HttpOnly Cookie.

Do not use NextAuth.

Sessions must be server-side validated.

---

# Authorization

RBAC (Role Based Access Control)

Support multiple roles.

Support permission-based authorization.

Every API must verify authorization.

Never rely only on hidden buttons.

---

# Business Rules

One Business

↓

Many Users

One User

↓

Can belong to multiple businesses

Business Roles

OWNER

ADMIN

QUALITY_MANAGER

STAFF

VIEWER

Business users can only access their own business.

---

# UI Design

Style

Modern Government Platform

Premium

Professional

Minimal

Clean

Elegant

Responsive

Rounded Cards

Soft Shadows

Subtle Glass Effect

Large White Space

Smooth Animation

No flashy effects.

---

# Color Palette

Primary

#073B4C

Secondary

#087E8B

Accent

#0FA3B1

Support

#61C0BF

Background

#F8FAFC

Warning

#F4B942

Danger

#E63946

Success

#2E9F6B

---

# Landing Page Style

Landing page should communicate

- Trust
- Public Service
- Digital Transformation
- Fisheries
- Marine Resources
- Laboratory
- Certification
- Quality

Hero should not rely on stock images.

Prefer dashboard illustrations.

---

# UI Components

Use reusable components.

PrimaryButton

SecondaryButton

StatCard

FeatureCard

SectionTitle

EmptyState

LoadingSkeleton

Table

Badge

Dialog

Drawer

Modal

Pagination

Breadcrumb

---

# Forms

Use React Hook Form.

Validate using Zod.

Never use uncontrolled forms.

---

# API Response

Success

{
    "success": true,
    "message": "",
    "data": {}
}

Error

{
    "success": false,
    "message": "",
    "errors": {}
}

---

# Error Handling

Return meaningful messages.

Never expose stack traces.

Log unexpected errors.

---

# Logging

Create audit logs for

Login

Logout

Create

Update

Delete

Approval

Reject

Status changes

---

# Security

Sanitize inputs.

Validate permissions.

Prevent SQL Injection.

Prevent XSS.

Prevent CSRF where applicable.

Never expose internal IDs unnecessarily.

---

# Accessibility

Semantic HTML.

Keyboard accessible.

ARIA labels.

Good color contrast.

Responsive.

---

# Performance

Prefer Server Components.

Client Components only if required.

Optimize images.

Avoid unnecessary rerenders.

Lazy load large sections.

---

# Landing Page Content Language

All UI text must be written in Indonesian.

Source code must remain in English.

---

# Icons

Prefer lucide-react.

Avoid emoji in production UI.

---

# Comment Style

Only comment complex logic.

Avoid unnecessary comments.

---

# Git Workflow

Never commit.

Never push.

Never merge.

Only modify files.

---

# Before Every Task

1. Read AGENTS.md.
2. Inspect project.
3. Explain plan.
4. List files.
5. Wait if package installation is needed.

---

# After Every Task

Run

npm run lint

Run

npm run build

Fix all errors.

Report

Files created

Files modified

Dependencies

Commands

Remaining TODO

---

# Current Development Stage

Current Sprint

Sprint 1

Focus only on

✅ Landing Page

Do not implement

Authentication

RBAC

Database

API

Prisma Schema

Business Logic

AI

Certification

Quality Testing

unless explicitly requested.

---

# General Principle

Always prioritize

Maintainability

Readability

Reusability

Scalability

Enterprise Architecture

over writing code quickly.

Every implementation should be production-ready.
<!-- END:nextjs-agent-rules -->
