'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SetupPage() {
  const router = useRouter()

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('')
  const [proteinPercent, setProteinPercent] = useState('')
  const [carbsPercent, setCarbsPercent] = useState('')
  const [fatsPercent, setFatsPercent] = useState('')

  function toNumber(value: string) {
    return Number(value.replace(',', '.')) || 0
  }

  const totalPercent =
    toNumber(proteinPercent) +
    toNumber(carbsPercent) +
    toNumber(fatsPercent)

  function calculateMacros() {
    const calories = toNumber(calorieGoal)

    return {
      proteins: Math.round((calories * (toNumber(proteinPercent) / 100)) / 4),
      carbs: Math.round((calories * (toNumber(carbsPercent) / 100)) / 4),
      fats: Math.round((calories * (toNumber(fatsPercent) / 100)) / 9),
    }
  }

  function limitMacroInput(
    newValue: string,
    other1: string,
    other2: string,
    setter: (value: string) => void
  ) {
    if (newValue === '') {
      setter('')
      return
    }

    const numberValue = toNumber(newValue)
    const maxAllowed = 100 - toNumber(other1) - toNumber(other2)

    if (numberValue > maxAllowed) {
      setter(String(Math.max(0, maxAllowed)))
      return
    }

    setter(newValue)
  }

  async function saveProfile() {
    if (!weight || !height || !calorieGoal || !proteinPercent || !carbsPercent || !fatsPercent) {
      alert('Remplis tous les champs')
      return
    }

    if (totalPercent !== 100) {
      alert('Les pourcentages doivent faire exactement 100%')
      return
    }

    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      router.push('/auth')
      return
    }

    const macros = calculateMacros()

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: user.email,
      weight: toNumber(weight),
      height: toNumber(height),
      calorie_goal: toNumber(calorieGoal),
      protein_goal: macros.proteins,
      carbs_goal: macros.carbs,
      fats_goal: macros.fats,
    })

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  const preview = calculateMacros()

  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <p className="text-sm text-neutral-500">Première connexion</p>
          <h1 className="text-3xl font-bold">Configure tes objectifs</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded-2xl p-3" placeholder="Poids (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <input className="border rounded-2xl p-3" placeholder="Taille (cm)" value={height} onChange={(e) => setHeight(e.target.value)} />
        </div>

        <input className="w-full border rounded-2xl p-3" placeholder="Objectif calories" value={calorieGoal} onChange={(e) => setCalorieGoal(e.target.value)} />

        <p className="text-sm text-neutral-500">Répartition des macros (%)</p>

        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded-2xl p-3" placeholder="Prot %" value={proteinPercent} onChange={(e) => limitMacroInput(e.target.value, carbsPercent, fatsPercent, setProteinPercent)} />
          <input className="border rounded-2xl p-3" placeholder="Gluc %" value={carbsPercent} onChange={(e) => limitMacroInput(e.target.value, proteinPercent, fatsPercent, setCarbsPercent)} />
          <input className="border rounded-2xl p-3" placeholder="Lip %" value={fatsPercent} onChange={(e) => limitMacroInput(e.target.value, proteinPercent, carbsPercent, setFatsPercent)} />
        </div>

        <p className={totalPercent === 100 ? 'text-green-600' : 'text-neutral-500'}>
          Total : {totalPercent}% / 100%
        </p>

        <div className="rounded-2xl bg-neutral-100 p-4 grid grid-cols-3 text-center">
          <div><p>Protéines</p><strong>{preview.proteins} g</strong></div>
          <div><p>Glucides</p><strong>{preview.carbs} g</strong></div>
          <div><p>Lipides</p><strong>{preview.fats} g</strong></div>
        </div>

        <button onClick={saveProfile} className="w-full bg-black text-white rounded-2xl py-3 font-semibold">
          Enregistrer mes objectifs
        </button>
      </div>
    </main>
  )
}