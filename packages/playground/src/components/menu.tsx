import { useState, useRef, useEffect } from 'react'
import type { LegumesEditor } from '../legumes-editor'
import { samples } from '../sample-loader'
import packageJson from '../../package.json'
import styles from './menu.module.scss'

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
  const [isPlaying, setIsPlaying] = useState(false)
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
      label: 'Legumes',
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
    <div className={styles.menuContainer}>
      <div className={styles.menuBar}>
        {menuGroups.map((group) => (
          <div key={group.label} className={styles.menuGroup}>
            <button
              onClick={() => handleMenuClick(group.label)}
              className={`${styles.menuButton} ${
                activeDropdown === group.label ? styles.active : ''
              }`}
            >
              {group.label}
            </button>

            {activeDropdown === group.label && (
              <div className={styles.dropdown}>
                {group.items.map((item, index) => (
                  <div key={index}>
                    {item.isSeparator ? (
                      <div className={styles.separator} />
                    ) : (
                      <button
                        onClick={() => handleItemClick(item.action)}
                        className={styles.dropdownItem}
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

        {/* 右侧按钮区域 */}
        <div className={styles.buttonGroup}>
          {/* 编译按钮 */}
          <button
            onClick={() => editor.compile()}
            className={styles.actionButton}
            title="Compile"
          >
            🔨
          </button>

          {/* MIDI播放按钮 */}
          <button
            onClick={() => {
              editor.toggleMidiPlay()
              setIsPlaying(editor.getIsPlaying())
            }}
            className={styles.actionButton}
            title={isPlaying ? 'Pause MIDI' : 'Play MIDI'}
          >
            {isPlaying ? '⏸️' : '🔊'}
          </button>

          {/* 调试按钮 */}
          <button
            onClick={() => editor.debugCodeMirror()}
            className={`${styles.actionButton} ${styles.debugButton}`}
            title="Debug CodeMirror"
          >
            🐛
          </button>
        </div>
      </div>
    </div>
  )
}

// File upload utility
