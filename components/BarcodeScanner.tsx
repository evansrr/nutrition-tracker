'use client'

import { BrowserMultiFormatReader } from '@zxing/browser'
import { useEffect, useRef } from 'react'

type Props = {
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({
  onScan,
}: Props) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const reader =
      new BrowserMultiFormatReader()

    let controls: any
    let stopped = false

    async function startScanner() {
      try {
        controls =
          await reader.decodeFromVideoDevice(
            undefined,
            videoRef.current!,
            (result) => {
              if (result && !stopped) {
                stopped = true

                const code =
                  result.getText()

                controls?.stop()

                onScan(code)
              }
            }
          )
      } catch (error) {
        console.error(error)
      }
    }

    startScanner()

    return () => {
      stopped = true
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
        Scanne un code-barres alimentaire
      </p>
    </div>
  )
}