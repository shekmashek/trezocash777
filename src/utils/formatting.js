export const formatCurrency = (amount, settings = {}) => {
  const { 
    displayUnit = 'standard', 
    decimalPlaces = 2,
    currency = '€'
  } = settings;
  
  const currencySymbol = currency;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return '-';
  }

  let value = amount;
  let suffix = '';

  if (displayUnit === 'thousands') {
    value /= 1000;
    suffix = ' K';
  } else if (displayUnit === 'millions') {
    value /= 1000000;
    suffix = ' M';
  }

  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return `${formatter.format(value)}${suffix} ${currencySymbol}`;
};

export const formatPaymentTerms = (terms) => {
    if (!terms || terms.length === 0) {
        return '-';
    }
    if (terms.length === 1 && terms[0].days === 0 && terms[0].percentage === 100) {
        return 'Comptant';
    }

    return terms
        .sort((a, b) => a.days - b.days)
        .map(term => `${term.percentage}% à ${term.days}j`)
        .join(', ');
};
