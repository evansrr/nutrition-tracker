'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')

  const [proteinPercent, setProteinPercent] = useState('')
  const [carbsPercent, setCarbsPercent] = useState('')
  const [fatsPercent, setFatsPercent] = useState('')

  function toNumber(value: string) {
    return Number(value.replace(',', '.')) || 0
  }

  function calculateMacros() {
    const calories = toNumber(calorieGoal)

    const proteinPct = toNumber(proteinPercent)
    const carbsPct = toNumber(carbsPercent)
    const fatsPct = toNumber(fatsPercent)

    const proteinCalories = calories * (proteinPct / 100)
    const carbsCalories = calories * (carbsPct / 100)
    const fatsCalories = calories * (fatsPct / 100)

    const proteins = proteinCalories / 4
    const carbs = carbsCalories / 4
    const fats = fatsCalories / 9

    return {
      proteins: Math.round(proteins),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    }
  }

  async function createProfile(userId: string) {
    const macros = calculateMacros()

    await supabase.from('profiles').upsert({
      id: userId,
      username: email,
      weight: toNumber(weight),
      height: toNumber(height),
      calorie_goal: toNumber(calorieGoal),
      protein_goal: macros.proteins,
      carbs_goal: macros.carbs,
      fats_goal: macros.fats,
    })
  }

  async function signUp() {
    if (
      !email ||
      !password ||
      !weight ||
      !height ||
      !calorieGoal ||
      !proteinPercent ||
      !carbsPercent ||
      !fatsPercent
    ) {
      alert('Remplis tous les champs')
      return
    }

    const totalPercent =
      toNumber(proteinPercent) +
      toNumber(carbsPercent) +
      toNumber(fatsPercent)

    if (totalPercent !== 100) {
      alert('Les pourcentages doivent totaliser 100%')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      await createProfile(data.user.id)
    }

    alert('Compte créé !')
  }

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      router.push('/dashboard')
    }
  }

  const preview = calculateMacros()

  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm space-y-4">

        <div>
          <p className="text-sm text-neutral-500">Bienvenue</p>
          <h1 className="text-3xl font-bold">Suivi nutritionnel</h1>
        </div>

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-2xl p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border rounded-2xl p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="border-t pt-4 space-y-4">
          <p className="font-semibold text-lg">Tes objectifs</p>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Poids (kg)"
              className="border rounded-2xl p-3"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />

            <input
              type="number"
              placeholder="Taille (cm)"
              className="border rounded-2xl p-3"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <input
            type="number"
            placeholder="Objectif calories"
            className="w-full border rounded-2xl p-3"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(e.target.value)}
          />

          <div>
            <p className="text-sm text-neutral-500 mb-2">
              Répartition des macronutriments (%)
            </p>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Prot %"
                className="border rounded-2xl p-3"
                value={proteinPercent}
                onChange={(e) => setProteinPercent(e.target.value)}
              />

              <input
                type="number"
                placeholder="Gluc %"
                className="border rounded-2xl p-3"
                value={carbsPercent}
                onChange={(e) => setCarbsPercent(e.target.value)}
              />

              <input
                type="number"
                placeholder="Lip %"
                className="border rounded-2xl p-3"
                value={fatsPercent}
                onChange={(e) => setFatsPercent(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-100 p-4 space-y-2">
            <p className="font-semibold">Aperçu automatique</p>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-neutral-500">Protéines</p>
                <p className="font-bold">{preview.proteins} g</p>
              </div>

              <div>
                <p className="text-xs text-neutral-500">Glucides</p>
                <p className="font-bold">{preview.carbs} g</p>
              </div>

              <div>
                <p className="text-xs text-neutral-500">Lipides</p>
                <p className="font-bold">{preview.fats} g</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={signUp}
          className="w-full bg-black text-white rounded-2xl py-3 font-semibold"
        >
          Créer un compte
        </button>

        <button
          onClick={signIn}
          className="w-full border rounded-2xl py-3 font-semibold"
        >
          Se connecter
        </button>
      </div>
    </main>
  )
}