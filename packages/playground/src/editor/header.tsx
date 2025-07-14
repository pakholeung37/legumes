import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NavActions } from './nav-actions'
import { useEditorInstance } from './use-editor-instance'

export function Header() {
  const editor = useEditorInstance()
  const sourcePath = editor.useSourcePath()
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b">
      <div className="flex flex-1 items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <div className="text-sm">{sourcePath?.split('/').pop()}</div>
      </div>
      <div className="ml-auto px-3">
        <NavActions />
      </div>
    </header>
  )
}
