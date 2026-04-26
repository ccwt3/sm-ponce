// components
import Header from "@/components/home/header";
import Inventory from "@/components/home/inventory/inventory";
import Modal from "@/components/home/dialogs/editModal";
import Foot from "@/components/home/foot";

export default function Home() {
  return (
    <main className="flex flex-col position-relative">
      <Header />
      <Inventory />
      <Modal />
      <Foot />
    </main>
  );
}
 