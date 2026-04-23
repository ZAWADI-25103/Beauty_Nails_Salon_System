const BOOKING_STORAGE_KEY = "beauty_nails_booking_progress";

export const saveBookingProgress = (data: any) => {
    try {
      localStorage.setItem(
        BOOKING_STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error("Failed to save booking progress", error);
    }
  };

export const loadBookingProgress = () => {
    try {
      const saved = localStorage.getItem(BOOKING_STORAGE_KEY);

      if (!saved) return null;

      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load booking progress", error);
      return null;
    }
  };

export const clearBookingProgress = () => {
    localStorage.removeItem("beauty_nails_booking_progress");
  };