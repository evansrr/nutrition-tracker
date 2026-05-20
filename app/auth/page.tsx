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
    let isScanning = true
    let controls: { stop: () => void } | undefined

    async function startScanner() {
      try {
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && isScanning) {
              isScanning = false
              const code = result.getText()

              controls?.stop()
              onScan(code)
            }
          }
        )
      } catch (error) {
        console.error(error)
        alert('Impossible de lancer le scanner.')
      }
    }

    startScanner()

    return () => {
      isScanning = false
      controls?.stop()
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