# Font Licenses

This document outlines the fonts used in this project and their licenses.

## Google Sans

**Designer:** Google  
**License:** SIL Open Font License (OFL) Version 1.1  
**Source:** https://fonts.google.com  
**License File:** [static/fonts/OFL.txt](static/fonts/OFL.txt)

### Usage

Google Sans is used as the primary sans-serif font family throughout the application. It is self-hosted locally in `static/fonts/` to ensure optimal performance and availability.

**Weights and Styles:**
- Regular (400)
- Italic (400)
- Medium (500)
- Bold (700)

### Compliance

This project complies with the SIL Open Font License by:

1. ✅ **Self-hosting the fonts** - Font files are distributed with the application
2. ✅ **Including the license** - Full OFL license text included in `static/fonts/OFL.txt`
3. ✅ **Not selling the font** - The font is bundled as part of the software, not sold separately
4. ✅ **Maintaining the font name** - The font is referred to by its reserved name "Google Sans"
5. ✅ **Using proper @font-face declarations** - CSS properly declares the font with all required metadata
6. ✅ **Providing attribution** - License and attribution comments included in CSS

### Fallback Fonts

The font stack uses proper CSS fallbacks:
```css
font-family: 'Google Sans', system-ui, sans-serif;
```

If Google Sans fails to load, the system will fall back to `system-ui` and then to the generic `sans-serif` family, ensuring the application remains usable on all platforms.

---

For more information about the SIL Open Font License, visit: https://openfontlicense.org
