'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResetPassword } from '@/lib/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordComponent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { mutate, isPending } = useResetPassword();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!token) {
      toast.error('Token de réinitialisation manquant');
      return;
    }

    mutate({ token, newPassword: password }, {
      onSuccess: () => {
        toast.success('Mot de passe réinitialisé avec succès');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-gray-950 shadow-xl rounded-2xl border border-pink-100 dark:border-pink-900/30">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Réinitialiser votre mot de passe</h1>
          <p className="text-lg sm:text-base text-gray-600 dark:text-gray-400">Entrez votre nouveau mot de passe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <Label htmlFor="password" className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 rounded-xl py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-base sm:text-lg text-gray-700 dark:text-gray-300">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1 rounded-xl py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-medium"
          >
            {isPending ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/auth/login')}
            className="text-base sm:text-lg text-purple-600 dark:text-purple-400 hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>
        </div>
      </Card>
    </div>
  );
}