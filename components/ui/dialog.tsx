"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Modal } from "./modal"
import { Button } from "./button"
import { Input } from "./input"

interface DialogContextValue {
  confirm: (message: string, title?: string) => Promise<boolean>
  prompt: (message: string, title?: string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

type DialogState =
  | { kind: "none" }
  | { kind: "confirm"; message: string; title?: string }
  | { kind: "prompt"; message: string; title?: string }

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ kind: "none" })
  const [value, setValue] = useState("")
  const resolver = useRef<((result: unknown) => void) | null>(null)

  const close = () => setState({ kind: "none" })

  const confirm = useCallback((message: string, title?: string) => {
    setState({ kind: "confirm", message, title })
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve as (r: unknown) => void
    })
  }, [])

  const prompt = useCallback((message: string, title?: string) => {
    setValue("")
    setState({ kind: "prompt", message, title })
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve as (r: unknown) => void
    })
  }, [])

  const settle = (result: boolean | string | null) => {
    resolver.current?.(result)
    resolver.current = null
    close()
  }

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <Modal
        open={state.kind !== "none"}
        onClose={() => settle(state.kind === "confirm" ? false : null)}
        title={state.kind !== "none" ? state.title : undefined}
      >
        {state.kind !== "none" && (
          <div className="space-y-4">
            <p className="text-ink">{state.message}</p>
            {state.kind === "prompt" && (
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => settle(state.kind === "confirm" ? false : null)}
              >
                Batal
              </Button>
              <Button
                onClick={() => settle(state.kind === "confirm" ? true : value)}
              >
                OK
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error("useDialog harus dipakai di dalam DialogProvider")
  return ctx
}
