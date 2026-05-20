'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  { ssr: false }
)

type Profile = {
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fats_goal: number
}

type Entry = {
  id: string
  quantity: number
  meal_type: string | null
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

  const [barcode, setBarcode] = useState('')
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState('100')
  const [calories, setCalories] = useState('')
  const [proteins, setProteins] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [mealType, setMealType] = useState('déjeuner')
  const [showScanner, setShowScanner] = useState(false)

  async function getUser() {
    const { data } = await supabase.auth.getUser()
    return data.user
  }

  async function loadData() {
    const user = await getUser()

    if (!user) {
      window.location.href = '/auth'
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('calorie_goal, protein_goal, carbs_goal, fats_goal')
      .eq('id', user.id)
      .maybeSingle()

    const today = new Date().toISOString().slice(0, 10)

    const { data: entriesData, error } = await supabase
      .from('food_entries')
      .select(`
        id,
        quantity,
        meal_type,
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

    if (error) {
      alert(error.message)
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

  const totals = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const factor = Number(entry.quantity) / 100

        acc.calories += Number(entry.foods.calories || 0) * factor
        acc.proteins += Number(entry.foods.proteins || 0) * factor
        acc.carbs += Number(entry.foods.carbs || 0) * factor
        acc.fats += Number(entry.foods.fats || 0) * factor

        return acc
      },
      { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    )
  }, [entries])

  const previewFactor = Number(quantity || 0) / 100

  const previewCalories = Math.round(Number(calories || 0) * previewFactor)
  const previewProteins = Math.round(Number(proteins || 0) * previewFactor)
  const previewCarbs = Math.round(Number(carbs || 0) * previewFactor)
  const previewFats = Math.round(Number(fats || 0) * previewFactor)

  const calorieGoal = profile?.calorie_goal || 2800
  const theoreticalCalories = Math.round(totals.calories + previewCalories)
  const theoreticalRemaining = calorieGoal - theoreticalCalories

  async function fetchBarcode(code?: string) {
    const codeToSearch = code || barcode

    if (!codeToSearch) {
      alert('Entre ou scanne un code-barres.')
      return
    }

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codeToSearch}.json`
    )

    const data = await response.json()

    if (!data.product) {
      alert('Produit introuvable.')
      return
    }

    const product = data.product
    const nutriments = product.nutriments || {}

    setBarcode(codeToSearch)
    setFoodName(product.product_name || 'Produit sans nom')
    setCalories(String(nutriments['energy-kcal_100g'] || 0))
    setProteins(String(nutriments.proteins_100g || 0))
    setCarbs(String(nutriments.carbohydrates_100g || 0))
    setFats(String(nutriments.fat_100g || 0))
  }

  async function handleScan(code: string) {
    setShowScanner(false)
    await fetchBarcode(code)
  }

  async function addFoodEntry() {
    const user = await getUser()

    if (!user) {
      window.location.href = '/auth'
      return
    }

    if (!foodName || !quantity) {
      alert('Ajoute au moins un nom et une quantité.')
      return
    }

    const { data: foodData, error: foodError } = await supabase
      .from('foods')
      .insert({
        barcode: barcode || null,
        name: foodName,
        calories: Number(calories || 0),
        proteins: Number(proteins || 0),
        carbs: Number(carbs || 0),
        fats: Number(fats || 0),
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
        meal_type: mealType,
        consumed_at: today,
      })

    if (entryError) {
      alert(entryError.message)
      return
    }

    setBarcode('')
    setFoodName('')
    setQuantity('100')
    setCalories('')
    setProteins('')
    setCarbs('')
    setFats('')

    await loadData()
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  if (loading) {
    return <main className="p-6">Chargement...</main>
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard nutrition</h1>

        <div className="grid grid-cols-2 gap-4">
          <Card title="Calories" value={totals.calories} goal={profile?.calorie_goal || 2800} unit="kcal" />
          <Card title="Protéines" value={totals.proteins} goal={profile?.protein_goal || 120} unit="g" />
          <Card title="Glucides" value={totals.carbs} goal={profile?.carbs_goal || 400} unit="g" />
          <Card title="Lipides" value={totals.fats} goal={profile?.fats_goal || 65} unit="g" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-bold">Ajouter un aliment</h2>

          <input
            className="border p-3 w-full rounded"
            placeholder="Code-barres"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />

          <button onClick={() => fetchBarcode()} className="border p-3 rounded w-full">
            Récupérer avec OpenFoodFacts
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className="border p-3 rounded w-full"
          >
            Scanner avec la caméra
          </button>

          {showScanner && (
            <div className="border p-3 rounded space-y-3">
              <BarcodeScanner onScan={handleScan} />

              <button
                onClick={() => setShowScanner(false)}
                className="border p-3 rounded w-full"
              >
                Annuler le scan
              </button>
            </div>
          )}

          <input
            className="border p-3 w-full rounded"
            placeholder="Nom de l’aliment"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
          />

          <input
            className="border p-3 w-full rounded"
            placeholder="Quantité consommée en grammes"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <p className="text-sm text-gray-500">Valeurs pour 100 g :</p>

          <input
            className="border p-3 w-full rounded"
            placeholder="Calories / 100 g"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />

          <input
            className="border p-3 w-full rounded"
            placeholder="Protéines / 100 g"
            type="number"
            value={proteins}
            onChange={(e) => setProteins(e.target.value)}
          />

          <input
            className="border p-3 w-full rounded"
            placeholder="Glucides / 100 g"
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
          />

          <input
            className="border p-3 w-full rounded"
            placeholder="Lipides / 100 g"
            type="number"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
          />

          <select
            className="border p-3 w-full rounded"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option value="petit-déjeuner">Petit-déjeuner</option>
            <option value="déjeuner">Déjeuner</option>
            <option value="dîner">Dîner</option>
            <option value="collation">Collation</option>
          </select>

          <div className="bg-gray-100 p-4 rounded-xl space-y-2">
            <p className="font-bold text-lg">Aperçu avant ajout</p>

            <p>
              Pour {quantity || 0} g :{' '}
              <span className="font-bold">{previewCalories} kcal</span>
            </p>

            <p>
              Protéines : <span className="font-bold">{previewProteins} g</span>
            </p>

            <p>
              Glucides : <span className="font-bold">{previewCarbs} g</span>
            </p>

            <p>
              Lipides : <span className="font-bold">{previewFats} g</span>
            </p>

            <div className="border-t pt-2 mt-2">
              <p className="font-bold">Après ajout :</p>

              <p>
                {theoreticalCalories} / {calorieGoal} kcal
              </p>

              <p>
                Calories restantes :{' '}
                <span className="font-bold">{theoreticalRemaining} kcal</span>
              </p>
            </div>
          </div>

          <button onClick={addFoodEntry} className="bg-black text-white p-3 rounded w-full">
            Ajouter à ma journée
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl shadow space-y-3">
          <h2 className="text-xl font-bold">Aliments du jour</h2>

          {entries.length === 0 && (
            <p className="text-gray-500">Aucun aliment ajouté aujourd’hui.</p>
          )}

          {entries.map((entry) => {
            const factor = Number(entry.quantity) / 100

            return (
              <div key={entry.id} className="border p-3 rounded flex justify-between gap-3">
                <div>
                  <p className="font-bold">{entry.foods.name}</p>
                  <p className="text-sm text-gray-500">
                    {entry.meal_type || 'repas'} · {entry.quantity} g
                  </p>
                  <p className="text-sm">
                    {Math.round(entry.foods.calories * factor)} kcal · P{' '}
                    {Math.round(entry.foods.proteins * factor)} g · G{' '}
                    {Math.round(entry.foods.carbs * factor)} g · L{' '}
                    {Math.round(entry.foods.fats * factor)} g
                  </p>
                </div>

                <button onClick={() => deleteEntry(entry.id)} className="text-red-600">
                  Supprimer
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

function Card({
  title,
  value,
  goal,
  unit,
}: {
  title: string
  value: number
  goal: number
  unit: string
}) {
  const percent = Math.min(100, Math.round((value / goal) * 100))

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <p className="text-gray-500">{title}</p>
      <p className="text-2xl font-bold">
        {Math.round(value)} / {goal} {unit}
      </p>

      <div className="h-3 bg-gray-200 rounded mt-3">
        <div className="h-3 bg-black rounded" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}