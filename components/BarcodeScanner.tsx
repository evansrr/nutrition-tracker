'use client'

import { BrowserMultiFormatReader } from '@zxing/browser'
import { useEffect, useRef } from 'react'

type Props = {
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let stopped = false

    async function start() {
      try {
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && !stopped) {
              stopped = true
              onScan(result.getText())
              ;(reader as any).reset()
            }
          }
        )
      } catch {
        alert('Impossible de lancer le scanner.')
      }
    }

    start()

    return () => {
      stopped = true
      ;(reader as any).reset()
    }
  }, [onScan])

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        className="w-full rounded border"
        playsInline
        muted
      />

      <p className="text-sm text-gray-500">
        Place le code-barres bien à plat, bien éclairé, et assez proche de la caméra.
      </p>
    </div>
  )
}