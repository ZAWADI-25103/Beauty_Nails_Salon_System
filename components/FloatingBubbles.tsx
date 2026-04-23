'use client';

import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react"; // Import Gift icon
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

export default function FloatingBubbles({ appointments, user, referralList }: any) {
  const [visible, setVisible] = useState<any[]>([]);
  const [tick, setTick] = useState(Date.now());

  const successfulReferrals = referralList?.filter((r: any) =>
    r.status === "completed" || r.status === "pending"
  ).length || 0;

  const canClaimBonus = successfulReferrals >= 5;
  const hasActiveBonus = user?.refBonus > 0; // Check if they have a percentage to show

  // ⏱ live timer
  useEffect(() => {
    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 🎉 confetti (client only)
  useEffect(() => {
    visible.forEach((appt) => {
      const elapsed = getElapsedSeconds(appt.startTime);
      const duration = appt.duration * 60;

      // 🔔 vibration when finished
      if (elapsed === duration && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      // ⚠️ vibration when exceeded (worker)
      if (
        user.role === "worker" &&
        elapsed === duration + 60 && // 1 min late
        navigator.vibrate
      ) {
        navigator.vibrate([300, 100, 300]);
      }
    });
  }, [tick]);

  // 🎯 role filter
  useEffect(() => {
    let data = appointments;

    if (user.role === "admin") data = appointments.slice(0, 4);
    else data = appointments.slice(0, 1);

    setVisible(data);
  }, [appointments, user.role]);

  // ⏱ helpers
  const getElapsedSeconds = (start: string) => {
    return Math.floor((tick - new Date(start).getTime()) / 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
  };

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-3 z-50">
      <AnimatePresence>

        {/* 🎁 BONUS BUBBLE (Logic: Claimable OR has active bonus percentage) */}
        {(canClaimBonus || hasActiveBonus) && (
          <motion.div
            initial={{ scale: 0, x: 50 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: 50 }}
            whileHover={{ scale: 1.05 }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <div
                  onClick={canClaimBonus ? triggerConfetti : undefined}
                  className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full shadow-2xl cursor-pointer border-4 border-white dark:border-gray-800 text-white
                    ${canClaimBonus ? "bg-linear-to-br from-yellow-400 to-orange-500 animate-bounce" : "bg-linear-to-br from-pink-500 to-purple-600"}
                  `}
                >
                  <Gift className="w-8 h-8 mb-1" />
                  <span className="text-xs font-black uppercase tracking-tighter">
                    {canClaimBonus ? "CADEAU !" : `-${user.refBonus}%`}
                  </span>

                  {/* Small pulse ring for attention */}
                  {canClaimBonus && (
                    <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-25"></span>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
                {canClaimBonus ? (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-orange-600">Félicitations ! 🥳</h3>
                    <p className="text-sm">Vous avez parrainé 5 amis. Allez dans l'onglet <b>Parrainage</b> pour réclamer votre bonus !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-purple-600">Bonus Actif ✨</h3>
                    <p className="text-sm">Vous profitez de <b>{user.refBonus}%</b> de réduction sur vos rendez-vous jusqu'à la fin du mois !</p>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </motion.div>
        )}

        {visible.map((appt) => {
          const elapsedSec = getElapsedSeconds(appt.startTime);
          const durationSec = appt.duration * 60;
          const exceeded = elapsedSec > durationSec;
          const isActive = elapsedSec < durationSec;
          const radius = 22;
          const stroke = 4;
          const normalizedRadius = radius - stroke;
          const circumference = normalizedRadius * 2 * Math.PI;

          const progress = Math.min(elapsedSec / durationSec, 1);
          const strokeDashoffset = circumference - progress * circumference;

          let bg = "bg-purple-600";
          if (user.role === "worker" && exceeded) bg = "bg-red-500";

          return (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >

              {/* 📱 Popover wrapper */}
              <Popover>
                <PopoverTrigger asChild>
                  <div
                    className={`text-white px-4 py-3 rounded-2xl shadow-xl ${bg}
                        w-32 flex flex-col items-center justify-center cursor-pointer relative
                        ${isActive ? "animate-pulse" : ""}
                      `}
                  >

                    {/* ❌ close (admin only) */}
                    {user.role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVisible((prev) =>
                            prev.filter((p) => p.id !== appt.id)
                          );
                        }}
                        className="absolute top-1 right-1"
                      >
                        <X className="w-5 h-5 border cursor-pointer hover:bg-red-800 hover:text-red-50" />
                      </button>
                    )}

                    {/* ⏱ TIMER ONLY */}
                    <p className="text-lg font-bold tracking-wide">
                      {formatTime(elapsedSec)}
                    </p>

                    <div className="relative flex items-center justify-center">

                      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                        {/* Background */}
                        <circle
                          stroke="rgba(255,255,255,0.2)"
                          fill="transparent"
                          strokeWidth={stroke}
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                        />

                        {/* Progress */}
                        <circle
                          stroke="white"
                          fill="transparent"
                          strokeWidth={stroke}
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          r={normalizedRadius}
                          cx={radius}
                          cy={radius}
                        />
                      </svg>

                      {/* Timer inside */}
                      <div className="absolute text-xs font-bold">
                        {formatTime(elapsedSec)}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>

                {/* 📄 MOBILE DETAILS */}
                <PopoverContent className="w-64 bg-linear-to-br from-purple-50 to-pink-50 dark:from-gray-950 dark:to-gray-950 p-4 rounded-2xl text-center shadow-sm hover:shadow-lg transition border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400">
                  <div className="space-y-2">

                    <p className="font-semibold text-sm">
                      {appt.service?.name}
                    </p>

                    <p className="text-xl text-gray-500">
                      {appt.client?.user?.name}
                    </p>

                    <div className="flex justify-between text-sm">
                      <span>Prix</span>
                      <span className="font-medium">
                        {appt.price} CDF
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>Durée</span>
                      <span>{appt.duration} min</span>
                    </div>

                  </div>
                </PopoverContent>
              </Popover>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}