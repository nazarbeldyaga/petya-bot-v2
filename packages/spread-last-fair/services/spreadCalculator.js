function calculateSpread(lastPrice, fairPrice) {
  const spread = Math.abs((lastPrice / fairPrice - 1) * 100);

  let direction;
  if (fairPrice > lastPrice) {
    direction = 'LONG';
  } else {
    direction = 'SHORT';
  }

  return {
    spread: spread,
    direction: direction,
    details: `Last: ${lastPrice}, Fair: ${fairPrice}`,
  };
}

module.exports = { calculateSpread };
