"use client";

import KolItem from "./kolItem";

const mockData = [
  {
    id: 1,
    name: "Kol 1",
  },
  {
    id: 2,
    name: "Kol 2",
  },
  {
    id: 3,
    name: "Kol 3",
  },
  {
    id: 4,
    name: "Kol 4",
  },
  {
    id: 5,
    name: "Kol 5",
  },
];

export default function KolList({
  onClick,
}: {
  onClick: (id: number) => void;
}) {
  const handleClick = (id: number) => {
    onClick(id);
  };

  return (
    <div>
      {mockData.map((item) => {
        return (
          <KolItem
            key={item.id}
            onClick={() => {
              handleClick(item.id);
            }}
          />
        );
      })}
    </div>
  );
}
