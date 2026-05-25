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

  const totalCalories = foods.reduce((acc, food) => acc + Number(food.calories || 0), 0)
  const totalProteins = foods.reduce((acc, food) => acc + Number(food.proteins || 0), 0)
  const totalCarbs = foods.reduce((acc, food) => acc + Number(food.carbs || 0), 0)
  const totalFats = foods.reduce((acc, food) => acc + Number(food.fats || 0), 0)

  const calorieGoal = profile?.calorie_goal || 2800
  const proteinGoal = profile?.protein_goal || 120
  const carbsGoal = profile?.carbs_goal || 400
  const fatsGoal = profile?.fats_goal || 65

  const remainingCalories = calorieGoal - totalCalories
  const remainingProteins = proteinGoal - totalProteins
  const remainingCarbs = carbsGoal - totalCarbs
  const remainingFats = fatsGoal - totalFats

  const liveCalories = useMemo(() => {
    return Math.round((Number(calories || 0) * Number(grams || 0)) / 100)
  }, [calories, grams])

  const liveProteins = useMemo(() => {
    return ((Number(proteins || 0) * Number(grams || 0)) / 100).toFixed(1)
  }, [proteins, grams])

  const liveCarbs = useMemo(() => {
    return ((Number(carbs || 0) * Number(grams || 0)) / 100).toFixed(1)
  }, [carbs, grams])

  const liveFats = useMemo(() => {
    return ((Number(fats || 0) * Number(grams || 0)) / 100).toFixed(1)
  }, [fats, grams])

  const afterAddCalories = totalCalories + liveCalories
  const afterAddRemaining = calorieGoal - afterAddCalories

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

    const { error } = await supabase.from('foods').insert({
      user_id: user.id,
      name: foodName,
      calories: liveCalories,
      proteins: Number(liveProteins),
      carbs: Number(liveCarbs),
      fats: Number(liveFats),
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

  async function deleteFood(id: string) {
    const confirmed = window.confirm('Es-tu sûr de vouloir supprimer cet aliment ?')

    if (!confirmed) return

    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', id)

    if (error) {
      alert(error.message)
      return
    }

    setFoods((prev) => prev.filter((food) => food.id !== id))
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
      setCalories(product.nutriments?.['energy-kcal_100g']?.toString() || '0')
      setProteins(product.nutriments?.proteins_100g?.toString() || '0')
      setCarbs(product.nutriments?.carbohydrates_100g?.toString() || '0')
      setFats(product.nutriments?.fat_100g?.toString() || '0')
      setGrams('100')
    } catch {
      alert('Erreur récupération produit')
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-md px-4 py-6 space-y-6">
        <header>
          <p className="text-sm text-neutral-500">Aujourd’hui</p>
          <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm space-y-4">
          <div>
            <p className="text-sm text-neutral-500">Calories</p>
            <p className="text-4xl font-bold">
              {Math.round(totalCalories)}
              <span className="text-lg text-neutral-400"> / {calorieGoal}</span>
            </p>
            <p className="text-sm text-neutral-500">
              Restant : {Math.round(remainingCalories)} kcal
            </p>
          </div>

          <div className="h-3 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-black"
              style={{
                width: `${Math.min(100, (totalCalories / calorieGoal) * 100)}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <Macro
              label="Protéines"
              value={`${totalProteins.toFixed(1)} / ${proteinGoal}g`}
              remaining={`${Math.max(0, remainingProteins).toFixed(1)}g restants`}
            />
            <Macro
              label="Glucides"
              value={`${totalCarbs.toFixed(1)} / ${carbsGoal}g`}
              remaining={`${Math.max(0, remainingCarbs).toFixed(1)}g restants`}
            />
            <Macro
              label="Lipides"
              value={`${totalFats.toFixed(1)} / ${fatsGoal}g`}
              remaining={`${Math.max(0, remainingFats).toFixed(1)}g restants`}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ajouter</h2>
            <button
              onClick={() => setShowScanner(true)}
              className="rounded-full bg-black px-4 py-2 text-sm text-white"
            >
              Scanner
            </button>
          </div>

          {showScanner && (
            <div className="rounded-2xl border p-3 space-y-3">
              <BarcodeScanner onScan={handleScan} />
              <button
                onClick={() => setShowScanner(false)}
                className="w-full rounded-xl border py-3"
              >
                Fermer
              </button>
            </div>
          )}

          <Input placeholder="Nom de l’aliment" value={foodName} setValue={setFoodName} />
          <Input placeholder="Quantité en grammes" value={grams} setValue={setGrams} type="number" />

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="kcal / 100g" value={calories} setValue={setCalories} type="number" />
            <Input placeholder="Protéines" value={proteins} setValue={setProteins} type="number" />
            <Input placeholder="Glucides" value={carbs} setValue={setCarbs} type="number" />
            <Input placeholder="Lipides" value={fats} setValue={setFats} type="number" />
          </div>

          <select
            className="w-full rounded-2xl border bg-white px-4 py-3 outline-none"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option>Petit-déjeuner</option>
            <option>Déjeuner</option>
            <option>Dîner</option>
            <option>Snack</option>
          </select>

          <div className="rounded-2xl bg-neutral-100 p-4 space-y-2">
            <p className="font-semibold">Aperçu</p>
            <p className="text-3xl font-bold">{liveCalories} kcal</p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <Macro label="P" value={`${liveProteins}g`} />
              <Macro label="G" value={`${liveCarbs}g`} />
              <Macro label="L" value={`${liveFats}g`} />
            </div>

            <p className="text-sm text-neutral-500">
              Après ajout : {afterAddCalories} / {calorieGoal} kcal
            </p>
            <p className="text-sm text-neutral-500">
              Restant après ajout : {afterAddRemaining} kcal
            </p>
          </div>

          <button
            onClick={addFood}
            disabled={loading || !foodName}
            className="w-full rounded-2xl bg-black py-4 font-semibold text-white disabled:opacity-40"
          >
            {loading ? 'Ajout...' : 'Ajouter à ma journée'}
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Aliments du jour</h2>

          {foods.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-neutral-500">
              Aucun aliment ajouté.
            </p>
          )}

          {foods.map((food) => (
            <div key={food.id} className="relative rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex justify-between gap-3 pr-10">
                <div>
                  <h3 className="font-semibold">{food.name}</h3>
                  <p className="text-sm text-neutral-500">
                    {food.meal_type} · {food.grams} g
                  </p>
                </div>

                <p className="font-bold">{food.calories} kcal</p>
              </div>

              <p className="mt-2 text-sm text-neutral-500 pr-10">
                P {food.proteins}g · G {food.carbs}g · L {food.fats}g
              </p>

              <button
                onClick={() => deleteFood(food.id)}
                className="absolute bottom-4 right-4 text-lg"
              >
                🗑️
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}

function Input({
  placeholder,
  value,
  setValue,
  type = 'text',
}: {
  placeholder: string
  value: string
  setValue: (value: string) => void
  type?: string
}) {
  return (
    <input
      className="w-full rounded-2xl border bg-white px-4 py-3 outline-none focus:border-black"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

function Macro({
  label,
  value,
  remaining,
}: {
  label: string
  value: string
  remaining?: string
}) {
  return (
    <div className="rounded-2xl bg-neutral-100 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="font-semibold">{value}</p>
      {remaining && (
        <p className="text-xs text-neutral-500 mt-1">{remaining}</p>
      )}
    </div>
  )
}