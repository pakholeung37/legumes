import { useState, useRef, useEffect } from 'react'
import type { LegumesEditor } from '../legumes-editor'
import { samples } from '../sample-loader'
import packageJson from '../../package.json'

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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 关闭下拉菜单的函数
  const closeDropdown = () => setActiveDropdown(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 菜单配置
  const menuGroups: MenuGroup[] = [
    {
      label: 'L',
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
      items: Object.keys(samples).map((sampleName) => ({
        label: sampleName,
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
            window.open('https://github.com/LingDong-/legumes/issues', '_blank')
          },
        },
      ],
    },
  ]

  const handleMenuClick = (groupLabel: string) => {
    setActiveDropdown(activeDropdown === groupLabel ? null : groupLabel)
  }

  const handleItemClick = (action?: () => void) => {
    if (action) {
      action()
    }
    closeDropdown()
  }

  return (
    <div
      style={{
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '32px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          pointerEvents: 'auto',
        }}
      >
        {menuGroups.map((group) => (
          <div
            key={group.label}
            style={{
              position: 'relative',
              display: 'inline-block',
            }}
          >
            <button
              onClick={() => handleMenuClick(group.label)}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: activeDropdown === group.label ? '#007bff' : '#333',
                fontWeight: activeDropdown === group.label ? 'bold' : 'normal',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {group.label}
            </button>

            {activeDropdown === group.label && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  minWidth: '160px',
                  zIndex: 1001,
                }}
              >
                {group.items.map((item, index) => (
                  <div key={index}>
                    {item.isSeparator ? (
                      <div
                        style={{
                          height: '1px',
                          backgroundColor: '#dee2e6',
                          margin: '4px 0',
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => handleItemClick(item.action)}
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          textAlign: 'left',
                          color: '#333',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {item.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// File upload utility
