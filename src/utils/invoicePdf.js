import { pdf } from '@react-pdf/renderer'

export async function generateInvoicePdfBlob(documentElement) {
  return pdf(documentElement).toBlob()
}

export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

/** Opens the system print dialog for a PDF blob (no download step). */
export function printPdfBlob(blob) {
  const url = URL.createObjectURL(blob)
  let cleanedUp = false

  const cleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    URL.revokeObjectURL(url)
  }

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('title', 'Print invoice')
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
    })
    iframe.src = url

    const removeIframe = () => {
      iframe.remove()
    }

    const scheduleCleanup = () => {
      window.setTimeout(() => {
        removeIframe()
        cleanup()
      }, 60_000)
    }

    const fail = (message) => {
      removeIframe()
      cleanup()
      reject(new Error(message))
    }

    const openPrintDialog = (win) => {
      win.focus()
      win.print()
      resolve()

      if (typeof win.addEventListener === 'function') {
        win.addEventListener('afterprint', () => {
          removeIframe()
          cleanup()
        })
      } else {
        scheduleCleanup()
      }
    }

    iframe.onload = () => {
      const win = iframe.contentWindow
      if (!win) {
        removeIframe()
        const popup = window.open(url, '_blank', 'noopener')
        if (!popup) {
          fail('Could not open print preview. Allow pop-ups for this site and try again.')
          return
        }
        popup.onload = () => openPrintDialog(popup)
        return
      }

      openPrintDialog(win)
    }

    iframe.onerror = () => {
      fail('Could not load the invoice for printing.')
    }

    document.body.appendChild(iframe)
  })
}
