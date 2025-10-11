import Header from "./components/header";
import Following from "./components/following";
import Search from "./components/search";
import KolList from "./components/kolList";

export default function CopyTrading() {
  return (
    <div className="px-5 flex flex-col">
      <Header />
      <Following />
      <Search />
      <KolList />
    </div>
  );
}
