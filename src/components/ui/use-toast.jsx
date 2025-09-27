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

const ToastContext = React.createContext({})

function ToastContextProvider({
  children,
  ...props
}) {
  const [toasts, setToasts] = React.useState([])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        setToasts,
        ...props,
      }}
    >
      {children}
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          )
        })}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

function useToast() {
  const { toasts, setToasts } = React.useContext(ToastContext)

  return {
    toast: ({ title, description, variant, ...props }) => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((toasts) => [
        ...toasts,
        { id, title, description, variant, ...props },
      ])

      setTimeout(() => {
        setToasts((toasts) => toasts.filter((toast) => toast.id !== id))
      }, TOAST_REMOVE_DELAY)

      return {
        id,
        dismiss: () => setToasts((toasts) => toasts.filter((toast) => toast.id !== id)),
        update: (props) => {
          setToasts((toasts) =>
            toasts.map((toast) =>
              toast.id === id ? { ...toast, ...props } : toast
            )
          )
        },
      }
    },
    dismiss: (toastId) => {
      setToasts((toasts) => toasts.filter((toast) => toast.id !== toastId))
    },
    dismissAll: () => {
      setToasts([])
    },
  }
}

export { ToastContextProvider, useToast }