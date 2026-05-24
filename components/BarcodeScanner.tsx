'use client'

import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from '@zxing/browser'
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

    let controls: IScannerControls | undefined
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
        className="aspect-video w-full rounded-lg border border-stone-200 bg-stone-950 object-cover"
        playsInline
        muted
      />

      <p className="text-sm text-stone-500">
        Scanne un code-barres alimentaire
      </p>
    </div>
  )
}
