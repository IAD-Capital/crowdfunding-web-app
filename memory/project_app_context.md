---
name: project-app-context
description: Core business logic and domain model of the crowdfunding real estate platform
metadata:
  type: project
---

Real estate crowdfunding platform where users buy percentage stakes in apartments (UF = Unidad Funcional) within developments (Emprendimientos).

**Core rules:**
- Users can buy between 5% and 50% of a UF, or 100% if they want full ownership
- Once a % of a UF is purchased, an investor group is created for that UF
- Each group has an expiration date
- UF prices change over time; the system must inform original investors of their updated investment value
- Example: user paid $10,000 for 10% → UF increases $120,000 → user's stake is now worth $22,000

**Domain entities:**
- Emprendimiento (Development): a real estate project with multiple UFs
- UF (Unidad Funcional): an individual apartment within a development
- Inversión (Investment): a % stake a user holds in a UF
- Grupo (Group): investor group created when a UF gets its first investment, has expiration date

**Why:** This context should inform all future feature decisions — pricing, notifications, group management, dashboard views.

**How to apply:** When building any new feature, consider how it fits into the investment lifecycle: browse development → view UF → invest % → join group → receive value updates.
