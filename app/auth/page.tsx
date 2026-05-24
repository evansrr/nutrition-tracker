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

    alert('Compte créé !')
  }

  async function signIn() {
    const { data, error } =
      await supabase.auth.signInWithPassword({
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
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-8 text-stone-900 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[320px] flex-col justify-between bg-stone-900 p-8 text-white sm:p-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-lime-200">
                Nutrition
              </p>
              <h1 className="mt-5 max-w-sm text-4xl font-semibold leading-tight sm:text-5xl">
                Suivi simple, repas clairs.
              </h1>
            </div>

            <p className="mt-10 max-w-sm text-base leading-7 text-stone-300">
              Connecte-toi pour ajouter tes aliments, vérifier tes apports et garder une vue calme sur ta journée.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-stone-950">
                Bienvenue
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                Entre tes identifiants pour accéder à ton tableau de bord.
              </p>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Email
              </span>
              <input
                type="email"
                placeholder="toi@exemple.com"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </label>

            <label className="mb-6 block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Mot de passe
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-4 focus:ring-stone-100"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </label>

            <div className="grid gap-3">
              <button
                onClick={signIn}
                className="w-full rounded-lg bg-stone-950 px-4 py-3 font-medium text-white transition hover:bg-stone-800"
              >
                Se connecter
              </button>

              <button
                onClick={signUp}
                className="w-full rounded-lg border border-stone-200 px-4 py-3 font-medium text-stone-800 transition hover:border-stone-300 hover:bg-stone-50"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
