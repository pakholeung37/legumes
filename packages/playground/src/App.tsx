import { LegumesEditorComponent } from './components/legumes-editor'
import { ThemeProvider } from './components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <LegumesEditorComponent />
    </ThemeProvider>
  )
}

export default App
