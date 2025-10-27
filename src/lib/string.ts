const ellipsisAddress = (
  address: string,
  start: number = 6,
  end: number = 4
) => {
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export { ellipsisAddress };
