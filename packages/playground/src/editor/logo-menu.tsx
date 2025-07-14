import { ChevronDown } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useMemo, useState, type ElementType } from 'react'
import { loadSample, SAMPLES } from '@/editor/sample-loader'
import { useEditorInstance } from './use-editor-instance'
import { useTheme } from '@/components/theme-provider'
import { useGlobalStore } from './use-global-store'

interface MenuItem {
  label: string
  action?: () => void
  items?: MenuItem[]
  isSeparator?: boolean
}

export function LogoMenu({
  teams,
}: {
  teams: {
    name: string
    logo: ElementType
    plan: string
  }[]
}) {
  const [activeTeam, setActiveTeam] = useState(teams[0])
  const { setTheme } = useTheme()

  if (!activeTeam) {
    return null
  }

  const editor = useEditorInstance()

  // Memoize samples menu items with stable references
  const samplesMenuItems = useMemo(() => {
    const result: Record<string, MenuItem[]> = {}
    if (!editor) {
      return result
    }
    SAMPLES.forEach((samplePath) => {
      const [category, sampleName] = samplePath.split('/').slice(-2)
      if (!result[category]) {
        result[category] = []
      }
      result[category].push({
        label: sampleName,
        action: async () => {
          editor.setSourcePath(samplePath)
          const result = await loadSample(samplePath)
          editor.setSource(result)
          editor.compile()
        },
      })
    })
    return result
  }, [editor])

  const { setLib } = useGlobalStore()

  const menu: MenuItem[] = useMemo(() => {
    return [
      {
        label: 'Teams',
        items: teams.map((team) => ({
          label: team.name,
          action: () => setActiveTeam(team),
        })),
      },
      {
        label: 'Samples',
        items: Object.entries(samplesMenuItems).map(([category, items]) => ({
          label: category,
          items,
        })),
      },
      {
        label: 'Theme',
        items: [
          {
            label: 'Dark Theme',
            action: () => setTheme('dark'),
          },
          {
            label: 'Light Theme',
            action: () => setTheme('light'),
          },
          {
            label: 'System Theme',
            action: () => setTheme('system'),
          },
        ],
      },
      {
        label: 'Lib',
        items: [
          {
            label: 'Legumes',
            action: () => {
              setLib('legumes')
            },
          },
          {
            label: 'Vexml',
            action: () => {
              setLib('vexml')
            },
          },
        ],
      },
    ]
  }, [setTheme, teams, samplesMenuItems])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <activeTeam.logo className="size-3" />
              </div>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuInternal menu={menu} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function DropdownMenuInternal({ menu }: { menu: MenuItem[] }) {
  return menu.map((group) =>
    group.items ? (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{group.label}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className={'max-h-96 overflow-auto'}>
            <DropdownMenuInternal menu={group.items} />
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    ) : (
      <DropdownMenuItem onClick={group.action}>{group.label}</DropdownMenuItem>
    ),
  )
}
