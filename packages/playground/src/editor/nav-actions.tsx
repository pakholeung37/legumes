import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NavActions() {
  // const editorInstance = useEditorInstance()
  return (
    <div className="flex items-center gap-2 text-sm">
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Play />
      </Button>
    </div>
  )
}
