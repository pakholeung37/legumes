import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import type { LegumesEditor } from '../legumes-editor'
import { SAMPLES } from '../sample-loader'
import packageJson from '../../package.json'
import { Hammer, Play, Pause, Sun, Moon, Bug } from 'lucide-react'
import { useMemo, useState, useCallback } from 'react'
import { useTheme } from './theme-provider'
import { Button } from './ui/button'

interface MenuItem {
  label: string
  action?: () => void
  isSeparator?: boolean
}

interface MenuGroup {
  label: string
  items: MenuItem[] | MenuGroup[]
}

export const Menu = (props: { editor: LegumesEditor }) => {
  const { editor } = props
  const [isPlaying, setIsPlaying] = useState(false)
  const { theme, setTheme } = useTheme()

  // Memoize samples menu items with stable references
  const samplesMenuItems = useMemo(() => {
    const result: Record<string, MenuItem[]> = {}
    SAMPLES.forEach((samplePath) => {
      const [category, sampleName] = samplePath.split('/').slice(-2)
      if (!result[category]) {
        result[category] = []
      }
      result[category].push({
        label: sampleName,
        action: () => editor.loadSample(samplePath),
      })
    })
    return result
  }, [editor])

  // Memoize all action handlers to prevent re-renders
  const handleCompile = useCallback(() => editor.compile(), [editor])
  const handleTogglePlay = useCallback(() => {
    editor.tooglePlay()
    setIsPlaying(editor.getIsPlaying())
  }, [editor])
  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        label: 'Chihiro',
        items: [
          {
            label: 'About legumes',
            action: () => alert(packageJson.version),
          },
          {
            label: 'Github',
            action: () => {
              window.open('https://github.com/LingDong-/legumes', '_blank')
            },
          },
          {
            label: 'Syntax Manual',
            action: () => {
              window.open(
                'https://github.com/LingDong-/legumes/blob/main/SYNTAX.md',
                '_blank',
              )
            },
          },
        ],
      },
      {
        label: 'File',
        items: [
          {
            label: 'Import TXT',
            action: () => editor.importTxt(),
          },
          {
            label: 'Import MIDI',
            action: () => editor.importMidi(),
          },
          { label: '---', isSeparator: true },
          {
            label: 'Export SVG',
            action: () => editor.exportSvg(),
          },
          {
            label: 'Export PDF',
            action: () => editor.exportPdf(),
          },
          {
            label: 'Export MIDI',
            action: () => editor.exportMidi(),
          },
        ],
      },
      {
        label: 'Samples',
        items: Object.keys(samplesMenuItems).map((category) => ({
          label: category,
          items: samplesMenuItems[category],
        })),
      },
      {
        label: 'Compile',
        items: [
          {
            label: 'Plain',
            action: () => {
              editor.setOutputFunction(editor.legumes.export_svg)
              editor.compile()
            },
          },
          {
            label: 'Animated',
            action: () => {
              editor.setOutputFunction(editor.legumes.export_animated_svg)
              editor.compile()
            },
          },
          {
            label: 'Mock',
            action: () => {
              editor.setOutputFunction(editor.legumes.export_mock_svg)
              editor.compile()
            },
          },
          {
            label: 'Hand-drawn',
            action: () => {
              editor.setOutputFunction(editor.legumes.export_sketch_svg)
              editor.compile()
            },
          },
          { label: '---', isSeparator: true },
          {
            label: 'Thinner stroke',
            action: () => {
              const outElement = document.getElementById('out')
              if (outElement) {
                outElement.innerHTML = outElement.innerHTML.replace(
                  /stroke-width="(.*?)"/g,
                  (_, n) => `stroke-width="${(Number(n) * 2) / 3}"`,
                )
              }
            },
          },
          {
            label: 'Thicker stroke',
            action: () => {
              const outElement = document.getElementById('out')
              if (outElement) {
                outElement.innerHTML = outElement.innerHTML.replace(
                  /stroke-width="(.*?)"/g,
                  (_, n) => `stroke-width="${Number(n) * 1.5}"`,
                )
              }
            },
          },
        ],
      },
      {
        label: 'Playback',
        items: [
          {
            label: 'Play',
            action: () => editor.play(),
          },
          {
            label: 'Abort',
            action: () => editor.pause(),
          },
          { label: '---', isSeparator: true },
          {
            label: 'Decrease Speed',
            action: () => editor.setMidiSpeed(editor.getMidiSpeed() * 0.8),
          },
          {
            label: 'Increase Speed',
            action: () => editor.setMidiSpeed(editor.getMidiSpeed() * 1.125),
          },
        ],
      },
      {
        label: 'Source Code',
        items: [
          {
            label: 'Github',
            action: () => {
              window.open('https://github.com/LingDong-/legumes', '_blank')
            },
          },
          {
            label: 'Download',
            action: () => {
              window.open(
                'https://github.com/LingDong-/legumes/blob/main/dist/legumes.js',
                '_blank',
              )
            },
          },
        ],
      },
      {
        label: 'Help',
        items: [
          {
            label: 'Overview',
            action: () => {
              window.open('https://github.com/LingDong-/legumes', '_blank')
            },
          },
          {
            label: 'Syntax Manual',
            action: () => {
              window.open(
                'https://github.com/LingDong-/legumes/blob/main/SYNTAX.md',
                '_blank',
              )
            },
          },
          {
            label: 'Report an Issue',
            action: () => {
              window.open(
                'https://github.com/LingDong-/legumes/issues',
                '_blank',
              )
            },
          },
        ],
      },
    ],
    [editor, samplesMenuItems],
  )

  return (
    <Menubar className="justify-between rounded-none">
      <div className="flex">
        {menuGroups.map((group) => (
          <MenubarMenu key={group.label}>
            <MenubarTrigger>{group.label}</MenubarTrigger>
            <MenubarContent>
              {group.items.map((item, index) =>
                // If the item is a group, render a submenu
                'items' in item ? (
                  <MenubarSub key={index}>
                    <MenubarSubTrigger>{item.label}</MenubarSubTrigger>
                    <MenubarSubContent className="max-h-96 overflow-auto">
                      {item.items.map((subItem: MenuItem, subIndex) => (
                        <MenubarItem key={subIndex} onClick={subItem.action}>
                          {subItem.label}
                        </MenubarItem>
                      ))}
                    </MenubarSubContent>
                  </MenubarSub>
                ) : (
                  <div key={index}>
                    {item.isSeparator ? (
                      <MenubarSeparator />
                    ) : (
                      <MenubarItem onClick={item.action}>
                        {item.label}
                      </MenubarItem>
                    )}
                  </div>
                ),
              )}
            </MenubarContent>
          </MenubarMenu>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          className="h-6"
          onClick={handleCompile}
          variant={'ghost'}
          size={'icon'}
        >
          <Hammer />
        </Button>
        <Button
          className="h-6"
          onClick={handleTogglePlay}
          variant={'ghost'}
          size={'icon'}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Button
          className="h-6"
          onClick={handleToggleTheme}
          variant={'ghost'}
          size={'icon'}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
    </Menubar>
  )
}
