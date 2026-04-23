"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Download } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "./ui/badge";

export default function FloatingReceipt() {
  const storage = typeof window !== "undefined" ? window.localStorage : null;

  const [remainingTime, setRemainingTime] = useState<number | null>(
    Number(storage?.getItem("time")) * 60
  );

  const router = useRouter();
  const params = useSearchParams();
  const url = decodeURIComponent(params.get("url") || "");

  const [visible, setVisible] = useState(false );

  useEffect(() => {
    const isUrlValid = (url && url.startsWith("/api/")) ? true : false;
    setVisible(isUrlValid)
  }, [url]);

  // ⏳ Countdown
  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) {
      setRemainingTime(null);
      setVisible(false);
      storage?.removeItem("time");
      router.replace("/dashboard/client");
      return;
    }

    const timer = setTimeout(() => {
      setRemainingTime((prev) => prev! - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingTime]);

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
  };

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-3 z-50">
      <AnimatePresence>
        {(visible) && (
          <motion.div
            initial={{ scale: 0, x: 50 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: 50 }}
            whileHover={{ scale: 1.05 }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <div
                  onClick={visible ? triggerConfetti : undefined}
                  className={`
                    relative flex flex-col items-center justify-center
                    w-24 h-24 rounded-full cursor-pointer
                    text-white transition-all duration-300

                    border border-pink-500/30

                    shadow-[0_10px_30px_rgba(0,0,0,0.6)]

                    ${
                      visible
                        ? `
                          bg-linear-to-br from-pink-600 via-purple-600 to-indigo-600
                          animate-bounce
                        `
                        : `
                          bg-gray-900 text-gray-400
                        `
                    }
                  `}
                >
                  <Download className="w-7 h-7 mb-1" />

                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    {visible ? "Reçu prêt" : "Voir reçu"}
                  </span>

                  {/* Glow pulse */}
                  {visible && (
                    <span className="absolute inset-0 rounded-full bg-pink-500/30 blur-xl animate-pulse"></span>
                  )}
                </div>
              </PopoverTrigger>

              <PopoverContent
                side="left"
                className="
                  w-72 p-4 rounded-2xl text-center

                  bg-[#0f0f11]

                  border border-pink-500/20

                  shadow-[0_10px_40px_rgba(0,0,0,0.8)]
                "
              >
                {visible && (
                  <div className="flex flex-col gap-3 pt-2">
                    {/* Title */}
                    <p className="text-sm font-medium flex items-center justify-center gap-2 text-pink-400">
                      <CheckCircle className="h-4 w-4" />
                      Votre reçu est prêt
                    </p>

                    {/* Timer */}
                    {remainingTime !== null && remainingTime > 0 && (
                      <Badge className="w-fit mx-auto text-xs bg-gray-800 text-gray-300 border border-gray-700">
                        ⏳ {Math.floor(remainingTime / 60)}:
                        {(remainingTime % 60)
                          .toString()
                          .padStart(2, "0")}
                      </Badge>
                    )}

                    {/* Action */}
                    <button
                      onClick={() => {
                        storage?.removeItem("time");
                        setRemainingTime(null);
                        window.open(url, "_blank");
                        router.replace("/dashboard/client");
                      }}
                      className="
                        mt-2 px-4 py-2 rounded-lg font-medium

                        bg-linear-to-r from-pink-600 to-purple-600
                        hover:from-pink-700 hover:to-purple-700

                        text-white

                        shadow-lg shadow-pink-500/20
                        transition
                      "
                    >
                      Télécharger
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}