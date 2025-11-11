# Hedgehog Protocol - GitBook Theme Colors

This directory contains the custom CSS styling for the Hedgehog Protocol GitBook documentation.

## Brand Colors

The theme uses the following Hedgehog brand colors:

### Primary Colors
- **Hedgehog Cyan** (CTA): `#3dd8c9` - Primary accent, links, active states
- **Dark Green**: `#0C463F` - Table headers, secondary accents
- **Blue**: `#00A3FF` - Info alerts, function tokens
- **Green**: `#00FF9D` - Success states, string tokens, hover effects
- **Pink**: `#ec4899` - Keywords in code
- **Orange**: `#f97316` - Warning alerts, number tokens

### Background & Text Colors
- **Darker Gray**: `#101010` - Main background
- **Dark Gray**: `#1A1A1A` - Sidebar, code blocks
- **Mid Gray**: `#2A2A2A` - Borders, hover states
- **Medium Gray**: `#8E9196` - Muted text, comments
- **Light Gray**: `#E5E7EB` - Body text
- **White**: `#F3F4F6` - Headers, emphasized text

## Theme Features

### Dark Theme
The GitBook uses a dark theme matching your website:
- Dark backgrounds for better readability
- Hedgehog cyan for CTAs and interactive elements
- Consistent with your main website styling

### Typography
- Headers use `#F3F4F6` (white)
- Body text uses `#E5E7EB` (light gray)
- Code uses `#00FF9D` (green) with dark gray background
- Links use `#3dd8c9` (cyan), hover with `#00FF9D` (green)

### Syntax Highlighting
Code blocks use Prism with custom token colors:
- Keywords: Pink `#ec4899`
- Functions: Blue `#00A3FF`
- Strings: Green `#00FF9D`
- Comments: Medium Gray `#8E9196`
- Numbers: Orange `#f97316`

### Interactive Elements
- Buttons: Cyan background with dark text
- Hover states: Green tint with slight elevation
- Active navigation: Cyan with left border accent
- Tables: Dark green headers, alternating row backgrounds

## File Structure

```
gitbook/styles/
├── README.md          # This file - color documentation
└── website.css        # Main theme stylesheet
```

## Usage

The theme is automatically applied when GitBook builds the documentation. The `book.json` configuration file references `styles/website.css` in the theme settings.

To preview with these colors locally:
```bash
cd gitbook
gitbook serve
```

Then visit `http://localhost:4000` to see the styled documentation.

## Customization

To modify colors, edit `website.css` and update the CSS variables in the `:root` selector:

```css
:root {
  --hh-cyan: #3dd8c9;      /* Change primary accent */
  --hh-dark-green: #0C463F; /* Change secondary accent */
  /* ... other colors ... */
}
```

All theme elements reference these variables, so changes propagate throughout the documentation automatically.
