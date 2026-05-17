'use client'

import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect } from 'react'

type Props = {
  onScan: (barcode: string) => void
}

export default function BarcodeScanner({
  onScan,
}: Props) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: 250,
      },
      false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
        scanner.clear()
      },
      () => {}
    )

    return () => {
      scanner.clear().catch(() => {})
    }
  }, [onScan])

  return <div id="reader" />
}