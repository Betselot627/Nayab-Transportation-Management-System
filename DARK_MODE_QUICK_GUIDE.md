# Dark Mode Quick Implementation Guide

## Quick Reference for Adding Dark Mode to Components

### Basic Pattern

```jsx
// Container
<div className="bg-white dark:bg-gray-800 transition-colors duration-300">

// Text
<h1 className="text-gray-900 dark:text-white">Title</h1>
<p className="text-gray-600 dark:text-gray-400">Description</p>

// Input Fields
<input className="
  bg-white dark:bg-gray-700
  border-gray-300 dark:border-gray-600
  text-gray-900 dark:text-white
  placeholder:text-gray-400 dark:placeholder:text-gray-500
  focus:border-blue-500 dark:focus:border-blue-400
  transition-colors duration-300
" />

// Buttons
<button className="
  bg-blue-600 dark:bg-blue-500
  hover:bg-blue-700 dark:hover:bg-blue-600
  text-white
  transition-colors duration-300
">
  Click Me
</button>

// Secondary Buttons
<button className="
  bg-white dark:bg-gray-700
  border-gray-300 dark:border-gray-600
  text-gray-700 dark:text-gray-300
  hover:bg-gray-50 dark:hover:bg-gray-600
  transition-colors duration-300
">
  Cancel
</button>

// Cards
<div className="
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  shadow-lg
  transition-colors duration-300
">
  Card Content
</div>

// Tables
<table className="w-full">
  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
    <tr>
      <th className="text-gray-700 dark:text-gray-300">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="text-gray-900 dark:text-white">Data</td>
    </tr>
  </tbody>
</table>

// Status Badges
<span className="
  bg-green-100 dark:bg-green-900
  text-green-800 dark:text-green-200
  px-3 py-1 rounded-full text-xs font-semibold
">
  Active
</span>

<span className="
  bg-yellow-100 dark:bg-yellow-900
  text-yellow-800 dark:text-yellow-200
  px-3 py-1 rounded-full text-xs font-semibold
">
  Pending
</span>

<span className="
  bg-red-100 dark:bg-red-900
  text-red-800 dark:text-red-200
  px-3 py-1 rounded-full text-xs font-semibold
">
  Inactive
</span>
```

## Color Palette Reference

### Backgrounds

- Primary: `bg-white` → `dark:bg-gray-800`
- Secondary: `bg-gray-50` → `dark:bg-gray-900`
- Card: `bg-white` → `dark:bg-gray-800`
- Sidebar: `bg-gray-900` → `dark:bg-gray-950`
- Table Header: `bg-gray-50` → `dark:bg-gray-700`

### Text Colors

- Primary: `text-gray-900` → `dark:text-white`
- Secondary: `text-gray-600` → `dark:text-gray-400`
- Muted: `text-gray-500` → `dark:text-gray-500`
- Label: `text-gray-700` → `dark:text-gray-300`

### Borders

- Default: `border-gray-300` → `dark:border-gray-600`
- Light: `border-gray-200` → `dark:border-gray-700`
- Divider: `border-gray-100` → `dark:border-gray-700`

### Interactive States

- Hover BG: `hover:bg-gray-50` → `dark:hover:bg-gray-700`
- Focus Ring: `focus:ring-blue-500` → stays same
- Active State: `bg-blue-600` → `dark:bg-blue-500`

### Role-Specific Colors

- **Admin**: Blue - `bg-blue-600` → `dark:bg-blue-500`
- **Driver**: Green - `bg-green-600` → `dark:bg-green-500`
- **Customer**: Purple - `bg-purple-600` → `dark:bg-purple-500`
- **Dispatcher**: Purple - `bg-purple-600` → `dark:bg-purple-500`

## Step-by-Step Process

### 1. Find the Component

Identify the component that needs dark mode.

### 2. Update Container

Add dark mode classes to the main container:

```jsx
// Before
<div className="min-h-screen bg-gray-50">

// After
<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
```

### 3. Update All Child Elements

Apply dark classes to:

- Text elements
- Input fields
- Buttons
- Cards/Panels
- Tables
- Borders
- Backgrounds

### 4. Test Both Themes

- Switch to dark mode and verify
- Check color contrast
- Ensure all text is readable
- Verify hover states work

### 5. Add Transition

Always add `transition-colors duration-300` for smooth theme switching.

## Common Mistakes to Avoid

❌ **Don't forget borders**

```jsx
// Wrong
<div className="border bg-white dark:bg-gray-800">

// Right
<div className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
```

❌ **Don't forget input placeholders**

```jsx
// Wrong
<input className="bg-white dark:bg-gray-700" placeholder="Search..." />

// Right
<input className="bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
```

❌ **Don't forget hover states**

```jsx
// Wrong
<button className="bg-white dark:bg-gray-700 hover:bg-gray-50">

// Right
<button className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
```

❌ **Don't forget transition**

```jsx
// Wrong
<div className="bg-white dark:bg-gray-800">

// Right
<div className="bg-white dark:bg-gray-800 transition-colors duration-300">
```

## Testing Checklist

For each component:

- [ ] Background colors have dark variants
- [ ] Text colors are readable in both modes
- [ ] Borders are visible in both modes
- [ ] Hover states work in both modes
- [ ] Focus states work in both modes
- [ ] Transitions are smooth
- [ ] No accessibility issues
- [ ] Mobile view works in both modes

## Using the Theme Hook

```javascript
import { useTheme } from "../context/ThemeContext";

function MyComponent() {
  const { theme, isDark, toggleTheme, setDarkTheme, setLightTheme } =
    useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Is dark? {isDark ? "Yes" : "No"}</p>

      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={setDarkTheme}>Force Dark</button>
      <button onClick={setLightTheme}>Force Light</button>
    </div>
  );
}
```

## Chart Dark Mode Example

For Recharts components:

```javascript
const { isDark } = useTheme();

const chartColors = {
  text: isDark ? "#e5e7eb" : "#374151",
  grid: isDark ? "#374151" : "#e5e7eb",
  tooltip: {
    bg: isDark ? "#1f2937" : "#ffffff",
    border: isDark ? "#374151" : "#e5e7eb",
  },
};

<AreaChart data={data}>
  <CartesianGrid stroke={chartColors.grid} />
  <XAxis stroke={chartColors.text} />
  <YAxis stroke={chartColors.text} />
  <Tooltip
    contentStyle={{
      backgroundColor: chartColors.tooltip.bg,
      borderColor: chartColors.tooltip.border,
      color: chartColors.text,
    }}
  />
  <Area stroke="#3b82f6" fill="#3b82f6" />
</AreaChart>;
```

## Priority Order for Implementation

1. **High Priority** (User-facing):
   - Dashboard pages
   - Profile pages ✅
   - Data tables
   - Forms

2. **Medium Priority**:
   - Modal dialogs
   - Notifications
   - Loading states
   - Empty states

3. **Low Priority**:
   - Settings pages ✅
   - Admin-only pages
   - Error pages

---

**Pro Tip**: Copy-paste the pattern from already implemented pages like `VehicleManagement.jsx` or `Login.jsx` and adapt to your component!
