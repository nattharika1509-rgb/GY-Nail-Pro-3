# AI Agent Skills Repository

This repository contains reusable skills for AI coding agents (opencode, CommandCode, Kilocode, Qwen, ZenCoder). Each skill provides domain-specific instructions and workflows for specialized tasks.

## Repository Structure

```
.agents/skills/          # OpenCode skills (primary location)
.commandcode/skills/     # CommandCode skills
.kilocode/skills/        # Kilocode skills
.qwen/skills/            # Qwen skills
.zencoder/skills/        # ZenCoder skills
skills/                  # Shared skills directory
```

## Available Skills

### tailwind-design-system
Build scalable design systems with Tailwind CSS v4, design tokens, component libraries, and responsive patterns.

**Use when:** Creating component libraries, implementing design systems, or standardizing UI patterns.

**Key patterns:**
- CSS-first configuration with `@theme` blocks
- CVA (Class Variance Authority) for type-safe variants
- OKLCH colors for better perceptual uniformity
- Native CSS animations with `@starting-style`
- Dark mode with `@custom-variant dark`

### canvas-design
Create visual art in .png and .pdf documents using design philosophy.

**Use when:** Creating posters, artwork, designs, or static visual pieces.

**Process:**
1. Create a design philosophy (aesthetic movement) as .md file
2. Express it visually on canvas as .pdf or .png

## Skill File Format

Each skill is a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: skill-name
description: Brief description of what this skill does.
license: Optional license reference
---

# Skill Title

Detailed instructions for the skill...
```

## Code Style Guidelines

### Markdown Files
- Use ATX-style headers (`# Header`)
- Include YAML frontmatter with `name` and `description`
- Use fenced code blocks with language hints
- Keep paragraphs concise (4-6 sentences max)
- Use tables for structured comparisons
- Use bullet points for lists, numbered lists for sequences

### CSS (Tailwind v4)
- Use `@theme` blocks for configuration (not `tailwind.config.ts`)
- Use `@import "tailwindcss"` (not `@tailwind` directives)
- Define semantic color tokens: `--color-primary`, `--color-background`
- Use OKLCH colors for better color perception
- Define animations inside `@theme` blocks with `@keyframes`
- Use `@custom-variant dark` for dark mode

### TypeScript/React
- React 19 patterns: `ref` is a regular prop (no `forwardRef`)
- Use CVA for component variants with type-safe props
- Export interfaces for component props
- Use `cn()` utility for class merging
- Prefer compound components for complex UI

```typescript
// Example component pattern (React 19)
export function Button({
  className,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### Naming Conventions
- **Skills:** kebab-case (`tailwind-design-system`)
- **Files:** kebab-case (`SKILL.md`, `button.tsx`)
- **Components:** PascalCase (`Button`, `CardHeader`)
- **Functions:** camelCase (`useTheme`, `cn`)
- **CSS Variables:** kebab-case (`--color-primary`, `--radius-md`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants

### Error Handling
- Throw descriptive errors with context
- Use TypeScript discriminated unions for error states
- Handle errors at appropriate boundaries
- Log errors with sufficient detail for debugging

```typescript
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### Imports
- Group imports: external → internal → relative
- Use absolute imports with path aliases (`@/lib/utils`)
- Import types separately with `import type { ... }`
- Avoid barrel exports for tree-shaking

```typescript
// External
import { useState } from 'react'
import type { VariantProps } from 'class-variance-authority'

// Internal aliases
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Relative
import { LocalComponent } from './local-component'
```

### Formatting
- Use 2-space indentation
- No trailing whitespace
- Single quotes for strings (except in CSS)
- Semicolons required
- Max line length: 100 characters
- One component per file
- Export components as named exports (not default)

### Documentation
- Keep comments minimal and meaningful
- Document public APIs with JSDoc when necessary
- Use examples to demonstrate patterns
- Update documentation when changing behavior

## Contributing Skills

1. Create `SKILL.md` in appropriate skills directory
2. Include required frontmatter (`name`, `description`)
3. Follow existing skill structure and style
4. Test with target AI agent before submitting
5. Include examples and code patterns

## License

Apache License 2.0 - See LICENSE files for details.
