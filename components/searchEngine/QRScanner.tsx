import { Html5Qrcode } from "html5-qrcode"
import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function QRScanner({
  onClose,
  onScan
}: {
  onClose: () => void
  onScan: (value: string) => void
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isStoppedRef = useRef(false)
  const isStartedRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    let timeoutId: NodeJS.Timeout

    const stop = async () => {
      if (isStoppedRef.current) return
      isStoppedRef.current = true

      const currentScanner = scannerRef.current
      if (!currentScanner || !isStartedRef.current) return

      try {
        await currentScanner.stop()
        await currentScanner.clear()
      } catch (error) {
        console.error("QRScanner stop failed:", error)
      } finally {
        scannerRef.current = null
        isStartedRef.current = false
      }
    }

    const start = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (isStoppedRef.current) return
            isStoppedRef.current = true

            onScan(decodedText)
            stop()
          },
          () => {}
        )

        isStartedRef.current = true

        // ⏱️ Auto-stop after 1 minute
        timeoutId = setTimeout(() => {
          if (!isStoppedRef.current) {
            stop()
            onClose()
            toast("Scanner closed automatically")
          }
        }, 60 * 1000)

      } catch {
        toast.error("Camera error")
        onClose()
      }
    }

    start()

    return () => {
      clearTimeout(timeoutId)
      stop()
    }
  }, [onScan, onClose])

  const handleClose = async () => {
    isStoppedRef.current = true

    const currentScanner = scannerRef.current
    if (!currentScanner || !isStartedRef.current) {
      onClose()
      return
    }

    try {
      await currentScanner.stop()
      await currentScanner.clear()
    } catch (error) {
      console.error("QRScanner manual stop failed:", error)
    } finally {
      scannerRef.current = null
      isStartedRef.current = false
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <p className="text-gray-400 mt-2">
        Point your camera at a QR code
      </p>
      <div id="qr-reader" className="w-72" />
      <button
        onClick={handleClose}
        className="mt-4 text-white border px-4 py-2 rounded"
      >
        Close
      </button>
    </div>
  )
}