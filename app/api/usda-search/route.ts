import { NextResponse } from 'next/server'

const USDA_API_KEY = process.env.USDA_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ foods: [] })
  }

  if (!USDA_API_KEY) {
    return NextResponse.json(
      { error: 'Clé USDA manquante' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          pageSize: 10,
          dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
        }),
      }
    )

    const data = await response.json()

    return NextResponse.json({
      foods: data.foods || [],
    })
  } catch {
    return NextResponse.json(
      { error: 'Erreur USDA' },
      { status: 500 }
    )
  }
}