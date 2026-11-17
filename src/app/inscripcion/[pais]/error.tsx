"use client";

// Si el formulario de un país falla, el error se queda en esa página: los demás países siguen funcionando.
import { useParams } from "next/navigation";
import ErrorDePais from "@/shared/ui/ErrorDePais";

const NOMBRES: Record<string, string> = { colombia: "Colombia", ecuador: "Ecuador", panama: "Panamá", uruguay: "Uruguay" };

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { pais } = useParams<{ pais: string }>();
  return <ErrorDePais {...props} pais={NOMBRES[pais] ?? "este país"} donde={`inscripcion/${pais}`} />;
}
