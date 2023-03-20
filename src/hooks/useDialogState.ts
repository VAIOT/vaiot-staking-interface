import { useCallback, useMemo, useState } from 'react'

export const useDialogState = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(p => !p), [])

  return useMemo(() => ({ isOpen, open, close, toggle }), [close, isOpen, open, toggle])
}
