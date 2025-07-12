import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import type { LegumesEditor } from '../legumes-editor'
import { SAMPLES } from '../sample-loader'
import packageJson from '../../package.json'
import { Hammer, Play, Pause, Sun, Moon, Bug } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTheme } from './theme-provider'

interface MenuItem {
  label: string
  action?: () => void
  isSeparator?: boolean
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

export const Menu = (props: { editor: LegumesEditor }) => {
  const { editor } = props
  const [isPlaying, setIsPlaying] = useState(false)
  const { theme, setTheme } = useTheme()

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
        items: SAMPLES.map((sampleName) => ({
          label: sampleName.split('/').pop() || sampleName,
          action: () => editor.loadSample(sampleName),
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
            action: () => editor.playMidi(),
          },
          {
            label: 'Abort',
            action: () => editor.abortPlay(),
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
    [editor],
  )

  return (
    <Menubar className="justify-between rounded-none">
      <div className="flex">
        {menuGroups.map((group) => (
          <MenubarMenu key={group.label}>
            <MenubarTrigger>{group.label}</MenubarTrigger>
            <MenubarContent>
              {group.items.map((item, index) => (
                <div key={index}>
                  {item.isSeparator ? (
                    <MenubarSeparator />
                  ) : (
                    <MenubarItem onClick={item.action}>
                      {item.label}
                    </MenubarItem>
                  )}
                </div>
              ))}
            </MenubarContent>
          </MenubarMenu>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <MenubarMenu>
          <MenubarTrigger onClick={() => editor.compile()}>
            <Hammer size={16} />
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            onClick={() => {
              editor.toggleMidiPlay()
              setIsPlaying(editor.getIsPlaying())
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger onClick={() => editor.debugCodeMirror()}>
            <Bug size={16} />
          </MenubarTrigger>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </MenubarTrigger>
        </MenubarMenu>
      </div>
    </Menubar>
  )
}
