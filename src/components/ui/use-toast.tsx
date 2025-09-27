import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const TOAST_REMOVE_DELAY = 5000

// ---- Types ----
type ToastItem = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: string
  // thêm props khác nếu cần
  [key: string]: any
}

type ToastContextType = {
  toasts: ToastItem[]
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

type ToastContextProviderProps = {
  children: React.ReactNode
}

function ToastContextProvider({ children }: ToastContextProviderProps) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  return (
    <ToastContext.Provider value={{ toasts, setToasts }}>
      {children}
      <ToastProvider>
        {toasts.map(({ id, title, description, action, ...props }) => (
          <Toast key={id} {...props} variant={props.variant as "default" | "destructive" | undefined}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastContextProvider")
  }

  const { setToasts } = context

  return {
    toast: ({ title, description, variant, ...props }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [
        ...prev,
        { id, title, description, variant, ...props },
      ])

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, TOAST_REMOVE_DELAY)

      return {
        id,
        dismiss: () =>
          setToasts((prev) => prev.filter((toast) => toast.id !== id)),
        update: (newProps: Partial<ToastItem>) => {
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id ? { ...toast, ...newProps } : toast
            )
          )
        },
      }
    },
    dismiss: (toastId: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== toastId))
    },
    dismissAll: () => {
      setToasts([])
    },
  }
}

export { ToastContextProvider, useToast }
