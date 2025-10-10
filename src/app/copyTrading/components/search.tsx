import Image from "next/image";
import searchIcon from "@/assets/icons/search.png";

export default function Search() {
  return (
    <div
      className="flex w-full my-5 h-[52px] rounded-[16px] items-center px-5"
      style={{
        background: "rgba(10, 20, 23, 1)",
      }}
    >
      <Image src={searchIcon} alt="search" width={16} height={16} />
      <input
        type="text"
        className="flex-1 pl-2 ml-2 h-[36px]"
        placeholder="Search"
      />
    </div>
  );
}
