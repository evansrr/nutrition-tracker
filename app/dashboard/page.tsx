'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BarcodeScanner from '@/components/BarcodeScanner'

type Food = {
  id: string
  name: string
  calories: number
  proteins: number
  carbs: number
  fats: number
  grams: number
  meal_type: string
}

export default function DashboardPage() {
  const [foods, setFoods] = useState<Food[]>([])
  const [profile, setProfile] = useState<any>(null)

  const [foodName, setFoodName] = useState('')
  const [calories, setCalories] = useState('')
  const [proteins, setProteins] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fats, setFats] = useState('')
  const [grams, setGrams] = useState('100')

  const [mealType, setMealType] = useState('Déjeuner')

  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  async function loadFoods() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setFoods(data || [])
  }

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
  }

  useEffect(() => {
    loadFoods()
    loadProfile()
  }, [])

  const totalCalories = foods.reduce(
    (acc, food) => acc + food.calories,
    0
  )

  const liveCalories = useMemo(() => {
    return Math.round(
      (Number(calories || 0) * Number(grams || 0)) / 100
    )
  }, [calories, grams])

  const liveProteins = useMemo(() => {
    return (
      (Number(proteins || 0) * Number(grams || 0)) /
      100
    ).toFixed(1)
  }, [proteins, grams])

  const liveCarbs = useMemo(() => {
    return (
      (Number(carbs || 0) * Number(grams || 0)) /
      100
    ).toFixed(1)
  }, [carbs, grams])

  const liveFats = useMemo(() => {
    return (
      (Number(fats || 0) * Number(grams || 0)) /
      100
    ).toFixed(1)
  }, [fats, grams])

  async function addFood() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Utilisateur non connecté')
      setLoading(false)
      return
    }

    const finalCalories = liveCalories

    const finalProteins = Number(liveProteins)
    const finalCarbs = Number(liveCarbs)
    const finalFats = Number(liveFats)

    const { error } = await supabase.from('foods').insert({
      user_id: user.id,
      name: foodName,
      calories: finalCalories,
      proteins: finalProteins,
      carbs: finalCarbs,
      fats: finalFats,
      grams: Number(grams),
      meal_type: mealType,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setFoodName('')
    setCalories('')
    setProteins('')
    setCarbs('')
    setFats('')
    setGrams('100')

    await loadFoods()
  }

  async function handleScan(barcode: string) {
    setShowScanner(false)

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      )

      const data = await response.json()

      if (!data.product) {
        alert('Produit introuvable')
        return
      }

      const product = data.product

      setFoodName(product.product_name || '')

      setCalories(
        product.nutriments?.['energy-kcal_100g']?.toString() || '0'
      )

      setProteins(
        product.nutriments?.proteins_100g?.toString() || '0'
      )

      setCarbs(
        product.nutriments?.carbohydrates_100g?.toString() || '0'
      )

      setFats(
        product.nutriments?.fat_100g?.toString() || '0'
      )

      setGrams('100')
    } catch {
      alert('Erreur récupération produit')
    }
  }

  return (
    <main className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-4xl font-bold">
        Suivi nutritionnel
      </h1>

      <div className="bg-white border rounded-xl p-4 space-y-4">
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
              Fermer le scanner
            </button>
          </div>
        )}

        <input
          className="border p-3 w-full rounded"
          placeholder="Nom de l'aliment"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
        />

        <input
          className="border p-3 w-full rounded"
          placeholder="Quantité consommée en grammes"
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />

        <p className="text-sm text-gray-500">
          Valeurs pour 100 g :
        </p>

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
          <option>Petit-déjeuner</option>
          <option>Déjeuner</option>
          <option>Dîner</option>
          <option>Snack</option>
        </select>

        <div className="bg-gray-100 p-4 rounded space-y-2">
          <h2 className="font-bold text-2xl">
            Aperçu avant-ajout
          </h2>

          <p>
            Pour {grams} g :
            <strong> {liveCalories} kcal</strong>
          </p>

          <p>
            Protéines :
            <strong> {liveProteins} g</strong>
          </p>

          <p>
            Glucides :
            <strong> {liveCarbs} g</strong>
          </p>

          <p>
            Lipides :
            <strong> {liveFats} g</strong>
          </p>

          <div className="border-t pt-3 mt-3">
            <p className="font-semibold">
              Après ajout :
            </p>

            <p>
              {totalCalories + liveCalories}/
              {profile?.calorie_goal || 2800} kcal
            </p>

            <p>
              Restant :
              <strong>
                {' '}
                {(profile?.calorie_goal || 2800) -
                  (totalCalories + liveCalories)}
                kcal
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={addFood}
          disabled={loading}
          className="bg-black text-white p-3 rounded w-full"
        >
          {loading ? 'Ajout...' : 'Ajouter'}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold">
          Aliments du jour
        </h2>

        {foods.map((food) => (
          <div
            key={food.id}
            className="border rounded-xl p-4"
          >
            <h3 className="font-bold text-xl">
              {food.name}
            </h3>

            <p>{food.calories} kcal</p>

            <p>
              P: {food.proteins}g • G: {food.carbs}g •
              L: {food.fats}g
            </p>

            <p>{food.grams} g</p>

            <p className="text-sm text-gray-500">
              {food.meal_type}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}