"use client";

import { useState } from "react";
import Header from "./components/header";
import Following from "./components/following";
import Search from "./components/search";
import KolList from "./components/kolList";
import KolDetailSheet from "./components/kolDetailSheet";

export default function CopyTrading() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClickKOLItem = (id: number) => {
    console.log(id);
    setIsOpen(true);
  };

  const handleKOLDetailSheetClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="px-5 flex flex-col">
      <Header />
      <Following />
      <Search />
      <KolList onClick={handleClickKOLItem} />
      <KolDetailSheet isOpen={isOpen} handleClose={handleKOLDetailSheetClose} />
    </div>
  );
}
