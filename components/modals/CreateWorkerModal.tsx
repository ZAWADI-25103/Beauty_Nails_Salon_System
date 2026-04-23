"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { useStaff } from "@/lib/hooks/useStaff"
import { toast } from "sonner"

const POSITIONS = [
  "Spécialiste",
  "Réceptionniste",
  "Manager",
  "Assistant",
]

const SERVICE_CATEGORIES = [
  "Onglerie",
  "Cils",
  "Tresses",
  "Maquillage",
]

export default function CreateWorkerModal({
  triggerLabel = "Ajouter un employé",
}: {
  triggerLabel?: string
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  const [position, setPosition] = useState("")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [commissionRate, setCommissionRate] = useState<number | "">("")
  const [workingHours, setWorkingHours] = useState("")

  const [isOpen, setIsOpen] = useState(false)

  const { createWorker, isCreating } = useStaff()

  const toggleSpecialty = (category: string) => {
    setSpecialties((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const onSubmit = () => {
    if (!name || !email || !phone || !password || !position) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Email invalide")
      return
    }

    if (phone.length < 9) {
      toast.error("Numéro de téléphone invalide")
      return
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    const payload = {
      name,
      email,
      phone,
      password,
      role: "worker",
      workerProfile: {
        position,
        specialties,
        commissionRate: Number(commissionRate) || 0,
        workingHours: workingHours || undefined,
      },
    }

    createWorker(payload as any)

    setIsOpen(false)
    setName("")
    setEmail("")
    setPhone("")
    setPassword("")
    setPosition("")
    setSpecialties([])
    setCommissionRate("")
    setWorkingHours("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">{triggerLabel}</Button>
      </DialogTrigger>

      {/* ✅ Bigger + Responsive */}
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto  dark:bg-gray-950 p-5">

        <DialogHeader>
          <DialogTitle className="text-xl">
            Créer un nouvel employé
          </DialogTitle>
        </DialogHeader>

        {/* ✅ Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 py-6">

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Informations personnelles
            </h3>

            <div>
              <Label className="mb-3">Nom complet *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marie Nkumu"
              />
            </div>

            <div>
              <Label className="mb-3">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@example.com"
              />
            </div>

            <div>
              <Label className="mb-3">Téléphone *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243..."
              />
            </div>

            <div>
              <Label className="mb-3">Mot de passe *</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
              />
            </div>
          </div>

          {/* Professional */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Professionnel
            </h3>

            {/* ✅ Shadcn Select */}
            <div>
              <Label className="mb-3">Poste *</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un poste" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ✅ Checkbox Specialties */}
            <div>
              <Label className="mb-3">Spécialités</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {SERVICE_CATEGORIES.map((category) => (
                  <div
                    key={category}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={category}
                      checked={specialties.includes(category)}
                      onCheckedChange={() => toggleSpecialty(category)}
                    />
                    <Label htmlFor={category} className="text-lg">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3">Commission (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) =>
                  setCommissionRate(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                  )
                }
                placeholder="15"
              />
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Horaires
            </h3>

            <div>
              <Label className="mb-3">Horaires de travail</Label>
              <Input
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="Lun-Ven 09:00-18:00"
              />
            </div>

            <div className="bg-muted rounded-lg p-4 text-base">
              <strong>Note:</strong> Un compte client et employé sera créé automatiquement.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">
              Annuler
            </Button>
          </DialogClose>

          <Button
            onClick={onSubmit}
            disabled={isCreating}
            className="bg-pink-500 hover:bg-pink-600"
          >
            {isCreating ? "Création..." : "Créer l'employé"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}