'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function signUp() {
    if (!email || !password) {
      alert('Entre un email et un mot de passe')
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    alert('Compte créé ! Vérifie ton email, puis reconnecte-toi.')
  }

  async function signIn() {
    if (!email || !password) {
      alert('Entre ton email et ton mot de passe')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!profile) {
        router.push('/setup')
        return
      }

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