import plugin from 'tailwindcss/plugin'
import colorTokens from './theme'

const themePlugin = plugin(function({ addBase }) {
  addBase({
    ':root': {
      '--primary': colorTokens.light.primary,
      '--primary-foreground': colorTokens.light.primaryForeground,
      '--secondary': colorTokens.light.secondary,
      '--secondary-foreground': colorTokens.light.secondaryForeground,
      '--success': colorTokens.light.success,
      '--success-foreground': colorTokens.light.successForeground,
      '--warning': colorTokens.light.warning,
      '--warning-foreground': colorTokens.light.warningForeground,
      '--error': colorTokens.light.error,
      '--error-foreground': colorTokens.light.errorForeground,
    },
    '.dark': {
      '--primary': colorTokens.dark.primary,
      '--primary-foreground': colorTokens.dark.primaryForeground,
      '--secondary': colorTokens.dark.secondary,
      '--secondary-foreground': colorTokens.dark.secondaryForeground,
      '--success': colorTokens.dark.success,
      '--success-foreground': colorTokens.dark.successForeground,
      '--warning': colorTokens.dark.warning,
      '--warning-foreground': colorTokens.dark.warningForeground,
      '--error': colorTokens.dark.error,
      '--error-foreground': colorTokens.dark.errorForeground,
    },
  })
})

export default themePlugin
