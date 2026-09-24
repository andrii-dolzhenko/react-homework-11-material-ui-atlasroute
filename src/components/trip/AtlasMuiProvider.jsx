import { useMemo } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { selectTheme } from '../../redux/preferencesSlice.js'

export default function AtlasMuiProvider({ children }) {
  const mode = useSelector(selectTheme)
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#55b9e8' },
      success: { main: '#2fbf83' },
      warning: { main: '#e4a53b' },
      error: { main: '#e46262' },
    },
    typography: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      button: { textTransform: 'none', fontWeight: 800 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: { padding: 4 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 999 },
          bar: { borderRadius: 999 },
        },
      },
    },
  }), [mode])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
