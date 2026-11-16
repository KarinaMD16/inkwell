import { SkHeading, WorksSkeleton } from "@/components/Skeleton";

/** Se muestra al instante mientras llega la página. */
export default function Cargando() {
  return <div className="stack-lg"><SkHeading w={220} /><WorksSkeleton /></div>;
}
