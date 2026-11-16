import { CardsSkeleton } from "@/components/Skeleton";

/** Se muestra al instante mientras llega la página. */
export default function Cargando() {
  return <CardsSkeleton cards={4} title={180} />;
}
