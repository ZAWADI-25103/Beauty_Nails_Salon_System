import prisma from "@/lib/prisma";

async function main() {
  console.log('Seeding salon profile...');
  
  // Create salon profile
  await prisma.salonProfile.upsert({
    where: { id: 'default-profile' },
    update: {},
    create: {
      id: 'default-profile',
      name: 'Beauty Nails',
      address: 'Q. Himbi, Av. de la Justice, Goma, Republique Démocratique du Congo',
      phone: '+243 810 000 000',
      email: 'contact@beautynails.cd',
      website: 'https://www.beautynails.cd',
      description: 'Votre salon de beauté de référence à Republique Démocratique du Congo. Nous offrons une large gamme de services de manucure, pédicure, soins du visage et plus encore. Notre équipe de professionnels passionnés est dédiée à vous offrir une expérience de beauté exceptionnelle dans un environnement chaleureux et accueillant.',
      logo: '/Bnails_ white.png',
      openingHours: {
        monday: { open: '08:00', close: '20:00' },
        tuesday: { open: '08:00', close: '20:00' },
        wednesday: { open: '08:00', close: '20:00' },
        thursday: { open: '08:00', close: '20:00' },
        friday: { open: '08:00', close: '20:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: { open: '10:00', close: '16:00' }
      },
      socialMedia: {
        facebook: 'https://facebook.com/beautynails',
        instagram: 'https://instagram.com/beautynails',
        whatsapp: '+243 973 887 148'
      },
      currency: 'CDF',
      timezone: 'Africa/Goma',
      language: 'fr'
    }
  });

  console.log('Seeding system settings...');
  
  // Create system settings
  const settingsData = [
    { key: 'smsNotifications', value: true, category: 'notifications' },
    { key: 'emailNotifications', value: true, category: 'notifications' },
    { key: 'autoReminders', value: true, category: 'notifications' },
    { key: 'onlineBooking', value: true, category: 'booking' },
    { key: 'requireConfirmation', value: false, category: 'booking' },
    { key: 'maintenanceMode', value: false, category: 'general' },
    { key: 'showPastAppointments', value: true, category: 'general' },
    { key: 'maxAdvanceBookingDays', value: 30, category: 'booking' },
    { key: 'appointmentDuration', value: 60, category: 'booking' },
    { key: 'notificationLeadTime', value: 24, category: 'notifications' },
    { key: 'currencySymbol', value: 'FC', category: 'general' },
    { key: 'dateFormat', value: 'DD/MM/YYYY', category: 'general' },
    { key: 'timeFormat', value: '24h', category: 'general' },
    { key: 'defaultTaxRate', value: 0, category: 'financial' },
    { key: 'enableLoyaltyProgram', value: true, category: 'marketing' },
    { key: 'loyaltyPointsPerCurrency', value: 1, category: 'marketing' },
    { key: 'loyaltyPointsRequired', value: 100, category: 'marketing' }
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });