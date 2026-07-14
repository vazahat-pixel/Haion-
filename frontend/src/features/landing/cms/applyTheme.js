export function applyCmsTheme(theme) {
  if (!theme || typeof document === 'undefined') return;
  const root = document.documentElement;
  const map = {
    '--cms-color-primary': theme.primaryColor,
    '--cms-color-secondary': theme.secondaryColor,
    '--cms-color-accent': theme.accentColor,
    '--cms-color-bg': theme.backgroundColor,
    '--cms-color-text': theme.textColor,
    '--cms-font-family': theme.fontFamily ? `'${theme.fontFamily}', system-ui, sans-serif` : undefined,
    '--cms-font-heading': theme.headingFontFamily ? `'${theme.headingFontFamily}', system-ui, sans-serif` : undefined,
    '--cms-border-radius': theme.borderRadius,
  };
  Object.entries(map).forEach(([key, val]) => {
    if (val) root.style.setProperty(key, val);
  });
}
