import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { xml } from '@codemirror/lang-xml'
import { useEditorInstance } from './use-editor-instance'

interface CodeEditorProps {
  onChange?: (value: string) => void
  readOnly?: boolean
}

export function CodeEditor({ readOnly = false, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const editor = useEditorInstance()
  const source = editor.useSource()

  useEffect(() => {
    if (!editorRef.current) return

    const extensions = [
      basicSetup,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          editor.setSource(newValue)
          if (onChange) {
            onChange(newValue)
          }
        }
      }),
      EditorView.editable.of(!readOnly),
      xml(),
    ]

    viewRef.current = new EditorView({
      doc: '',
      extensions,
      parent: editorRef.current,
    })

    return () => {
      viewRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (viewRef.current && source !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: source,
        },
      })
    }
  }, [source])

  return <div ref={editorRef} className="h-full" />
}
