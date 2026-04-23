"use server";

import { signIn } from "@/lib/auth/auth";
import axiosdb from "@/lib/axios";

export async function handleSignup(formData: FormData, refCodeParam: string | null, redirect?: string | null, isFirstAdmin = false) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  // const acceptTerms = !!formData.get("acceptTerms");
  const role = isFirstAdmin ? "admin" : "client";

  if (!name || !email || !phone || !password) {
    return { error: "Veuillez remplir tous les champs" };
  }

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas" };
  }

  // if (!acceptTerms) {
  //   return { error: "Veuillez accepter les conditions d'utilisation" };
  // }
  try
  {
    const res = await axiosdb.post("/auth/register",{
      name,
      email,
      phone,
      password,
      role,
      refCode: refCodeParam
    })

    if(res.status === 202){
      return { error: "Email ou téléphone déjà utilisé" };
    }

    // Auto login
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      return { error: "Email ou mot de passe incorrect" };
    }
  }catch(e) {
    return { error: "Incorrect Email or Password, verifier votre role et essayez encore une fois..." };
  }

  if(!redirect){
    return {
    success: true,
    redirectUrl: `/dashboard/${role}`,
  }
  } else {
    return {
      success: true,
      redirectUrl: `/${redirect}`,
    };
  }
}
