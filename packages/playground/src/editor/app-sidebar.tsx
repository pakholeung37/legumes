import * as React from 'react'
import { AudioWaveform, Command } from 'lucide-react'

import { LogoMenu } from '@/editor/logo-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CodeEditor } from './code-editor'

// This is sample data.
const teams = [
  {
    name: 'Acme Inc',
    logo: Command,
    plan: 'Enterprise',
  },
  {
    name: 'Acme Corp.',
    logo: AudioWaveform,
    plan: 'Startup',
  },
  {
    name: 'Evil Corp.',
    logo: Command,
    plan: 'Free',
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-12 border-b">
        <LogoMenu teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <CodeEditor />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
