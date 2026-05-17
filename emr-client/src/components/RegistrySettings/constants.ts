export const timezones = [
  { value: "UTC", label: "UTC (COORDINATED UNIVERSAL TIME)" },
  { value: "Asia/Manila", label: "ASIA/MANILA (PHT - PHILIPPINE TIME)" },
  { value: "America/New_York", label: "AMERICA/NEW_YORK (EST/EDT)" },
  { value: "Europe/London", label: "EUROPE/LONDON (GMT/BST)" },
  { value: "Asia/Singapore", label: "ASIA/SINGAPORE (SGT)" },
];

if (typeof window !== "undefined") {
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timezones.find((tz) => tz.value === localTz)) {
    timezones.push({
      value: localTz,
      label: `${localTz.toUpperCase()} (LOCAL BROWSER TIME)`,
    });
  }
}

export const currencies = [
  { value: "PHP", label: "PHP - PHILIPPINE PESO (₱)", symbol: "₱" },
  { value: "USD", label: "USD - US DOLLAR ($)", symbol: "$" },
  { value: "EUR", label: "EUR - EURO (€)", symbol: "€" },
  { value: "GBP", label: "GBP - BRITISH POUND (£)", symbol: "£" },
];

export const languages = [
  { value: "en", label: "ENGLISH (US)" },
  { value: "tl", label: "TAGALOG (FILIPINO)" },
  { value: "es", label: "SPANISH" },
];
