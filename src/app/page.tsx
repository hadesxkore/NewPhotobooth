import { Photobooth } from "@/components/photobooth/Photobooth";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Online Photobooth</h1>
      <Photobooth />
    </div>
  );
}
