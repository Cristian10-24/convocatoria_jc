"use client";

// Si la landing de Colombia falla, el error se queda aquí: las demás páginas y países siguen funcionando.
import ErrorDePais from "@/shared/ui/ErrorDePais";

export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorDePais {...props} pais="Colombia" donde="landing/col" />;
}
