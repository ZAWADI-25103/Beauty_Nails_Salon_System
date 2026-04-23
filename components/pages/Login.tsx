"use client"

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import Link from "next/link";
import { Logo } from "../Logo";
import { handleLogin, handleOTPVerification } from "@/app/(auth)/auth/login/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Loader2 } from "lucide-react";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>, role: string) {
    e.preventDefault();
    startTransition(async () => {
      const result = await handleLogin(new FormData(e.currentTarget), role, redirect);
      if (result?.success) {
        setExpectedOtp(result.expectedOtp || "");
        setRedirectUrl(result.redirectUrl);
        toast.success(result.message);
        setOtpDialogOpen(true);
      }
      else {
        toast.error(result.error);
      }
    }
    )
  }

  const handleOtp = async () => {

    setIsVerifyingOtp(true);

    const res = await handleOTPVerification(otp.trim(), expectedOtp, redirectUrl);
    if (res?.success) {
      setTimeout(() => {
        router.push(res.redirectUrl);
        setOtpDialogOpen(false);
        setIsVerifyingOtp(false);
      }, 9000);
    } else {
      toast.error(res.error);
      setIsVerifyingOtp(false);
    }

  }

  return (
    <div className="min-h-screen py-12 sm:py-24 flex items-center bg-background dark:bg-gray-950">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center mb-4 sm:mb-6"
          >
            <Logo width={250} height={70} />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            Connexion
          </h1>
          <p className="text-lg sm:text-base text-gray-600 dark:text-gray-300">
            Accédez à votre espace personnel
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-b border-pink-100 dark:border-pink-900 bg-white dark:bg-gray-950 shadow-2xl rounded-3xl">
          {/* <p className=" dark:text-pink-400 text-xs sm:text-xs">{'glisser  <--- | --->'}</p> */}
          <Tabs
            defaultValue="client"
          >
            <TabsList className="w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-pink-900/30 p-1 rounded-xl flex overflow-x-auto no-scrollbar justify-start sm:justify-center">
              <TabsTrigger value="client" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Client</TabsTrigger>
              <TabsTrigger value="worker" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Employée</TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-pink-100 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-400 text-base sm:text-base">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <form
                onSubmit={(e) => onSubmit(e, "client")}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="email" className="dark:text-gray-200">Email ou Telephone</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="dark:text-gray-200">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-pink-500 to-amber-400 hover:from-pink-600 hover:to-amber-500 text-white rounded-full py-5 sm:py-6 mt-4 sm:mt-6 text-lg sm:text-base"
                >
                  {isPending ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="worker">
              <form
                onSubmit={(e) => onSubmit(e, "worker")}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="email" className="dark:text-gray-200">Email ou Telephone</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="dark:text-gray-200">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500 text-white rounded-full py-5 sm:py-6 mt-4 sm:mt-6 text-lg sm:text-base"
                >
                  {isPending ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form
                onSubmit={(e) => onSubmit(e, "admin")}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="email" className="dark:text-gray-200">Email ou Telephone</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="dark:text-gray-200">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="mt-2 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white rounded-full py-5 sm:py-6 mt-4 sm:mt-6 text-lg sm:text-base"
                >
                  {isPending ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 sm:mt-6 text-center">
            <a
              href="/auth/forgot-password"
              className="text-base sm:text-lg text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300"
            >
              Mot de passe oublié ?
            </a>
          </div>
        </Card>
        <p className="text-center mt-4 sm:mt-6 text-lg sm:text-base text-gray-600 dark:text-gray-300">
          Vous n'avez pas de compte ?{" "}
          <Link
            href={`/auth/signup${redirect ? "?redirect=appointments" : ""}`}
            className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium"
          >
            Créer un compte
          </Link>
        </p>
      </div>
      {/* Cancel Appointment Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sm:max-w-2xl w-[90vw] bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition-shadow border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
          <DialogHeader>
            <DialogTitle>Beauty Nails One-Time-Password (OTP)</DialogTitle>
            <DialogDescription>
              Un code OTP a été envoyé à votre numéro de téléphone. Veuillez entrer le code pour vérifier votre identité et accéder à votre tableau de bord.
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Si vous ne recevez pas le code, veuillez vérifier avec ce code par defaut : {expectedOtp}.
              </p>
            </DialogDescription>
          </DialogHeader>

          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Entrez votre OTP"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <DialogFooter>
            <Button
              disabled={isVerifyingOtp}
              onClick={handleOtp}
            >
              {isVerifyingOtp ? <Loader2 className="animate-spin" /> : 'Vérifier OTP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}