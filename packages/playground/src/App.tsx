import Editor from './editor/editor'
import { ThemeProvider } from './components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Editor />
    </ThemeProvider>
  )
}

export default App
