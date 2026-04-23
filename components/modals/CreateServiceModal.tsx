"use client"
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useServices, useAddOnMutations } from "@/lib/hooks/useServices";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PlusCircle, MinusCircle, Camera, User } from 'lucide-react';
import { Service, ServiceAddOn } from "@/lib/api/services";
import { useMedias } from "@/lib/hooks/useMedia";
import { MediaData } from "@/lib/api/media";

export default function CreateServiceModal({ trigger, service, onSubmitRemoveService, onSubmitReftch }: {
  trigger?: React.ReactNode,
  service?: Service,
  onSubmitRemoveService?: (serviceId: string | null) => void
  onSubmitReftch?: () => void
}) {
  const [name, setName] = useState(service?.name || "");
  const [category, setCategory] = useState<'onglerie' | 'cils' | 'tresses' | 'maquillage' | ''>(service?.category || '');
  const [description, setDescription] = useState(service?.description || "");
  const [price, setPrice] = useState<number | ''>(service?.price || '');
  const [commission, setCommission] = useState<number | ''>(service?.workerCommission || '');
  const [duration, setDuration] = useState<number | ''>(service?.duration || '');
  const [imageUrl, setImageUrl] = useState(service?.imageUrl || '');
  const [onlineBookable, setOnlineBookable] = useState(true);
  const [isPopular, setIsPopular] = useState(service?.isPopular || false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddOnFlow, setShowAddOnFlow] = useState(false);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(service?.id || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [addOns, setAddOns] = useState(() => {
    const addOnList: {
      name: string;
      price: number;
      duration: number;
      addOnDesc?: string;
    }[] = []

    if (service?.addOns && service?.addOns?.length >= 0) {
      service?.addOns?.map((addOn) => {
        addOnList.push(
          { name: addOn.name, price: addOn.price, duration: addOn.duration as number, addOnDesc: addOn?.addOnDesc as string }
        )
      })
    }
    return [
      { name: '', price: '', duration: '' as number | '', addOnDesc: '' }
    ]
  });

  const { createMedia } = useMedias();

  const { createService, updateService, isUpdating, isCreating, createdService, updatedService } = useServices();
  const { createAddOn, isCreatingAddOn } = useAddOnMutations();

  const onSubmit = () => {
    if (!name || !category || !price || !duration) {
      toast.error("Veuillez renseigner le nom, la catégorie, le prix et la durée");
      return;
    }

    const payload = {
      name,
      category,
      price: Number(price),
      commission: Number(commission),
      duration: Number(duration),
      description,
      imageUrl: imageUrl || undefined,
      onlineBookable,
      isPopular,
    } as import('@/lib/api/services').CreateServiceData;

    createService(payload);
  };
  const onUpdate = () => {
    if (service) {
      if (!name || !category || !price || !duration) {
        toast.error("Veuillez renseigner le nom, la catégorie, le prix et la durée");
        return;
      }

      const payload = {
        name,
        category,
        price: Number(price),
        commission: Number(commission),
        duration: Number(duration),
        description,
        imageUrl: imageUrl || undefined,
        onlineBookable,
        isPopular,
      } as import('@/lib/api/services').CreateServiceData;

      updateService({ id: service?.id, updates: payload });
    } else {
      toast.warning("Vous ne pouvez pas modifier, re-essayer encore")
    }
  };

  // Handle service creation success
  useEffect(() => {

    if (createdService) {
      setCreatedServiceId(createdService.service.id);
      setShowAddOnFlow(true);
    }
    if (updatedService) {
      setCreatedServiceId(updatedService.id);
      setShowAddOnFlow(true);
    }
  }, [createdService, updatedService]);

  // Handle add-on submission
  const handleAddOnSubmit = () => {
    const validAddOns = addOns.filter(addOn =>
      addOn.name.trim() !== '' &&
      addOn.price !== '' &&
      addOn.duration !== ''
    );

    if (validAddOns.length === 0) {
      toast.error("Aucun add-on valide à ajouter");
      return;
    }

    // Submit all valid add-ons
    validAddOns.forEach((addOn) => {
      createAddOn({
        serviceId: createdServiceId!,
        name: addOn.name,
        price: Number(addOn.price),
        duration: Number(addOn.duration),
        description: ''
      });
    });

    // Close the modal and reset
    setIsOpen(false);
    if (onSubmitRemoveService) onSubmitRemoveService(null)
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setCategory('');
    setDescription("");
    setPrice('');
    setDuration('');
    setImageUrl('');
    setOnlineBookable(true);
    setIsPopular(false);
    setAddOns([{ name: '', price: '', duration: '', addOnDesc: '' }]);
    setShowAddOnFlow(false);
    setCreatedServiceId(null);
  };

  const addAddOnField = () => {
    setAddOns([...addOns, { name: '', price: '', duration: '', addOnDesc: '' }]);
  };

  const removeAddOnField = (index: number) => {
    if (addOns.length > 1) {
      const newAddOns = [...addOns];
      newAddOns.splice(index, 1);
      setAddOns(newAddOns);
    }
  };

  const updateAddOnField = (index: number, field: keyof typeof addOns[0], value: any) => {
    const newAddOns = [...addOns];
    newAddOns[index][field] = value;
    setAddOns(newAddOns);
  };

  const handleUpload = async (file: File) => {

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);

    // Create media object
    const media: MediaData = {
      file,
      clientId: null,
      appointmentId: null,
      workerId: null
    };

    try {
      await createMedia(media, {
        onSuccess: (data) => {
          setImageUrl(data.url)
        }
      });

      if (inputRef.current) {
        inputRef.current.value = '';
      }

    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Erreur lors de l\'upload du document');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto  dark:bg-gray-950 p-5">
        {!showAddOnFlow ? (
          <>
            <DialogHeader>
              <DialogTitle>{!service ? 'Créer un nouveau service' : `Modification - ${service.name}`}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label className="mb-2" htmlFor="service-name">Nom</Label>
                <Input
                  id="service-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Manucure complète"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="service-category">Catégorie</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as any)}
                >
                  <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-900 dark:bg-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onglerie">
                      💅 Onglerie
                    </SelectItem>
                    <SelectItem value="cils">
                      👁️ Cils
                    </SelectItem>
                    <SelectItem value="tresses">
                      💇‍♀️ Tresses
                    </SelectItem>
                    <SelectItem value="maquillage">
                      💄 Maquillage
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2" htmlFor="service-price">Prix (CDF)</Label>
                <Input
                  id="service-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  type="number"
                  placeholder="Ex: 15000"
                />
              </div>
              <div>
                <Label className="mb-2" htmlFor="service-commission">La Commission</Label>
                <Input
                  id="service-commission"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))}
                  type="number"
                  placeholder="Ex: 15000"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="service-duration">Durée (minutes)</Label>
                <Input
                  id="service-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
                  type="number"
                  placeholder="Ex: 60"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="mb-2" htmlFor="service-desc">Description</Label>
                <Textarea
                  id="service-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le service..."
                />
              </div>

              <div className="space-y-2">
                <Label className="mb-2" htmlFor="service-img">Service Image</Label>
                <div className="relative w-24 h-24">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Business logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-accent">
                    <Camera className="h-4 w-4" />
                    <input
                      ref={inputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Square image recommended (200x200px)
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={onlineBookable}
                    onChange={(e) => setOnlineBookable(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-lg text-gray-700 dark:text-gray-300">Réservable en ligne</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-lg text-gray-700 dark:text-gray-300">Mettre en avant (Populaire)</span>
                </label>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              {!service ?
                <Button
                  onClick={() => {
                    onSubmit()

                    if (onSubmitRemoveService && onSubmitReftch) {
                      onSubmitReftch()
                      onSubmitRemoveService(null)
                    }
                  }}
                  disabled={isCreating}
                >
                  {isCreating ? "Création..." : "Créer"}
                </Button>
                :
                <Button
                  onClick={() => {
                    onUpdate()
                    if (onSubmitRemoveService && onSubmitReftch) {
                      onSubmitRemoveService(null)
                      onSubmitReftch()
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update"}
                </Button>

              }
            </DialogFooter>
          </>
        ) : (
          // Add-on creation flow
          <>
            <DialogHeader>
              <DialogTitle>Ajouter des add-ons pour "{name}"</DialogTitle>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Ajoutez des éléments complémentaires à ce service pour augmenter sa valeur
              </p>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {addOns.map((addOn, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nom de l'add-on</Label>
                      <Input
                        value={addOn.name}
                        onChange={(e) => updateAddOnField(index, 'name', e.target.value)}
                        placeholder="Ex: Gel coloré"
                      />
                    </div>
                    <div>
                      <Label>Prix (CDF)</Label>
                      <Input
                        type="number"
                        value={addOn.price}
                        onChange={(e) => updateAddOnField(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <div>
                      <Label>Durée (min)</Label>
                      <Input
                        type="number"
                        value={addOn.duration}
                        onChange={(e) => updateAddOnField(index, 'duration', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 15"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2" htmlFor="add-on-desc">Description</Label>
                    <Textarea
                      id="add-on-desc"
                      value={addOn.addOnDesc}
                      onChange={(e) => updateAddOnField(index, 'addOnDesc', e.target.value)}
                      placeholder="Décrivez le add-on..."
                    />
                  </div>

                  {addOns.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500 hover:text-red-700"
                      onClick={() => removeAddOnField(index)}
                    >
                      <MinusCircle className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addAddOnField}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter un autre add-on
              </Button>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Passer
                </Button>
              </DialogClose>
              <Button
                onClick={handleAddOnSubmit}
                disabled={isCreatingAddOn}
                className="w-full sm:w-auto bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isCreatingAddOn ? "Ajout..." : "Ajouter les add-ons"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}