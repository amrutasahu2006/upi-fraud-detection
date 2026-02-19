export const translateBackendReason = (reason, t) => {
  if (!reason || typeof reason !== 'string') return reason;

  const mappings = [
    {
      test: /^🔥 Extremely high amount/i,
      get: () => t('backendReasons.extremelyHighAmount')
    },
    {
      test: /^⚠️ High transaction amount/i,
      get: () => t('backendReasons.highTransactionAmount')
    },
    {
      test: /^📈 Amount is more than 4x your average/i,
      get: () => t('backendReasons.amountAbove4x')
    },
    {
      test: /^📊 Amount is more than 2\.5x your average/i,
      get: () => t('backendReasons.amountAbove2_5x')
    },
    {
      test: /^⏰ Transaction at (\d+):00 is outside your typical hours\./i,
      get: (match) => t('backendReasons.unusualHour', { hour: match[1] })
    },
    {
      test: /^🌙 Transaction at (\d+):00 is during late night, which is unusual for you\./i,
      get: (match) => t('backendReasons.lateNightUnusual', { hour: match[1] })
    },
    {
      test: /^👤 New recipient \((.+)\) - No transaction history/i,
      get: (match) => t('backendReasons.newRecipientNoHistory', { recipient: match[1] })
    },
    {
      test: /^👤 New recipient \((.+)\)/i,
      get: (match) => t('backendReasons.newRecipient', { recipient: match[1] })
    },
    {
      test: /^📱 Device information unavailable/i,
      get: () => t('backendReasons.deviceInfoUnavailable')
    },
    {
      test: /^📱 New or unrecognized device used for transaction/i,
      get: () => t('backendReasons.newDevice')
    },
    {
      test: /^📍 Location information unavailable/i,
      get: () => t('backendReasons.locationUnavailable')
    },
    {
      test: /^📍 Establishing typical transaction locations/i,
      get: () => t('backendReasons.establishingLocationPattern')
    },
    {
      test: /^📍 Transaction from unusual location \((.+)\)/i,
      get: (match) => t('backendReasons.unusualLocation', { city: match[1] })
    },
    {
      test: /^🚀 (\d+) transactions in (\d+) minutes/i,
      get: (match) => t('backendReasons.highVelocityCount', { count: match[1], minutes: match[2] })
    },
    {
      test: /^💸 High transaction velocity/i,
      get: () => t('backendReasons.highVelocityAmount')
    },
    {
      test: /^✅ Recipient is whitelisted - trusted payee/i,
      get: () => t('backendReasons.whitelistedRecipient')
    },
    {
      test: /^🚫 Recipient is blacklisted - known fraudulent account/i,
      get: () => t('backendReasons.blacklistedRecipient')
    },
    {
      test: /^Amount is below 1000 rupees - automatically approved/i,
      get: () => t('backendReasons.amountAutoApproved')
    },
    {
      test: /^Risk score below 30 - automatically approved/i,
      get: () => t('backendReasons.scoreAutoApproved')
    },
    {
      test: /^No significant risk factors detected/i,
      get: () => t('backendReasons.noSignificantFactors')
    },
  ];

  for (const mapping of mappings) {
    const match = reason.match(mapping.test);
    if (match) return mapping.get(match);
  }

  return reason;
};

export const translateBackendReasons = (reasons, t) => {
  if (!Array.isArray(reasons)) return [];
  return reasons.map((reason) => translateBackendReason(reason, t));
};
