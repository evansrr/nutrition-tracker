'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function createProfile(userId: string) {
    await supabase.from('profiles').upsert({
      id: userId,
      username: email,
      weight: 60,
      height: 170,
      calorie_goal: 2800,
      protein_goal: 120,
      carbs_goal: 400,
      fats_goal: 65,
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

    alert('Compte créé ! Vérifie ton email si Supabase te le demande.')
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
      await createProfile(data.user.id)
    }

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm p-6 border rounded-xl bg-white shadow">
        <h1 className="text-2xl font-bold mb-6">
          Suivi nutritionnel
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border p-3 mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signUp}
          className="w-full bg-black text-white py-3 mb-3 rounded"
        >
          Créer un compte
        </button>

        <button
          onClick={signIn}
          className="w-full border py-3 rounded"
        >
          Se connecter
        </button>
      </div>
    </main>
  )
}