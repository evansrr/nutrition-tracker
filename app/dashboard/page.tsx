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
  meal: string
}

export default function DashboardPage() {
  const [foods, setFoods] = useState<Food[]>([])

  const [foodName, setFoodName] = useState('')
  const [grams, setGrams] = useState('100')

  const [calories100g, setCalories100g] = useState('')
  const [proteins100g, setProteins100g] = useState('')
  const [carbs100g, setCarbs100g] = useState('')
  const [fats100g, setFats100g] = useState('')

  const [mealType, setMealType] = useState('Déjeuner')

  const [showScanner, setShowScanner] = useState(false)

  const calorieGoal = 2800
  const proteinGoal = 120
  const carbsGoal = 400
  const fatsGoal = 65

  async function loadFoods() {
    const { data } = await supabase
      .from('foods')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setFoods(data)
    }
  }

  useEffect(() => {
    loadFoods()
  }, [])

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

      setCalories100g(
        String(
          Math.round(product.nutriments?.['energy-kcal_100g'] || 0)
        )
      )

      setProteins100g(
        String(
          Math.round(product.nutriments?.proteins_100g || 0)
        )
      )

      setCarbs100g(
        String(
          Math.round(product.nutriments?.carbohydrates_100g || 0)
        )
      )

      setFats100g(
        String(
          Math.round(product.nutriments?.fat_100g || 0)
        )
      )
    } catch {
      alert('Erreur scan')
    }
  }

  const preview = useMemo(() => {
    const qty = Number(grams) || 0

    const factor = qty / 100

    const calories =
      (Number(calories100g) || 0) * factor

    const proteins =
      (Number(proteins100g) || 0) * factor

    const carbs =
      (Number(carbs100g) || 0) * factor

    const fats =
      (Number(fats100g) || 0) * factor

    return {
      calories: Math.round(calories),
      proteins: Number(proteins.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fats: Number(fats.toFixed(1)),
    }
  }, [
    grams,
    calories100g,
    proteins100g,
    carbs100g,
    fats100g,
  ])

  async function addFood() {
    if (!foodName) {
      alert('Nom manquant')
      return
    }

    const { error } = await supabase
      .from('foods')
      .insert({
        name: foodName,
        calories: preview.calories,
        proteins: preview.proteins,
        carbs: preview.carbs,
        fats: preview.fats,
        grams: Number(grams),
        meal: mealType,
      })

    if (error) {
      alert(error.message)
      return
    }

    setFoodName('')
    setCalories100g('')
    setProteins100g('')
    setCarbs100g('')
    setFats100g('')
    setGrams('100')

    loadFoods()
  }

  async function deleteFood(id: string) {
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setFoods((prev) =>
      prev.filter((food) => food.id !== id)
    )
  }

  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + Number(food.calories),
      proteins: acc.proteins + Number(food.proteins),
      carbs: acc.carbs + Number(food.carbs),
      fats: acc.fats + Number(food.fats),
    }),
    {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    }
  )

  return (
    <main className="min-h-screen bg-neutral-100 p-4 space-y-6">

      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-neutral-500">Aujourd’hui</p>

        <h1 className="text-5xl font-bold mb-6">
          Nutrition
        </h1>

        <div>
          <p className="text-neutral-500 mb-1">
            Calories
          </p>

          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold">
              {totals.calories}
            </span>

            <span className="text-3xl text-neutral-400 mb-1">
              / {calorieGoal}
            </span>
          </div>

          <p className="text-neutral-500 mt-2">
            Restant : {calorieGoal - totals.calories} kcal
          </p>
        </div>

        <div className="h-4 bg-neutral-200 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-black rounded-full"
            style={{
              width: `${Math.min(
                (totals.calories / calorieGoal) * 100,
                100
              )}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">

          <div className="bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-neutral-500 text-sm">
              Protéines
            </p>

            <p className="font-bold text-2xl">
              {totals.proteins}g
            </p>

            <p className="text-xs text-neutral-500">
              Restant : {Math.max(0, proteinGoal - totals.proteins)}g
            </p>
          </div>

          <div className="bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-neutral-500 text-sm">
              Glucides
            </p>

            <p className="font-bold text-2xl">
              {totals.carbs}g
            </p>

            <p className="text-xs text-neutral-500">
              Restant : {Math.max(0, carbsGoal - totals.carbs)}g
            </p>
          </div>

          <div className="bg-neutral-100 rounded-2xl p-3 text-center">
            <p className="text-neutral-500 text-sm">
              Lipides
            </p>

            <p className="font-bold text-2xl">
              {totals.fats}g
            </p>

            <p className="text-xs text-neutral-500">
              Restant : {Math.max(0, fatsGoal - totals.fats)}g
            </p>
          </div>

        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm space-y-4">

        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            Ajouter
          </h2>

          <button
            onClick={() => setShowScanner(true)}
            className="bg-black text-white px-6 py-3 rounded-full"
          >
            Scanner
          </button>
        </div>

        {showScanner && (
          <div className="space-y-3">
            <BarcodeScanner onScan={handleScan} />

            <button
              onClick={() => setShowScanner(false)}
              className="border p-3 rounded-2xl w-full"
            >
              Fermer le scanner
            </button>
          </div>
        )}

        <input
          className="border rounded-2xl p-4 w-full"
          placeholder="Nom de l’aliment"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
        />

        <input
          className="border rounded-2xl p-4 w-full"
          placeholder="Quantité en grammes"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">

          <input
            className="border rounded-2xl p-4"
            placeholder="kcal / 100g"
            value={calories100g}
            onChange={(e) =>
              setCalories100g(e.target.value)
            }
          />

          <input
            className="border rounded-2xl p-4"
            placeholder="Protéines"
            value={proteins100g}
            onChange={(e) =>
              setProteins100g(e.target.value)
            }
          />

          <input
            className="border rounded-2xl p-4"
            placeholder="Glucides"
            value={carbs100g}
            onChange={(e) =>
              setCarbs100g(e.target.value)
            }
          />

          <input
            className="border rounded-2xl p-4"
            placeholder="Lipides"
            value={fats100g}
            onChange={(e) =>
              setFats100g(e.target.value)
            }
          />

        </div>

        <select
          className="border rounded-2xl p-4 w-full"
          value={mealType}
          onChange={(e) =>
            setMealType(e.target.value)
          }
        >
          <option>Petit-déjeuner</option>
          <option>Déjeuner</option>
          <option>Dîner</option>
          <option>Collation</option>
        </select>

        <div className="bg-neutral-100 rounded-3xl p-6">
          <h3 className="text-2xl font-bold mb-4">
            Aperçu
          </h3>

          <p className="text-6xl font-bold">
            {preview.calories} kcal
          </p>

          <div className="grid grid-cols-3 mt-6">

            <div>
              <p className="text-neutral-500">P</p>
              <p className="text-2xl font-semibold">
                {preview.proteins}g
              </p>
            </div>

            <div>
              <p className="text-neutral-500">G</p>
              <p className="text-2xl font-semibold">
                {preview.carbs}g
              </p>
            </div>

            <div>
              <p className="text-neutral-500">L</p>
              <p className="text-2xl font-semibold">
                {preview.fats}g
              </p>
            </div>

          </div>

          <div className="mt-6 text-neutral-500 space-y-1">
            <p>
              Après ajout :{' '}
              {totals.calories + preview.calories}
              {' / '}
              {calorieGoal} kcal
            </p>

            <p>
              Restant après ajout :{' '}
              {calorieGoal -
                (totals.calories + preview.calories)}{' '}
              kcal
            </p>
          </div>
        </div>

        <button
          onClick={addFood}
          className="w-full bg-black text-white py-5 rounded-3xl text-2xl font-semibold"
        >
          Ajouter à ma journée
        </button>

      </section>

      <section className="space-y-4">

        <h2 className="text-5xl font-bold">
          Aliments du jour
        </h2>

        {foods.length === 0 && (
          <div className="bg-white rounded-3xl p-6 text-neutral-500">
            Aucun aliment ajouté.
          </div>
        )}

        {foods.map((food) => (
          <div
            key={food.id}
            className="relative bg-white rounded-3xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">
                  {food.name}
                </h3>

                <p className="text-neutral-500 text-xl">
                  {food.meal} · {food.grams} g
                </p>

                <p className="text-neutral-500 text-xl mt-3">
                  P {food.proteins}g · G {food.carbs}g · L {food.fats}g
                </p>
              </div>

              <p className="text-3xl font-bold">
                {food.calories} kcal
              </p>
            </div>

            <button
              onClick={() => deleteFood(food.id)}
              className="absolute bottom-5 right-5 text-2xl"
            >
              🗑️
            </button>
          </div>
        ))}

      </section>
    </main>
  )
}