'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  { ssr: false }
)

type Profile = {
  id: string
  calories_goal: number
  proteins_goal: number
  carbs_goal: number
  fats_goal: number
}

type Entry = {
  id: string
  quantity: number
  foods: {
    name: string
    calories: number
    proteins: number
    carbs: number
    fats: number
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])

  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [proteins, setProteins] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [quantity, setQuantity] = useState('100')
  const [barcode, setBarcode] = useState('')

  const [showScanner, setShowScanner] = useState(false)

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const today = new Date().toISOString().slice(0, 10)

    const { data: entriesData, error: entriesError } =
      await supabase
        .from('food_entries')
        .select(`
          id,
          quantity,
          foods (
            name,
            calories,
            proteins,
            carbs,
            fats
          )
        `)
        .eq('user_id', user.id)
        .eq('consumed_at', today)
        .order('created_at', { ascending: false })

    if (entriesError) {
      alert(entriesError.message)
      setLoading(false)
      return
    }

    setProfile(profileData)
    setEntries((entriesData ?? []) as unknown as Entry[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleAddFood() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: foodData, error: foodError } =
      await supabase
        .from('foods')
        .insert({
          user_id: user.id,
          name: foodName,
          calories: Number(calories),
          proteins: Number(proteins),
          carbs: Number(carbs),
          fats: Number(fats),
        })
        .select()
        .single()

    if (foodError) {
      alert(foodError.message)
      return
    }

    const today = new Date().toISOString().slice(0, 10)

    const { error: entryError } = await supabase
      .from('food_entries')
      .insert({
        user_id: user.id,
        food_id: foodData.id,
        quantity: Number(quantity),
        consumed_at: today,
      })

    if (entryError) {
      alert(entryError.message)
      return
    }

    setFoodName('')
    setCalories('')
    setProteins('')
    setCarbs('')
    setFats('')
    setQuantity('100')
    setBarcode('')

    loadData()
  }

  async function handleDeleteEntry(id: string) {
    await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)

    loadData()
  }

  async function fetchBarcode() {
    if (!barcode) return

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    )

    const data = await response.json()

    if (!data.product) {
      alert('Produit introuvable.')
      return
    }

    const product = data.product
    const nutriments = product.nutriments || {}

    setFoodName(product.product_name || '')
    setCalories(String(nutriments['energy-kcal_100g'] || 0))
    setProteins(String(nutriments.proteins_100g || 0))
    setCarbs(String(nutriments.carbohydrates_100g || 0))
    setFats(String(nutriments.fat_100g || 0))
  }

  async function handleScan(code: string) {
    setBarcode(code)
    setShowScanner(false)

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`
    )

    const data = await response.json()

    if (!data.product) {
      alert('Produit introuvable.')
      return
    }

    const product = data.product
    const nutriments = product.nutriments || {}

    setFoodName(product.product_name || '')
    setCalories(String(nutriments['energy-kcal_100g'] || 0))
    setProteins(String(nutriments.proteins_100g || 0))
    setCarbs(String(nutriments.carbohydrates_100g || 0))
    setFats(String(nutriments.fat_100g || 0))
  }

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const factor =
          Number(entry.quantity) / 100

        acc.calories +=
          Number(entry.foods.calories || 0) *
          factor

        acc.proteins +=
          Number(entry.foods.proteins || 0) *
          factor

        acc.carbs +=
          Number(entry.foods.carbs || 0) * factor

        acc.fats +=
          Number(entry.foods.fats || 0) * factor

        return acc
      },
      {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      }
    )
  }, [entries])

  if (loading) {
    return <p>Chargement...</p>
  }

  return (
    <main className="p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">
        Dashboard nutrition
      </h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <p>Calories</p>

          <p className="text-2xl font-bold">
            {Math.round(totals.calories)} /{' '}
            {profile?.calories_goal}
          </p>
        </div>

        <div className="border p-4 rounded">
          <p>Protéines</p>

          <p className="text-2xl font-bold">
            {Math.round(totals.proteins)}g /{' '}
            {profile?.proteins_goal}g
          </p>
        </div>

        <div className="border p-4 rounded">
          <p>Glucides</p>

          <p className="text-2xl font-bold">
            {Math.round(totals.carbs)}g /{' '}
            {profile?.carbs_goal}g
          </p>
        </div>

        <div className="border p-4 rounded">
          <p>Lipides</p>

          <p className="text-2xl font-bold">
            {Math.round(totals.fats)}g /{' '}
            {profile?.fats_goal}g
          </p>
        </div>
      </div>

      <div className="border p-6 rounded space-y-4">
        <h2 className="text-xl font-bold">
          Ajouter un aliment
        </h2>

        <input
          placeholder="Code-barres"
          value={barcode}
          onChange={(e) =>
            setBarcode(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <button
          onClick={fetchBarcode}
          className="bg-black text-white p-3 rounded w-full"
        >
          Récupérer produit
        </button>

        <button
          onClick={() => setShowScanner(true)}
          className="border p-3 rounded w-full"
        >
          Scanner avec la caméra
        </button>

        {showScanner && (
          <BarcodeScanner onScan={handleScan} />
        )}

        <input
          placeholder="Nom"
          value={foodName}
          onChange={(e) =>
            setFoodName(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Calories"
          value={calories}
          onChange={(e) =>
            setCalories(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Protéines"
          value={proteins}
          onChange={(e) =>
            setProteins(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Glucides"
          value={carbs}
          onChange={(e) =>
            setCarbs(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Lipides"
          value={fats}
          onChange={(e) =>
            setFats(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <input
          placeholder="Quantité consommée (g)"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value)
          }
          className="border p-3 w-full rounded"
        />

        <button
          onClick={handleAddFood}
          className="bg-black text-white p-3 rounded w-full"
        >
          Ajouter
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">
          Aliments du jour
        </h2>

        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-bold">
                {entry.foods.name}
              </p>

              <p>
                {entry.quantity} g
              </p>

              <p>
                {Math.round(
                  (entry.foods.calories *
                    entry.quantity) /
                    100
                )}{' '}
                kcal
              </p>
            </div>

            <button
              onClick={() =>
                handleDeleteEntry(entry.id)
              }
              className="text-red-500"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}