"use client"

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Logo } from '../Logo';
import { useTransition } from "react";
import { handleSignup } from '@/app/(auth)/auth/signup/actions';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Eye, EyeOff, Info, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { useUsers } from '@/lib/hooks/useSettings';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    countryCode: '+250', // Default to Rwanda
    acceptTerms: false,
    refCode: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : 'new_account',
  });
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { data: users, isLoading: usersLoading } = useUsers();

  // Check if this is the very first account on the system
  const isFirstAdmin = !usersLoading && (!users || users.length === 0);

  const refCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : 'new_account';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startTransition(async () => {
      const result = await handleSignup(new FormData(e.currentTarget), refCode, redirect, isFirstAdmin);
      if (result?.success) {
        toast.success('Connecté avec succès');
        router.push(result?.redirectUrl);
        router.refresh();
      }
      else {
        toast.error(result.error);
      }
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <Logo width={250} height={70} />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Créer un compte</h1>
          <p className="text-lg sm:text-base text-gray-600 dark:text-gray-300">Rejoignez notre communauté beauté</p>
        </div>

        <Card className="p-6 sm:p-8 border-b border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950 shadow-2xl rounded-3xl">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="dark:text-gray-200">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Marie Kabila"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="email" className="dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="marie@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="phone" className="dark:text-gray-200">Téléphone</Label>
                <div className="flex gap-2 mt-2">
                  {/* Shadcn Select for Country Code */}
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                  >
                    <SelectTrigger className="w-32 rounded-xl border-gray-300 dark:border-gray-700 focus:ring-pink-500">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-pink-100 dark:border-pink-900">
                      <SelectItem value="+250">🇷🇼 +250</SelectItem>
                      <SelectItem value="+243">🇨🇩 +243</SelectItem>
                      <SelectItem value="+254">🇰🇪 +254</SelectItem>
                      <SelectItem value="+256">🇺🇬 +256</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Input for Phone Number */}
                  <div className="relative flex-1">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="78XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, ''); // Numeric only
                        // Auto-remove leading zero for Rwanda/DRC
                        if ((['+250', '+243'].includes(formData.countryCode)) && val.startsWith('0')) {
                          val = val.substring(1);
                        }
                        setFormData({ ...formData, phone: val });
                      }}
                      className="rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {/* Visual Preview */}
                <p className="text-xs font-medium text-pink-600 dark:text-pink-400 mt-2 ml-1">
                  Numéro enregistré : <span className="underline">{formData.countryCode}{formData.phone}</span>
                </p>
              </div>

              <div className="sm:col-span-2 space-y-4">
                {/* Password Field */}
                <div>
                  <Label htmlFor="password" title="password" className="dark:text-gray-200">Mot de passe</Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pr-12 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-pink-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pink-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                    Minimum 8 caractères
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <Label htmlFor="confirmPassword" title="confirmPassword" className="dark:text-gray-200">
                    Confirmer le mot de passe
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pr-12 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>


              {formData.refCode && (
                <div className="sm:col-span-2 mt-2">
                  <Label className="dark:text-gray-200">Vous avez été parrainé par</Label>

                  <div className="mt-2 flex items-center justify-between rounded-xl border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-gray-800 px-4 py-3">
                    <span className="text-lg font-semibold text-pink-700 dark:text-pink-400 tracking-wide">
                      {formData.refCode}
                    </span>
                    <span className="text-base px-2 py-1 rounded-full bg-pink-200 dark:bg-pink-900 text-pink-700 dark:text-pink-300">
                      Ref Code
                    </span>
                  </div>
                </div>
              )}
            </div>


            <div className="flex items-start space-x-3 pt-4">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-base sm:text-lg text-gray-600 dark:text-gray-300 cursor-pointer">
                J'accepte les{' '}
                <Link href="/terms" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline">
                  conditions d'utilisation
                </Link>{' '}
                et la{' '}
                <Link href="/privacy" className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 underline">
                  politique de confidentialité
                </Link>
              </label>
            </div>


            {usersLoading ? (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : isFirstAdmin && (
              <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 shadow-sm rounded-2xl p-6">
                  <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-xl font-bold text-amber-800 dark:text-amber-200 ml-2">
                    Configuration du Premier Administrateur
                  </AlertTitle>
                  <AlertDescription className="mt-3 text-amber-700 dark:text-amber-300 space-y-2">
                    <p className="font-medium text-lg">
                      Bienvenue dans <strong>Beauty Nails Salon Management</strong>.
                      Aucun utilisateur n'a été détecté : vous créez actuellement le **compte maître** du système.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="flex items-start gap-2 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800">
                        <ShieldCheck className="h-5 w-5 mt-0.5 text-amber-600" />
                        <span><strong>Contrôle Total :</strong> Gestion des services, prix et stocks.</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800">
                        <Info className="h-5 w-5 mt-0.5 text-amber-600" />
                        <span><strong>Supervision :</strong> Approbation des réservations et accès aux rapports financiers.</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Hidden Role Field or Read-only Display */}
                <div className="group relative">
                  <Label className="text-pink-600 dark:text-pink-400 font-bold uppercase tracking-widest text-xs">
                    Rôle Attribué
                  </Label>
                  <div className="mt-2 flex items-center gap-3 p-4 bg-linear-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border border-pink-200 dark:border-pink-900 rounded-2xl">
                    <div className="p-2 bg-pink-500 rounded-lg text-white shadow-lg shadow-pink-200 dark:shadow-none">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Propriétaire / Administrateur Système</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Permissions maximales activées par défaut</p>
                    </div>
                  </div>
                  {/* Ensure the role is sent to the backend */}
                  <input type="hidden" name="role" value="admin" />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full py-5 sm:py-6 mt-4 sm:mt-6 text-lg sm:text-base"
            >
              {isPending ? 'Création...' : 'Créer un compte'}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-base sm:text-lg">
                <span className="px-3 sm:px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">Ou</span>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full py-5 sm:py-6 border-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 text-base sm:text-lg"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full py-5 sm:py-6 border-2 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 text-base sm:text-lg"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continuer avec Facebook
              </Button>
            </div>
          </div>
        </Card>

        <p className="text-center mt-4 sm:mt-6 text-lg sm:text-base text-gray-600 dark:text-gray-300">
          Vous avez déjà un compte ?{' '}
          <Link href={`/auth/login${redirect ? "?redirect=appointments" : ""}`} className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}