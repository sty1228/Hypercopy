import BigNumber from "bignumber.js";

export const numberToPercentageString = (
  number: number | string,
  decimalPlaces: number = 2
) => {
  return `${new BigNumber(number)
    .multipliedBy(100)
    .decimalPlaces(decimalPlaces)}%`;
};
