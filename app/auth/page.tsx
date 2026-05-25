'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [weight, setWeight] = useState('60')
  const [height, setHeight] = useState('170')
  const [calorieGoal, setCalorieGoal] = useState('2800')
  const [proteinGoal, setProteinGoal] = useState('120')
  const [carbsGoal, setCarbsGoal] = useState('400')
  const [fatsGoal, setFatsGoal] = useState('65')

  function toNumber(value: string) {
    return Number(value.replace(',', '.')) || 0
  }

  async function createProfile(userId: string) {
    await supabase.from('profiles').upsert({
      id: userId,
      username: email,
      weight: toNumber(weight),
      height: toNumber(height),
      calorie_goal: toNumber(calorieGoal),
      protein_goal: toNumber(proteinGoal),
      carbs_goal: toNumber(carbsGoal),
      fats_goal: toNumber(fatsGoal),
    })
  }

  async function signUp() {
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

    alert('Compte créé ! Tu peux maintenant te connecter.')
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

        <div className="border-t pt-4 space-y-3">
          <p className="font-semibold">Tes objectifs</p>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Poids"
              className="border rounded-2xl p-3"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />

            <input
              type="number"
              placeholder="Taille"
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

          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Protéines"
              className="border rounded-2xl p-3"
              value={proteinGoal}
              onChange={(e) => setProteinGoal(e.target.value)}
            />

            <input
              type="number"
              placeholder="Glucides"
              className="border rounded-2xl p-3"
              value={carbsGoal}
              onChange={(e) => setCarbsGoal(e.target.value)}
            />

            <input
              type="number"
              placeholder="Lipides"
              className="border rounded-2xl p-3"
              value={fatsGoal}
              onChange={(e) => setFatsGoal(e.target.value)}
            />
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