# Workflow Design System Documentation

## 🎨 Color Palette

### Primary Colors

- Primary: `#00887A` (light mode), `#00C9A7` (dark mode)
- Secondary: `#D3E3FC` (light mode), `#0F1419` (dark mode)
- Accent: `#FFCCBC` (light mode), `#FF8A65` (dark mode)
- Neon: `#00FFA3` (dark mode highlight)
- Soft Blue: `#D3E3FC` (light backgrounds), `#0F1419` (dark backgrounds)

### Color Schemes

The application supports multiple color schemes that can be selected by users:

- Teal (default): Primary `#00887A`, Secondary `#D3E3FC`, Accent `#FFCCBC`, Neon `#00FFA3`
- Blue: Primary `#2563EB`, Secondary `#DBEAFE`, Accent `#C7D2FE`, Neon `#00D4FF`
- Purple: Primary `#7C3AED`, Secondary `#EDE9FE`, Accent `#DDD6FE`, Neon `#C4B5FD`
- Emerald: Primary `#059669`, Secondary `#D1FAE5`, Accent `#A7F3D0`, Neon `#6EE7B7`
- Amber: Primary `#D97706`, Secondary `#FEF3C7`, Accent `#FDE68A`, Neon `#FBBF24`
- Cyber: Primary `#FF0080`, Secondary `#0C0032`, Accent `#00FFFF`, Neon `#FF00FF`

### Text Colors

- Primary Text: `text-gray-900` (light), `text-white` (dark)
- Secondary Text: `text-gray-600` (light), `text-gray-300` (dark)
- Muted Text: `text-gray-500` (light), `text-gray-400` (dark)
- Success: `text-green-500`
- Warning: `text-yellow-500`
- Error: `text-red-500`

### Background Colors

- Main Background: `bg-white` (light), `bg-gray-900` (dark)
- Secondary Background: `bg-softBlue/30` (light), `bg-gray-800/30` (dark)
- Card Background: `bg-white` (light), `bg-gray-950` (dark)
- Gradient Background: `bg-gradient-to-b from-white to-gray-50` (light), `from-gray-900 to-gray-800` (dark)

### Border Colors

- Border: `border-gray-200` (light), `border-gray-800` (dark)
- Subtle Border: `border-gray-200/50` (light), `border-gray-700/30` (dark)

## 🔠 Typography

### Font Family

- System font stack with fallbacks

### Font Sizes

- XS: `text-xs`
- SM: `text-sm`
- Base: `text-base`
- LG: `text-lg`
- XL: `text-xl`
- 2XL: `text-2xl`

### Font Weights

- Normal: `font-normal`
- Medium: `font-medium`
- Semibold: `font-semibold`
- Bold: `font-bold`

### Special Text Effects

- Gradient Text: `bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent`

## 🧩 Components

### Buttons

- Primary: `EnhancedButton variant="primary"`
- Secondary: `EnhancedButton variant="secondary"`
- Outline: `EnhancedButton variant="outline"`
- Ghost: `EnhancedButton variant="ghost"`
- Danger: `EnhancedButton variant="danger"`

### Cards

- Standard Card: `Card3D` with 3D hover effect
- Glass Card: `GlassContainer` with backdrop blur effect

### Navigation

- Sidebar: Animated sidebar with hover effects
- Header: Motion-enhanced header with breadcrumbs

### Form Elements

- Inputs with focus rings in primary color
- Form groups with consistent spacing

### Containers

- Glass containers with blur effects
- 3D cards with hover animations

## 🎭 Animations

### Page Transitions

- Entry: Fade in and slide up
- Exit: Fade out and slide down
- Staggered children animations

### Component Animations

- Hover: Scale up slightly (1.02-1.05)
- Active/Tap: Scale down slightly (0.95-0.98)
- Magnetic hover effect on interactive elements

### Animation Constants

- Spring transitions with specific stiffness and damping
- Ease transitions with specific durations
- Staggered animations for lists and grids

### Special Effects

- Mouse follower (on non-touch devices)
- Floating animations
- Magnetic hover effects
- Parallax scrolling effects

## 🌓 Theme System

### Theme Implementation

- Light/Dark/System theme options
- Theme stored in localStorage
- System preference detection
- Smooth theme transitions

### Theme Variables

- CSS variables for colors
- Theme-aware components
- Dark mode optimized UI

## 📱 Responsive Design

### Breakpoints

- Mobile: Default
- MD: `md:` prefix (768px+)
- LG: `lg:` prefix (1024px+)
- XL: `xl:` prefix (1280px+)

### Mobile Adaptations

- Stacked layouts on mobile
- Hidden elements on smaller screens
- Touch-friendly interactions

## 🧰 Utility Classes

### Custom Scrollbar

- `futuristic-scrollbar` for styled scrollbars

### Reduced Motion

- `reduce-motion` class for accessibility

### Layout Utilities

- Flex and grid layouts
- Spacing utilities
- Responsive containers

## 🔧 Implementation Guidelines

### Component Usage

- Use `EnhancedButton` for all buttons
- Use `Card3D` for main content cards
- Use `GlassContainer` for subtle UI elements
- Use Framer Motion for animations

### Theme Implementation

- Use `useAppearance` hook for theme access
- Use `useAnimatedTheme` for animated theme changes
- Apply theme-aware class names consistently

### Animation Best Practices

- Use `containerVariants` and `itemVariants` for lists
- Use `motion.div` for animated elements
- Consider reduced motion preferences
